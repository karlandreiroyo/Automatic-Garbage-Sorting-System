import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config/api';
import '../employee/employeecss/Notifications.css';

const loadInitialNotifications = () => {
  try {
    const raw = localStorage.getItem('agss_notifications');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// --- ICONS ---
const Icons = {
  critical: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  warning: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  success: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  location: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  weight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l4 6-10 12L2 9z"></path></svg>
};

// Helper function to get bin class name from subtext
const getBinClassName = (subtext) => {
  if (!subtext) return '';
  return `bin-${subtext.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')}`;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(loadInitialNotifications);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [activeFilters, setActiveFilters] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletedNotifications, setDeletedNotifications] = useState([]);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Fetch notifications from database (Supabase notification_bin — same DB locally and on Railway)
  useEffect(() => {
    let cancelled = false;
    setApiError(null);
    const fetchFromApi = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/collector-bins/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const list = data?.notifications;
          if (Array.isArray(list)) {
            setNotifications(list);
            try { localStorage.setItem('agss_notifications', JSON.stringify(list)); } catch {}
          }
        } else {
          const msg = res.status === 401 ? 'Not signed in or session expired.' : res.status === 503 ? 'Backend misconfigured (check SUPABASE_SERVICE_KEY).' : `Server error (${res.status}).`;
          if (!cancelled) setApiError(msg);
        }
      } catch (e) {
        if (!cancelled) setApiError('Could not reach backend. Set VITE_API_URL to your backend URL and redeploy. See DOCS.md.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFromApi();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('agss_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Filter logic:
  // - When no filters selected: show only unread notifications (main view)
  // - When one or more filters selected: show notifications matching ANY selected type
  const filteredNotifications = activeFilters.length > 0
    ? notifications.filter(n => activeFilters.includes(n.type))
    : notifications.filter(n => n.isUnread);

  const stats = [
    { type: 'critical', label: 'Critical', count: notifications.filter(n => n.type === 'critical').length },
    { type: 'warning', label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length },
    { type: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
    { type: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
  ];

  // Validation: Check if there are any notifications
  const hasNotifications = notifications.length > 0;
  const _hasUnreadNotifications = notifications.filter(n => n.isUnread).length > 0;
  const hasFilteredNotifications = filteredNotifications.length > 0;

  // Show success message with auto-hide
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => n.isUnread);
    const unreadCount = unread.length;
    
    if (unreadCount === 0) {
      showSuccess('All notifications are already marked as read');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      const dbIds = unread
        .filter(n => typeof n.id === 'number' || (typeof n.id === 'string' && /^\d+$/.test(String(n.id))))
        .map(n => n.id);
      await Promise.all(
        dbIds.map(id =>
          fetch(`${API_BASE}/api/collector-bins/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
    }

    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
    showSuccess(`Marked ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read`);
  };

  const handleMarkRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      console.error('Notification not found');
      return;
    }

    if (!notification.isUnread) {
      showSuccess('Notification is already marked as read');
      return;
    }

    const isDbId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(String(id)));
    if (isDbId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const res = await fetch(`${API_BASE}/api/collector-bins/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('API error');
        }
      } catch (_) {
        // Fallback: update local only
      }
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

  const handleConfirmDelete = async (id) => {
    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      console.error('Notification not found');
      setDeleteConfirm(null);
      return;
    }

    const isDbId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(String(id)));
    if (isDbId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const res = await fetch(`${API_BASE}/api/collector-bins/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('API error');
        }
      } catch (_) {
        // Still remove from local state
      }
    }

    setDeletedNotifications([...deletedNotifications, notification]);
    setNotifications(notifications.filter(n => n.id !== id));
    setDeleteConfirm(null);
    showSuccess('Notification deleted successfully');
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleFilterClick = (type) => {
    if (!type) return;
    setActiveFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const _handleClearAll = () => {
    if (notifications.length === 0) {
      showSuccess('No notifications to clear');
      return;
    }

    setShowClearAllConfirm(true);
  };

  const handleConfirmClearAll = () => {
    setDeletedNotifications([...deletedNotifications, ...notifications]);
    setNotifications([]);
    setActiveFilters([]);
    setShowClearAllConfirm(false);
    showSuccess('All notifications cleared');
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

      {/* API error: e.g. Railway backend not reachable or Supabase not configured */}
      {apiError && (
        <div className="api-error-banner" style={{ marginBottom: '1rem', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.9rem' }}>
          {Icons.critical}
          <span style={{ marginLeft: '8px' }}>{apiError}</span>
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
            <button 
              className="mark-all-btn" 
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              title={unreadCount === 0 ? 'All notifications are read' : 'Mark all as read'}
            >
              Mark all as read
            </button>
          )}
        </div>
      </header>

      {/* Stats */}
      {hasNotifications && (
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className={`stat-card ${activeFilters.includes(stat.type) ? 'active' : ''} ${stat.count === 0 ? 'disabled' : ''}`}
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

      {/* Active Filter Badge – show when one or more filters selected */}
      {activeFilters.length > 0 && (
        <div className="active-filter-badge">
          <span>
            Showing: {activeFilters.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')} notifications
          </span>
          <button onClick={() => setActiveFilters([])} className="clear-filter-btn">
            {Icons.x} Clear filter
          </button>
        </div>
      )}

      {/* Notification List */}
      {loading ? (
        <div className="empty-state">
          <p>Loading notifications…</p>
        </div>
      ) : !hasNotifications ? (
        <div className="empty-state">
          <div className="empty-icon">{Icons.info}</div>
          <h3>No notifications</h3>
          <p>You don't have any notifications at the moment. Check back later!</p>
        </div>
      ) : !hasFilteredNotifications ? (
        <div className="empty-state">
          <div className="empty-icon">{Icons.info}</div>
          {activeFilters.length > 0 ? (
            <>
              <h3>No matching notifications</h3>
              <p>There are no notifications for {activeFilters.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}.</p>
              <button className="reset-filter-btn" onClick={() => setActiveFilters([])}>
                View all notifications
              </button>
            </>
          ) : (
            <>
              <h3>All notifications read</h3>
              <p>You have no unread notifications. Use the filters above to view past notifications.</p>
            </>
          )}
        </div>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notif-card ${notif.type} ${notif.isUnread ? 'unread' : ''} ${deleteConfirm === notif.id ? 'deleting' : ''}`}
            >
              <div className={`notif-icon-box ${notif.type} ${getBinClassName(notif.subtext)}`}>{Icons[notif.type]}</div>
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

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowClearAllConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            className="confirm-modal-box" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                margin: '0 auto 15px',
                color: '#ef4444'
              }}>
                {Icons.critical}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '10px' }}>
                Confirm Delete
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                Are you sure you want to delete all {notifications.length} notification{notifications.length > 1 ? 's' : ''}?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowClearAllConfirm(false)}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmClearAll}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;