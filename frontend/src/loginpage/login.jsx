import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.jsx';
import './login.css';
import employeeIcon from '../assets/employee.PNG';
import adminIcon from '../assets/admin.PNG';
import supervisorIcon from '../assets/supervisor.PNG';

// Decorative Green Translucent Shapes Component
const DecorativeShapes = () => (
  <div className="decorative-shapes">
    {/* Top-left shape */}
    <div className="shape shape-1"></div>
    {/* Bottom-right shape */}
    <div className="shape shape-2"></div>
  </div>
);

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

const AlertIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function Login({ setIsLoggedIn: _setIsLoggedIn, setUserRole: _setUserRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  
  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Alert');
  
  const navigate = useNavigate();

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Check for existing lockout on component mount
  useEffect(() => {
    const lockoutData = localStorage.getItem('loginLockout');
    if (lockoutData) {
      const { lockoutUntil } = JSON.parse(lockoutData);
      const now = Date.now();
      if (lockoutUntil > now) {
        setIsLockedOut(true);
        setLockoutTimeRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        // Lockout expired, clear it
        localStorage.removeItem('loginLockout');
        localStorage.removeItem('failedLoginAttempts');
        setFailedAttempts(0);
      }
    }

    // Restore failed attempts count (only if not locked out)
    const savedAttempts = localStorage.getItem('failedLoginAttempts');
    if (savedAttempts && !lockoutData) {
      const attempts = parseInt(savedAttempts, 10);
      setFailedAttempts(attempts);
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut || lockoutTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutTimeRemaining((prev) => {
        if (prev <= 1) {
          // Lockout expired
          setIsLockedOut(false);
          setFailedAttempts(0);
          localStorage.removeItem('loginLockout');
          localStorage.removeItem('failedLoginAttempts');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimeRemaining]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Prevent login if locked out
    if (isLockedOut) {
      setAlertTitle('Login Disabled');
      setAlertMessage(`Login is temporarily disabled. Please wait ${formatTimeRemaining(lockoutTimeRemaining)} before trying again.`);
      setShowAlertModal(true);
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in with Supabase Auth (primary or backup email)
      let authData = null;
      let backupEmailUsed = null;

      const { data: primaryAuth, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        // Maybe they entered their backup email: resolve to primary and try again
        try {
          const resolveRes = await fetch(`${API_BASE_URL}/api/login/resolve-backup-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
          const resolveData = await resolveRes.json();
          if (resolveData.primaryEmail) {
            const { data: resolvedAuth, error: resolvedError } = await supabase.auth.signInWithPassword({
              email: resolveData.primaryEmail,
              password: password,
            });
            if (!resolvedError && resolvedAuth) {
              authData = resolvedAuth;
              backupEmailUsed = email.trim().toLowerCase();
            }
          }
        } catch (resolveErr) {
          console.warn('Resolve backup email failed:', resolveErr);
        }

        if (!authData) {
          // Still invalid
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);
          localStorage.setItem('failedLoginAttempts', newAttempts.toString());

          if (newAttempts >= 3) {
            const lockoutUntil = Date.now() + (3 * 60 * 1000);
            localStorage.setItem('loginLockout', JSON.stringify({ lockoutUntil }));
            setIsLockedOut(true);
            setLockoutTimeRemaining(180);
            try {
              await fetch(`${API_BASE_URL}/api/security/send-alert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, failedAttempts: newAttempts }),
              });
            } catch (alertError) {
              console.error('Failed to send security alert:', alertError);
            }
            setAlertTitle('Too Many Failed Attempts');
            setAlertMessage('Too many failed login attempts. Login is disabled for 3 minutes. A security alert has been sent to your email.');
            setShowAlertModal(true);
          } else {
            setAlertTitle('Invalid Credentials');
            setAlertMessage(`Invalid email or password! ${3 - newAttempts} attempt(s) remaining.`);
            setShowAlertModal(true);
          }
          setLoading(false);
          return;
        }
      } else {
        authData = primaryAuth;
      }

      // Successful login - reset failed attempts
      setFailedAttempts(0);
      localStorage.removeItem('failedLoginAttempts');
      localStorage.removeItem('loginLockout');

      // 2. Get user details AND status from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email, first_name, last_name, status') // Added 'status'
        .eq('auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        setAlertTitle('Error');
        setAlertMessage('User data not found!');
        setShowAlertModal(true);
        setLoading(false);
        return;
      }

      // 3. Check if account is INACTIVE
      if (userData.status === 'INACTIVE') {
        // Sign out immediately so they don't keep an active auth session
        await supabase.auth.signOut(); 
        setAlertTitle('Account Inactive');
        setAlertMessage('Your account is inactive. Please contact the administrator to regain access.');
        setShowAlertModal(true);
        setLoading(false);
        return;
      }

      // 4. Convert database role to React role
      let reactRole;
      if (userData.role === 'ADMIN') {
        reactRole = 'admin';
      } else if (userData.role === 'COLLECTOR') {
        reactRole = 'employee';
      } else if (userData.role === 'SUPERVISOR') {
        reactRole = 'supervisor';
      } else if (userData.role === 'SUPERADMIN') {
        reactRole = 'superadmin';
      } else {
        setAlertTitle('Error');
        setAlertMessage('Invalid user role!');
        setShowAlertModal(true);
        setLoading(false);
        return;
      }

      // 5. Get access token for API calls
      const accessToken = authData?.session?.access_token;
      if (!accessToken) {
        setAlertTitle('Error');
        setAlertMessage('Login session not found. Please try again.');
        setShowAlertModal(true);
        setLoading(false);
        return;
      }

      // 6. Store user data temporarily (don't set logged in yet)
      const pendingLoginUser = {
        email: userData.email,
        role: reactRole,
        firstName: userData.first_name,
        lastName: userData.last_name,
        authId: authData.user.id
      };

      // 7. Send verification code (to backup email if they logged in with backup), then go to verification page
      try {
        const response = await fetch(`${API_BASE_URL}/api/login/send-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(backupEmailUsed ? { sendCodeTo: backupEmailUsed } : {}),
        });

        const data = await response.json();

        if (data.success) {
          sessionStorage.setItem('pendingLoginUser', JSON.stringify(pendingLoginUser));
          sessionStorage.setItem('pendingLoginAccessToken', accessToken);
          navigate('/verify-login');
        } else {
          setAlertTitle('Error');
          setAlertMessage(data.message || 'Failed to send verification code');
          setShowAlertModal(true);
        }
      } catch (error) {
        console.error('Send verification error:', error);
        setAlertTitle('Error');
        setAlertMessage('Failed to send verification code. Please try again.');
        setShowAlertModal(true);
      }

    } catch (error) {
      console.error('Login error:', error);
      setAlertTitle('Error');
      setAlertMessage('An error occurred during login. Please try again.');
      setShowAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
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
        <div className="form-container">
          {/* Mobile Logo and Title - hidden on desktop */}
          <div className="mobile-logo-section">
            <img src="/sorting-logo.png" alt="Logo" className="mobile-logo" />
            <h3 className="mobile-title">Automatic Garbage Sorting System</h3>
          </div>
          <h2>Login Form</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="ecosort@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isLockedOut}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Eco@123sorT"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || isLockedOut}
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLockedOut}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <div className="options-row">
              {/* <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label> */}
              <span
                className="forgot-password"
                onClick={() => navigate('/forgot')}
                style={{ cursor: 'pointer' }}
              >
                Forgot Password?
              </span>
            </div>

            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading || isLockedOut}
            >
              {loading ? 'Logging in...' : isLockedOut ? `Login Disabled (${formatTimeRemaining(lockoutTimeRemaining)})` : 'Login'}
            </button>
            
            {isLockedOut && (
              <div className="lockout-message">
                <p>Too many failed login attempts. Please wait {formatTimeRemaining(lockoutTimeRemaining)} before trying again.</p>
              </div>
            )}
          </form>

          {/* Role Selection Buttons */}
          <div className="role-selection">
            <div className="role-card role-employee">
              <img src={employeeIcon} alt="Employee" />
              <span>Employee</span>
            </div>
            <div className="role-card role-admin">
              <img src={adminIcon} alt="Admin" />
              <span>Admin</span>
            </div>
            <div className="role-card role-supervisor">
              <img src={supervisorIcon} alt="Supervisor" />
              <span>Supervisor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowAlertModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            className="modal-box" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <AlertIcon />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '10px' }}>
              {alertTitle}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {alertMessage}
            </p>
            <button 
              onClick={() => setShowAlertModal(false)}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#047857',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                width: '100%'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;