import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient.jsx';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when app loads
  useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const role = localStorage.getItem('userRole');
      if (role) {
        setUserRole(role);
        setIsLoggedIn(true);
      } else {
        // Session exists but no role in localStorage, sign out
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } else {
      // No session, clear everything
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      setIsLoggedIn(false);
      setUserRole(null);
    }
    
    setLoading(false);
  };

  checkUser();

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      setIsLoggedIn(false);
      setUserRole(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
  }, []);

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // Show loading while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isLoggedIn ? (
              userRole === 'admin' ? <Navigate to="/admin" /> :
              userRole === 'supervisor' ? <Navigate to="/supervisor" /> :
              <Navigate to="/" />
            ) : (
              <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
            )
          } 
        />
        <Route path="/forgot" element={<Forgot />} />

        {/* Admin route */}
        <Route 
          path="/admin" 
          element={isLoggedIn && userRole === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        {/* Supervisor route */}
        <Route
          path="/supervisor"
          element={isLoggedIn && userRole === 'supervisor' ? <SupervisorDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Employee routes */}
        <Route 
          path="/" 
          element={isLoggedIn && userRole === 'employee' ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/bin-monitoring" 
          element={isLoggedIn && userRole === 'employee' ? <BinMonitoring onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/collection-history" 
          element={isLoggedIn && userRole === 'employee' ? <CollectionHistory onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/notifications" 
          element={isLoggedIn && userRole === 'employee' ? <Notifications onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={isLoggedIn && userRole === 'employee' ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/about" 
          element={isLoggedIn && userRole === 'employee' ? <About onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;