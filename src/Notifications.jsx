import React, { useState } from 'react';

// --- ICONS ---
const Icons = {
  critical: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  warning: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  success: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

const Notifications = () => {
  // Mock Data
  const stats = [
    { type: 'critical', label: 'Critical', count: 1 },
    { type: 'warning', label: 'Warnings', count: 2 },
    { type: 'info', label: 'Info', count: 1 },
    { type: 'success', label: 'Success', count: 1 },
  ];

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Bin Full Alert',
      time: '2 minutes ago',
      message: 'Non-biodegradable bin has reached 100% capacity',
      subtext: 'Non-Biodegradable',
      isUnread: true,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Bin Almost Full',
      time: '15 minutes ago',
      message: 'Recyclable bin is at 85% capacity',
      subtext: 'Recyclable',
      isUnread: true,
    },
    {
      id: 3,
      type: 'warning',
      title: 'Bin Almost Full',
      time: '1 hour ago',
      message: 'Biodegradable bin is at 78% capacity',
      subtext: 'Biodegradable',
      isUnread: false,
    },
    {
      id: 4,
      type: 'success',
      title: 'Collection Completed',
      time: '3 hours ago',
      message: 'Non-biodegradable bin has been emptied',
      subtext: 'Non-Biodegradable',
      isUnread: false,
    },
    {
      id: 5,
      type: 'info',
      title: 'Scheduled Collection',
      time: '5 hours ago',
      message: 'Recyclable bin collection scheduled for tomorrow 9:00 AM',
      subtext: 'Recyclable',
      isUnread: false,
    },
  ]);

  return (
    <>
      {/* --- CSS STYLES --- */}
      <style>{`
        /* Color Palette */
        :root {
          /* Critical / Red */
          --red-bg: #FFF1F2;
          --red-icon-bg: #FECDD3;
          --red-text: #E11D48;
          
          /* Warning / Yellow */
          --yellow-bg: #FFFBEB;
          --yellow-icon-bg: #FDE68A;
          --yellow-text: #D97706;

          /* Info / Blue */
          --blue-bg: #EFF6FF;
          --blue-icon-bg: #BFDBFE;
          --blue-text: #2563EB;

          /* Success / Green */
          --green-bg: #ECFDF5;
          --green-icon-bg: #A7F3D0;
          --green-text: #059669;

          --text-primary: #1F2937;
          --text-secondary: #6B7280;
        }

        .notifications-page-container {
          padding: 2rem 3rem;
          background-color: #FFFFFF;
          min-height: 100%;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .page-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 5px;
        }

        .mark-all-btn {
          background: none;
          border: none;
          color: #10B981;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
        }

        /* Stats Grid (Top Row) */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid #F3F4F6;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .stat-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Notification Cards */
        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notif-card {
          display: flex;
          align-items: flex-start;
          padding: 1.5rem;
          border-radius: 12px;
          position: relative;
          transition: transform 0.2s;
        }

        .notif-card.critical { background-color: var(--red-bg); }
        .notif-card.warning { background-color: var(--yellow-bg); }
        .notif-card.info { background-color: var(--blue-bg); }
        .notif-card.success { background-color: var(--green-bg); }

        .notif-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1.5rem;
          background-color: white;
          flex-shrink: 0;
        }

        /* Text Colors */
        .notif-icon-box.critical { color: var(--red-text); }
        .notif-icon-box.warning { color: var(--yellow-text); }
        .notif-icon-box.info { color: var(--blue-text); }
        .notif-icon-box.success { color: var(--green-text); }

        .icon-box.critical { background-color: var(--red-bg); color: var(--red-text); }
        .icon-box.warning { background-color: var(--yellow-bg); color: var(--yellow-text); }
        .icon-box.info { background-color: var(--blue-bg); color: var(--blue-text); }
        .icon-box.success { background-color: var(--green-bg); color: var(--green-text); }

        .notif-content {
          flex-grow: 1;
        }

        .notif-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .red-dot {
          width: 8px;
          height: 8px;
          background-color: var(--red-text);
          border-radius: 50%;
          display: inline-block;
        }

        .notif-message {
          margin: 0 0 1rem 0;
          color: #4B5563;
          font-size: 0.95rem;
        }

        .notif-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .trash-icon {
          display: flex;
          align-items: center;
        }

        .notif-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
          min-width: 120px;
        }

        .time-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .mark-read-btn {
          background: none;
          border: none;
          color: #10B981;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .mark-read-btn:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* --- COMPONENT JSX --- */}
      <div className="notifications-page-container">
        {/* Header */}
        <header className="page-header">
          <div className="header-text">
            <h1>Notifications</h1>
            <p className="subtitle">2 unread notifications</p>
          </div>
          <button className="mark-all-btn">Mark all as read</button>
        </header>

        {/* Stats Row */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className={`icon-box ${stat.type}`}>
                {Icons[stat.type]}
              </div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-count">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Notifications List */}
        <div className="notification-list">
          {notifications.map((notif) => (
            <div key={notif.id} className={`notif-card ${notif.type}`}>
              {/* Left Icon */}
              <div className={`notif-icon-box ${notif.type}`}>
                {Icons[notif.type]}
              </div>

              {/* Middle Content */}
              <div className="notif-content">
                <div className="notif-header">
                  <h3>
                    {notif.title}
                    {notif.isUnread && <span className="red-dot"></span>}
                  </h3>
                </div>
                <p className="notif-message">{notif.message}</p>
                <div className="notif-meta">
                  <span className="trash-icon">{Icons.trash}</span>
                  <span>{notif.subtext}</span>
                </div>
              </div>

              {/* Right Side (Time & Button) */}
              <div className="notif-actions">
                <span className="time-text">{notif.time}</span>
                {notif.isUnread && <button className="mark-read-btn">Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Notifications;