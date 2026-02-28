'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const { sendNewEmployeeCredentialsEmail, sendSecondEmailVerification } = require('../../utils/mailer');
const { generateSecondEmailToken, secondEmailTokens } = require('../../utils/verification');
// SMS functionality removed - using email only
// const { getSmsConfig, sendCredentialsSms } = require('../utils/sms');

const EMAIL_REGEX = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const SPECIAL = '!@#$%^&*';

/** In-memory store: auth_id -> plain password, for resend-credentials only. Not persisted. */
const employeePlainPasswords = new Map();

/**
 * Generate 8-char password from first/last name: 1 cap, 1 special, 1 number.
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
function generatePasswordFromName(firstName, lastName) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  const base = (last || first || 'User').slice(0, 4);
  const capped = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const digit = String(Math.floor(Math.random() * 10));
  const special = SPECIAL[Math.floor(Math.random() * SPECIAL.length)];
  const pad = 'abcdefghijklmnopqrstuvwxyz';
  let extra = '';
  for (let i = 0; i < 2; i++) {
    extra += pad[Math.floor(Math.random() * pad.length)];
  }
  const raw = capped + digit + special + extra;
  if (raw.length !== 8) {
    const need = 8 - raw.length;
    for (let i = 0; i < need; i++) {
      extra += pad[Math.floor(Math.random() * pad.length)];
    }
    return (capped + digit + special + extra).slice(0, 8);
  }
  return raw;
}

/**
 * POST /api/accounts/verify-email
 * Body: { email, first_name, last_name, middle_name }
 * Checks email format/availability AND sends credentials email immediately.
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, first_name, last_name, middle_name } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const emailVal = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailVal)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Check email not already registered (exact + Gmail dotted variants)
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', emailVal)
      .limit(1);

    if (existingByEmail && existingByEmail.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }

    if (emailVal.endsWith('@gmail.com')) {
      const [local, dom] = emailVal.split('@');
      const norm = local.replace(/\./g, '').toLowerCase();
      const { data: gmailUsers } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', `%@${dom}`)
        .limit(100);
      const match = (gmailUsers || []).find((u) => {
        const e = (u.email || '').toLowerCase();
        if (!e.endsWith(`@${dom}`)) return false;
        const otherLocal = e.slice(0, -(dom.length + 1));
        return otherLocal.replace(/\./g, '') === norm;
      });
      if (match) {
        return res.status(409).json({ success: false, message: 'This email is already registered.' });
      }
    }

    // Generate password and send credentials email immediately
    if (first_name && last_name) {
      const password = generatePasswordFromName(first_name, last_name);
      const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ') || `${first_name} ${last_name}`;
      
      const mailResult = await sendNewEmployeeCredentialsEmail({
        to: emailVal,
        username: emailVal,
        password,
        fullName,
      });

      if (mailResult.ok) {
        console.log(`✅ Verification email sent to ${emailVal} with credentials`);
        return res.status(200).json({ 
          success: true, 
          message: 'Email verified and credentials sent!',
          password, // Return password so frontend can use it when creating account
          emailSent: true
        });
      } else {
        console.warn(`⚠️ Email verification succeeded but sending credentials failed: ${mailResult.reason}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Email verified, but sending credentials failed. Check SMTP config.',
          password,
          emailSent: false,
          emailError: mailResult.reason
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Email is available.' });
  } catch (e) {
    console.error('Verify email error:', e);
    return res.status(500).json({ success: false, message: 'Email verification failed. Please try again.' });
  }
});

// Phone verification endpoint removed - using email only
// router.post('/verify-phone', ...) - REMOVED

/**
 * POST /api/accounts/create-employee
 * Body: { first_name, last_name, middle_name, email, second_email?, role, password? }
 * Creates auth user, users row. If password provided, uses it; otherwise generates new one.
 * Note: Credentials should already be sent during verification, but we can resend if needed.
 */
router.post('/create-employee', async (req, res) => {
  try {
    const { first_name, last_name, middle_name, email, role, password: providedPassword, region, province, city_municipality, barangay, street_address, performed_by_user_id } = req.body;
    // Ignore req.body.status: new accounts are always PENDING until user accepts terms
    // Frontend may send backup_email or second_email (send both for reliability)
    const second_email = (req.body.second_email ?? req.body.backup_email ?? '').trim() || null;

    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and role are required.',
      });
    }

    // Validate address fields
    if (!region || !province || !city_municipality || !barangay) {
      return res.status(400).json({
        success: false,
        message: 'Region, province, city/municipality, and barangay are required.',
      });
    }

    const emailVal = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailVal)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Validate second email if provided (optional)
    let secondEmailVal = null;
    if (second_email && String(second_email).trim()) {
      secondEmailVal = String(second_email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(secondEmailVal)) {
        return res.status(400).json({ success: false, message: 'Invalid second email format.' });
      }
      // Check if second email is same as primary email
      if (secondEmailVal === emailVal) {
        return res.status(400).json({ success: false, message: 'Second email must be different from primary email.' });
      }
      // Check if second email is already registered
      const { data: existingBySecondEmail } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', secondEmailVal)
        .limit(1);
      if (existingBySecondEmail && existingBySecondEmail.length > 0) {
        return res.status(409).json({ success: false, message: 'This second email is already registered.' });
      }
    }

    // Use provided password (from verification) or generate new one
    const password = providedPassword || generatePasswordFromName(first_name, last_name);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailVal,
      password,
      email_confirm: true,
    });

    if (authError) {
      const msg = (authError.message || '').toLowerCase();
      const isEmailExists = authError.code === 'email_exists' ||
        authError.status === 422 ||
        /already registered|already exists|already been registered|email.*exists|user.*registered/i.test(msg);
      if (isEmailExists) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email address has already been registered. If you deleted this user from the database table, you must also remove them from Supabase: go to Dashboard → Authentication → Users, find the user by this email, and delete. Then try creating the employee again.',
          code: 'email_exists',
        });
      }
      throw authError;
    }

    const newUserPayload = {
      auth_id: authData.user.id,
      email: emailVal,
      second_email: secondEmailVal || null,
      second_email_verified: false,
      role,
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      middle_name: String(middle_name || '').trim() || '',
      region: String(region).trim(),
      province: String(province).trim(),
      city_municipality: String(city_municipality).trim(),
      barangay: String(barangay).trim(),
      street_address: String(street_address || '').trim() || null,
      pass_hash: password,
    };
    newUserPayload.status = 'PENDING';
    const { data: newUserRow, error: dbError } = await supabase.from('users').insert([newUserPayload]).select('id').single();

    if (dbError) {
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (_) {}
      throw dbError;
    }

    employeePlainPasswords.set(authData.user.id, password);

    const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
    const username = emailVal;

    // If password was provided, credentials were already sent during verification
    // Only send again if password wasn't provided (fallback)
    let mailResult = { ok: false };
    
    if (providedPassword) {
      console.log('📧 Credentials already sent during verification. Skipping duplicate send.');
      mailResult = { ok: true }; // Mark as sent since it was sent during verification
    } else {
      // Fallback: send credentials if not sent during verification
      mailResult = await sendNewEmployeeCredentialsEmail({
        to: emailVal,
        username,
        password,
        fullName: fullName || `${first_name} ${last_name}`,
      });

      if (!mailResult.ok) {
        console.error('❌ Email sending failed:', mailResult.reason);
        console.error('   Email:', emailVal);
        console.error('   Full name:', fullName || `${first_name} ${last_name}`);
      } else {
        console.log('✅ Email sent successfully to:', emailVal);
      }
    }

    // Send second email verification if second email is provided
    let secondEmailVerificationResult = { ok: false };
    if (secondEmailVal) {
      console.log(`📬 Sending backup email verification to: ${secondEmailVal}`);
      const verificationToken = generateSecondEmailToken();
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days expiry
      
      // Store token for verification
      secondEmailTokens.set(verificationToken, {
        email: secondEmailVal,
        primaryEmail: emailVal,
        userId: authData.user.id,
        expiresAt
      });

      const baseUrl = process.env.FRONTEND_URL || 'https://automatic-garbage-sorting-system-production.up.railway.app';
      secondEmailVerificationResult = await sendSecondEmailVerification({
        to: secondEmailVal,
        primaryEmail: emailVal,
        fullName: fullName || `${first_name} ${last_name}`,
        verificationToken,
        baseUrl
      });

      if (secondEmailVerificationResult.ok) {
        console.log(`✅ Second email verification sent to: ${secondEmailVal}`);
      } else {
        console.warn(`⚠️ Failed to send second email verification: ${secondEmailVerificationResult.reason}`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📧 NEW EMPLOYEE CREDENTIALS');
    console.log('═'.repeat(60));
    console.log(`👤 ${fullName || `${first_name} ${last_name}`} | ${emailVal}`);
    console.log(`📬 Username (Email): ${username}`);
    if (secondEmailVal) {
      console.log(`📬 Second Email: ${secondEmailVal}`);
      console.log(`📧 Second Email Verification Sent: ${secondEmailVerificationResult.ok ? 'Yes' : 'No'}`);
      if (!secondEmailVerificationResult.ok) {
        console.log(`⚠️ Second Email Verification Error: ${secondEmailVerificationResult.reason || 'Unknown'}`);
      }
    }
    console.log(`🔑 Password: ${password}`);
    console.log(`📧 Credentials sent to email: ${mailResult.ok ? 'Yes' : 'No'}`);
    console.log('═'.repeat(60) + '\n');

    try {
      await supabase.from('activity_logs').insert([
        {
          activity_type: 'USER_ADDED',
          description: [first_name, middle_name, last_name].filter(Boolean).join(' ').trim(),
          user_id: performed_by_user_id || null,
          added_user_id: newUserRow?.id || null,
        },
      ]);
    } catch (logErr) {
      console.error('Activity log failed:', logErr);
    }

    const sentToEmail = mailResult.ok;
    const backupEmailSent = secondEmailVal ? secondEmailVerificationResult.ok : null; // null = no backup email requested
    let message = 'Employee account created successfully. ';

    if (sentToEmail) {
      message += 'Credentials sent via email.';
    } else {
      message += `⚠️ Email sending failed: ${mailResult.reason || 'Unknown error'}. Check backend terminal for details. Credentials are logged in terminal.`;
    }
    if (secondEmailVal) {
      if (backupEmailSent) {
        message += ' Backup email verification sent.';
      } else {
        message += ` ⚠️ Backup email verification could not be sent: ${secondEmailVerificationResult.reason || 'Unknown error'}.`;
      }
    }

    return res.status(200).json({
      success: true,
      message,
      sentToEmail,
      emailError: !mailResult.ok ? mailResult.reason : null,
      backupEmailSent: backupEmailSent ?? undefined,
      backupEmailError: secondEmailVal && !secondEmailVerificationResult.ok ? (secondEmailVerificationResult.reason || 'Failed to send') : undefined,
      backupEmailAddress: secondEmailVal || undefined,
    });
  } catch (e) {
    console.error('Create employee error:', e);
    const msg = (e.message || '').toLowerCase();
    const isEmailExists = e.code === 'email_exists' || e.status === 422 ||
      /already registered|already exists|already been registered|email.*exists|user.*registered/i.test(msg);
    if (isEmailExists) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address has already been registered. If you deleted this user from the database table, you must also remove them from Supabase: go to Dashboard → Authentication → Users, find the user by this email, and delete. Then try creating the employee again.',
        code: 'email_exists',
      });
    }
    return res.status(500).json({
      success: false,
      message: e.message || 'Failed to create employee. Please try again.',
    });
  }
});

/**
 * POST /api/accounts/resend-credentials-email
 * Body: { email }
 * Resends credentials to email. Sends the same plain password as at creation when available;
 * otherwise generates a new temporary password, updates Auth, and sends that.
 */
router.post('/resend-credentials-email', async (req, res) => {
  try {
    const { email } = req.body;
    const emailVal = email && String(email).trim().toLowerCase();
    if (!emailVal || !EMAIL_REGEX.test(emailVal)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, auth_id, email, first_name, last_name, middle_name')
      .ilike('email', emailVal)
      .limit(1)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let password = employeePlainPasswords.get(user.auth_id);
    if (!password) {
      password = generatePasswordFromName(user.first_name, user.last_name);
      const { error: updateErr } = await supabase.auth.admin.updateUserById(user.auth_id, { password });
      if (updateErr) {
        console.error('Resend: failed to set new password in Auth', updateErr);
        return res.status(500).json({ success: false, message: 'Could not reset password for resend.' });
      }
      employeePlainPasswords.set(user.auth_id, password);
    }

    const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ');
    const mailResult = await sendNewEmployeeCredentialsEmail({
      to: user.email,
      username: user.email,
      password,
      fullName: fullName || `${user.first_name} ${user.last_name}`,
    });

    if (!mailResult.ok) {
      return res.status(500).json({ success: false, message: mailResult.reason || 'Failed to send email.' });
    }

    console.log(`[Resend] Credentials re-sent to email: ${user.email}`);
    return res.status(200).json({ success: true, message: 'Credentials resent to email.' });
  } catch (e) {
    console.error('Resend email error:', e);
    return res.status(500).json({ success: false, message: e.message || 'Resend failed.' });
  }
});

// SMS resend endpoint removed - using email only
// router.post('/resend-credentials-sms', ...) - REMOVED

/**
 * PATCH /api/accounts/user-status
 * Body: { userId, status } where status is 'ACTIVE' or 'INACTIVE'
 * Updates the user's status in the database (bypasses RLS via service role).
 * Used when superadmin/admin archives or activates a user so the DB actually updates.
 */
router.patch('/user-status', async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required.' });
    }
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      return res.status(400).json({ success: false, message: 'status must be ACTIVE or INACTIVE.' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select('id, status')
      .maybeSingle();

    if (error) {
      console.error('user-status update error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to update user status.' });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: { id: data.id, status: data.status } });
  } catch (e) {
    console.error('user-status error:', e);
    return res.status(500).json({ success: false, message: e.message || 'Failed to update user status.' });
  }
});

/**
 * GET /api/accounts/verify-second-email
 * Query params: { token, email }
 * Verifies second email when user clicks Accept button in email
 */
router.get('/verify-second-email', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>Missing verification token or email. Please check your email link.</p>
        </body>
        </html>
      `);
    }

    const tokenData = secondEmailTokens.get(token);

    if (!tokenData) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>Invalid or expired verification token. Please contact your administrator.</p>
        </body>
        </html>
      `);
    }

    // Check expiry
    if (Date.now() > tokenData.expiresAt) {
      secondEmailTokens.delete(token);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Expired</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Expired</h1>
          <p>This verification link has expired. Please contact your administrator to resend the verification email.</p>
        </body>
        </html>
      `);
    }

    // Verify email matches
    const emailVal = String(email).trim().toLowerCase();
    if (emailVal !== tokenData.email.toLowerCase()) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>Email mismatch. Please use the exact link from your verification email.</p>
        </body>
        </html>
      `);
    }

    // Update user's second_email_verified status in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ second_email_verified: true })
      .eq('auth_id', tokenData.userId);

    if (updateError) {
      console.error('Failed to update second_email_verified:', updateError);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Error</h1>
          <p>Failed to verify email. Please contact your administrator.</p>
        </body>
        </html>
      `);
    }

    // Remove token after successful verification
    secondEmailTokens.delete(token);

    console.log(`✅ Second email verified: ${emailVal} for user ${tokenData.userId}`);

    // Return success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            text-align: center; 
            padding: 50px 20px;
            background: #f9fafb;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .success-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
          h1 { color: #111; margin: 0 0 16px 0; }
          p { color: #374151; line-height: 1.6; margin: 0 0 12px 0; }
          .email { 
            color: #111; 
            font-family: 'Courier New', monospace; 
            background: #f3f4f6; 
            padding: 8px 12px; 
            border-radius: 4px;
            display: inline-block;
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Email Verified Successfully!</h1>
          <p>Your second email account has been verified and activated.</p>
          <p><strong>Email:</strong></p>
          <div class="email">${emailVal}</div>
          <p style="margin-top: 24px;">You can now use this email to log in if you forget your primary email.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">You can close this window.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Verify second email error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1 class="error">Verification Error</h1>
        <p>An error occurred during verification. Please contact your administrator.</p>
      </body>
      </html>
    `);
  }
});

module.exports = router;
