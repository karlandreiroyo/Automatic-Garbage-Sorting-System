import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './forgot.css';

// Eye icon component
const EyeIcon = ({ visible }) => (
  visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.36 21.36 0 0 1 5.06-6.06M1 1l22 22"/>
    </svg>
  )
);

// Backend API base URL - adjust this to match your backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  const [passwordErrors, setPasswordErrors] = useState({});

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
  const isPasswordValid = (password) => {
    const errors = validatePassword(password);
    return Object.keys(errors).length === 0;
  };

  const sendCode = async () => {
    if (!emailOrMobile.trim()) {
      setError('Please enter your email or mobile number');
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
        // Show the code in the message if available
        const message = data.code 
          ? `Verification code: ${data.code} (Check terminal or email)`
          : (data.message || 'Password reset email sent. Check your email for the verification code.');
        setToastMessage(message);
        
        // Also log to browser console
        if (data.code) {
          console.log('═══════════════════════════════════════');
          console.log('🔑 VERIFICATION CODE:', data.code);
          console.log('📧 Email:', emailOrMobile);
          console.log('═══════════════════════════════════════');
        }
        
        setTimeout(() => {
          setShowToast(false);
          setStep('confirm');
        }, 5000); // Show longer so user can see the code
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

  const confirmCode = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
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
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    // Validate password
    const errors = validatePassword(newPassword);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setError('Please fix the password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!resetToken) {
      setError('Reset token is missing. Please start over.');
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
        setToastMessage('Code resent successfully');
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    navigate('/login');
  };

  return (
    <div className="forgot-container">
      {showToast && <div className="toast">{toastMessage}</div>}
      {error && <div className="error-message" style={{ 
        color: '#ef4444', 
        marginBottom: '10px', 
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>{error}</div>}

      {step === 'forgot' && (
        <div className="forgot-box">
          <button className="close-btn" onClick={cancel}>✕</button>

          <h2>Reset Password</h2>
          <p className="subtitle">
            Enter your mobile number or email
          </p>

          <input
            type="text"
            placeholder="Mobile number or email"
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
        <div className="forgot-box">
          <button className="close-btn" onClick={cancel}>✕</button>

          <h2>Confirm your account</h2>
          <p className="subtitle">
            Enter the verification code sent to your email
          </p>

          <input
            type="text"
            placeholder="Enter 6-digit code"
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
            className="btn primary full" 
            onClick={confirmCode}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>

          <button 
            className="btn link" 
            onClick={resendCode}
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            Didn't get a code? Resend
          </button>
        </div>
      )}

      {step === 'reset' && (
        <div className="forgot-box">
          <button className="close-btn" onClick={cancel}>✕</button>

          <h2>Reset Password</h2>
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
              <EyeIcon visible={showNewPassword} />
            </button>
          </div>

          {/* Password validation messages */}
          {newPassword && (
            <div className="password-validation">
              <div className={`validation-item ${newPassword.length >= 8 && newPassword.length <= 128 ? 'valid' : 'invalid'}`}>
                {newPassword.length >= 8 && newPassword.length <= 128 ? '✓' : '✗'} 8-128 characters
              </div>
              <div className={`validation-item ${/[A-Z]/.test(newPassword) ? 'valid' : 'invalid'}`}>
                {/[A-Z]/.test(newPassword) ? '✓' : '✗'} 1 capital letter
              </div>
              <div className={`validation-item ${/[0-9]/.test(newPassword) ? 'valid' : 'invalid'}`}>
                {/[0-9]/.test(newPassword) ? '✓' : '✗'} 1 numerical character
              </div>
              <div className={`validation-item ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'valid' : 'invalid'}`}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '✗'} 1 special character
              </div>
            </div>
          )}

          <div className="password-input-wrapper" style={{ marginTop: '16px' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <EyeIcon visible={showConfirmPassword} />
            </button>
          </div>

          {/* Checkbox to show/hide confirm password */}
          <label className="show-password-checkbox">
            <input
              type="checkbox"
              checked={showConfirmPassword}
              onChange={(e) => setShowConfirmPassword(e.target.checked)}
              disabled={loading}
            />
            <span>Show password</span>
          </label>

          <button 
            className="btn primary full" 
            onClick={resetPassword}
            disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Forgot;
