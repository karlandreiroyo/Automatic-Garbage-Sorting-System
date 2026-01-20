const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { generateVerificationCode, verificationCodes } = require('../utils/verification');
const { getSmtpConfig, sendResetPasswordVerificationEmail } = require('../utils/mailer');

// Route: Send password reset code
router.post('/send-code', async (req, res) => {
  try {
    const { emailOrMobile } = req.body;

    if (!emailOrMobile || !emailOrMobile.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or mobile number is required' 
      });
    }

    // Check if input is email or mobile
    const isEmail = emailOrMobile.includes('@');
    let email = null;
    let user = null;

    if (isEmail) {
      // Find user by email (case-insensitive search)
      email = emailOrMobile.trim().toLowerCase();
      
      console.log('Searching for user with email:', email);
      
      // Try multiple search methods
      let userData = null;
      let userError = null;
      
      // Method 1: Try exact match first (most reliable)
      let result = await supabase
        .from('users')
        .select('id, email, auth_id, status')
        .eq('email', email)
        .maybeSingle();
      
      console.log('Exact match result:', result);
      
      if (result.data) {
        userData = result.data;
        console.log('User found with exact match:', userData);
      } else {
        // Method 2: Try case-insensitive search
        result = await supabase
          .from('users')
          .select('id, email, auth_id, status')
          .ilike('email', email);
        
        console.log('Case-insensitive match result:', result);
        
        if (result.data && result.data.length > 0) {
          userData = result.data[0];
          console.log('User found with case-insensitive match:', userData);
        } else {
          // Method 3: Try without .maybeSingle() to see all users
          const allUsers = await supabase
            .from('users')
            .select('id, email, auth_id, status')
            .limit(100);
          
          console.log('All users in database:', allUsers.data?.map(u => u.email));
          userError = result.error || 'User not found';
        }
      }

      if (!userData) {
        // Last resort: Try searching all users to see what emails exist
        const { data: allUsers } = await supabase
          .from('users')
          .select('email')
          .limit(100);
        
        const emailList = allUsers?.map(u => u.email).join(', ') || 'none';
        console.error('User lookup failed for email:', email);
        console.error('Available emails in database:', emailList);
        console.error('Error details:', userError);
        
        return res.status(404).json({ 
          success: false, 
          message: `User not found with email: ${email}. Please make sure the account was created in the admin panel.` 
        });
      }
      
      user = userData;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Please use email address for password reset' 
      });
    }

    // Check if user is active
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Store code with expiry
    verificationCodes.set(email, {
      code,
      expiresAt,
      userId: user.auth_id,
      email: email
    });

    // Send verification email to the user's email address
    // Subject: "Reset Password Verification"
    // Note: For forgot password, user is not logged in, so we use the email from the request
    const userEmail = email.toLowerCase();
    const smtpCfg = getSmtpConfig();
    const verificationType = 'RESET PASSWORD VERIFICATION';
    const emailSubject = 'Reset Password Verification';
    let emailResult = null;

    if (smtpCfg.enabled) {
      try {
        emailResult = await sendResetPasswordVerificationEmail({ to: userEmail, code, expiresMinutes: 10 });
      } catch (err) {
        console.error('SMTP email sending failed:', err);
        emailResult = { ok: false, reason: err.message, subject: emailSubject, to: userEmail };
      }
    } else {
      emailResult = { ok: false, reason: 'SMTP not configured', subject: emailSubject, to: userEmail };
      console.warn('⚠️ SMTP not configured. Verification code is logged to terminal only.');
      console.warn('⚠️ To receive emails with "Reset Password Verification" subject, configure SMTP in backend/.env');
    }

    // Enhanced terminal logging with all verification details
    const actionPerformed = 'RESET_PASSWORD';
    console.log('\n' + '═'.repeat(75));
    console.log('📧 EMAIL VERIFICATION - PASSWORD RESET');
    console.log('═'.repeat(75));
    console.log(`👤 User: ${userEmail}`);
    console.log(`📨 Subject: ${emailSubject}`);
    console.log(`📬 Sent to: ${userEmail}`);
    
    if (emailResult.ok) {
      console.log('✅ Status: Email sent successfully!');
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
      console.log(`🔑 Verification Code: ${code} (available for testing)`);
      console.log(`⏰ Expires in: 10 minutes`);
      console.log('💡 Tip: User can still use the code above while you fix the email configuration.\n');
    }
    console.log('═'.repeat(75) + '\n');

    if (emailResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code sent to ${userEmail}. Check your email for "Reset Password Verification". Code is also logged in terminal.`,
        code: code
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code generated. Check terminal for code. ${emailResult.reason === 'SMTP not configured' ? 'Configure SMTP in backend/.env to receive emails with "Reset Password Verification" subject.' : 'Email sending failed - check terminal for details.'}`,
        code: code
      });
    }

  } catch (error) {
    console.error('Send code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Verify token from Supabase email
router.post('/verify-code', async (req, res) => {
  try {
    const { emailOrMobile, code } = req.body;

    if (!emailOrMobile || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification token are required' 
      });
    }

    const isEmail = emailOrMobile.includes('@');
    const email = isEmail ? emailOrMobile.trim().toLowerCase() : null;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please use email address' 
      });
    }

    // Get stored verification code
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code. Please request a new code.' 
      });
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Verify the code matches
    if (storedData.code !== code.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please check and try again.' 
      });
    }

    // Code is valid - generate reset token
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    // Store reset token temporarily
    verificationCodes.set(`reset_${email}`, {
      token: resetToken,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      userId: storedData.userId,
      email: email
    });

    // Remove the verification code after successful verification
    verificationCodes.delete(email);

    return res.status(200).json({ 
      success: true, 
      message: 'Token verified successfully',
      resetToken 
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Reset password
router.post('/reset', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token and new password are required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Find reset token
    let email = null;
    let resetData = null;

    for (const [key, value] of verificationCodes.entries()) {
      if (key.startsWith('reset_') && value.token === resetToken) {
        email = key.replace('reset_', '');
        resetData = value;
        break;
      }
    }

    if (!resetData || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Check expiry
    if (Date.now() > resetData.expiresAt) {
      verificationCodes.delete(`reset_${email}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new password reset.' 
      });
    }

    // Update password using Supabase Admin API with the stored token
    // First verify the token is still valid, then update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetData.userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to reset password. Please try again.' 
      });
    }

    // Remove reset token
    verificationCodes.delete(`reset_${email}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { emailOrMobile } = req.body;

    if (!emailOrMobile || !emailOrMobile.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or mobile number is required' 
      });
    }

    const isEmail = emailOrMobile.includes('@');
    let email = null;
    let user = null;

    if (isEmail) {
      email = emailOrMobile.trim().toLowerCase();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, auth_id, status')
        .ilike('email', email)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found with this email' 
        });
      }

      user = userData;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Please use email address for password reset' 
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000);

    verificationCodes.set(email, {
      code,
      expiresAt,
      userId: user.auth_id
    });

    // Send verification email to the user's email address
    // Subject: "Reset Password Verification"
    const userEmail = email.toLowerCase();
    const smtpCfg = getSmtpConfig();
    const verificationType = 'RESET PASSWORD VERIFICATION (RESEND)';
    const emailSubject = 'Reset Password Verification';
    let emailResult = null;

    if (smtpCfg.enabled) {
      try {
        emailResult = await sendResetPasswordVerificationEmail({ to: userEmail, code, expiresMinutes: 10 });
      } catch (err) {
        console.error('SMTP email sending failed:', err);
        emailResult = { ok: false, reason: err.message, subject: emailSubject, to: userEmail };
      }
    } else {
      emailResult = { ok: false, reason: 'SMTP not configured', subject: emailSubject, to: userEmail };
    }

    // Enhanced terminal logging with all verification details
    const actionPerformed = 'RESET_PASSWORD';
    console.log('\n' + '═'.repeat(75));
    console.log('📧 EMAIL VERIFICATION - PASSWORD RESET');
    console.log('═'.repeat(75));
    console.log(`👤 User: ${userEmail}`);
    console.log(`📨 Subject: ${emailSubject}`);
    console.log(`📬 Sent to: ${userEmail}`);
    
    if (emailResult.ok) {
      console.log('✅ Status: Email sent successfully!');
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
      console.log(`🔑 Verification Code: ${code} (available for testing)`);
      console.log(`⏰ Expires in: 10 minutes`);
      console.log('💡 Tip: User can still use the code above while you fix the email configuration.\n');
    }
    console.log('═'.repeat(75) + '\n');

    if (emailResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code resent to ${email}. Check your email for "Reset Password Verification". Code is also logged in terminal.`,
        code: code
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: `Verification code regenerated. Check terminal for code. ${emailResult.reason === 'SMTP not configured' ? 'Configure SMTP in backend/.env to receive emails with "Reset Password Verification" subject.' : 'Email sending failed - check terminal for details.'}`,
        code: code
      });
    }

  } catch (error) {
    console.error('Resend code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

module.exports = router;
