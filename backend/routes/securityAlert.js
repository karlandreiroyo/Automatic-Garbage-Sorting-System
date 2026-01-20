const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { getSmtpConfig, sendSecurityAlertEmail } = require('../utils/mailer');

// Route: Send security alert email after multiple failed login attempts
router.post('/send-alert', async (req, res) => {
  try {
    const { email, failedAttempts } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    if (!failedAttempts || failedAttempts < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security alert is only sent after 3 or more failed attempts' 
      });
    }

    // Find user by email to get their actual email address
    const emailLower = email.trim().toLowerCase();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, auth_id, status')
      .ilike('email', emailLower)
      .maybeSingle();

    // Even if user is not found, we still want to send the alert to the attempted email
    // This helps notify users if someone is trying to access their account
    const recipientEmail = userData?.email || emailLower;
    const timestamp = new Date().toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Send security alert email
    const smtpCfg = getSmtpConfig();
    let emailResult = null;

    if (smtpCfg.enabled) {
      try {
        emailResult = await sendSecurityAlertEmail({ 
          to: recipientEmail, 
          failedAttempts, 
          attemptedEmail: emailLower,
          timestamp 
        });
      } catch (err) {
        console.error('SMTP email sending failed:', err);
        emailResult = { ok: false, reason: err.message, subject: 'Security Alert: Suspicious Login Attempts', to: recipientEmail };
      }
    } else {
      emailResult = { ok: false, reason: 'SMTP not configured', subject: 'Security Alert: Suspicious Login Attempts', to: recipientEmail };
    }

    // Enhanced terminal logging
    console.log('\n' + '═'.repeat(75));
    console.log('🚨 SECURITY ALERT - SUSPICIOUS LOGIN ATTEMPTS');
    console.log('═'.repeat(75));
    console.log(`👤 Attempted Email: ${emailLower}`);
    console.log(`📧 Alert Sent To: ${recipientEmail}`);
    console.log(`🔢 Failed Attempts: ${failedAttempts}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`📨 Subject: Security Alert: Suspicious Login Attempts`);
    
    if (emailResult.ok) {
      console.log('✅ Status: Security alert email sent successfully!');
      console.log('\n' + '─'.repeat(75));
      console.log('📧 EMAIL CONTENT (as sent to user):');
      console.log('─'.repeat(75));
      console.log(`From: Automatic Garbage Sorting System <${smtpCfg.from}>`);
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: Security Alert: Suspicious Login Attempts`);
      console.log('');
      console.log('⚠️  SECURITY ALERT: Suspicious Login Attempts Detected');
      console.log('');
      console.log(`We detected ${failedAttempts} failed login attempts on your account.`);
      console.log(`Attempted Email: ${emailLower}`);
      console.log(`Time: ${timestamp}`);
      console.log('');
      console.log('If this was you, you can ignore this message.');
      console.log('If you did not attempt to log in, please:');
      console.log('  1. Change your password immediately');
      console.log('  2. Review your account security settings');
      console.log('  3. Contact support if you notice any suspicious activity');
      console.log('');
      console.log('For your security, login has been temporarily disabled for 3 minutes.');
      console.log('─'.repeat(75));
    } else {
      console.log('❌ Status: Security alert email sending failed');
      console.log('\n' + '─'.repeat(75));
      const reasonLines = emailResult.reason.split('\n');
      reasonLines.forEach(line => {
        if (line.trim()) {
          console.log('   ' + line);
        }
      });
      console.log('─'.repeat(75));
      console.log('\n📧 EMAIL CONTENT (would be sent if SMTP was configured):');
      console.log('─'.repeat(75));
      console.log(`From: Automatic Garbage Sorting System <${smtpCfg.from}>`);
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: Security Alert: Suspicious Login Attempts`);
      console.log('');
      console.log('⚠️  SECURITY ALERT: Suspicious Login Attempts Detected');
      console.log('');
      console.log(`We detected ${failedAttempts} failed login attempts on your account.`);
      console.log(`Attempted Email: ${emailLower}`);
      console.log(`Time: ${timestamp}`);
      console.log('');
      console.log('If this was you, you can ignore this message.');
      console.log('If you did not attempt to log in, please:');
      console.log('  1. Change your password immediately');
      console.log('  2. Review your account security settings');
      console.log('  3. Contact support if you notice any suspicious activity');
      console.log('');
      console.log('For your security, login has been temporarily disabled for 3 minutes.');
      console.log('─'.repeat(75));
      console.log('💡 Tip: Configure SMTP in backend/.env to receive security alert emails.\n');
    }

    if (emailResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Security alert sent to ${recipientEmail}. Check your email for "Security Alert: Suspicious Login Attempts".`
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: `Security alert generated. ${emailResult.reason === 'SMTP not configured' ? 'Configure SMTP in backend/.env to receive security alert emails.' : 'Email sending failed - check terminal for details.'}`
      });
    }

  } catch (error) {
    console.error('Send security alert error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending security alert. Please try again.' 
    });
  }
});

module.exports = router;
