import { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../employee/employeecss/App.css';

import sidebarLogo from '../assets/whitelogo.png';

import BinMonitoring from './BinMonitoring';
import Notifications from './Notifications';
import CollectionHistory from './CollectionHistory';
import Profile from './Profile';
import About from './About';

const SignOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="dashboard-container">

      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <div className="mobile-logo">
            <img src={sidebarLogo} alt="Logo" className="mobile-logo-img" />
            <span>Sorting System</span>
        </div>
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* FLOATING MENU BUTTON FOR MOBILE */}
      <button className="mobile-menu-btn-floating" onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon-wrapper"><AlertIcon /></div>
            <h3>Sign Out?</h3>
            <p>Are you sure you want to end your session?</p>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={() => setShowLogoutModal(false)}>
                No, Cancel
              </button>
              <button className="btn-modal btn-confirm" onClick={onLogout}>
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        
        <div className="sidebar-header">
          {/* System Power at Top */}
          <div className="power-indicator">
            <span>SYSTEM POWER</span>
            <div className="battery-icon">
              <div className="battery-level" style={{ width: '100%' }}></div>
            </div>
            <span>100%</span>
          </div>

          {/* Logo in Middle */}
          <div className="sidebar-logo-container">
            <img src={sidebarLogo} alt="Logo" className="sidebar-img-large" />
          </div>

          {/* Text at Bottom */}
          <div className="logo-text-vertical">
            <h3>Sorting System</h3>
            <p>Waste Management</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => { setActiveTab('monitoring'); closeMobileMenu(); }}>
            Bin Monitoring
          </div>
          <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => { setActiveTab('notifications'); closeMobileMenu(); }}>
            Notifications
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); closeMobileMenu(); }}>
            Collection History
          </div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); closeMobileMenu(); }}>
            Profile
          </div>
          <div className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => { setActiveTab('about'); closeMobileMenu(); }}>
            About
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sign-out-btn" onClick={() => setShowLogoutModal(true)}>
            <SignOutIcon /> Sign Out
          </button>

          <div className="today-status-card">
            <p>Today's Status</p>
            <h2>98.2%</h2>
            <span>Sorting Accuracy</span>
          </div>
        </div>
      </div>

      {/* OVERLAY FOR MOBILE - Only shows when menu is open */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="content-body">
          {activeTab === 'monitoring' && <BinMonitoring />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'history' && <CollectionHistory />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'about' && <About />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;