import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './superadmincss/adminLogs.css';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdminLogs();
  }, [currentPage]);

  const fetchAdminLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch activity logs where the user performing the action is an ADMIN
      // Join with users table to filter by role
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:users!activity_logs_user_id_fkey(
            id,
            role,
            first_name,
            last_name
          )
        `)
        .or('user.role.eq.ADMIN,user_id.is.null')
        .in('activity_type', [
          'USER_ADDED',
          'USER_UPDATED',
          'USER_ARCHIVED',
          'USER_ACTIVATED',
          'BIN_ADDED',
          'BIN_UPDATED',
          'BIN_ARCHIVED',
          'BIN_UNARCHIVED',
          'BIN_DRAINED',
          'BIN_DRAINED_ALL'
        ])
        .order('created_at', { ascending: false });

      if (error) {
        // If join fails, try without join and filter by activity types only
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('activity_logs')
          .select('*')
          .in('activity_type', [
            'USER_ADDED',
            'USER_UPDATED',
            'USER_ARCHIVED',
            'USER_ACTIVATED',
            'BIN_ADDED',
            'BIN_UPDATED',
            'BIN_ARCHIVED',
            'BIN_UNARCHIVED',
            'BIN_DRAINED',
            'BIN_DRAINED_ALL'
          ])
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setLogs(fallbackData || []);
      } else {
        // Filter to only show logs where user is ADMIN or user_id is null (system/admin actions)
        const adminLogs = (data || []).filter(log => 
          !log.user || log.user.role === 'ADMIN' || log.user_id === null
        );
        setLogs(adminLogs);
      }
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'USER_ADDED':
        return '➕';
      case 'USER_UPDATED':
        return '✏️';
      case 'USER_ARCHIVED':
        return '📦';
      case 'USER_ACTIVATED':
        return '✅';
      case 'BIN_ADDED':
        return '🗑️';
      case 'BIN_UPDATED':
        return '🔄';
      case 'BIN_ARCHIVED':
        return '📦';
      case 'BIN_UNARCHIVED':
        return '📤';
      case 'BIN_DRAINED':
        return '💧';
      case 'BIN_DRAINED_ALL':
        return '💧';
      default:
        return '📝';
    }
  };

  return (
    <div className="admin-logs-container">
      <div className="admin-logs-header">
        <div>
          <h1>Admin Logs</h1>
          <p>Track all admin activities and actions</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <p>No admin logs found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="admin-logs-table">
            <div className="table-header">
              <div className="col-date">Date & Time</div>
              <div className="col-activity">Activity</div>
              <div className="col-description">Description</div>
            </div>
            <div className="table-body">
              {currentLogs.map((log) => (
                <div key={log.id} className="table-row">
                  <div className="col-date">
                    {formatDate(log.created_at)}
                  </div>
                  <div className="col-activity">
                    <span className="activity-icon">{getActivityIcon(log.activity_type)}</span>
                    <span className="activity-type">{log.activity_type?.replace(/_/g, ' ') || 'Unknown'}</span>
                  </div>
                  <div className="col-description">
                    {log.description || 'No description'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="admin-logs-cards">
            {currentLogs.map((log) => (
              <div key={log.id} className="log-card">
                <div className="log-card-header">
                  <span className="activity-icon">{getActivityIcon(log.activity_type)}</span>
                  <span className="activity-type">{log.activity_type?.replace(/_/g, ' ') || 'Unknown'}</span>
                </div>
                <div className="log-card-body">
                  <p className="log-description">{log.description || 'No description'}</p>
                  <p className="log-date">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination">
                {currentPage > 1 && (
                  <button 
                    className="pagination-btn pagination-first" 
                    onClick={() => handlePageChange(1)}
                  >
                    First Page
                  </button>
                )}
                <button 
                  className="pagination-btn pagination-prev" 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {generatePageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`pagination-btn pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
                <button 
                  className="pagination-btn pagination-next" 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                {currentPage < totalPages && (
                  <button 
                    className="pagination-btn pagination-last" 
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Last Page
                  </button>
                )}
              </div>
              <div className="pagination-info">
                Page {currentPage} of {totalPages} ({logs.length} total logs)
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLogs;
