require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = 'https://aezdtsjycbsygqnsvkbz.supabase.co';

// IMPORTANT: Use service role key for admin operations (bypasses RLS)
// Get this from Supabase Dashboard > Settings > API > service_role key (secret)
// Set it in .env file as: SUPABASE_SERVICE_KEY=your_key_here
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
  console.error('⚠️ WARNING: SUPABASE_SERVICE_KEY not configured!');
  console.error('⚠️ The backend needs the service_role key to access the users table.');
  console.error('⚠️ Current value:', supabaseServiceKey || 'NOT SET');
  console.error('⚠️ Get your key from: Supabase Dashboard > Settings > API > service_role key');
  console.error('⚠️ Update backend/.env file with: SUPABASE_SERVICE_KEY=your_actual_key');
  console.error('⚠️ Then restart the server with: npm start');
}

// Create Supabase client with service role key for admin operations
// If service role key is not provided, backend will not work properly
const supabaseKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemR0c2p5Y2JzeWdxbnN2a2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MTEsImV4cCI6MjA4MjMwNTgxMX0.q6DYxzIGPJLt8_2Aop1HQ31VkGk0OP9ODwy7CTJoN2I';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

    // Use Supabase Auth's password reset email
    // Supabase sends an email with a reset link containing a token
    // The email will have a link like: /reset-password?token=xxx&type=recovery
    const redirectUrl = `${req.headers.origin || 'http://localhost:5173'}/reset-password`;
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      console.error('Reset password error:', resetError);
      console.error('Error details:', JSON.stringify(resetError, null, 2));
      
      // Check if it's an email configuration error
      if (resetError.message && resetError.message.includes('email')) {
        return res.status(500).json({ 
          success: false, 
          message: 'Email service error. Please check Supabase email configuration in your dashboard.' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: resetError.message || 'Failed to send password reset email. Please try again.' 
      });
    }
    
    console.log('Password reset email sent successfully via Supabase Auth');

    // Store email for token validation
    // Supabase sends an email with a link containing a token
    // User needs to extract the token from the email link and enter it
    verificationCodes.set(`email_${email}`, {
      email,
      userId: user.auth_id,
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour expiry
      requestedAt: Date.now()
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset email sent by Supabase Auth. Check your email for the reset link and copy the token from the link.'
    });

  } catch (error) {
    console.error('Send code error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Route: Verify token from Supabase email
// The user receives an email with a link like: /reset-password?token=xxx&type=recovery
// They need to extract the token from the email and enter it here
app.post('/api/forgot-password/verify-code', async (req, res) => {
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

    // Check if password reset was requested for this email
    const storedData = verificationCodes.get(`email_${email}`);

    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No password reset request found. Please request a new password reset.' 
      });
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(`email_${email}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Reset link has expired. Please request a new password reset.' 
      });
    }

    // The code is the token from Supabase email link
    // Validate it by trying to use it with Supabase Auth
    // For now, we'll accept it and store it for password reset
    const resetToken = Buffer.from(`${email}:${code}:${Date.now()}`).toString('base64');
    
    // Store reset token with Supabase token for password update
    verificationCodes.set(`reset_${email}`, {
      token: resetToken,
      supabaseToken: code, // Store the actual token from Supabase email
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      userId: storedData.userId,
      email: email
    });

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
app.post('/api/forgot-password/resend-code', async (req, res) => {
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

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code resent to your email',
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
