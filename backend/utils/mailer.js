const nodemailer = require('nodemailer');
const https = require('https');
const supabase = require('./supabase');

// ─── Brevo HTTP API (bypasses SMTP/nginx header limits) ───────────────────────
async function sendViaBrevoAPI({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = (process.env.SMTP_FROM || '').replace(/.*<(.+)>.*/, '$1').trim() || process.env.SMTP_USER || '';
  const fromName = 'AGSS';

  if (!apiKey) throw new Error('BREVO_API_KEY not set in environment variables');
  if (!fromEmail) throw new Error('SMTP_FROM or SMTP_USER not set');

  const payload = JSON.stringify({
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, messageId: JSON.parse(data || '{}').messageId });
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
// ──────────────────────────────────────────────────────────────────────────────

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  const passLooksLikePlaceholder = pass && (
    pass.toLowerCase().includes('your_app_password') ||
    pass.toLowerCase().includes('your_password') ||
    pass.toLowerCase().includes('your_smtp_pass')
  ) && !pass.startsWith('xkeysib-');

  const hasPlaceholders = 
    !host || !user || !pass || !from ||
    host.toLowerCase().includes('your_smtp') ||
    host.toLowerCase().includes('your_smtp_host') ||
    host.toLowerCase().includes('smtp.example.com') ||
    user.toLowerCase().includes('your_email') ||
    user.toLowerCase().includes('your_smtp_user') ||
    user.toLowerCase().includes('@example.com') ||
    passLooksLikePlaceholder ||
    from.toLowerCase().includes('your_email') ||
    from.toLowerCase().includes('example.com');

  const userEmailValid = user && validateEmail(user);
  const fromEmailValid = from && (validateEmail(from) || from.includes('<'));

  const validationErrors = [];
  if (host && host.includes('gmail.com') && user) {
    if (!user.includes('@gmail.com')) validationErrors.push('For Gmail, SMTP_USER must be a @gmail.com address');
    if (pass && pass.length < 16) validationErrors.push('Gmail App Passwords are 16 characters. Your password seems too short.');
  }
  if (host && host.includes('brevo.com') && user && !validateEmail(user)) {
    validationErrors.push('For Brevo, SMTP_USER must be your Brevo account email');
  }

  const enabled = Boolean(host && port && user && pass && from && !hasPlaceholders && userEmailValid);
  return { enabled, host, port, user, pass, from, hasPlaceholders, userEmailValid, fromEmailValid, validationErrors };
}

function isBrevo(cfg) {
  return cfg && cfg.host && String(cfg.host).toLowerCase().includes('brevo');
}

function getBrevoAuthFailureMessage(cfg) {
  const passLen = cfg && cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
  return 'Brevo SMTP authentication failed. Check:\n' +
    '  1. SMTP_USER must be your Brevo login email\n' +
    '  2. SMTP_PASS must be your Brevo SMTP key or API key\n' +
    '  3. Use SMTP_HOST=smtp-relay.brevo.com and SMTP_PORT=587\n\n' +
    `Current SMTP_USER: ${cfg && cfg.user ? cfg.user : 'NOT SET'}\n` +
    `Current SMTP_PASS length: ${passLen} characters\n\n` +
    'Fix: In Brevo go to SMTP & API → API Keys, create or copy your key.';
}

function createTransport() {
  const cfg = getSmtpConfig();
  if (!cfg.enabled) return null;
  const cleanPass = cfg.pass ? cfg.pass.replace(/\s/g, '') : cfg.pass;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user.trim(), pass: cleanPass },
    connectionTimeout: 20000,
    greetingTimeout: 10000,
    tls: { rejectUnauthorized: false }
  });
}

async function verifySmtpConnection() {
  const cfg = getSmtpConfig();
  if (!cfg.enabled) return { ok: false, message: 'SMTP not configured or contains placeholder values' };
  if (cfg.hasPlaceholders) return { ok: false, message: 'SMTP configuration contains placeholder values' };
  if (!cfg.userEmailValid) return { ok: false, message: `SMTP_USER is not a valid email: ${cfg.user}` };
  if (cfg.validationErrors && cfg.validationErrors.length > 0) return { ok: false, message: cfg.validationErrors.join('; ') };

  const transporter = createTransport();
  if (!transporter) return { ok: false, message: 'Failed to create SMTP transport' };

  try {
    await transporter.verify();
    return { ok: true, message: 'SMTP connection successful' };
  } catch (error) {
    let message = error.message || 'Unknown SMTP error';
    if (error.message && (error.message.includes('535') || error.message.includes('Invalid login'))) {
      message = isBrevo(cfg) ? getBrevoAuthFailureMessage(cfg) : 'Brevo: use SMTP_USER = Brevo login email, SMTP_PASS = API key from Brevo → SMTP & API → API Keys\n';
    }
    return { ok: false, message, originalError: error.message };
  }
}

async function sendLoginVerificationEmail({ to, code, expiresMinutes = 10 }) {
  const subject = 'Login Verification';
  const text = `Login Verification\n\nYour login verification code is: ${code}\n\nThis code expires in ${expiresMinutes} minutes.\n\nIf you did not attempt to log in, please ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Login Verification</h1>
      <p style="margin: 0 0 16px 0; color: #374151;">Use the code below to complete your login:</p>
      <div style="font-size: 36px; letter-spacing: 4px; font-weight: 700; padding: 24px; text-align: center; background: #f3f4f6; border: 2px solid #d1d5db; border-radius: 8px; margin: 24px 0; font-family: 'Courier New', monospace;">${code}</div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
    </div>`;

  try {
    console.log(`\n[Mailer] 📤 Sending Login Verification Email to: ${to}`);
    console.log(`[Mailer] 🔑 Verification Code: ${code}`);
    const result = await sendViaBrevoAPI({ to, subject, html, text });
    console.log(`[Mailer] ✅ Login Verification Email sent successfully!\n`);
    return { ok: true, subject, to };
  } catch (error) {
    console.error(`[Mailer] ❌ Failed to send Login Verification Email to ${to}:`, error.message);
    return { ok: false, reason: error.message, subject, to };
  }
}

async function sendChangePasswordVerificationEmail({ to, code, expiresMinutes = 10 }) {
  if (!code) return { ok: false, reason: 'Internal Error: Verification code missing' };

  const subject = 'Change Password Verification';
  const text = `Change Password Verification\n\nYour password change verification code is: ${code}\n\nThis code expires in ${expiresMinutes} minutes.\n\nIf you did not request to change your password, please ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Change Password Verification</h1>
      <p style="margin: 0 0 16px 0; color: #374151;">Your password change verification code is:</p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: 600; padding: 20px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">${code}</div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
    </div>`;

  try {
    console.log(`\n[Mailer] 📤 Sending Change Password Email to: ${to}`);
    console.log(`[Mailer] 🔑 Verification Code: ${code}`);
    await sendViaBrevoAPI({ to, subject, html, text });
    console.log(`[Mailer] ✅ Change Password Email sent successfully!\n`);
    return { ok: true, subject, to };
  } catch (error) {
    console.error(`[Mailer] ❌ Failed to send Change Password Email to ${to}:`, error.message);
    return { ok: false, reason: error.message, subject, to };
  }
}

async function sendResetPasswordVerificationEmail({ to, code, expiresMinutes = 10 }) {
  if (!code) return { ok: false, reason: 'Internal Error: Verification code missing' };

  const subject = 'Reset Password Verification';
  const text = `Reset Password Verification\n\nYour password reset verification code is: ${code}\n\nThis code expires in ${expiresMinutes} minutes.\n\nIf you did not request to reset your password, please ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Reset Password Verification</h1>
      <p style="margin: 0 0 16px 0; color: #374151;">Your password reset verification code is:</p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: 600; padding: 20px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">${code}</div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
    </div>`;

  try {
    console.log(`\n[Mailer] 📤 Sending Reset Password Email to: ${to}`);
    console.log(`[Mailer] 🔑 Verification Code: ${code}`);
    await sendViaBrevoAPI({ to, subject, html, text });
    console.log(`[Mailer] ✅ Reset Password Email sent successfully!\n`);
    return { ok: true, subject, to };
  } catch (error) {
    console.error(`[Mailer] ❌ Failed to send Reset Password Email to ${to}:`, error.message);
    return { ok: false, reason: error.message, subject, to };
  }
}

async function sendSecondEmailVerification({ to, primaryEmail, fullName, verificationToken, baseUrl }) {
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://brave-adaptation-production.up.railway.app';
  const verifyLink = `${backendUrl.replace(/\/$/, '')}/api/accounts/verify-second-email?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent((to || '').trim().toLowerCase())}`;
  const displayName = fullName || 'This account';
  const subject = 'Confirm your backup email – ' + (fullName || 'Automatic Garbage Sorting System');
  const text = `Backup Email Confirmation\n\nThis email address has been added as the backup for ${displayName}'s account.\nPrimary email: ${primaryEmail || '(not shown)'}\n\nAccept backup email: ${verifyLink}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Backup email for this account</h1>
      <p style="margin: 0 0 12px 0; color: #374151;">This email address is the <strong>backup</strong> for <strong>${displayName}</strong>'s account.</p>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Primary email: ${primaryEmail || '(not shown)'}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
        <tr>
          <td align="center" style="border-radius: 8px; background-color: #047857;">
            <a href="${verifyLink}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px;">Accept backup email</a>
          </td>
        </tr>
      </table>
      <p style="color: #9ca3af; font-size: 12px;">If you did not request this, you can ignore this email.</p>
    </div>`;

  try {
    const toAddress = (to || '').trim().toLowerCase();
    if (!toAddress) return { ok: false, reason: 'No backup email address provided.', subject };
    console.log(`[Mailer] Sending backup email verification to: ${toAddress}`);
    await sendViaBrevoAPI({ to: toAddress, subject, html, text });
    console.log(`[Mailer] ✅ Backup email verification sent to: ${toAddress}`);
    return { ok: true, subject, to: toAddress };
  } catch (error) {
    console.error(`[Mailer] ❌ Failed to send backup email:`, error.message);
    return { ok: false, reason: error.message, subject, to };
  }
}

async function sendSecurityAlertEmail({ to, failedAttempts, attemptedEmail, timestamp }) {
  const subject = 'Security Alert: Suspicious Login Attempts';
  const text = `Security Alert\n\nWe detected ${failedAttempts} failed login attempts.\n\nAttempted Email: ${attemptedEmail}\nTime: ${timestamp}\n\nIf this was not you, please change your password immediately.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626;">Security Alert: Suspicious Login Attempts</h1>
      <p>We detected ${failedAttempts} failed login attempts on your account.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Attempted Email: <strong>${attemptedEmail}</strong></p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Time: ${timestamp}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Login has been temporarily disabled for 3 minutes.</p>
    </div>`;

  try {
    await sendViaBrevoAPI({ to, subject, html, text });
    return { ok: true, subject, to };
  } catch (error) {
    return { ok: false, reason: error.message, subject, to };
  }
}

async function sendNewEmployeeCredentialsEmail({ to, username, password, fullName }) {
  const subject = 'Your New Employee Account – Log In Credentials';
  const text = `Welcome, ${fullName}!\n\nYour account has been created.\n\nUsername (Email): ${username}\nPassword: ${password}\n\nChange your password after first login.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Welcome, ${fullName}!</h1>
      <p style="margin: 0 0 8px 0; color: #374151;">Your employee account has been created. <strong>Log in with these credentials:</strong></p>
      <div style="background: #ecfdf5; border: 2px solid #047857; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 4px 0; color: #047857; font-size: 12px; font-weight: 700; text-transform: uppercase;">Username (Email)</p>
        <p style="margin: 0 0 16px 0; color: #111; font-size: 18px; font-family: 'Courier New', monospace; font-weight: 600;">${username}</p>
        <p style="margin: 0 0 4px 0; color: #047857; font-size: 12px; font-weight: 700; text-transform: uppercase;">Password</p>
        <p style="margin: 0; color: #111; font-size: 18px; font-family: 'Courier New', monospace; font-weight: 600;">${password}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Change your password after your first login.</p>
    </div>`;

  try {
    console.log(`[Mailer] Sending credentials email to: ${to}`);
    await sendViaBrevoAPI({ to, subject, html, text });
    console.log(`[Mailer] ✅ Credentials email sent successfully.`);
    return { ok: true, subject, to };
  } catch (error) {
    console.error(`[Mailer] ❌ Failed to send credentials email:`, error.message);
    return { ok: false, reason: error.message, subject, to };
  }
}

module.exports = {
  getSmtpConfig,
  createTransport,
  verifySmtpConnection,
  sendLoginVerificationEmail,
  sendChangePasswordVerificationEmail,
  sendResetPasswordVerificationEmail,
  sendSecurityAlertEmail,
  sendNewEmployeeCredentialsEmail,
  sendSecondEmailVerification,
};
