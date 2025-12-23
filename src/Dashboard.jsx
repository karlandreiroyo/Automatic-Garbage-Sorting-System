import { useState } from 'react';
import './App.css';

// 1. IMPORT YOUR LOGOS
// Make sure the filename matches what you saved in src/assets/
import sidebarLogo from './assets/whitelogo.png'; 

// Import Page Components
import BinMonitoring from './BinMonitoring';
import Notifications from './Notifications';
import CollectionHistory from './CollectionHistory';
import Profile from './Profile';
import About from './About'; 

// Icons
const SignOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const AlertIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('about'); 
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="dashboard-container">
      {/* --- STYLES --- */}
      <style>{`
        /* Removed the CSS filter since you have a real white image */
        .sidebar-logo img {
          width: 110px;
          height: auto;
        }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease-out;
        }
        .modal-box {
          background: white; padding: 30px; border-radius: 16px; width: 320px;
          text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-icon-wrapper {
          background: #ffebee; width: 70px; height: 70px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;
        }
        .modal-box h3 { margin: 0 0 10px 0; font-size: 1.25rem; color: #333; }
        .modal-box p { margin: 0 0 25px 0; color: #666; font-size: 0.95rem; line-height: 1.5; }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .btn-modal { flex: 1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.95rem; transition: 0.2s; }
        .btn-cancel { background: #f3f4f6; color: #374151; }
        .btn-cancel:hover { background: #e5e7eb; }
        .btn-confirm { background: #c62828; color: white; }
        .btn-confirm:hover { background: #b71c1c; box-shadow: 0 4px 12px rgba(198, 40, 40, 0.2); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* --- LOGOUT MODAL --- */}
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

      {/* --- SIDEBAR --- */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="power-indicator">
            <span>SYSTEM POWER</span>
            <div className="battery-icon"><div className="battery-level" style={{width: '100%'}}></div></div>
            <span>100%</span>
          </div>
          <div className="sidebar-logo">
            {/* Using your custom white logo here */}
            <img src={sidebarLogo} alt="Logo" />
            <div className="logo-text"><h3>Sorting System</h3><p>Waste Management</p></div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
            <span className="nav-icon">📊</span> Bin Monitoring
          </div>
          <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span className="nav-icon">🔔</span> Notifications <span className="dot"></span>
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <span className="nav-icon">🕒</span> Collection History
          </div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon">👤</span> Profile
          </div>
          <div className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
            <span className="nav-icon">ℹ️</span> About
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sign-out-btn" onClick={() => setShowLogoutModal(true)}>
            <SignOutIcon /> Sign Out
          </button>
          <div className="today-status-card">
            <p>Today's Status</p><h2>98.2%</h2><span>Sorting Accuracy</span>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="main-content">
        <header className="dashboard-header">
          {activeTab === 'monitoring' && <div><h1>Real-Time Bin Monitoring</h1><p>Monitor bin fill levels in real-time</p></div>}
          {activeTab === 'notifications' && <div className="notif-header-top"><div><h1>Notifications</h1><p>2 unread notifications</p></div><a href="#" className="mark-all-link">Mark all as read</a></div>}
          {activeTab === 'history' && <div><h1>Collection History</h1><p>View past collection records</p></div>}
          {(activeTab === 'profile' || activeTab === 'about') && <div></div>}
        </header>

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