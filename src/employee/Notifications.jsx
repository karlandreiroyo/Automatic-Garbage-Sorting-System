import React, { useState } from 'react';
import '../employee/employeecss/Notifications.css';

// --- ICONS ---
const Icons = {
  critical: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  warning: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  success: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletedNotifications, setDeletedNotifications] = useState([]);

  const filteredNotifications = activeFilter 
    ? notifications.filter(n => n.type === activeFilter)
    : notifications;

  const stats = [
    { type: 'critical', label: 'Critical', count: notifications.filter(n => n.type === 'critical').length },
    { type: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length },
    { type: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
    { type: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
  ];

  // Validation: Check if there are any notifications
  const hasNotifications = notifications.length > 0;
  const hasFilteredNotifications = filteredNotifications.length > 0;

  // Show success message with auto-hide
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleMarkAllRead = () => {
    const unreadCount = notifications.filter(n => n.isUnread).length;
    
    if (unreadCount === 0) {
      showSuccess('All notifications are already marked as read');
      return;
    }

    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
    showSuccess(`Marked ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read`);
  };

  const handleMarkRead = (id) => {
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      console.error('Notification not found');
      return;
    }

    if (!notification.isUnread) {
      showSuccess('Notification is already marked as read');
      return;
    }

    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isUnread: false } : n
    ));
    showSuccess('Notification marked as read');
  };

  const handleDeleteClick = (id) => {
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      console.error('Notification not found');
      return;
    }

    setDeleteConfirm(id);
  };

  const handleConfirmDelete = (id) => {
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      console.error('Notification not found');
      setDeleteConfirm(null);
      return;
    }

    // Store deleted notification for potential undo
    setDeletedNotifications([...deletedNotifications, notification]);
    
    // Remove from notifications
    setNotifications(notifications.filter(n => n.id !== id));
    setDeleteConfirm(null);
    
    showSuccess('Notification deleted successfully');
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleFilterClick = (type) => {
    if (!type) return;
    
    const newFilter = activeFilter === type ? null : type;
    setActiveFilter(newFilter);
    
    if (newFilter) {
      const count = notifications.filter(n => n.type === type).length;
      if (count === 0) {
        showSuccess(`No ${type} notifications found`);
      }
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      showSuccess('No notifications to clear');
      return;
    }

    if (window.confirm(`Are you sure you want to delete all ${notifications.length} notification${notifications.length > 1 ? 's' : ''}?`)) {
      setDeletedNotifications([...deletedNotifications, ...notifications]);
      setNotifications([]);
      setActiveFilter(null);
      showSuccess('All notifications cleared');
    }
  };

  const unreadCount = notifications.filter(n => n.isUnread).length;

  return (
    <div className="notifications-page-container">
      {/* Success Message */}
      {successMessage && (
        <div className="success-toast">
          {Icons.check}
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Notifications</h1>
          <p className="subtitle">
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All notifications are read'}
          </p>
        </div>
        <div className="header-actions">
          {notifications.length > 0 && (
            <>
              <button 
                className="clear-all-btn" 
                onClick={handleClearAll}
                title="Delete all notifications"
              >
                Clear All
              </button>
              <button 
                className="mark-all-btn" 
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                title={unreadCount === 0 ? 'All notifications are read' : 'Mark all as read'}
              >
                Mark all as read
              </button>
            </>
          )}
        </div>
      </header>

      {/* Stats */}
      {hasNotifications && (
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className={`stat-card ${activeFilter === stat.type ? 'active' : ''} ${stat.count === 0 ? 'disabled' : ''}`}
              onClick={() => stat.count > 0 && handleFilterClick(stat.type)}
              style={{ cursor: stat.count === 0 ? 'not-allowed' : 'pointer' }}
            >
              <div className={`icon-box ${stat.type}`}>{Icons[stat.type]}</div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-count">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Filter Badge */}
      {activeFilter && (
        <div className="active-filter-badge">
          <span>Showing: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} notifications</span>
          <button onClick={() => setActiveFilter(null)} className="clear-filter-btn">
            {Icons.x} Clear filter
          </button>
        </div>
      )}

      {/* Notification List */}
      {!hasNotifications ? (
        <div className="empty-state">
          <div className="empty-icon">{Icons.info}</div>
          <h3>No notifications</h3>
          <p>You don't have any notifications at the moment. Check back later!</p>
        </div>
      ) : !hasFilteredNotifications ? (
        <div className="empty-state">
          <div className="empty-icon">{Icons.info}</div>
          <h3>No {activeFilter} notifications</h3>
          <p>There are no {activeFilter} notifications to display.</p>
          <button className="reset-filter-btn" onClick={() => setActiveFilter(null)}>
            View all notifications
          </button>
        </div>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notif-card ${notif.type} ${notif.isUnread ? 'unread' : ''} ${deleteConfirm === notif.id ? 'deleting' : ''}`}
            >
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
                <div className="action-buttons">
                  {deleteConfirm === notif.id ? (
                    <div className="delete-confirm">
                      <span className="confirm-text">Delete?</span>
                      <button 
                        className="confirm-delete-btn" 
                        onClick={() => handleConfirmDelete(notif.id)}
                        title="Confirm delete"
                      >
                        {Icons.check}
                      </button>
                      <button 
                        className="cancel-delete-btn" 
                        onClick={handleCancelDelete}
                        title="Cancel"
                      >
                        {Icons.x}
                      </button>
                    </div>
                  ) : (
                    <>
                      {notif.isUnread && (
                        <button 
                          className="mark-read-btn" 
                          onClick={() => handleMarkRead(notif.id)}
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteClick(notif.id)}
                        title="Delete notification"
                      >
                        {Icons.trash}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;