import React, { useState } from 'react';
import '../employee/employeecss/Notifications.css'; // link the separate CSS file

// --- ICONS ---
const Icons = {
  critical: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  warning: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  success: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'critical', title: 'Bin Full Alert', time: '2 minutes ago', message: 'Non-biodegradable bin has reached 100% capacity', subtext: 'Non-Biodegradable', isUnread: true },
    { id: 2, type: 'warning', title: 'Bin Almost Full', time: '15 minutes ago', message: 'Recyclable bin is at 85% capacity', subtext: 'Recyclable', isUnread: true },
    { id: 3, type: 'warning', title: 'Bin Almost Full', time: '1 hour ago', message: 'Biodegradable bin is at 78% capacity', subtext: 'Biodegradable', isUnread: false },
    { id: 4, type: 'success', title: 'Collection Completed', time: '3 hours ago', message: 'Non-biodegradable bin has been emptied', subtext: 'Non-Biodegradable', isUnread: false },
    { id: 5, type: 'info', title: 'Scheduled Collection', time: '5 hours ago', message: 'Recyclable bin collection scheduled for tomorrow 9:00 AM', subtext: 'Recyclable', isUnread: false },
  ]);

  const [activeFilter, setActiveFilter] = useState(null);

  const stats = [
    { type: 'critical', label: 'Critical', count: notifications.filter(n => n.type === 'critical').length },
    { type: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length },
    { type: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
    { type: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
  ];

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  const handleMarkRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isUnread: false } : n
    ));
  };

  const handleFilterClick = (type) => {
    setActiveFilter(activeFilter === type ? null : type);
  };

  const filteredNotifications = activeFilter 
    ? notifications.filter(n => n.type === activeFilter)
    : notifications;

  const unreadCount = notifications.filter(n => n.isUnread).length;

  return (
    <div className="notifications-page-container">
      {/* Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Notifications</h1>
          <p className="subtitle">{unreadCount} unread notifications</p>
        </div>
        <button className="mark-all-btn" onClick={handleMarkAllRead}>Mark all as read</button>
      </header>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`stat-card ${activeFilter === stat.type ? 'active' : ''}`}
            onClick={() => handleFilterClick(stat.type)}
          >
            <div className={`icon-box ${stat.type}`}>{Icons[stat.type]}</div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-count">{stat.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notification List */}
      <div className="notification-list">
        {filteredNotifications.map((notif) => (
          <div key={notif.id} className={`notif-card ${notif.type} ${notif.isUnread ? 'unread' : ''}`}>
            <div className={`notif-icon-box ${notif.type}`}>{Icons[notif.type]}</div>
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
            <div className="notif-actions">
              <span className="time-text">{notif.time}</span>
              {notif.isUnread && <button className="mark-read-btn" onClick={() => handleMarkRead(notif.id)}>Mark read</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;