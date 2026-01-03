import React, { useState } from 'react';
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
import Settings from './settings.jsx';

  const SignOutIcon = () => 
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
    </svg>;
  const AlertIcon = () => 
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12">
        </line>
        <line x1="12" y1="16" x2="12.01" y2="16">
        </line>
    </svg>;

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="admin-container">
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon-wrapper"><AlertIcon /></div>
            <h3>Sign Out?</h3>
            <p>Are you sure you want to end your session?</p>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={() => setShowLogoutModal(false)}>No, Cancel</button>
              <button className="btn-modal btn-confirm" onClick={onLogout}>Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar">
        <div className="sidebar-header">
          <div className="power-indicator">
            <span>ADMIN PANEL</span>
            <div className="battery-icon">
              <div className="battery-level" style={{width: '100%'}}></div>
            </div>
            <span>ACTIVE</span>
          </div>
          <div className="sidebar-logo">
            <img src={sidebarLogo} alt="Logo" />
            <div className="logo-text">
              <h3>Admin Panel</h3>
              <p>Management System</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <span className="nav-icon">🧹</span> Waste Categories
          </div>
          <div className={`nav-item ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
            <span className="nav-icon">📈</span> Data Analytics
          </div>
          <div className={`nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <span className="nav-icon">👥</span> Accounts
          </div>
          <div className={`nav-item ${activeTab === 'bins' ? 'active' : ''}`} onClick={() => setActiveTab('bins')}>
            <span className="nav-icon">🗑️</span> Bin Monitoring
          </div>
          <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <span className="nav-icon">ℹ️</span> About
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙️</span> Settings
          </div>
        </nav>   

        <div className="sidebar-footer">
          <button className="sign-out-btn" onClick={() => setShowLogoutModal(true)}>
            <SignOutIcon /> Sign Out
          </button>
          <div className="today-status-card">
            <p>System Status</p>
            <h2>99.8%</h2>
            <span>Uptime</span>
          </div>
        </div>
      </div>

      {/* SIDE BAR ROUTE */}
      <div className="main-content">
        {activeTab === 'dashboard' && <AdminDash />}
        {activeTab === 'users' && <WasteCategories />}
        {activeTab === 'data' && <DataAnalytics />}
        {activeTab === 'account' && <Accounts />}
        {activeTab === 'bins' && <BinMonitoring />}
        {activeTab === 'reports' && <About />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
};

export default AdminDashboard;