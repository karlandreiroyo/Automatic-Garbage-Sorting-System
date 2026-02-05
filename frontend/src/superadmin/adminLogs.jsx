import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './superadmincss/adminLogs.css';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchAdminLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const fetchAdminLogs = async () => {
    try {
      setLoading(true);
      
      // Admin Logs: record when an admin creates, edits, archives or activates an employee (Collector/Admin)
      // Only employee-related actions: USER_ADDED, USER_UPDATED, USER_ARCHIVED, USER_ACTIVATED
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
        .in('activity_type', [
          'USER_ADDED',
          'USER_UPDATED',
          'USER_ARCHIVED',
          'USER_ACTIVATED'
        ])
        .order('created_at', { ascending: false });

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('activity_logs')
          .select('*')
          .in('activity_type', [
            'USER_ADDED',
            'USER_UPDATED',
            'USER_ARCHIVED',
            'USER_ACTIVATED'
          ])
          .order('created_at', { ascending: false });
        if (fallbackError) throw fallbackError;
        const raw = fallbackData || [];
        const userIds = [...new Set(raw.map(l => l.user_id).filter(Boolean))];
        if (userIds.length === 0) {
          setLogs(raw);
          return;
        }
        const { data: usersData } = await supabase
          .from('users')
          .select('id, role, first_name, last_name')
          .in('id', userIds);
        const userMap = (usersData || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
        const adminLogs = raw.filter(log =>
          !log.user_id || (userMap[log.user_id] && userMap[log.user_id].role === 'ADMIN')
        ).map(log => ({ ...log, user: log.user_id ? userMap[log.user_id] : null }));
        setLogs(adminLogs);
      } else {
        // Filter to only show logs where actor is ADMIN or user_id is null (superadmin/system)
        const adminLogs = (data || []).filter(log =>
          !log.user_id || (log.user && log.user.role === 'ADMIN')
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

  const getAdminName = (log) => {
    if (!log.user_id) return 'System';
    if (!log.user) return 'Unknown';
    const first = log.user.first_name || '';
    const last = log.user.last_name || '';
    return `${first} ${last}`.trim() || 'Admin';
  };

  const getAdminNameForFilter = (log) => {
    return getAdminName(log).toLowerCase();
  };

  const filteredBySearch = searchTerm.trim()
    ? logs.filter((log) => {
        const term = searchTerm.trim().toLowerCase();
        const adminName = getAdminNameForFilter(log);
        const activityType = (log.activity_type || '').replace(/_/g, ' ').toLowerCase();
        const description = (log.description || '').toLowerCase();
        return (
          adminName.includes(term) ||
          activityType.includes(term) ||
          description.includes(term)
        );
      })
    : logs;

  const filteredLogs = dateFilter
    ? filteredBySearch.filter((log) => {
        if (!log.created_at) return false;
        const logDate = new Date(log.created_at);
        const logDateStr = logDate.getFullYear() + '-' + String(logDate.getMonth() + 1).padStart(2, '0') + '-' + String(logDate.getDate()).padStart(2, '0');
        return logDateStr === dateFilter;
      })
    : filteredBySearch;

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

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

  // Parse employee/target name (and role) from stored description for display
  const getEmployeeNameFromDescription = (activityType, description) => {
    if (!description || !description.trim()) return { name: 'Unknown', roleLabel: 'Employee' };
    const d = description.trim();
    if (activityType === 'USER_ADDED') {
      const match = d.match(/^Added\s+(.+?)\s+as\s+(?:a|an)\s+(COLLECTOR|ADMIN)/i);
      if (match) {
        const name = match[1].trim();
        const roleLabel = match[2].toUpperCase() === 'ADMIN' ? 'Admin' : 'Collector';
        return { name, roleLabel };
      }
    }
    if (activityType === 'USER_UPDATED') {
      const match = d.match(/^Updated\s+(.+?)'s\s+information/i) || d.match(/^Updated\s+(.+)/i);
      if (match) return { name: match[1].trim(), roleLabel: 'Employee' };
    }
    if (activityType === 'USER_ARCHIVED' || activityType === 'USER_ACTIVATED') {
      const match = d.match(/^(?:Archived|Activated)\s+(.+)/i);
      if (match) return { name: match[1].trim(), roleLabel: 'Employee' };
    }
    return { name: d, roleLabel: 'Employee' };
  };

  // Format description as "Archive / Activate / Add / Update" then "name"
  const formatAdminLogDescription = (log) => {
    const { name: employeeName } = getEmployeeNameFromDescription(log.activity_type, log.description);
    switch (log.activity_type) {
      case 'USER_ADDED':
        return `Add ${employeeName}`;
      case 'USER_UPDATED':
        return `Update ${employeeName}`;
      case 'USER_ARCHIVED':
        return `Archive ${employeeName}`;
      case 'USER_ACTIVATED':
        return `Activate ${employeeName}`;
      default:
        return log.description || 'No description';
    }
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
      default:
        return '📝';
    }
  };

  return (
    <div className="admin-logs-container">
      <div className="admin-logs-header">
        <div>
          <h1>Admin Logs</h1>
          <p>Track admin activities</p>
        </div>
      </div>

      <div className="admin-logs-search-row">
        <input
          type="text"
          placeholder="Search by admin name, activity or description..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="admin-logs-date-filter">
          <input
            id="admin-logs-date-picker"
            type="date"
            className="admin-logs-date-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter by date (above Date & Time)"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-state">
          <p>{searchTerm.trim() || dateFilter ? 'No logs match your search' : 'No admin logs found'}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View - same column order as Collector Logs: Activity, Admin, Description, Date & Time */}
          <div className="admin-logs-table">
            <div className="table-header">
              <div className="col-activity">Activity</div>
              <div className="col-admin">Admin</div>
              <div className="col-description">Description</div>
              <div className="col-date">Date & Time</div>
            </div>
            <div className="table-body">
              {currentLogs.map((log) => (
                <div key={log.id} className="table-row">
                  <div className="col-activity">
                    <span className="activity-icon">{getActivityIcon(log.activity_type)}</span>
                    <span className="activity-type">{log.activity_type?.replace(/_/g, ' ') || 'Unknown'}</span>
                  </div>
                  <div className="col-admin">{getAdminName(log)}</div>
                  <div className="col-description">{formatAdminLogDescription(log)}</div>
                  <div className="col-date">{formatDate(log.created_at)}</div>
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
                  <p className="log-admin">{getAdminName(log)}</p>
                  <p className="log-description">{formatAdminLogDescription(log)}</p>
                  <p className="log-date">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
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
                {generatePageNumbers().map((page, index) =>
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
                )}
                <button
                  className="pagination-btn pagination-next"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                {currentPage < totalPages && totalPages > 1 && (
                  <button
                    className="pagination-btn pagination-last"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Last Page
                  </button>
                )}
              </div>
              <div className="pagination-info">
                Page {currentPage} of {totalPages} ({filteredLogs.length} total logs)
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLogs;
