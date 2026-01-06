import React, { useState } from 'react';
import '../employee/employeecss/Notifications.css'; 

// --- ICONS ---
const Icons = {
  critical: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  warning: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  success: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  checkCircle: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
};

const Notifications = () => {
  // --- UPDATED STATE WITH INFO & SUCCESS SAMPLES ---
  const [notifications, setNotifications] = useState([
    // Critical
    { id: 1, type: 'critical', title: 'Bin Full Alert', time: '2 minutes ago', message: 'Non-biodegradable bin has reached 100% capacity', subtext: 'Non-Biodegradable', isUnread: true },
    
    // Warning
    { id: 2, type: 'warning', title: 'Bin Almost Full', time: '15 minutes ago', message: 'Recyclable bin is at 85% capacity', subtext: 'Recyclable', isUnread: true },
    { id: 3, type: 'warning', title: 'Bin Almost Full', time: '1 hour ago', message: 'Biodegradable bin is at 78% capacity', subtext: 'Biodegradable', isUnread: false },
    
    // Info (New Samples)
    { id: 6, type: 'info', title: 'System Maintenance', time: 'Just now', message: 'Sensor calibration scheduled for 12:00 PM.', subtext: 'System', isUnread: true },
    { id: 7, type: 'info', title: 'Shift Reminder', time: '45 minutes ago', message: 'Afternoon sorting shift begins in 1 hour.', subtext: 'Personnel', isUnread: true },
    { id: 5, type: 'info', title: 'Scheduled Collection', time: '5 hours ago', message: 'Recyclable bin collection scheduled for tomorrow 9:00 AM', subtext: 'Recyclable', isUnread: false },

    // Success (New Samples)
    { id: 8, type: 'success', title: 'Optimization Complete', time: '10 minutes ago', message: 'Auto-sorting algorithm updated successfully.', subtext: 'System Update', isUnread: true },
    { id: 9, type: 'success', title: 'Daily Goal Met', time: '30 minutes ago', message: 'Sorting accuracy reached 99% for the morning shift!', subtext: 'Performance', isUnread: true },
    { id: 4, type: 'success', title: 'Collection Completed', time: '3 hours ago', message: 'Non-biodegradable bin has been emptied', subtext: 'Non-Biodegradable', isUnread: false },
  ]);

  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- STATS LOGIC ---
  // Count only UNREAD items for the stats badges
  const stats = [
    { type: 'critical', label: 'Critical', count: notifications.filter(n => n.type === 'critical' && n.isUnread).length },
    { type: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning' && n.isUnread).length },
    { type: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info' && n.isUnread).length },
    { type: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success' && n.isUnread).length },
  ];

  const filteredNotifications = activeFilter 
    ? notifications.filter(n => n.type === activeFilter)
    : notifications;

  const totalUnreadCount = notifications.filter(n => n.isUnread).length;

  // --- VALIDATION LOGIC ---
  
  // 1. Identify which selected items are actually unread
  const selectedUnreadIds = selectedIds.filter(id => {
    const notif = notifications.find(n => n.id === id);
    return notif && notif.isUnread;
  });

  // 2. Button is enabled ONLY if there is work to do
  const isActionEnabled = selectedIds.length > 0 
    ? selectedUnreadIds.length > 0  
    : totalUnreadCount > 0;         

  // --- HANDLERS ---
  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id)); 
    }
  };

  const handleActionClick = () => {
    if (isActionEnabled) {
      setShowConfirmModal(true);
    }
  };

  // --- CONFIRM ACTION (MARK AS READ) ---
  const confirmAction = () => {
    if (selectedIds.length > 0) {
      setNotifications(prev => prev.map(n => 
        selectedIds.includes(n.id) ? { ...n, isUnread: false } : n
      ));
      setSelectedIds([]); // Deselect after action
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    }
    setShowConfirmModal(false);
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
  };

  const handleFilterClick = (type) => {
    setActiveFilter(activeFilter === type ? null : type);
    setSelectedIds([]); 
  };

  // --- DYNAMIC BUTTON TEXT ---
  let buttonText = "Mark All as Read";
  
  if (selectedIds.length > 0) {
    if (selectedUnreadIds.length > 0) {
      buttonText = `Mark ${selectedUnreadIds.length} as Read`; 
    } else {
      buttonText = "Already Read"; 
    }
  } else {
    if (totalUnreadCount === 0) {
      buttonText = "All Caught Up"; 
    }
  }

  return (
    <div className="notifications-page-container">
      {/* Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Notifications</h1>
          <p className="subtitle">
            {selectedIds.length > 0 
              ? `${selectedIds.length} selected` 
              : `${totalUnreadCount} unread notifications`}
          </p>
        </div>
        
        <div className="header-actions">
          <label className="select-all-wrapper">
             <input 
               type="checkbox" 
               className="custom-checkbox"
               checked={notifications.length > 0 && selectedIds.length === filteredNotifications.length}
               onChange={handleSelectAll}
               disabled={notifications.length === 0}
             />
             <span>Select All</span>
          </label>

          <button 
            className={`action-btn ${selectedIds.length > 0 ? 'btn-blue' : 'btn-green'}`} 
            onClick={handleActionClick}
            disabled={!isActionEnabled} 
            style={{ 
              opacity: !isActionEnabled ? 0.5 : 1, 
              cursor: !isActionEnabled ? 'not-allowed' : 'pointer',
              backgroundColor: !isActionEnabled ? '#e5e7eb' : '',
              color: !isActionEnabled ? '#9ca3af' : ''
            }}
          >
            {buttonText}
          </button>
        </div>
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
          <div 
            key={notif.id} 
            className={`notif-card ${notif.type} ${notif.isUnread ? 'unread' : 'read-card'} ${selectedIds.includes(notif.id) ? 'selected' : ''}`}
          >
            <div className="card-select">
              <input 
                type="checkbox" 
                className="custom-checkbox"
                checked={selectedIds.includes(notif.id)}
                onChange={() => handleSelect(notif.id)}
              />
            </div>

            <div className={`notif-icon-box ${notif.type}`}>{Icons[notif.type]}</div>
            
            <div className="notif-content">
              <div className="notif-header">
                <h3>
                  {notif.title}
                  {/* Red dot only shows if unread */}
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
            </div>
          </div>
        ))}
        {filteredNotifications.length === 0 && (
          <div className="empty-state">No notifications found.</div>
        )}
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              {Icons.success}
            </div>
            <h2>Confirm Action</h2>
            <p>
              {selectedIds.length > 0 
                ? `Are you sure you want to mark these ${selectedUnreadIds.length} notifications as read?`
                : "Are you sure you want to mark ALL notifications as read?"
              }
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={cancelAction}>Cancel</button>
              <button className="modal-btn confirm" onClick={confirmAction}>
                Yes, Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notifications;