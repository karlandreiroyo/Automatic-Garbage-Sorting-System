import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.jsx';
import sidebarLogo from '../assets/whitelogo.png';
import '../admin/admincss/admindashboard.css';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal'; 

// IMPORT FILES OF DASHBOARD HERE FOR SIDE BAR
import AdminDash from './adminDash.jsx';
import Accounts from './accounts.jsx';
import WasteCategories from './wasteCategories.jsx';
import DataAnalytics from './dataAnalytics.jsx';
import BinMonitoring from './binMonitoring.jsx';
import CollectorLogs from './collectorLogs.jsx';
import AdminProfile from './Profile.jsx';

/* ================= ICONS ================= */

const SignOutIcon = () => 
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>;

const AlertIcon = () => 
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>;

// Sidebar Navigation Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const WasteCategoriesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
);

const DataAnalyticsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const AccountsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const BinMonitoringIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const CollectorLogsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ================= MAIN ================= */

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [binMonitoringDropdownOpen, setBinMonitoringDropdownOpen] = useState(false);
  const [sidebarArchiveRequested, setSidebarArchiveRequested] = useState(false);
  const [binMonitoringArchiveActive, setBinMonitoringArchiveActive] = useState(false);
  const [requestExitArchiveView, setRequestExitArchiveView] = useState(false);
  
  // Terms and Conditions modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [termsCheckDone, setTermsCheckDone] = useState(false);
  // Logged-in user display name for header
  const [currentUserName, setCurrentUserName] = useState('');

  // Load logged-in user name for header
  useEffect(() => {
    const loadCurrentUserName = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data: userRow } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        if (userRow) {
          const name = [userRow.first_name, userRow.last_name].filter(Boolean).join(' ').trim();
          setCurrentUserName(name || 'Admin');
        }
      } catch {}
    };
    loadCurrentUserName();
  }, []);

  // First-login: show Terms and Conditions for admin if not yet accepted (users.terms_accepted_at is null)
  useEffect(() => {
    if (termsCheckDone) return;
    const checkFirstLoginTerms = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setTermsCheckDone(true);
          return;
        }
        const { data: userRow, error } = await supabase
          .from('users')
          .select('id, terms_accepted_at, role')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        if (error) {
          console.warn('Terms check failed:', error);
          setTermsCheckDone(true);
          return;
        }
        setTermsCheckDone(true);
        // Only show for ADMIN and COLLECTOR roles
        if (userRow && (userRow.role === 'ADMIN' || userRow.role === 'COLLECTOR') && (userRow.terms_accepted_at == null || userRow.terms_accepted_at === '')) {
          setCurrentUserId(userRow.id);
          setShowTermsModal(true);
        }
      } catch (e) {
        console.warn('Terms check error:', e);
        setTermsCheckDone(true);
      }
    };
    checkFirstLoginTerms();
  }, [termsCheckDone]);

  const handleAcceptTermsFirstLogin = async () => {
    if (!currentUserId) {
      setShowTermsModal(false);
      return;
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({
          terms_accepted_at: new Date().toISOString(),
          status: 'ACTIVE'
        })
        .eq('id', currentUserId);
      if (error) throw error;
      setShowTermsModal(false);
      setCurrentUserId(null);
    } catch (e) {
      console.error('Failed to save terms acceptance:', e);
      setShowTermsModal(false);
    }
  };

  const handleCancelTerms = () => {
    // If user cancels on first login, sign them out
    if (onLogout) {
      onLogout();
    }
  };
  
  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'bins') {
      setBinMonitoringDropdownOpen(false);
      setBinMonitoringArchiveActive(false);
    }
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleBinMonitoringClick = () => {
    if (activeTab !== 'bins') {
      handleNavClick('bins');
      setBinMonitoringDropdownOpen(true);
    } else {
      setBinMonitoringDropdownOpen((prev) => !prev);
    }
  };

  const handleViewArchiveBinsFromSidebar = (e) => {
    e.stopPropagation();
    setSidebarArchiveRequested(true);
    setBinMonitoringDropdownOpen(false);
    if (activeTab !== 'bins') {
      setActiveTab('bins');
    }
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleReturnToBinMonitoringFromSidebar = (e) => {
    e.stopPropagation();
    setRequestExitArchiveView(true);
    setBinMonitoringDropdownOpen(false);
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className="admin-container">
      <TermsAndConditionsModal
        open={showTermsModal}
        onAccept={handleAcceptTermsFirstLogin}
        onCancel={handleCancelTerms}
      />
      
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon-wrapper"><AlertIcon /></div>
            <h3>Sign Out?</h3>
            <p>Are you sure you want to end your session?</p>
            <div className="modal-actions">
              <button
                className="btn-modal btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                No, Cancel
              </button>
              <button
                className="btn-modal btn-confirm"
                onClick={onLogout}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header with Hamburger - Only show on mobile */}
      {isMobile && (
        <div className="mobile-header">
          <div className="mobile-logo">
            <img src={sidebarLogo} alt="Logo" />
            <span>{currentUserName || 'Admin Panel'}</span>
          </div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            {isSidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
          </button>
        </div>
      )}

      {/* FLOATING MENU BUTTON FOR MOBILE - Right side */}
      {isMobile && (
        <button className="mobile-menu-btn-floating" onClick={toggleSidebar}>
          {isSidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
        </button>
      )}

      {/* Sidebar with conditional class */}
      <div className={`sidebar ${isMobile && !isSidebarCollapsed ? 'mobile-open' : ''} ${!isMobile && isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={sidebarLogo} alt="Logo" className="sidebar-main-logo" />
            <div className="logo-text-stacked">
              <h3>{currentUserName || 'Admin Panel'}</h3>
              <p>Admin</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="nav-icon"><DashboardIcon /></div>
            Dashboard
          </div>

          <div
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleNavClick('users')}
          >
            <div className="nav-icon"><WasteCategoriesIcon /></div>
            Waste Categories
          </div>

          <div
            className={`nav-item ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => handleNavClick('data')}
          >
            <div className="nav-icon"><DataAnalyticsIcon /></div>
            Data Analytics
          </div>

          <div
            className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => handleNavClick('account')}
          >
            <div className="nav-icon"><AccountsIcon /></div>
            Accounts
          </div>

          {activeTab === 'bins' ? (
            <div className={`nav-item-dropdown ${binMonitoringDropdownOpen ? 'open' : ''}`}>
              <div
                className={`nav-item nav-item-dropdown-trigger active`}
                onClick={handleBinMonitoringClick}
              >
                <div className="nav-icon"><BinMonitoringIcon /></div>
                Bin Monitoring
                <span className={`nav-dropdown-caret ${binMonitoringDropdownOpen ? 'open' : ''}`}>▾</span>
              </div>
              {binMonitoringDropdownOpen && (
                <div className="nav-item-submenu">
                  {binMonitoringArchiveActive ? (
                    <div
                      className="nav-item nav-item-sub"
                      onClick={handleReturnToBinMonitoringFromSidebar}
                    >
                      Return to Bin Monitoring
                    </div>
                  ) : (
                    <div
                      className="nav-item nav-item-sub"
                      onClick={handleViewArchiveBinsFromSidebar}
                    >
                      View Archive Bins
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className="nav-item"
              onClick={handleBinMonitoringClick}
            >
              <div className="nav-icon"><BinMonitoringIcon /></div>
              Bin Monitoring
            </div>
          )}

          <div
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => handleNavClick('logs')}
          >
            <div className="nav-icon"><CollectorLogsIcon /></div>
            Collector Logs
          </div>

          <div
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <div className="nav-icon"><ProfileIcon /></div>
            Profile Settings
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sign-out-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <SignOutIcon /> Sign Out
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && !isSidebarCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarCollapsed(true)} />
      )}

      <div className={`main-content ${isSidebarCollapsed && isMobile ? 'mobile-expanded' : ''}`}>
        {activeTab === 'dashboard' && <AdminDash onNavigateTo={handleNavClick} />}
        {activeTab === 'users' && <WasteCategories />}
        {activeTab === 'data' && <DataAnalytics />}
        {activeTab === 'account' && <Accounts />}
        {activeTab === 'bins' && (
          <BinMonitoring
            openArchiveFromSidebar={sidebarArchiveRequested}
            onViewedArchiveFromSidebar={() => setSidebarArchiveRequested(false)}
            onArchiveViewChange={setBinMonitoringArchiveActive}
            requestExitArchiveView={requestExitArchiveView}
            onExitedArchiveView={() => setRequestExitArchiveView(false)}
          />
        )}
        {activeTab === 'logs' && <CollectorLogs />}
        {activeTab === 'profile' && <AdminProfile />}
      </div>
    </div>
  );
};

export default AdminDashboard;