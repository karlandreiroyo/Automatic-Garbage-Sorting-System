const nodemailer = require('nodemailer');
const supabase = require('./supabase');

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

  // Check for placeholder values
  const hasPlaceholders = 
    !host || 
    !user || 
    !pass || 
    !from ||
    host.toLowerCase().includes('your_smtp') ||
    host.toLowerCase().includes('your_smtp_host') ||
    host.toLowerCase().includes('smtp.example.com') ||
    user.toLowerCase().includes('your_email') ||
    user.toLowerCase().includes('your_smtp_user') ||
    user.toLowerCase().includes('@example.com') ||
    pass.toLowerCase().includes('your_app_password') ||
    pass.toLowerCase().includes('your_password') ||
    pass.toLowerCase().includes('your_smtp_pass') ||
    from.toLowerCase().includes('your_email') ||
    from.toLowerCase().includes('example.com');

  // Validate email format
  const userEmailValid = user && validateEmail(user);
  const fromEmailValid = from && (validateEmail(from) || from.includes('<'));

  // Check for common Gmail issues
  const validationErrors = [];
  if (host && host.includes('gmail.com') && user) {
    if (!user.includes('@gmail.com')) {
      validationErrors.push('For Gmail, SMTP_USER must be a @gmail.com address');
    }
    if (pass && pass.length < 16) {
      validationErrors.push('Gmail App Passwords are 16 characters. Your password seems too short.');
    }
  }

  const enabled = Boolean(host && port && user && pass && from && !hasPlaceholders && userEmailValid);
  return { 
    enabled, 
    host, 
    port, 
    user, 
    pass, 
    from, 
    hasPlaceholders, 
    userEmailValid, 
    fromEmailValid,
    validationErrors 
  };
}

function createTransport() {
  const cfg = getSmtpConfig();
  if (!cfg.enabled) return null;

  // Remove spaces from App Password if present (Gmail App Passwords can have spaces)
  const cleanPass = cfg.pass ? cfg.pass.replace(/\s/g, '') : cfg.pass;

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { 
      user: cfg.user.trim(), 
      pass: cleanPass 
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
}

/**
 * Verify SMTP connection and credentials
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function verifySmtpConnection() {
  const cfg = getSmtpConfig();
  
  if (!cfg.enabled) {
    return { ok: false, message: 'SMTP not configured or contains placeholder values' };
  }

  if (cfg.hasPlaceholders) {
    return { ok: false, message: 'SMTP configuration contains placeholder values' };
  }

  if (!cfg.userEmailValid) {
    return { ok: false, message: `SMTP_USER is not a valid email: ${cfg.user}` };
  }

  if (cfg.validationErrors && cfg.validationErrors.length > 0) {
    return { ok: false, message: cfg.validationErrors.join('; ') };
  }

  const transporter = createTransport();
  if (!transporter) {
    return { ok: false, message: 'Failed to create SMTP transport' };
  }

  try {
    await transporter.verify();
    return { ok: true, message: 'SMTP connection successful' };
  } catch (error) {
    let message = 'SMTP verification failed';
    
    if (error.message && error.message.includes('535')) {
      message = 'Gmail authentication failed. Check:\n' +
               '  1. SMTP_USER must be the exact email that generated the App Password\n' +
               '  2. SMTP_PASS must be the 16-character App Password (spaces removed automatically)\n' +
               '  3. 2-Step Verification must be enabled on the Google account\n' +
               '  4. The App Password must not be expired or revoked\n\n' +
               `Current SMTP_USER: ${cfg.user}\n` +
               `Current SMTP_PASS length: ${cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0} characters\n\n` +
               'Fix: Generate a new App Password at https://myaccount.google.com/apppasswords\n' +
               'Make sure the email in SMTP_USER matches the account that generated the App Password.';
    } else if (error.message && error.message.includes('Invalid login')) {
      message = 'Invalid SMTP credentials. Verify SMTP_USER and SMTP_PASS are correct.';
    } else {
      message = error.message || 'Unknown SMTP error';
    }
    
    return { ok: false, message, originalError: error.message };
  }
}

/**
 * Send login verification email to the authenticated user
 * @param {string} to - Recipient email (dynamically retrieved from authenticated user session)
 * @param {string} code - 6-digit verification code
 * @param {number} expiresMinutes - Code expiration time in minutes
 * 
 * Note: The 'to' parameter is automatically set to the logged-in user's email address.
 * SMTP_USER in .env is the SENDER account (one account sends emails to all users).
 */
async function sendLoginVerificationEmail({ to, code, expiresMinutes = 10 }) {
  const cfg = getSmtpConfig();
  
  if (cfg.hasPlaceholders) {
    return { 
      ok: false, 
      reason: 'SMTP configuration contains placeholder values. Please update backend/.env with actual SMTP credentials.', 
      subject: 'Login Verification' 
    };
  }

  if (!cfg.userEmailValid) {
    return {
      ok: false,
      reason: `SMTP_USER is not a valid email address: "${cfg.user}". Please check your backend/.env file.`,
      subject: 'Login Verification'
    };
  }

  if (cfg.validationErrors && cfg.validationErrors.length > 0) {
    return {
      ok: false,
      reason: `SMTP configuration errors:\n${cfg.validationErrors.map(e => `  - ${e}`).join('\n')}`,
      subject: 'Login Verification'
    };
  }
  
  const transporter = createTransport();

  if (!transporter) {
    return { ok: false, reason: 'SMTP not configured', subject: 'Login Verification' };
  }

  const subject = 'Login Verification';
  const actionType = 'LOGIN_VERIFICATION';
  const text =
    `Login Verification\n\n` +
    `Your login verification code is: ${code}\n\n` +
    `This code expires in ${expiresMinutes} minutes.\n\n` +
    `If you did not attempt to log in, please ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111;">Login Verification</h1>
      <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">You have requested a login verification code.</p>
      <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Use the code below to complete your login:</p>
      <div style="font-size: 36px; letter-spacing: 4px; font-weight: 700; padding: 24px; text-align: center; background: #f3f4f6; border: 2px solid #d1d5db; border-radius: 8px; margin: 24px 0; font-family: 'Courier New', monospace; color: #111;">
        ${code}
      </div>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">If you did not attempt to log in, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, subject, to };
  } catch (error) {
    // Provide user-friendly error messages for common Gmail issues
    let reason = error.message;
    const cfg = getSmtpConfig();
    
    if (error.message && error.message.includes('535')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      const isWrongLength = passLength !== 16;
      
      reason = 'Gmail authentication failed. Your password configuration needs to be fixed.\n\n' +
               `Current Settings:\n` +
               `  SMTP_USER: ${cfg.user || 'NOT SET'}\n` +
               `  Password Length: ${passLength} characters\n\n`;
      
      if (isWrongLength) {
        reason += `❌ Problem Found: Your password is ${passLength} characters, but Gmail App Passwords must be exactly 16 characters.\n` +
                 `   You are using your regular Gmail password instead of an App Password.\n\n` +
                 `✅ Solution: Generate a 16-character App Password:\n` +
                 `   1. Go to: https://myaccount.google.com/apppasswords\n` +
                 `   2. Make sure 2-Step Verification is enabled first\n` +
                 `   3. Select "Mail" → "Other (Custom name)" → Type "Backend Server"\n` +
                 `   4. Click "Generate" and copy the 16-character password\n` +
                 `   5. Update backend/.env: SMTP_PASS=your_16_char_app_password\n` +
                 `   6. Restart backend server\n\n`;
      } else {
        reason += 'How to Fix:\n' +
                 '1. Go to https://myaccount.google.com/apppasswords\n' +
                 '2. Make sure 2-Step Verification is enabled on your Google account\n' +
                 '3. Click "Select app" → Choose "Mail"\n' +
                 '4. Click "Select device" → Choose "Other (Custom name)"\n' +
                 '5. Type "Backend Server" and click "Generate"\n' +
                 '6. Copy the 16-character password (it will look like: abcd efgh ijkl mnop)\n' +
                 '7. Open backend/.env and update SMTP_PASS with the new password\n' +
                 '8. Restart the backend server\n\n';
      }
      
      reason += '⚠️  Important: SMTP_USER must match the email account that generated the App Password.\n' +
               '   If you see a different email in the "User" field above, make sure SMTP_USER matches that email.';
    } else if (error.message && error.message.includes('Invalid login')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      reason = 'Invalid email credentials. Please check your SMTP settings.\n\n' +
               'For Gmail accounts:\n' +
               '  • Use your full Gmail address for SMTP_USER\n' +
               '  • Use a 16-character App Password (not your regular password)\n' +
               '  • Enable 2-Step Verification first: https://myaccount.google.com/security\n' +
               '  • Generate App Password: https://myaccount.google.com/apppasswords\n\n' +
               `Current password length: ${passLength} characters (should be 16 for Gmail App Password)`;
    } else if (error.message && error.message.includes('ENOTFOUND')) {
      reason = `SMTP server not found: ${cfg.host}\n` +
               'Check SMTP_HOST in backend/.env is correct.\n' +
               'For Gmail, use: SMTP_HOST=smtp.gmail.com';
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      reason = `Cannot connect to SMTP server: ${cfg.host}:${cfg.port}\n` +
               'Check SMTP_HOST and SMTP_PORT in backend/.env.\n' +
               'For Gmail, use: SMTP_HOST=smtp.gmail.com and SMTP_PORT=587';
    }
    
    return { ok: false, reason, subject, to, originalError: error.message };
  }
}

/**
 * Send password change verification email to the authenticated user
 * @param {string} to - Recipient email (dynamically retrieved from authenticated user session)
 * @param {string} code - 6-digit verification code
 * @param {number} expiresMinutes - Code expiration time in minutes
 * 
 * Note: The 'to' parameter is automatically set to the logged-in user's email address.
 * SMTP_USER in .env is the SENDER account (one account sends emails to all users).
 */
async function sendChangePasswordVerificationEmail({ to, code, expiresMinutes = 10 }) {
  const cfg = getSmtpConfig();
  
  if (cfg.hasPlaceholders) {
    return { 
      ok: false, 
      reason: 'SMTP configuration contains placeholder values. Please update backend/.env with actual SMTP credentials.', 
      subject: 'Change Password Verification' 
    };
  }

  if (!cfg.userEmailValid) {
    return {
      ok: false,
      reason: `SMTP_USER is not a valid email address: "${cfg.user}". Please check your backend/.env file.`,
      subject: 'Change Password Verification'
    };
  }

  if (cfg.validationErrors && cfg.validationErrors.length > 0) {
    return {
      ok: false,
      reason: `SMTP configuration errors:\n${cfg.validationErrors.map(e => `  - ${e}`).join('\n')}`,
      subject: 'Change Password Verification'
    };
  }
  
  const transporter = createTransport();

  if (!transporter) {
    return { ok: false, reason: 'SMTP not configured', subject: 'Change Password Verification' };
  }

  const subject = 'Change Password Verification';
  const actionType = 'CHANGE_PASSWORD';
  const text =
    `Change Password Verification\n\n` +
    `Your password change verification code is: ${code}\n\n` +
    `This code expires in ${expiresMinutes} minutes.\n\n` +
    `If you did not request to change your password, please ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111;">Change Password Verification</h1>
      <p style="margin: 0 0 16px 0; color: #374151;">Your password change verification code is:</p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: 600; padding: 20px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">
        ${code}
      </div>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">If you did not request to change your password, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, subject, to };
  } catch (error) {
    // Provide user-friendly error messages for common Gmail issues
    let reason = error.message;
    const cfg = getSmtpConfig();
    
    if (error.message && error.message.includes('535')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      const isWrongLength = passLength !== 16;
      
      reason = 'Gmail authentication failed. Your password configuration needs to be fixed.\n\n' +
               `Current Settings:\n` +
               `  SMTP_USER: ${cfg.user || 'NOT SET'}\n` +
               `  Password Length: ${passLength} characters\n\n`;
      
      if (isWrongLength) {
        reason += `❌ Problem Found: Your password is ${passLength} characters, but Gmail App Passwords must be exactly 16 characters.\n` +
                 `   You are using your regular Gmail password instead of an App Password.\n\n` +
                 `✅ Solution: Generate a 16-character App Password:\n` +
                 `   1. Go to: https://myaccount.google.com/apppasswords\n` +
                 `   2. Make sure 2-Step Verification is enabled first\n` +
                 `   3. Select "Mail" → "Other (Custom name)" → Type "Backend Server"\n` +
                 `   4. Click "Generate" and copy the 16-character password\n` +
                 `   5. Update backend/.env: SMTP_PASS=your_16_char_app_password\n` +
                 `   6. Restart backend server\n\n`;
      } else {
        reason += 'How to Fix:\n' +
                 '1. Go to https://myaccount.google.com/apppasswords\n' +
                 '2. Make sure 2-Step Verification is enabled on your Google account\n' +
                 '3. Click "Select app" → Choose "Mail"\n' +
                 '4. Click "Select device" → Choose "Other (Custom name)"\n' +
                 '5. Type "Backend Server" and click "Generate"\n' +
                 '6. Copy the 16-character password (it will look like: abcd efgh ijkl mnop)\n' +
                 '7. Open backend/.env and update SMTP_PASS with the new password\n' +
                 '8. Restart the backend server\n\n';
      }
      
      reason += '⚠️  Important: SMTP_USER must match the email account that generated the App Password.\n' +
               '   If you see a different email in the "User" field above, make sure SMTP_USER matches that email.';
    } else if (error.message && error.message.includes('Invalid login')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      reason = 'Invalid email credentials. Please check your SMTP settings.\n\n' +
               'For Gmail accounts:\n' +
               '  • Use your full Gmail address for SMTP_USER\n' +
               '  • Use a 16-character App Password (not your regular password)\n' +
               '  • Enable 2-Step Verification first: https://myaccount.google.com/security\n' +
               '  • Generate App Password: https://myaccount.google.com/apppasswords\n\n' +
               `Current password length: ${passLength} characters (should be 16 for Gmail App Password)`;
    } else if (error.message && error.message.includes('ENOTFOUND')) {
      reason = `SMTP server not found: ${cfg.host}\n` +
               'Check SMTP_HOST in backend/.env is correct.\n' +
               'For Gmail, use: SMTP_HOST=smtp.gmail.com';
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      reason = `Cannot connect to SMTP server: ${cfg.host}:${cfg.port}\n` +
               'Check SMTP_HOST and SMTP_PORT in backend/.env.\n' +
               'For Gmail, use: SMTP_HOST=smtp.gmail.com and SMTP_PORT=587';
    }
    
    return { ok: false, reason, subject, to, originalError: error.message };
  }
}

/**
 * Send password reset verification email to the user
 * @param {string} to - Recipient email (from password reset request)
 * @param {string} code - 6-digit verification code
 * @param {number} expiresMinutes - Code expiration time in minutes
 * 
 * Note: The 'to' parameter comes from the user's password reset request.
 * SMTP_USER in .env is the SENDER account (one account sends emails to all users).
 */
async function sendResetPasswordVerificationEmail({ to, code, expiresMinutes = 10 }) {
  const cfg = getSmtpConfig();
  
  if (cfg.hasPlaceholders) {
    return { 
      ok: false, 
      reason: 'SMTP configuration contains placeholder values. Please update backend/.env with actual SMTP credentials.', 
      subject: 'Reset Password Verification' 
    };
  }

  if (!cfg.userEmailValid) {
    return {
      ok: false,
      reason: `SMTP_USER is not a valid email address: "${cfg.user}". Please check your backend/.env file.`,
      subject: 'Reset Password Verification'
    };
  }

  if (cfg.validationErrors && cfg.validationErrors.length > 0) {
    return {
      ok: false,
      reason: `SMTP configuration errors:\n${cfg.validationErrors.map(e => `  - ${e}`).join('\n')}`,
      subject: 'Reset Password Verification'
    };
  }
  
  const transporter = createTransport();

  if (!transporter) {
    return { ok: false, reason: 'SMTP not configured', subject: 'Reset Password Verification' };
  }

  const subject = 'Reset Password Verification';
  const actionType = 'RESET_PASSWORD';
  const text =
    `Reset Password Verification\n\n` +
    `Your password reset verification code is: ${code}\n\n` +
    `This code expires in ${expiresMinutes} minutes.\n\n` +
    `If you did not request to reset your password, please ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111;">Reset Password Verification</h1>
      <p style="margin: 0 0 16px 0; color: #374151;">Your password reset verification code is:</p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: 600; padding: 20px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">
        ${code}
      </div>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">If you did not request to reset your password, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, subject, to };
  } catch (error) {
    // Provide user-friendly error messages for common Gmail issues
    let reason = error.message;
    const cfg = getSmtpConfig();
    
    if (error.message && error.message.includes('535')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      const isWrongLength = passLength !== 16;
      
      reason = 'Gmail authentication failed. Your password configuration needs to be fixed.\n\n' +
               `Current Settings:\n` +
               `  SMTP_USER: ${cfg.user || 'NOT SET'}\n` +
               `  Password Length: ${passLength} characters\n\n`;
      
      if (isWrongLength) {
        reason += `❌ Problem Found: Your password is ${passLength} characters, but Gmail App Passwords must be exactly 16 characters.\n` +
                 `   You are using your regular Gmail password instead of an App Password.\n\n` +
                 `✅ Solution: Generate a 16-character App Password:\n` +
                 `   1. Go to: https://myaccount.google.com/apppasswords\n` +
                 `   2. Make sure 2-Step Verification is enabled first\n` +
                 `   3. Select "Mail" → "Other (Custom name)" → Type "Backend Server"\n` +
                 `   4. Click "Generate" and copy the 16-character password\n` +
                 `   5. Update backend/.env: SMTP_PASS=your_16_char_app_password\n` +
                 `   6. Restart backend server\n\n`;
      } else {
        reason += 'How to Fix:\n' +
                 '1. Go to https://myaccount.google.com/apppasswords\n' +
                 '2. Make sure 2-Step Verification is enabled on your Google account\n' +
                 '3. Click "Select app" → Choose "Mail"\n' +
                 '4. Click "Select device" → Choose "Other (Custom name)"\n' +
                 '5. Type "Backend Server" and click "Generate"\n' +
                 '6. Copy the 16-character password (it will look like: abcd efgh ijkl mnop)\n' +
                 '7. Open backend/.env and update SMTP_PASS with the new password\n' +
                 '8. Restart the backend server\n\n';
      }
      
      reason += '⚠️  Important: SMTP_USER must match the email account that generated the App Password.\n' +
               '   If you see a different email in the "User" field above, make sure SMTP_USER matches that email.';
    } else if (error.message && error.message.includes('Invalid login')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      reason = 'Invalid email credentials. Please check your SMTP settings.\n\n' +
               'For Gmail accounts:\n' +
               '  • Use your full Gmail address for SMTP_USER\n' +
               '  • Use a 16-character App Password (not your regular password)\n' +
               '  • Enable 2-Step Verification first: https://myaccount.google.com/security\n' +
               '  • Generate App Password: https://myaccount.google.com/apppasswords\n\n' +
               `Current password length: ${passLength} characters (should be 16 for Gmail App Password)`;
    } else if (error.message && error.message.includes('ENOTFOUND')) {
      reason = `SMTP server not found: ${cfg.host}\n` +
               'Check SMTP_HOST in backend/.env is correct.\n' +
               'For Gmail, use: SMTP_HOST=smtp.gmail.com';
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      reason = `Cannot connect to SMTP server: ${cfg.host}:${cfg.port}\n` +
               'Check SMTP_HOST and SMTP_PORT in backend/.env.\n' +
               'For Gmail, use: SMTP_HOST=smtp.gmail.com and SMTP_PORT=587';
    }
    
    return { ok: false, reason, subject, to, originalError: error.message };
  }
}

/**
 * Send security alert email to notify user of suspicious login attempts
 * @param {string} to - Recipient email address
 * @param {number} failedAttempts - Number of failed login attempts
 * @param {string} attemptedEmail - Email address that was used in failed attempts
 * @param {string} timestamp - Timestamp of the attempts
 * 
 * Note: This email is sent when multiple failed login attempts are detected.
 */
async function sendSecurityAlertEmail({ to, failedAttempts, attemptedEmail, timestamp }) {
  const cfg = getSmtpConfig();
  
  if (cfg.hasPlaceholders) {
    return { 
      ok: false, 
      reason: 'SMTP configuration contains placeholder values. Please update backend/.env with actual SMTP credentials.', 
      subject: 'Security Alert: Suspicious Login Attempts' 
    };
  }

  if (!cfg.userEmailValid) {
    return {
      ok: false,
      reason: `SMTP_USER is not a valid email address: "${cfg.user}". Please check your backend/.env file.`,
      subject: 'Security Alert: Suspicious Login Attempts'
    };
  }

  if (cfg.validationErrors && cfg.validationErrors.length > 0) {
    return {
      ok: false,
      reason: `SMTP configuration errors:\n${cfg.validationErrors.map(e => `  - ${e}`).join('\n')}`,
      subject: 'Security Alert: Suspicious Login Attempts'
    };
  }
  
  const transporter = createTransport();

  if (!transporter) {
    return { ok: false, reason: 'SMTP not configured', subject: 'Security Alert: Suspicious Login Attempts' };
  }

  const subject = 'Security Alert: Suspicious Login Attempts';
  const text =
    `Security Alert: Suspicious Login Attempts\n\n` +
    `We detected ${failedAttempts} failed login attempts on your account.\n\n` +
    `Attempted Email: ${attemptedEmail}\n` +
    `Time: ${timestamp}\n\n` +
    `If this was you, you can ignore this message. However, if you did not attempt to log in, please change your password immediately.\n\n` +
    `For your security, login has been temporarily disabled for 3 minutes.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #dc2626;">Security Alert: Suspicious Login Attempts</h1>
      <p style="margin: 0 0 16px 0; color: #374151;">We detected ${failedAttempts} failed login attempts on your account.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Attempted Email:</p>
        <p style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-family: 'Courier New', monospace;">${attemptedEmail}</p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Time:</p>
        <p style="margin: 0; color: #111; font-size: 16px;">${timestamp}</p>
      </div>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">If this was you, you can ignore this message. However, if you did not attempt to log in, please change your password immediately.</p>
      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">For your security, login has been temporarily disabled for 3 minutes.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, subject, to };
  } catch (error) {
    let reason = error.message;
    const cfg = getSmtpConfig();
    
    if (error.message && error.message.includes('535')) {
      const passLength = cfg.pass ? cfg.pass.replace(/\s/g, '').length : 0;
      reason = 'Gmail authentication failed. Please check your SMTP configuration in backend/.env';
    } else if (error.message && error.message.includes('Invalid login')) {
      reason = 'Invalid SMTP credentials. Please check your backend/.env file.';
    } else if (error.message && error.message.includes('ENOTFOUND')) {
      reason = `SMTP server not found: ${cfg.host}`;
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      reason = `Cannot connect to SMTP server: ${cfg.host}:${cfg.port}`;
    }
    
    return { ok: false, reason, subject, to, originalError: error.message };
  }
}

/**
 * Send new employee credentials email (username + password) via Gmail.
 * @param {{ to: string, username: string, password: string, fullName: string }} opts
 */
async function sendNewEmployeeCredentialsEmail({ to, username, password, fullName }) {
  const cfg = getSmtpConfig();

  console.log('\n' + '═'.repeat(60));
  console.log('📧 ATTEMPTING TO SEND EMPLOYEE CREDENTIALS EMAIL');
  console.log('═'.repeat(60));
  console.log(`To: ${to}`);
  console.log(`SMTP Enabled: ${cfg.enabled}`);
  console.log(`SMTP Host: ${cfg.host || 'NOT SET'}`);
  console.log(`SMTP Port: ${cfg.port || 'NOT SET'}`);
  console.log(`SMTP User: ${cfg.user || 'NOT SET'}`);
  console.log(`SMTP From: ${cfg.from || 'NOT SET'}`);
  console.log(`Has Placeholders: ${cfg.hasPlaceholders}`);
  console.log(`User Email Valid: ${cfg.userEmailValid}`);
  if (cfg.validationErrors && cfg.validationErrors.length > 0) {
    console.log(`Validation Errors: ${cfg.validationErrors.join(', ')}`);
  }
  console.log('═'.repeat(60));

  if (cfg.hasPlaceholders || !cfg.enabled || !cfg.userEmailValid) {
    const reason = cfg.hasPlaceholders 
      ? 'SMTP configuration contains placeholder values. Update backend/.env with actual SMTP credentials.'
      : !cfg.enabled
      ? 'SMTP is not enabled. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env.'
      : !cfg.userEmailValid
      ? `SMTP_USER is not a valid email: ${cfg.user}`
      : 'SMTP not configured. Set SMTP in backend/.env to send credentials via Gmail.';
    
    console.error('❌ SMTP Configuration Issue:', reason);
    return { ok: false, reason };
  }

  const transporter = createTransport();
  if (!transporter) {
    console.error('❌ Failed to create SMTP transporter');
    return { ok: false, reason: 'SMTP not configured. Failed to create transporter.' };
  }

  const subject = 'Your New Employee Account – Log In Credentials';
  const text =
    `Welcome, ${fullName}!\n\n` +
    `Your account has been created. Use these credentials to log in:\n\n` +
    `Username (Email): ${username}\n` +
    `Password: ${password}\n\n` +
    `Log in at your application login page. Change your password after first login. Keep these credentials secure.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111;">Welcome, ${fullName}!</h1>
      <p style="margin: 0 0 8px 0; color: #374151;">Your employee account has been created. <strong>Log in with these credentials:</strong></p>
      <div style="background: #ecfdf5; border: 2px solid #047857; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 4px 0; color: #047857; font-size: 12px; font-weight: 700; text-transform: uppercase;">Username (Email)</p>
        <p style="margin: 0 0 16px 0; color: #111; font-size: 18px; font-family: 'Courier New', monospace; font-weight: 600;">${username}</p>
        <p style="margin: 0 0 4px 0; color: #047857; font-size: 12px; font-weight: 700; text-transform: uppercase;">Password</p>
        <p style="margin: 0; color: #111; font-size: 18px; font-family: 'Courier New', monospace; font-weight: 600; letter-spacing: 1px;">${password}</p>
      </div>
      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Use the same login page as before. Enter the username and password above to sign in.</p>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Change your password after your first login. Keep these credentials secure.</p>
    </div>
  `;

  try {
    console.log(`[Mailer] Sending credentials email to: ${to}`);
    console.log(`[Mailer] Subject: ${subject}`);
    console.log(`[Mailer] From: ${cfg.from}`);
    
    const result = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    
    console.log(`[Mailer] ✅ Email sent successfully. MessageId: ${result.messageId || 'N/A'}`);
    return { ok: true, subject, to, messageId: result.messageId };
  } catch (error) {
    console.error(`[Mailer] ❌ Failed to send credentials email to ${to}:`, error.message);
    console.error(`[Mailer] Error details:`, error);
    
    // Provide more detailed error information
    let reason = error.message || 'Failed to send credentials email.';
    if (error.code === 'EAUTH') {
      reason = 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS in backend/.env';
    } else if (error.code === 'ECONNECTION') {
      reason = `Cannot connect to SMTP server ${cfg.host}:${cfg.port}. Check SMTP_HOST and SMTP_PORT.`;
    } else if (error.responseCode === 535) {
      reason = 'Gmail authentication failed. Verify SMTP_PASS is a valid App Password (16 characters).';
    }
    
    return { ok: false, reason, subject, to, originalError: error.message };
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

