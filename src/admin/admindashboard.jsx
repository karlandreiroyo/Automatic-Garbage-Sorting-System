/**
 * Admin Dashboard Component
 * Main container component for the admin panel that manages navigation and displays different admin pages
 * Features: Sidebar navigation, modal dialogs, and dynamic content rendering based on active tab
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.jsx';
import { useNavigate } from 'react-router-dom';
import sidebarLogo from '../assets/whitelogo.png';
import '../admin/admincss/admindashboard.css'; 

// IMPORT FILES OF DASHBOARD HERE FOR SIDE BAR
import AdminDash from './adminDash.jsx';
import Accounts from './accounts.jsx';
import WasteCategories from './wasteCategories.jsx';
import DataAnalytics from './dataAnalytics.jsx';
import BinMonitoring from './binMonitoring.jsx';
import About from './about.jsx';

/* ================= ICONS ================= */

const SignOutIcon = () => 
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>;

const AlertIcon = () => 
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>;

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

const AboutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

/* ================= MAIN ================= */

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      // Only auto-collapse on mobile, desktop should show sidebar by default
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false); // Desktop: show sidebar
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
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className="admin-container">
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
          <button className="hamburger-btn" onClick={toggleSidebar}>
            {isSidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
          </button>
          <div className="mobile-logo">
            <img src={sidebarLogo} alt="Logo" />
            <span>Admin Panel</span>
          </div>
        </div>
      )}

      {/* Sidebar with conditional class */}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="power-indicator">
            <span>ADMIN PANEL</span>
            <div className="battery-icon">
              <div className="battery-level" style={{ width: '100%' }}></div>
            </div>
            <span>ACTIVE</span>
          </div>

          <div className="sidebar-logo-container">
            <img src={sidebarLogo} alt="Logo" className="sidebar-main-logo" />
            <div className="logo-text-stacked">
              <h3>Admin Panel</h3>
              <p>Management System</p>
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

          <div
            className={`nav-item ${activeTab === 'bins' ? 'active' : ''}`}
            onClick={() => handleNavClick('bins')}
          >
            <div className="nav-icon"><BinMonitoringIcon /></div>
            Bin Monitoring
          </div>

          <div
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <div className="nav-icon"><AboutIcon /></div>
            About
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sign-out-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <SignOutIcon /> Sign Out
          </button>

          <div className="today-status-card">
            <p>System Status</p>
            <h2>99.8%</h2>
            <span>Uptime</span>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {!isSidebarCollapsed && isMobile && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarCollapsed(true)} />
      )}

      <div className={`main-content ${isSidebarCollapsed && isMobile ? 'mobile-expanded' : ''}`}>
        {activeTab === 'dashboard' && <AdminDash />}
        {activeTab === 'users' && <WasteCategories />}
        {activeTab === 'data' && <DataAnalytics />}
        {activeTab === 'account' && <Accounts />}
        {activeTab === 'bins' && <BinMonitoring />}
        {activeTab === 'reports' && <About />}
      </div>
    </div>
  );
};

export default AdminDashboard;