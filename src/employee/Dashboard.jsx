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

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="dashboard-container">

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
      <div className="sidebar">

        <div className="sidebar-header">
          <div className="power-indicator">
            <span>SYSTEM POWER</span>
            <div className="battery-icon">
              <div className="battery-level" style={{ width: '100%' }}></div>
            </div>
            <span>100%</span>
          </div>

          <div className="sidebar-logo-vertical">
            <img src={sidebarLogo} alt="Logo" className="sidebar-img-large" />
            <div className="logo-text-vertical">
              <h3>Sorting System</h3>
              <p>Waste Management</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
            Bin Monitoring
          </div>
          <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            Notifications
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Collection History
          </div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            Profile
          </div>
          <div className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
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
