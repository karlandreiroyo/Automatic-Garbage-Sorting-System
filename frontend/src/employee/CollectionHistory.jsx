import React, { useState, useMemo, useEffect } from 'react';
import '../employee/employeecss/CollectionHistory.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** Normalize API bin_category to display/filter type (e.g. "Non Biodegradable" → "Non-Biodegradable"). */
const normalizeType = (binCategory) => {
  if (!binCategory) return 'Unsorted';
  const s = String(binCategory).trim();
  if (s === 'Non Biodegradable') return 'Non-Biodegradable';
  if (s === 'Biodegradable' || s === 'Recyclable' || s === 'Unsorted') return s;
  return s;
};

// --- ICONS ---
const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const RecycleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SmallTrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const CollectionHistory = () => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [historyData, setHistoryData] = useState([]);
  const [recordedItems, setRecordedItems] = useState([]);
  const [loadingRecordedItems, setLoadingRecordedItems] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 4;

  // Recorded items for Bin 2 (same as admin "Recorded Items – Bin 2" – waste_items from collector)
  useEffect(() => {
    let cancelled = false;
    const fetchRecorded = async () => {
      setLoadingRecordedItems(true);
      try {
        const res = await fetch(`${API_BASE}/api/collector-bins/recorded-items?bin_id=2`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) setRecordedItems(json.data);
        else setRecordedItems([]);
      } catch {
        if (!cancelled) setRecordedItems([]);
      } finally {
        if (!cancelled) setLoadingRecordedItems(false);
      }
    };
    fetchRecorded();
    const interval = setInterval(fetchRecorded, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Real-time collection history from backend (bin drains from Bin Monitoring)
  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/collector-bins/collection-history`);
        if (!res.ok) throw new Error('Failed to load collection history');
        const data = await res.json();
        if (cancelled) return;
        const raw = data?.history ?? [];
        const mapped = raw.map((entry) => {
          const d = entry.drained_at ? new Date(entry.drained_at) : new Date();
          return {
            id: entry.id,
            type: normalizeType(entry.bin_category),
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            drainedAt: d,
            collector: entry.collector_name || '—',
            status: entry.status || 'Completed',
          };
        });
        setHistoryData(mapped);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load collection history');
        setHistoryData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Filter types (no "All" – multi-select like Notifications). Includes Unsorted.
  const filterTypes = ['Biodegradable', 'Non-Biodegradable', 'Recyclable', 'Unsorted'];

  // Filter logic: no filters = show all; one or more = show items matching any selected type
  const filteredList = useMemo(() => {
    if (activeFilters.length === 0) return [...historyData];
    return historyData.filter(item => activeFilters.includes(item.type));
  }, [activeFilters, historyData]);

  // Calculate statistics from real-time data (using drained_at)
  const stats = useMemo(() => {
    const totalCollections = historyData.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daily = historyData.filter(item => {
      const itemDate = item.drainedAt;
      if (!itemDate) return false;
      const d = new Date(itemDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekly = historyData.filter(item => {
      const itemDate = item.drainedAt;
      if (!itemDate) return false;
      const d = new Date(itemDate);
      d.setHours(0, 0, 0, 0);
      return d >= oneWeekAgo && d <= today;
    }).length;

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthly = historyData.filter(item => {
      const itemDate = item.drainedAt;
      if (!itemDate) return false;
      const d = new Date(itemDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return {
      totalCollections: totalCollections || 0,
      daily: daily || 0,
      weekly: weekly || 0,
      monthly: monthly || 0
    };
  }, [historyData]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const indexOfLastItem = safePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  // Validation checks
  const hasData = historyData.length > 0;
  const hasFilteredResults = filteredList.length > 0;

  // Get appropriate icon based on waste type
  const getTypeIcon = (type) => {
    if (!type || typeof type !== 'string') {
      return <div className="list-icon icon-red"><AlertIcon /></div>;
    }
    if (type === 'Unsorted') return <div className="list-icon icon-yellow"><AlertIcon /></div>;
    if (type.includes('Non')) return <div className="list-icon icon-red"><TrashIcon /></div>;
    if (type.includes('Recyclable')) return <div className="list-icon icon-blue"><RecycleIcon /></div>;
    return <div className="list-icon icon-green"><LeafIcon /></div>;
  };

  // Event handlers
  const handleFilterClick = (type) => {
    if (!filterTypes.includes(type)) return;
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    const newPage = Math.min(Math.max(1, page), totalPages);
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="history-page">
      {/* Header Section */}
      <div className="history-header-section">
        <div className="history-header-text">
          <h1>Collection History</h1>
          <p>Track all waste collection activities and logs</p>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="empty-state-container">
          <p>Loading collection history…</p>
        </div>
      )}
      {error && !loading && (
        <div className="empty-state-container">
          <div className="empty-icon-large">
            <AlertIcon />
          </div>
          <h3>Could not load history</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Statistics */}
      {hasData && !loading && (
        <div className="stats-row">
          <div className="stats-box">
            <div className="stats-icon-bg bg-green-light">
              <TrashIcon />
            </div>
            <div className="stats-content">
              <span className="stats-label">Total Trash Collection</span>
              <span className="stats-value">{stats.totalCollections}</span>
            </div>
          </div>
          <div className="stats-box">
            <div className="stats-icon-bg bg-blue-light">
              <CalendarIcon />
            </div>
            <div className="stats-content">
              <span className="stats-label">Daily</span>
              <span className="stats-value">{stats.daily}</span>
            </div>
          </div>
          <div className="stats-box">
            <div className="stats-icon-bg bg-purple-light">
              <CalendarIcon />
            </div>
            <div className="stats-content">
              <span className="stats-label">Weekly</span>
              <span className="stats-value">{stats.weekly}</span>
            </div>
          </div>
          <div className="stats-box">
            <div className="stats-icon-bg bg-orange-light">
              <CalendarIcon />
            </div>
            <div className="stats-content">
              <span className="stats-label">Monthly</span>
              <span className="stats-value">{stats.monthly}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs – by bin type (Biodegradable, Non-Biodegradable, Recyclable, Unsorted) */}
      {!loading && (
      <div className="filter-tabs">
        {filterTypes.map(type => (
          <button
            key={type}
            className={`filter-btn ${activeFilters.includes(type) ? 'active' : ''}`}
            onClick={() => handleFilterClick(type)}
          >
            {type}
            <span className="filter-count">
              ({historyData.filter(item => item.type === type).length})
            </span>
          </button>
        ))}
      </div>
      )}

      {/* Active filter badge – inline, like Notifications */}
      {activeFilters.length > 0 && (
        <div className="active-filter-badge">
          <span>
            Showing: {activeFilters.join(', ')} collections
          </span>
          <button type="button" onClick={handleClearFilters} className="clear-filter-btn">
            Clear filter
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading || error ? null : !hasData ? (
        // No data state
        <div className="empty-state-container">
          <div className="empty-icon-large">
            <AlertIcon />
          </div>
          <h3>No Collection History</h3>
          <p>Collection records appear here when bins are drained in Bin Monitoring.</p>
        </div>
      ) : !hasFilteredResults ? (
        // No results state (filters active but no match)
        <div className="empty-state-container">
          <div className="empty-icon-large">
            <SearchIcon />
          </div>
          <h3>No matching collections</h3>
          <p>
            There are no collections for {activeFilters.join(', ')}.
          </p>
          <button type="button" className="reset-btn" onClick={handleClearFilters}>
            View all collections
          </button>
        </div>
      ) : (
        // Collection list
        <>
          <div className="history-list">
            {currentItems.map(item => (
              <div key={item.id} className="history-list-card">
                <div className="card-left">
                  {getTypeIcon(item.type)}
                </div>
                <div className="card-middle">
                  <h3>
                    {item.type} <span className="light-text">Collection</span>
                  </h3>
                  <div className="card-meta-row">
                    <div className="meta-item">
                      <CalendarIcon /> <span>{item.date || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <ClockIcon /> <span>{item.time || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="card-right">
                  <span className="status-completed">
                    <CheckCircleIcon /> {item.status || 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn nav-btn" 
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
              >
                Prev
              </button>
              
              {pageNumbers.map(num => (
                <button 
                  key={num}
                  className={`page-btn ${safePage === num ? 'active' : ''}`} 
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </button>
              ))}
              
              <button 
                className="page-btn nav-btn" 
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Recorded items – Bin 2 (waste_items history from collector) */}
      <div className="recorded-items-section">
        <h2 className="recorded-items-title">Recorded items – Bin 2</h2>
        {loadingRecordedItems ? (
          <p className="recorded-items-loading">Loading recorded items…</p>
        ) : recordedItems.length === 0 ? (
          <p className="recorded-items-empty">No recorded items for Bin 2 yet.</p>
        ) : (
          <ul className="recorded-items-list">
            {recordedItems.map((item) => {
              const d = item.created_at ? new Date(item.created_at) : null;
              const dateStr = d ? d.toLocaleDateString() : '—';
              const timeStr = d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
              const type = item.category ? normalizeType(item.category) : 'Unsorted';
              return (
                <li key={item.id} className="recorded-items-list-item">
                  <span className="recorded-item-icon">{getTypeIcon(type)}</span>
                  <span className="recorded-item-category">{type}</span>
                  <span className="recorded-item-date">{dateStr}</span>
                  <span className="recorded-item-time">{timeStr}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CollectionHistory;