const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { generateVerificationCode, verificationCodes } = require('../utils/verification');
const { getSmtpConfig, sendLoginVerificationEmail } = require('../utils/mailer');
const requireAuth = require('../middleware/requireAuth');

// Route: Send verification code after login
// This route sends verification email to the authenticated user's email address
router.post('/send-verification', requireAuth, async (req, res) => {
  try {
    const authenticatedUserEmail = req.authUser.email;
    console.log('Login verification code requested for authenticated user:', authenticatedUserEmail);

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

    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Store verification code with login session identifier
    verificationCodes.set(`login_verification_${authenticatedUserEmail}`, {
      code,
      expiresAt,
      userId: userData.auth_id,
      email: authenticatedUserEmail
    });

    // Send verification email to the authenticated user's email address
    // Subject: "Login Verification"
    const smtpCfg = getSmtpConfig();
    const verificationType = 'LOGIN 2FA VERIFICATION';
    const emailSubject = 'Login Verification';
    let emailResult = null;

    if (smtpCfg.enabled) {
      try {
        emailResult = await sendLoginVerificationEmail({ to: authenticatedUserEmail, code, expiresMinutes: 10 });
      } catch (err) {
        console.error('SMTP email sending failed:', err);
        emailResult = { ok: false, reason: err.message, subject: emailSubject, to: authenticatedUserEmail };
      }
    } else {
      emailResult = { ok: false, reason: 'SMTP not configured', subject: emailSubject, to: authenticatedUserEmail };
      console.warn('⚠️ SMTP not configured. Verification code is logged to terminal only.');
      console.warn('⚠️ To receive emails with proper subject, configure SMTP in backend/.env');
    }

    // Enhanced terminal logging with all verification details
    const actionPerformed = 'LOGIN_VERIFICATION';
    console.log('\n' + '═'.repeat(75));
    console.log('📧 EMAIL VERIFICATION - LOGIN 2FA');
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
      console.log('Action Performed: LOGIN_VERIFICATION');
      console.log('');
      console.log('You have requested a login verification code.');
      console.log('Use the code below to complete your login:');
      console.log('');
      console.log('   ╔═══════════════════════════════╗');
      console.log(`   ║      ${code}      ║`);
      console.log('   ╚═══════════════════════════════╝');
      console.log('');
      console.log('This code expires in 10 minutes.');
      console.log('');
      console.log('If you did not attempt to log in, you can ignore this email.');
      console.log('─'.repeat(75));
      console.log(`🔑 Verification Code: ${code}`);
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
      console.log('Action Performed: LOGIN_VERIFICATION');
      console.log('');
      console.log('You have requested a login verification code.');
      console.log('Use the code below to complete your login:');
      console.log('');
      console.log('   ╔═══════════════════════════════╗');
      console.log(`   ║      ${code}      ║`);
      console.log('   ╚═══════════════════════════════╝');
      console.log('');
      console.log('This code expires in 10 minutes.');
      console.log('─'.repeat(75));
      console.log(`🔑 Verification Code: ${code} (available for testing)`);
      console.log(`⏰ Expires in: 10 minutes`);
      console.log('💡 Tip: User can still use the code above while you fix the email configuration.\n');
    }
    console.log('═'.repeat(75) + '\n');

    if (emailResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code sent to ${authenticatedUserEmail}. Check your email for "Login Verification". Code is also logged in terminal.`
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code generated. Check terminal for code. ${emailResult.reason === 'SMTP not configured' ? 'Configure SMTP in backend/.env to receive emails with "Login Verification" subject.' : 'Email sending failed - check terminal for details.'}`
      });
    }

  } catch (error) {
    console.error('Send login verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Verify login verification code
router.post('/verify-code', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code is required' 
      });
    }
    const authenticatedUserEmail = req.authUser.email;

    // Get stored verification code for authenticated user
    const storedData = verificationCodes.get(`login_verification_${authenticatedUserEmail}`);

    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code. Please request a new one.' 
      });
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`login_verification_${authenticatedUserEmail}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Verify code
    if (storedData.code !== code.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please check and try again.' 
      });
    }

    // Code is valid - generate login token
    const loginToken = Buffer.from(`${authenticatedUserEmail}:${Date.now()}:login`).toString('base64');
    
    // Store login token temporarily
    verificationCodes.set(`login_token_${authenticatedUserEmail}`, {
      token: loginToken,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      userId: storedData.userId,
      email: authenticatedUserEmail
    });

    // Remove the verification code after successful verification
    verificationCodes.delete(`login_verification_${authenticatedUserEmail}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code verified successfully',
      loginToken 
    });

  } catch (error) {
    console.error('Verify login code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

module.exports = router;
