import React, { useState, useEffect, useMemo } from 'react';
import '../employee/employeecss/Notifications.css';

// --- ICONS ---
const Icons = {
  Bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  CheckCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  AlertTriangle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  Info: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  XCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
  FilterX: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path><line x1="3" y1="3" x2="21" y2="21"></line></svg>
};

// --- MOCK DATA ---
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'critical', title: 'Bin Full Alert', message: 'Non-biodegradable bin has reached 100% capacity.', time: '2 minutes ago', read: false, binType: 'Non-biodegradable' },
  { id: 2, type: 'warning', title: 'Bin Almost Full', message: 'Recyclable bin is at 85% capacity.', time: '15 minutes ago', read: false, binType: 'Recyclable' },
  { id: 3, type: 'warning', title: 'Bin Almost Full', message: 'Biodegradable bin is at 78% capacity.', time: '1 hour ago', read: false, binType: 'Biodegradable' },
  { id: 4, type: 'success', title: 'Collection Completed', message: 'Non-biodegradable bin has been emptied.', time: '3 hours ago', read: true, binType: 'Non-biodegradable' },
  { id: 5, type: 'info', title: 'System Update', message: 'Sorting algorithm updated successfully.', time: '5 hours ago', read: true, binType: 'System' },
  { id: 6, type: 'critical', title: 'Sensor Error', message: 'Biodegradable bin sensor not responding.', time: '1 day ago', read: true, binType: 'Biodegradable' },
];

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, onConfirm, title, message, icon: Icon, confirmText, confirmBtnClass }) => {
  // Prevent Scroll Effect Logic
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon"><Icon /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className={confirmBtnClass} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });
  // Inline Delete State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // --- Derived State & Stats ---
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  
  const stats = useMemo(() => ({
    critical: notifications.filter(n => n.type === 'critical').length,
    warning: notifications.filter(n => n.type === 'warning').length,
    info: notifications.filter(n => n.type === 'info').length,
    success: notifications.filter(n => n.type === 'success').length,
  }), [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.read;
      return n.type === filter;
    });
  }, [notifications, filter]);

  // --- Handlers ---
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    showToast('Notification marked as read');
  };

  const handleDeleteClick = (id) => setDeleteConfirm(id);
  const handleCancelDelete = () => setDeleteConfirm(null);
  
  const handleConfirmDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDeleteConfirm(null);
    showToast('Notification deleted');
  };

  // Modal Handlers
  const openModal = (type) => setModalConfig({ isOpen: true, type });
  const closeModal = () => setModalConfig({ isOpen: false, type: null });

  const confirmAction = () => {
    if (modalConfig.type === 'markAllRead') {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    } else if (modalConfig.type === 'clearAll') {
      setNotifications([]);
      showToast('All notifications cleared');
    }
    closeModal();
  };

  return (
    <div className="notifications-page-container">
      {/* Toast Notification */}
      {toast && (
        <div className="success-toast">
          <Icons.CheckCircle /> {toast}
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Notifications</h1>
          <p className="subtitle">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="mark-all-btn" 
            onClick={() => openModal('markAllRead')} 
            disabled={unreadCount === 0}
          >
            Mark all read
          </button>
          <button 
            className="clear-all-btn" 
            onClick={() => openModal('clearAll')} 
            disabled={notifications.length === 0}
          >
            Clear All
          </button>
        </div>
      </header>

      {/* Stats Grid - Click to Filter */}
      <div className="stats-grid">
        {['critical', 'warning', 'info', 'success'].map(type => (
          <div 
            key={type}
            className={`stat-card ${filter === type ? 'active' : ''} ${stats[type] === 0 ? 'disabled' : ''}`} 
            onClick={() => stats[type] > 0 && setFilter(filter === type ? 'all' : type)}
          >
            <div className={`icon-box ${type}`}>
              {type === 'critical' && <Icons.AlertTriangle />}
              {type === 'warning' && <Icons.AlertTriangle />}
              {type === 'info' && <Icons.Info />}
              {type === 'success' && <Icons.CheckCircle />}
            </div>
            <div className="stat-info">
              <span className="stat-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              <span className="stat-count">{stats[type]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Filter Badge */}
      {filter !== 'all' && (
        <div className="active-filter-badge">
          <span>Showing: {filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
          <button className="clear-filter-btn" onClick={() => setFilter('all')}>
            <Icons.FilterX /> Clear Filter
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="notification-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div key={notification.id} className={`notif-card ${notification.type} ${notification.read ? 'read' : 'unread'}`}>
              
              {/* Icon */}
              <div className={`notif-icon-box ${notification.type}`}>
                {notification.type === 'critical' && <Icons.AlertTriangle />}
                {notification.type === 'warning' && <Icons.AlertTriangle />}
                {notification.type === 'info' && <Icons.Info />}
                {notification.type === 'success' && <Icons.CheckCircle />}
              </div>

              {/* Content */}
              <div className="notif-content">
                <div className="notif-header">
                  <h3>
                    {!notification.read && <span className="red-dot"></span>} 
                    {notification.title}
                  </h3>
                </div>
                <p className="notif-message">{notification.message}</p>
                <div className="notif-meta">
                  <span>{notification.binType}</span>
                </div>
              </div>

              {/* Actions / Deletion Confirm */}
              <div className="notif-actions">
                <span className="time-text">{notification.time}</span>
                
                {deleteConfirm === notification.id ? (
                  // Inline Deletion Validation
                  <div className="action-buttons">
                    <span style={{fontSize: '0.85rem', color: '#EF4444', fontWeight: 600}}>Delete?</span>
                    <button className="mark-read-btn" style={{color:'#EF4444'}} onClick={() => handleConfirmDelete(notification.id)}>Yes</button>
                    <button className="delete-btn" onClick={handleCancelDelete}>No</button>
                  </div>
                ) : (
                  <div className="action-buttons">
                    {!notification.read && (
                      <button className="mark-read-btn" onClick={() => handleMarkRead(notification.id)} title="Mark as read">
                        <Icons.Check /> Read
                      </button>
                    )}
                    <button className="delete-btn" onClick={() => handleDeleteClick(notification.id)} title="Delete">
                      <Icons.Trash />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Icons.Bell /></div>
            <h3>No notifications found</h3>
            <p>You're all caught up! There are no notifications to display{filter !== 'all' ? ' for this filter' : ''}.</p>
            {filter !== 'all' && (
              <button className="reset-filter-btn" onClick={() => setFilter('all')}>
                Show All Notifications
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals for Critical Actions */}
      <Modal
        isOpen={modalConfig.isOpen && modalConfig.type === 'markAllRead'}
        onClose={closeModal}
        onConfirm={confirmAction}
        title="Mark all as read?"
        message={`Are you sure you want to mark all ${unreadCount} unread notifications as read?`}
        icon={Icons.CheckCircle}
        confirmText="Yes, Mark Read"
        confirmBtnClass="btn-confirm-blue"
      />

      <Modal
        isOpen={modalConfig.isOpen && modalConfig.type === 'clearAll'}
        onClose={closeModal}
        onConfirm={confirmAction}
        title="Clear all notifications?"
        message="This will permanently delete all notifications. You cannot undo this action."
        icon={Icons.AlertTriangle}
        confirmText="Yes, Clear All"
        confirmBtnClass="btn-confirm-red"
      />
    </div>
  );
};

export default Notifications;