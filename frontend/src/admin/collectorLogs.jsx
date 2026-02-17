/**
 * Collector Logs Component
 * Displays activity logs for collectors (role COLLECTOR) - monitors collector movement and actions
 * Similar to superadmin Admin Logs but filtered by collector role
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/collectorLogs.css';

const CollectorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCollectorLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const fetchCollectorLogs = async () => {
    try {
      setLoading(true);

      // Fetch activity_logs with user join, then filter to only logs where user is COLLECTOR
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
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback: fetch without join and filter by fetching user roles (we cannot filter by role without join)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        // If we have user_ids, fetch users and filter to collector logs only
        const userIds = [...new Set((fallbackData || []).map(l => l.user_id).filter(Boolean))];
        if (userIds.length === 0) {
          setLogs([]);
          return;
        }
        const { data: usersData } = await supabase
          .from('users')
          .select('id, role, first_name, last_name')
          .in('id', userIds);

        const collectorIds = new Set((usersData || []).filter(u => u.role === 'COLLECTOR').map(u => u.id));
        const userMap = (usersData || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
        const collectorLogs = (fallbackData || [])
          .filter(log => log.user_id && collectorIds.has(log.user_id))
          .map(log => ({ ...log, user: userMap[log.user_id] }));
        setLogs(collectorLogs);
      } else {
        // Filter to only show logs where user is COLLECTOR
        const collectorLogs = (data || []).filter(
          log => log.user && log.user.role === 'COLLECTOR'
        );
        setLogs(collectorLogs);
      }
    } catch (err) {
      console.error('Error fetching collector logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getCollectorNameForFilter = (log) => {
    if (!log.user) return '';
    const first = log.user.first_name || '';
    const last = log.user.last_name || '';
    return `${first} ${last}`.trim().toLowerCase();
  };

  const filteredBySearch = searchTerm.trim()
    ? logs.filter((log) => {
        const term = searchTerm.trim().toLowerCase();
        const collectorName = getCollectorNameForFilter(log);
        const activityType = (log.activity_type || '').replace(/_/g, ' ').toLowerCase();
        const description = (log.description || '').toLowerCase();
        return (
          collectorName.includes(term) ||
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
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const getCollectorName = (log) => {
    if (!log.user) return 'Unknown';
    const first = log.user.first_name || '';
    const last = log.user.last_name || '';
    return `${first} ${last}`.trim() || 'Collector';
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
    <div className="collector-logs-container">
      <div className="collector-logs-header">
        <div>
          <h1>Collector Logs</h1>
          <p>Track collector activities and actions</p>
        </div>
      </div>

      <div className="collector-logs-search-row">
        <input
          type="text"
          placeholder="Search by collector name, activity or description..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="collector-logs-date-filter">
          <input
            id="collector-logs-date-picker"
            type="date"
            className="collector-logs-date-input"
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
          <p>{searchTerm.trim() ? 'No logs match your search' : 'No collector logs found'}</p>
        </div>
      ) : (
        <>
          <div className="collector-logs-table">
            <div className="table-header">
              <div className="col-activity">Activity</div>
              <div className="col-collector">Collector</div>
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
                  <div className="col-collector">{getCollectorName(log)}</div>
                  <div className="col-description">{log.description || 'No description'}</div>
                  <div className="col-date">{formatDate(log.created_at)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="collector-logs-cards">
            {currentLogs.map((log) => (
              <div key={log.id} className="log-card">
                <div className="log-card-header">
                  <span className="activity-icon">{getActivityIcon(log.activity_type)}</span>
                  <span className="activity-type">{log.activity_type?.replace(/_/g, ' ') || 'Unknown'}</span>
                </div>
                <div className="log-card-body">
                  <p className="log-collector">{getCollectorName(log)}</p>
                  <p className="log-description">{log.description || 'No description'}</p>
                  <p className="log-date">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

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

export default CollectorLogs;
