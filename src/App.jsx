import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Employee components
import Login from './loginpage/login';
import Forgot from './loginpage/forgot'; 
import Dashboard from './employee/Dashboard';
import BinMonitoring from './employee/BinMonitoring';
import CollectionHistory from './employee/CollectionHistory';
import Notifications from './employee/Notifications';
import Profile from './employee/Profile';
import About from './employee/About';

// Admin component
import AdminDashboard from './admin/admindashboard';

// Supervisor component
import SupervisorDashboard from './supervisor/supervisordashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userRole'));

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
  };

  // Helper function to get role
  const userRole = localStorage.getItem('userRole');

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/forgot" element={<Forgot />} />

        {/* Admin route */}
        <Route 
          path="/admin" 
          element={isLoggedIn && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
        />

        {/* Supervisor route */}
        <Route
          path="/supervisor"
          element={isLoggedIn && userRole === 'supervisor' ? <SupervisorDashboard /> : <Navigate to="/login" />}
        />

        {/* Employee routes */}
        <Route 
          path="/" 
          element={isLoggedIn && userRole === 'employee' ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/bin-monitoring" 
          element={isLoggedIn && userRole === 'employee' ? <BinMonitoring /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/collection-history" 
          element={isLoggedIn && userRole === 'employee' ? <CollectionHistory /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/notifications" 
          element={isLoggedIn && userRole === 'employee' ? <Notifications /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={isLoggedIn && userRole === 'employee' ? <Profile /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/about" 
          element={isLoggedIn && userRole === 'employee' ? <About /> : <Navigate to="/login" />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
