import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../employee/employeecss/App.css'; // Make sure your CSS matches the admin one or uses the shared one

// Assets
import sidebarLogo from '../assets/whitelogo.png';

// Sub-Pages
import BinMonitoring from './BinMonitoring';
import Notifications from './Notifications';
import CollectionHistory from './CollectionHistory';
import Profile from './Profile';
import About from './About';

/* ================= ICONS (Inline SVGs) ================= */
const SignOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const AlertIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

// Navigation Icons
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const InfoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;

/* ================= MAIN COMPONENT ================= */

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Mobile Responsive States (Matching Admin Dashboard)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true); // Default hidden on mobile
      } else {
        setIsSidebarCollapsed(false); // Default visible on desktop
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
    if (isMobile) {
      setIsSidebarCollapsed(true); // Auto-close on mobile selection
    }
  };

  return (
    <div className="dashboard-container"> {/* Ensure CSS class name matches Admin CSS */}
      
      {/* --- LOGOUT MODAL --- */}
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

      {/* --- MOBILE HEADER (Visible only on Mobile) --- */}
      {isMobile && (
        <div className="mobile-header">
          <div className="mobile-logo">
            <img src={sidebarLogo} alt="Logo" />
            <span>Sorting System</span>
          </div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            {isSidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
          </button>
        </div>
      )}

      {/* --- FLOATING MENU BUTTON (Visible only on Mobile) --- */}
      {isMobile && (
        <button className="mobile-menu-btn-floating" onClick={toggleSidebar}>
          {isSidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
        </button>
      )}

      {/* --- SIDEBAR --- */}
      <div className={`sidebar ${isMobile && !isSidebarCollapsed ? 'mobile-open' : ''} ${!isMobile && isSidebarCollapsed ? 'collapsed' : ''}`}>
        
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={sidebarLogo} alt="Logo" className="sidebar-main-logo" />
            <div className="logo-text-stacked">
              <h3>Sorting System</h3>
              <p>Waste Management</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => handleNavClick('monitoring')}>
            <div className="nav-icon"><HomeIcon /></div>
            Bin Monitoring
          </div>
          
          <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleNavClick('notifications')}>
            <div className="nav-icon"><BellIcon /></div>
            Notifications
          </div>
          
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleNavClick('history')}>
            <div className="nav-icon"><HistoryIcon /></div>
            Collection History
          </div>
          
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
            <div className="nav-icon"><UserIcon /></div>
            Profile
          </div>
          
          <div className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => handleNavClick('about')}>
            <div className="nav-icon"><InfoIcon /></div>
            About
          </div>
        </nav>

        <div className="sidebar-footer">
          
          <button className="sign-out-btn" onClick={() => setShowLogoutModal(true)}>
            <div className="nav-icon"><SignOutIcon /></div>
            Sign Out
          </button>
        </div>
      </div>

      {/* --- OVERLAY (Mobile) --- */}
      {isMobile && !isSidebarCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarCollapsed(true)} />
      )}

      {/* --- MAIN CONTENT --- */}
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