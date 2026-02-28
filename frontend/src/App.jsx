import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient.jsx';

// Employee components
import Login from './loginpage/login';
import Forgot from './loginpage/forgot'; 
import VerifyLogin from './loginpage/verifyLogin';
import Dashboard from './employee/Dashboard';
import BinMonitoring from './employee/BinMonitoring';
import CollectionHistory from './employee/CollectionHistory';
import Notifications from './employee/Notifications';
import Profile from './employee/Profile';
import About from './employee/About';

// Admin components
import AdminDashboard from './admin/admindashboard';
import AdminDash from './admin/adminDash.jsx';
import Accounts from './admin/accounts.jsx';

// Supervisor component
import SupervisorDashboard from './supervisor/supervisordashboard';

// Super Admin component
import SuperAdminDashboard from './superadmin/superadmindashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when app loads; also ensure archived (INACTIVE) users cannot stay logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const role = localStorage.getItem('userRole');
        if (role) {
          // Verify user is still ACTIVE in users table (e.g. not archived by superadmin)
          try {
            const { data: userRow } = await supabase
              .from('users')
              .select('status')
              .eq('auth_id', session.user.id)
              .maybeSingle();
            if (userRow && userRow.status === 'INACTIVE') {
              await supabase.auth.signOut();
              localStorage.removeItem('userRole');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userName');
              setIsLoggedIn(false);
              setUserRole(null);
            } else {
              setUserRole(role);
              setIsLoggedIn(true);
            }
          } catch {
            setUserRole(role);
            setIsLoggedIn(true);
          }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
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
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserRole(null);
  };

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
              userRole === 'superadmin' ? <Navigate to="/superadmin" /> :
              <Navigate to="/" />
            ) : (
              <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
            )
          } 
        />
        <Route
          path="/verify-login"
          element={isLoggedIn ? (
            userRole === 'admin' ? <Navigate to="/admin" /> :
            userRole === 'supervisor' ? <Navigate to="/supervisor" /> :
            userRole === 'superadmin' ? <Navigate to="/superadmin" /> :
            <Navigate to="/" />
          ) : (
            <VerifyLogin setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
          )}
        />
        <Route path="/forgot" element={<Forgot />} />

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={isLoggedIn && userRole === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/AdminDash" 
          element={isLoggedIn && userRole === 'admin' ? <AdminDash onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/accounts" 
          element={isLoggedIn && userRole === 'admin' ? <Accounts onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        {/* Supervisor route */}
        <Route
          path="/supervisor"
          element={isLoggedIn && userRole === 'supervisor' ? <SupervisorDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Super Admin route */}
        <Route
          path="/superadmin"
          element={isLoggedIn && userRole === 'superadmin' ? <SuperAdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
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
