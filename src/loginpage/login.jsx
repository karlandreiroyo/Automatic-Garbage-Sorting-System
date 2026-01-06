import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.jsx';
import './Login.css';

// Waste Sorting Logo Component
const SortingLogo = () => (
  <svg width="350" height="350" viewBox="0 0 350 350" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bin Container - Main rectangular body */}
    <rect x="80" y="195" width="190" height="125" rx="4" fill="white"/>
    
    {/* Curved Top Opening with slight overflow */}
    <path d="M75 195 Q175 175 275 195" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <rect x="80" y="195" width="190" height="8" rx="4" fill="white"/>
    
    {/* Three Vertical Dividers for compartments */}
    <line x1="143.33" y1="195" x2="143.33" y2="320" stroke="white" strokeWidth="3"/>
    <line x1="208.33" y1="195" x2="208.33" y2="320" stroke="white" strokeWidth="3"/>
    
    {/* Left Compartment - Leaf Icon (Biodegradable) */}
    <g transform="translate(105, 245)">
      {/* Main leaf shape */}
      <path d="M18 0 Q18 6 18 10 Q18 16 18 20 Q18 24 15 26 Q12 28 10 26 Q8 24 8 20 Q8 16 10 12 Q12 6 15 3 Q18 0 18 0" fill="white"/>
      <path d="M18 0 Q22 3 25 6 Q28 10 30 14 Q32 18 30 22 Q28 26 25 28 Q22 30 18 28 Q14 30 11 28 Q8 26 6 22 Q4 18 6 14 Q8 10 11 6 Q14 3 18 0" fill="white"/>
      {/* Stem */}
      <line x1="18" y1="20" x2="18" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
    
    {/* Middle Compartment - Cube Icon (General Waste) */}
    <g transform="translate(170, 245)">
      {/* 3D cube */}
      <rect x="12" y="12" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="12" x2="20" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="28" y1="12" x2="20" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="20" y1="8" x2="20" y2="24" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="28" x2="20" y2="24" stroke="white" strokeWidth="2.5"/>
      <line x1="28" y1="28" x2="20" y2="24" stroke="white" strokeWidth="2.5"/>
    </g>
    
    {/* Right Compartment - Recycling Symbol (Recyclables) */}
    <g transform="translate(235, 245)">
      {/* Three chasing arrows */}
      <path d="M22 6 L30 6 L26 16 Z" fill="white"/>
      <path d="M14 18 L22 18 L18 8 Z" fill="white"/>
      <path d="M26 22 L34 22 L30 12 Z" fill="white"/>
      <path d="M22 6 L26 16 L14 18 L18 8 L30 12 L26 22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    
    {/* Overflowing Organic Waste from Top */}
    {/* Banana Peel */}
    <path d="M105 180 Q115 170 125 180 Q135 190 130 195 Q125 200 115 195 Q105 190 105 180 Z" fill="white"/>
    
    {/* Leafy Greens / Cabbage/Lettuce */}
    <path d="M145 175 Q150 165 160 175 Q165 180 160 185 Q155 190 150 185 Q145 180 145 175 Z" fill="white"/>
    <path d="M155 170 Q160 165 170 170 Q175 175 170 180 Q165 185 160 180 Q155 175 155 170 Z" fill="white"/>
    <path d="M165 165 Q170 160 180 165 Q185 170 180 175 Q175 180 170 175 Q165 170 165 165 Z" fill="white"/>
    
    {/* Additional Food Scraps */}
    <circle cx="195" cy="175" r="6" fill="white"/>
    <ellipse cx="205" cy="170" rx="5" ry="7" fill="white"/>
    <path d="M215 165 Q220 160 225 165 Q230 170 225 175 Q220 180 215 175 Q215 170 215 165 Z" fill="white"/>
  </svg>
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
      <div className="left-panel">
        <div className="content-wrapper">
          <h1>
            Automatic<br />
            Garbage Sorting<br />
            System
          </h1>
          <div className="illustration-container">
            <SortingLogo />
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