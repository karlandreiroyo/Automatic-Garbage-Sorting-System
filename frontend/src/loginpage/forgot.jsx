import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forgot.css';

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

  const navigate = useNavigate();

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

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
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

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError('');
            }}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            disabled={loading}
            style={{ marginTop: '10px' }}
          />

          <button 
            className="btn primary full" 
            onClick={resetPassword}
            disabled={loading}
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
