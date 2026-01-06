import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.jsx';
import mainLogo from '../assets/sorting-logo.png';
import './Login.css';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        alert('Invalid email or password!');
        setLoading(false);
        return;
      }

      // Step 2: Get user details from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email, first_name, last_name')
        .eq('auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        alert('User data not found!');
        setLoading(false);
        return;
      }

      // Step 3: Convert database role to React role
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

      // Step 4: Store user info in localStorage
      localStorage.setItem('userRole', reactRole);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', `${userData.first_name} ${userData.last_name}`);

      setIsLoggedIn(true);
      setUserRole(reactRole);

      // Step 5: Role-based redirect
      if (reactRole === 'admin') {
        navigate('/admin');
      } else if (reactRole === 'supervisor') {
        navigate('/supervisor');
      } else if (reactRole === 'employee') {
        navigate('/'); 
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
      <div className="left-panel">
        <div className="content-wrapper">
          <h1>
            Automatic<br />
            Garbage Sorting<br />
            System
          </h1>
          <div className="illustration-container">
            <img src={mainLogo} alt="System Logo" className="hero-image" />
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="form-container">
          <h2>Login Form</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="abc@gmail.com"
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
                  placeholder="Password"
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
              <span
                className="forgot-password"
                onClick={() => navigate('/forgot')}
                style={{ cursor: 'pointer' }}
              >
                Forgot Password?
              </span>
              <label className="remember-me">
                <input type="checkbox" />
                Remember me
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Optional: Display test credentials */}
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <p><strong>Test Accounts:</strong></p>
            <p>Employee: abc@gmail.com / 123</p>
            <p>Admin: admin@gmail.com / 1234</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Login;