import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Define users with different roles
  const users = [
    {
      email: 'employee@gmail.com',
      password: 'password123',
      role: 'employee'
    },
    {
      email: 'supervisor@gmail.com',
      password: 'supervisor123',
      role: 'supervisor'
    },
    {
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin'
    }
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    // Find user with matching credentials
    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (user) {
      // Store user info in localStorage
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userEmail', user.email);

      setIsLoggedIn(true);

      // Role-based redirect
      if (user.role === 'admin') {
        navigate('/admin'); // redirect to AdminDashboard
      } else if (user.role === 'supervisor') {
        navigate('/supervisor'); // redirect to SupervisorDashboard
      } else {
        navigate('/'); // default Employee Dashboard
      }
    } else {
      alert('Invalid email or password!');
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
                placeholder="employee@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
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

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>

          {/* Optional: Display test credentials */}
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <p><strong>Test Accounts:</strong></p>
            <p>Employee: employee@gmail.com / password123</p>
            <p>Supervisor: supervisor@gmail.com / supervisor123</p>
            <p>Admin: admin@gmail.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
