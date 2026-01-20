const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { generateVerificationCode, verificationCodes } = require('../utils/verification');
const { getSmtpConfig, sendChangePasswordVerificationEmail } = require('../utils/mailer');
const requireAuth = require('../middleware/requireAuth');

// Route: Send OTP for password change (from profile)
// This route sends verification email to the authenticated user's email address
router.post('/send-otp', requireAuth, async (req, res) => {
  try {
    const authenticatedUserEmail = req.authUser.email;
    console.log('Profile password change OTP requested for authenticated user:', authenticatedUserEmail);

    // Find user by auth_id from token
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('id, email, auth_id, status')
      .eq('auth_id', req.authUser.id)
      .maybeSingle();

    if (userErr || !userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is active
    if (userData.status === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Generate 6-digit OTP
    const otp = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Store OTP with expiry using authenticated user's email
    verificationCodes.set(`profile_otp_${authenticatedUserEmail}`, {
      otp,
      expiresAt,
      userId: userData.auth_id,
      email: authenticatedUserEmail
    });

    // Send verification email to the authenticated user's email address
    // Subject: "Change Password Verification"
    const smtpCfg = getSmtpConfig();
    const verificationType = 'CHANGE PASSWORD VERIFICATION';
    const emailSubject = 'Change Password Verification';
    let emailResult = null;

    if (smtpCfg.enabled) {
      try {
        emailResult = await sendChangePasswordVerificationEmail({ to: authenticatedUserEmail, code: otp, expiresMinutes: 10 });
      } catch (err) {
        console.error('SMTP email sending failed:', err);
        emailResult = { ok: false, reason: err.message, subject: emailSubject, to: authenticatedUserEmail };
      }
    } else {
      emailResult = { ok: false, reason: 'SMTP not configured', subject: emailSubject, to: authenticatedUserEmail };
      console.warn('⚠️ SMTP not configured. Verification code is logged to terminal only.');
      console.warn('⚠️ To receive emails with "Change Password Verification" subject, configure SMTP in backend/.env');
    }

    // Enhanced terminal logging with all verification details
    const actionPerformed = 'CHANGE_PASSWORD';
    console.log('\n' + '═'.repeat(75));
    console.log('📧 EMAIL VERIFICATION - PASSWORD CHANGE');
    console.log('═'.repeat(75));
    console.log(`👤 User: ${authenticatedUserEmail}`);
    console.log(`📨 Subject: ${emailSubject}`);
    console.log(`📬 Sent to: ${authenticatedUserEmail}`);
    
    if (emailResult.ok) {
      console.log('✅ Status: Email sent successfully!');
      console.log('\n' + '─'.repeat(75));
      console.log('📧 EMAIL CONTENT (as sent to user):');
      console.log('─'.repeat(75));
      console.log(`From: Automatic Garbage Sorting System <${authenticatedUserEmail}>`);
      console.log(`To: ${authenticatedUserEmail}`);
      console.log(`Subject: ${emailSubject}`);
      console.log('');
      console.log('Action Performed: CHANGE_PASSWORD');
      console.log('');
      console.log('You have requested to change your password.');
      console.log('Use the code below to verify your password change:');
      console.log('');
      console.log('   ╔═══════════════════════════════╗');
      console.log(`   ║      ${otp}      ║`);
      console.log('   ╚═══════════════════════════════╝');
      console.log('');
      console.log('This code expires in 10 minutes.');
      console.log('');
      console.log('If you did not request to change your password, you can ignore this email.');
      console.log('─'.repeat(75));
      console.log(`🔑 Verification Code: ${otp}`);
      console.log(`⏰ Expires in: 10 minutes`);
      console.log('💡 The user should check their email inbox for the verification code.');
    } else {
      console.log('❌ Status: Email sending failed');
      console.log('\n' + '─'.repeat(75));
      // Handle multi-line error messages with better formatting
      const reasonLines = emailResult.reason.split('\n');
      reasonLines.forEach(line => {
        if (line.trim()) {
          console.log('   ' + line);
        }
      });
      console.log('─'.repeat(75));
      console.log('\n📧 EMAIL CONTENT (would be sent if SMTP was configured):');
      console.log('─'.repeat(75));
      console.log(`From: Automatic Garbage Sorting System <${authenticatedUserEmail}>`);
      console.log(`To: ${authenticatedUserEmail}`);
      console.log(`Subject: ${emailSubject}`);
      console.log('');
      console.log('Action Performed: CHANGE_PASSWORD');
      console.log('');
      console.log('You have requested to change your password.');
      console.log('Use the code below to verify your password change:');
      console.log('');
      console.log('   ╔═══════════════════════════════╗');
      console.log(`   ║      ${otp}      ║`);
      console.log('   ╚═══════════════════════════════╝');
      console.log('');
      console.log('This code expires in 10 minutes.');
      console.log('─'.repeat(75));
      console.log(`🔑 Verification Code: ${otp} (available for testing)`);
      console.log(`⏰ Expires in: 10 minutes`);
      console.log('💡 Tip: User can still use the code above while you fix the email configuration.\n');
    }
    console.log('═'.repeat(75) + '\n');

    if (emailResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code sent to ${authenticatedUserEmail}. Check your email for "Change Password Verification". Code is also logged in terminal.`,
        otp: otp
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code generated. Check terminal for code. ${emailResult.reason === 'SMTP not configured' ? 'Configure SMTP in backend/.env to receive emails with "Change Password Verification" subject.' : 'Email sending failed - check terminal for details.'}`,
        otp: otp
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Verify OTP for password change (authenticated user)
router.post('/verify-otp', requireAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const emailLower = req.authUser.email;
    const storedData = verificationCodes.get(`profile_otp_${emailLower}`);

    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`profile_otp_${emailLower}`);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (storedData.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    const changeToken = Buffer.from(`${emailLower}:${Date.now()}:profile`).toString('base64');
    verificationCodes.set(`profile_change_${emailLower}`, {
      token: changeToken,
      expiresAt: Date.now() + (30 * 60 * 1000),
      userId: storedData.userId,
      email: emailLower
    });
    verificationCodes.delete(`profile_otp_${emailLower}`);

    return res.status(200).json({ success: true, message: 'OTP verified successfully', changeToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Route: Change password after OTP verification (authenticated user)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { changeToken, newPassword } = req.body;
    if (!changeToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Change token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const emailLower = req.authUser.email;
    const storedData = verificationCodes.get(`profile_change_${emailLower}`);
    if (!storedData || storedData.token !== changeToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired change token. Please verify OTP again.' });
    }
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`profile_change_${emailLower}`);
      return res.status(400).json({ success: false, message: 'Change token has expired. Please verify OTP again.' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(storedData.userId, { password: newPassword });
    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to change password. Please try again.' });
    }

    verificationCodes.delete(`profile_change_${emailLower}`);
    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

module.exports = router;
