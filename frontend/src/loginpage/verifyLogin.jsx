import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

// Decorative Green Translucent Shapes Component (same as login)
const DecorativeShapes = () => (
  <div className="decorative-shapes">
    <div className="shape shape-1"></div>
    <div className="shape shape-2"></div>
  </div>
);

export default function VerifyLogin({ setIsLoggedIn, setUserRole }) {
  const navigate = useNavigate();

  const [pendingUser, setPendingUser] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://automatic-garbage-sorting-system-production.up.railway.app';

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingLoginUser');
    if (!raw) {
      navigate('/login');
      return;
    }
    try {
      setPendingUser(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem('pendingLoginUser');
      navigate('/login');
    }
  }, [navigate]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!pendingUser?.email) return;
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setVerifying(true);
      setVerificationMessage('');

      const accessToken = sessionStorage.getItem('pendingLoginAccessToken');
      if (!accessToken) {
        setVerificationMessage('Session expired. Please login again.');
        sessionStorage.removeItem('pendingLoginUser');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/login/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('userRole', pendingUser.role);
        localStorage.setItem('userEmail', pendingUser.email);
        localStorage.setItem('userName', `${pendingUser.firstName} ${pendingUser.lastName}`);

        sessionStorage.removeItem('pendingLoginUser');
        sessionStorage.removeItem('pendingLoginAccessToken');
        setIsLoggedIn(true);
        setUserRole(pendingUser.role);

        if (pendingUser.role === 'admin') navigate('/admin');
        else if (pendingUser.role === 'supervisor') navigate('/supervisor');
        else if (pendingUser.role === 'superadmin') navigate('/superadmin');
        else navigate('/');
      } else {
        setVerificationMessage(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setVerificationMessage('Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingUser?.email) return;
    try {
      setVerificationMessage('Sending new verification code...');

      const accessToken = sessionStorage.getItem('pendingLoginAccessToken');
      if (!accessToken) {
        setVerificationMessage('Session expired. Please login again.');
        sessionStorage.removeItem('pendingLoginUser');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/login/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        setVerificationMessage(data.message || 'New verification code sent to your email.');
        setVerificationCode('');
      } else {
        setVerificationMessage(data.message || 'Failed to resend verification code');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setVerificationMessage('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <div className="mobile-flower-left"></div>
      <div className="mobile-flower-right"></div>

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

      <div className="right-panel">
        <div className="form-container">
          <div className="mobile-logo-section">
            <img src="/sorting-logo.png" alt="Logo" className="mobile-logo" />
            <h3 className="mobile-title">Automatic Garbage Sorting System</h3>
          </div>

          <h2>Email Verification</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
            We've sent a verification code to your email address. Please enter the code below to complete your login.
          </p>

          {verificationMessage && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: verificationMessage.toLowerCase().includes('invalid') || verificationMessage.toLowerCase().includes('failed')
                ? '#fee'
                : '#e3f2fd',
              borderRadius: '4px',
              fontSize: '14px',
              color: verificationMessage.toLowerCase().includes('invalid') || verificationMessage.toLowerCase().includes('failed')
                ? '#c00'
                : '#1976d2',
              textAlign: 'center'
            }}>
              {verificationMessage}
            </div>
          )}

          <form onSubmit={handleVerifyCode}>
            <div className="input-group">
              <label>Verification Code</label>
              <input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setVerificationMessage('');
                }}
                required
                disabled={verifying}
                maxLength="6"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="login-btn" disabled={verifying || verificationCode.length !== 6}>
              {verifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span
              style={{ color: '#059669', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
              onClick={handleResendCode}
            >
              Resend Verification Code
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span
              style={{ color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => {
                sessionStorage.removeItem('pendingLoginUser');
                sessionStorage.removeItem('pendingLoginAccessToken');
                navigate('/login');
              }}
            >
              Back to Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

