import { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard'; // Dito natin tinawag yung ginawa mo sa Step 1

// Images
import mainLogo from './assets/sorting-logo.png'; 
import employeeIcon from './assets/employee.png';
import adminIcon from './assets/admin.png';
import supervisorIcon from './assets/supervisor.png';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('Employee'); 
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'Employee') {
      setIsLoggedIn(true); // Pag-click ng Login, lilipat na sa Dashboard
    } else {
      alert("This demo dashboard is currently designed for Employees only!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Babalik sa Login form
    setEmail('');
    setPassword('');
  };

  // --- KUNG NAKA-LOGIN, IPAPAKITA ANG DASHBOARD ---
  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  // --- KUNG HINDI PA, LOGIN FORM ANG MAKIKITA ---
  return (
    <div className="app-container">
      {/* Left Side */}
      <div className="left-panel">
        <div className="content-wrapper">
          <h1>Automatic<br />Garbage Sorting<br />System</h1>
          <div className="illustration-container">
            <img src={mainLogo} alt="System Logo" className="hero-image" />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="right-panel">
        <div className="form-container">
          <h2>Login Form</h2>
          <form onSubmit={handleLogin}>
            
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="ecosort@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "⌣" : "👁️"}
                </button>
              </div>
            </div>

            <div className="options-row">
              <a href="#" className="forgot-password">Forgot Password</a>
              <label className="remember-me"><input type="checkbox" /> Remember me</label>
            </div>

            <button type="submit" className="login-btn">Login</button>

            <div className="role-selection">
              <div className={`role-card ${role === 'Employee' ? 'active' : ''}`} onClick={() => setRole('Employee')}>
                <img src={employeeIcon} alt="Employee" className="role-img" /><span>Employee</span>
              </div>
              <div className={`role-card ${role === 'Admin' ? 'active' : ''}`} onClick={() => setRole('Admin')}>
                <img src={adminIcon} alt="Admin" className="role-img" /><span>Admin</span>
              </div>
              <div className={`role-card ${role === 'Supervisor' ? 'active' : ''}`} onClick={() => setRole('Supervisor')}>
                <img src={supervisorIcon} alt="Supervisor" className="role-img" /><span>Supervisor</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;