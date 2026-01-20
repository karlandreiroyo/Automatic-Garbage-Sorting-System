import { useState } from 'react';
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

function Login({ setIsLoggedIn, setUserRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        alert('Invalid email or password!');
        setLoading(false);
        return;
      }

      // 2. Get user details AND status from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email, first_name, last_name, status') // Added 'status'
        .eq('auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        alert('User data not found!');
        setLoading(false);
        return;
      }

      // 3. Check if account is INACTIVE
      if (userData.status === 'INACTIVE') {
        // Sign out immediately so they don't keep an active auth session
        await supabase.auth.signOut(); 
        alert('Your account is inactive. Please contact the administrator to regain access.');
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
      } else {
        alert('Invalid user role!');
        setLoading(false);
        return;
      }

      // 5. Store user data temporarily (don't set logged in yet)
      const pendingLoginUser = {
        email: userData.email,
        role: reactRole,
        firstName: userData.first_name,
        lastName: userData.last_name,
        authId: authData.user.id
      };

      // 6. Send verification code, then go to verification page
      try {
        const accessToken = authData?.session?.access_token;
        if (!accessToken) {
          alert('Login session not found. Please try again.');
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
          sessionStorage.setItem('pendingLoginUser', JSON.stringify(pendingLoginUser));
          sessionStorage.setItem('pendingLoginAccessToken', accessToken);
          navigate('/verify-login');
        } else {
          alert(data.message || 'Failed to send verification code');
        }
      } catch (error) {
        console.error('Send verification error:', error);
        alert('Failed to send verification code. Please try again.');
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
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
                disabled={loading}
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
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <div className="options-row">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <span
                className="forgot-password"
                onClick={() => navigate('/forgot')}
                style={{ cursor: 'pointer' }}
              >
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
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
    </div>
  );
}

export default Login;