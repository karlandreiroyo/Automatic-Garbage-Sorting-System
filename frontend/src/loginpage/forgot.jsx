import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './forgot.css';

// Decorative Green Translucent Shapes Component
const DecorativeShapes = () => (
  <div className="decorative-shapes">
    {/* Top-left shape */}
    <div className="shape shape-1"></div>
    {/* Bottom-right shape */}
    <div className="shape shape-2"></div>
  </div>
);


// Backend API base URL - adjust this to match your backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://automatic-garbage-sorting-system-production.up.railway.app';

const Forgot = () => {
  const [step, setStep] = useState('forgot'); // forgot | confirm | reset
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [_passwordErrors, setPasswordErrors] = useState({});

  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const errors = {};
    
    if (password.length < 8) {
      errors.minLength = 'Password must be at least 8 characters';
    }
    
    if (password.length > 128) {
      errors.maxLength = 'Password must be at most 128 characters';
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.capital = 'Password must contain at least 1 capital letter';
    }
    
    if (!/[0-9]/.test(password)) {
      errors.number = 'Password must contain at least 1 numerical character';
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.special = 'Password must contain at least 1 special character';
    }
    
    return errors;
  };

  // Check if password is valid
  const _isPasswordValid = (password) => {
    const errors = validatePassword(password);
    return Object.keys(errors).length === 0;
  };

  const sendCode = async () => {
    if (!emailOrMobile.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrMobile: emailOrMobile.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setShowToast(true);
        // Show generic message without revealing the code
        const message = data.message || 'Verification code has been sent to your email. Please check your inbox.';
        setToastMessage(message);
        
        // Log to browser console for debugging (not shown to user)
        if (data.code) {
          console.log('═══════════════════════════════════════');
          console.log('🔑 VERIFICATION CODE:', data.code);
          console.log('📧 Email:', emailOrMobile);
          console.log('═══════════════════════════════════════');
        }
        
        setTimeout(() => {
          setShowToast(false);
          setStep('confirm');
        }, 3000); // Reduced time since we're not showing the code
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Send code error:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (loading) {
      return; // Prevent multiple clicks
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emailOrMobile: emailOrMobile.trim(),
          code: code.trim() 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setShowToast(true);
        setToastMessage('Code verified successfully');
        setTimeout(() => {
          setShowToast(false);
          setStep('reset');
        }, 1500);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    // Clear previous errors
    setError('');

    // Validate new password is entered
    if (!newPassword.trim()) {
      setError('⚠️ Warning: Please enter a new password');
      return;
    }

    // Validate confirm password is entered
    if (!confirmPassword.trim()) {
      setError('⚠️ Warning: Please confirm your password');
      return;
    }

    // Validate password requirements
    const errors = validatePassword(newPassword);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      // Create detailed error message from validation errors
      const errorMessages = Object.values(errors);
      setError('⚠️ Warning: ' + errorMessages.join('. '));
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('⚠️ Warning: Passwords do not match. Please make sure both passwords are the same.');
      return;
    }

    // Validate reset token exists
    if (!resetToken) {
      setError('⚠️ Error: Reset token is missing. Please start over from the beginning.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resetToken,
          newPassword: newPassword.trim() 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowToast(true);
        setToastMessage('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!emailOrMobile.trim()) {
      setError('Email is required to resend code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrMobile: emailOrMobile.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setShowToast(true);
        // Show generic message without revealing the code
        const message = data.message || 'Verification code has been resent to your email. Please check your inbox.';
        setToastMessage(message);
        
        // Log to browser console for debugging (not shown to user)
        if (data.code) {
          console.log('═══════════════════════════════════════');
          console.log('🔑 NEW VERIFICATION CODE:', data.code);
          console.log('📧 Email:', emailOrMobile);
          console.log('═══════════════════════════════════════');
        }
        
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      } else {
        setError(data.message || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setError('Failed to resend code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    navigate('/login');
  };

  return (
    <div className="forgot-container">
      {/* Mobile Flower Decorations */}
      <div className="mobile-flower-left"></div>
      <div className="mobile-flower-right"></div>
      
      {/* Left Panel - 2/3 width */}
      <div className="left-panel">
        <DecorativeShapes />
        <div className="left-panel-content">
          <h1 className="system-title">
            Automatic<br />Garbage<br />Sorting System
          </h1>
          <div className="illustration-container">
            <img src="/sorting-logo.png" alt="Automatic Garbage Sorting System Logo" className="system-logo" />
          </div>
        </div>
      </div>

      {/* Right Panel - 1/3 width */}
      <div className="right-panel">
        {showToast && <div className="toast">{toastMessage}</div>}
        
        {step === 'forgot' && (
          <div className="forgot-box forgot-step">
            <button className="close-btn" onClick={cancel}>✕</button>

            <h2>Reset Password</h2>
            {error && <div className="error-message">{error}</div>}
            <p className="subtitle">
              Enter your email or backup email
            </p>

            <input
              type="email"
              placeholder="Email or backup email"
              value={emailOrMobile}
              onChange={(e) => {
                setEmailOrMobile(e.target.value);
                setError('');
              }}
              disabled={loading}
            />

            <div className="btn-group">
              <button className="btn cancel" onClick={cancel} disabled={loading}>
                Cancel
              </button>
              <button 
                className="btn primary" 
                onClick={sendCode}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Verification'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="forgot-box confirm-step">
            <button className="close-btn" onClick={cancel}>✕</button>

            <h2>Confirm your account</h2>
            {error && <div className="error-message">{error}</div>}
            <p className="subtitle">
              Enter the verification code sent to your email
            </p>

            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              disabled={loading}
              maxLength="6"
              style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
            />

            <button 
              type="button"
              className="btn primary full" 
              onClick={confirmCode}
              disabled={loading}
              aria-label="Continue to verify code"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>

            <button 
              type="button"
              className="btn link" 
              onClick={resendCode}
              disabled={loading}
              style={{ marginTop: '10px' }}
              aria-label="Resend verification code"
            >
              {loading ? 'Resending...' : "Didn't get a code? Resend"}
            </button>
          </div>
        )}

        {step === 'reset' && (
          <div className="forgot-box reset-step">
            <button className="close-btn" onClick={cancel}>✕</button>

            <h2>Reset Password</h2>
            {error && <div className="error-message">{error}</div>}
            <p className="subtitle">
              Enter your new password
            </p>

            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                  const errors = validatePassword(e.target.value);
                  setPasswordErrors(errors);
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
              </button>
            </div>

            <div className="password-input-wrapper" style={{ marginTop: '16px' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                  // Check if passwords match in real-time
                  if (e.target.value && newPassword && e.target.value !== newPassword) {
                    // Don't show error while typing, only when they click submit
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
              </button>
            </div>

            {/* Checkbox to show/hide password */}
            <label className="show-password-checkbox">
              <input
                type="checkbox"
                checked={showConfirmPassword}
                onChange={(e) => {
                  setShowConfirmPassword(e.target.checked);
                  setShowNewPassword(e.target.checked);
                }}
                disabled={loading}
              />
              <span>Show password</span>
            </label>

            <button 
              type="button"
              className="btn primary full" 
              onClick={resetPassword}
              disabled={loading}
              style={{ marginTop: '20px' }}
              aria-label="Reset password"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forgot;
