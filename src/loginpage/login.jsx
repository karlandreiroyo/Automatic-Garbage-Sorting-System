import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.jsx';
import './Login.css';

// System Logo Component - Three-compartment bin with gear
const SystemLogo = () => (
  <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Gear Symbol - Centered behind items */}
    <g transform="translate(200, 140)">
      {/* Outer gear teeth */}
      <circle cx="0" cy="0" r="35" fill="none" stroke="#047857" strokeWidth="3"/>
      {/* Gear teeth */}
      <rect x="-2" y="-40" width="4" height="12" fill="#047857"/>
      <rect x="-2" y="28" width="4" height="12" fill="#047857"/>
      <rect x="-40" y="-2" width="12" height="4" fill="#047857"/>
      <rect x="28" y="-2" width="12" height="4" fill="#047857"/>
      {/* Diagonal teeth */}
      <rect x="25" y="-25" width="4" height="12" fill="#047857" transform="rotate(45 27 -19)"/>
      <rect x="-29" y="-25" width="4" height="12" fill="#047857" transform="rotate(-45 -27 -19)"/>
      <rect x="25" y="25" width="4" height="12" fill="#047857" transform="rotate(-45 27 19)"/>
      <rect x="-29" y="25" width="4" height="12" fill="#047857" transform="rotate(45 -27 19)"/>
      {/* Inner circle */}
      <circle cx="0" cy="0" r="20" fill="none" stroke="#047857" strokeWidth="2"/>
      {/* Center hub */}
      <circle cx="0" cy="0" r="8" fill="#047857"/>
    </g>
    
    {/* Banana - Left side (oval shape) */}
    <g transform="translate(120, 150)">
      <ellipse cx="0" cy="0" rx="18" ry="25" fill="#047857"/>
      <ellipse cx="0" cy="0" rx="12" ry="18" fill="#065f46"/>
    </g>
    
    {/* Plastic Bottle - Right side */}
    <g transform="translate(280, 150)">
      {/* Bottle body */}
      <rect x="0" y="0" width="20" height="50" rx="3" fill="#047857"/>
      {/* Bottle neck */}
      <rect x="6" y="-8" width="8" height="8" rx="2" fill="#047857"/>
      {/* Bottle cap */}
      <rect x="7" y="-12" width="6" height="4" rx="1" fill="#065f46"/>
      {/* Bottle label area */}
      <rect x="2" y="10" width="16" height="20" rx="1" fill="none" stroke="#065f46" strokeWidth="1"/>
    </g>
    
    {/* Bin Container - Main trapezoidal body (dark green) */}
    <path d="M80 220 L320 220 L340 320 L60 320 Z" fill="#047857" stroke="#065f46" strokeWidth="3"/>
    
    {/* Rounded top rim */}
    <ellipse cx="200" cy="220" rx="130" ry="8" fill="#065f46"/>
    
    {/* Three Vertical Dividers for compartments */}
    <line x1="160" y1="220" x2="160" y2="320" stroke="#065f46" strokeWidth="4"/>
    <line x1="240" y1="220" x2="240" y2="320" stroke="#065f46" strokeWidth="4"/>
    
    {/* Left Compartment - Leaf Icon (Biodegradable) - WHITE */}
    <g transform="translate(120, 270)">
      {/* Main leaf shape */}
      <path d="M20 0 Q20 8 20 15 Q20 22 16 28 Q12 34 8 32 Q4 30 4 22 Q4 14 8 8 Q12 2 16 1 Q20 0 20 0" fill="white"/>
      <path d="M20 0 Q25 4 30 8 Q35 12 38 18 Q41 24 38 30 Q35 36 30 38 Q25 40 20 38 Q15 40 10 38 Q5 36 2 30 Q-1 24 2 18 Q5 12 10 8 Q15 4 20 0" fill="white"/>
      {/* Stem */}
      <line x1="20" y1="25" x2="20" y2="40" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </g>
    
    {/* Middle Compartment - House/Cube Icon (General Waste) - WHITE */}
    <g transform="translate(200, 270)">
      {/* House shape */}
      <rect x="10" y="20" width="20" height="20" fill="white"/>
      <path d="M10 20 L20 10 L30 20 Z" fill="white"/>
      <rect x="15" y="25" width="6" height="8" fill="#047857"/>
    </g>
    
    {/* Right Compartment - Recycling Symbol (Recyclables) - WHITE */}
    <g transform="translate(280, 270)">
      {/* Three chasing arrows */}
      <path d="M25 8 L35 8 L30 20 Z" fill="white"/>
      <path d="M15 22 L25 22 L20 10 Z" fill="white"/>
      <path d="M30 28 L40 28 L35 16 Z" fill="white"/>
      <path d="M25 8 L30 20 L15 22 L20 10 L35 16 L30 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </svg>
);

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // 5. Store user info and redirect
      localStorage.setItem('userRole', reactRole);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', `${userData.first_name} ${userData.last_name}`);

      setIsLoggedIn(true);
      setUserRole(reactRole);

      if (reactRole === 'admin') navigate('/admin');
      else if (reactRole === 'supervisor') navigate('/supervisor');
      else if (reactRole === 'employee') navigate('/');

    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
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