const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Simple cookie parser for remember-me (no extra dependency)
function parseCookies(cookieHeader) {
  const obj = {};
  if (!cookieHeader) return obj;
  cookieHeader.split(';').forEach((s) => {
    const [key, ...v] = s.trim().split('=');
    if (key) obj[key] = decodeURIComponent((v.join('=') || '').trim());
  });
  return obj;
}
const REMEMBER_ME_COOKIE = 'remember_me_token';
const rememberMeStore = new Map(); // token -> { email, password }
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60 * 1000,
  path: '/',
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
};

// Supabase configuration
const supabaseUrl = 'https://aezdtsjycbsygqnsvkbz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemR0c2p5Y2JzeWdxbnN2a2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MTEsImV4cCI6MjA4MjMwNTgxMX0.q6DYxzIGPJLt8_2Aop1HQ31VkGk0OP9ODwy7CTJoN2I';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// Route: Send password reset code
app.post('/api/forgot-password/send-code', async (req, res) => {
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
      // Find user by email
      email = emailOrMobile.trim().toLowerCase();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, auth_id, status')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found with this email' 
        });
      }

      user = userData;
    } else {
      // If mobile number, you might need a mobile field in users table
      // For now, returning error for mobile
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

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Store code with expiry
    verificationCodes.set(email, {
      code,
      expiresAt,
      userId: user.auth_id
    });

    // In production, send email via Supabase Auth or email service
    // For now, we'll use Supabase Auth's reset password functionality
    // which sends an email with a link. But we'll also support OTP
    
    // Option 1: Use Supabase Auth reset password (sends email with link)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin}/reset-password`,
    });

    if (resetError) {
      console.error('Reset password error:', resetError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset code. Please try again.' 
      });
    }

    // Return success with verification code (for development only)
    // In production, don't return the code, just confirm it was sent
    return res.status(200).json({ 
      success: true, 
      message: 'Verification code sent to your email',
      // Remove this in production - only for testing
      code: process.env.NODE_ENV === 'development' ? code : undefined
    });

  } catch (error) {
    console.error('Send code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Verify code
app.post('/api/forgot-password/verify-code', async (req, res) => {
  try {
    const { emailOrMobile, code } = req.body;

    if (!emailOrMobile || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
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

    // Get stored code
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code' 
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

    // Verify code
    if (storedData.code !== code.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }

    // Code is valid - return success with a reset token
    // In production, generate a proper JWT token
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    // Store reset token temporarily
    verificationCodes.set(`reset_${email}`, {
      token: resetToken,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      userId: storedData.userId
    });

    // Remove the verification code
    verificationCodes.delete(email);

    return res.status(200).json({ 
      success: true, 
      message: 'Code verified successfully',
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
app.post('/api/forgot-password/reset', async (req, res) => {
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

    // Update password using Supabase Admin API
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
app.post('/api/forgot-password/resend-code', async (req, res) => {
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
      // Find user by email
      email = emailOrMobile.trim().toLowerCase();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, auth_id, status')
        .eq('email', email)
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

    // Check if user is active
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Generate new verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiry

    // Update stored code
    verificationCodes.set(email, {
      code,
      expiresAt,
      userId: user.auth_id
    });

    // Send email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin}/reset-password`,
    });

    if (resetError) {
      console.error('Resend code error:', resetError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to resend code. Please try again.' 
      });
    }

    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'Verification code resent to your email',
      // Remove this in production - only for testing
      code: process.env.NODE_ENV === 'development' ? code : undefined
    });

  } catch (error) {
    console.error('Resend code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Remember-me: GET (return 200 with empty or saved email/password so no 404 in console)
app.get('/api/remember-me', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[REMEMBER_ME_COOKIE] && cookies[REMEMBER_ME_COOKIE].trim();
  if (!token) return res.status(200).json({ success: true, email: '', password: '' });
  const data = rememberMeStore.get(token);
  if (!data) return res.status(200).json({ success: true, email: '', password: '' });
  res.status(200).json({ success: true, email: data.email || '', password: data.password || '' });
});

// Remember-me: POST (save and set cookie)
app.post('/api/remember-me', (req, res) => {
  const { email, password } = req.body || {};
  const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailTrim) return res.status(400).json({ success: false, message: 'Email is required' });
  const cookies = parseCookies(req.headers.cookie);
  const oldToken = cookies[REMEMBER_ME_COOKIE] && cookies[REMEMBER_ME_COOKIE].trim();
  if (oldToken) rememberMeStore.delete(oldToken);
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  rememberMeStore.set(token, { email: emailTrim, password: typeof password === 'string' ? password : '' });
  res.cookie(REMEMBER_ME_COOKIE, token, COOKIE_OPTS);
  res.status(200).json({ success: true });
});

// Remember-me: DELETE (clear cookie and stored data)
app.delete('/api/remember-me', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[REMEMBER_ME_COOKIE] && cookies[REMEMBER_ME_COOKIE].trim();
  if (token) rememberMeStore.delete(token);
  res.clearCookie(REMEMBER_ME_COOKIE, { path: '/', sameSite: isProduction ? 'none' : 'lax', secure: isProduction });
  res.status(200).json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend login service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend login server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
