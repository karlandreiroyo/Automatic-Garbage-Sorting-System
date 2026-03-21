/**
 * Waste Categories Component
 * Displays waste sorting statistics by category with time-based filtering
 * Shows: Biodegradable, Non-Biodegradable, Recycle, and Unsorted categories
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/wasteCategories.css';

// Time Filter Icons
const DailyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const WeeklyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const MonthlyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>;

// Category Icons (matching bin monitoring)
const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const RecycleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const WasteCategories = () => {
  // State for waste category data (counts, colors, icons)
  const [wasteData, setWasteData] = useState([]);
  // State for total number of items sorted
  const [totalItems, setTotalItems] = useState(0);
  // State for time filter selection (daily, weekly, monthly)
  const [timeFilter, setTimeFilter] = useState('daily');
  // State for selected date (calendar - same as superadmin waste categories)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [detailedRecords, setDetailedRecords] = useState([]);
  const [collectorOptions, setCollectorOptions] = useState([]);
  const [collectorFilter, setCollectorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const normalizeCategoryLabel = (cat) => {
    if (!cat) return 'Unsorted';
    const c = String(cat).trim().toLowerCase();
    if (c === 'recyclable' || c === 'recycle') return 'Recycle';
    if (c === 'non biodegradable' || c === 'non-biodegradable' || c === 'non bio' || c === 'non-bio') return 'Non-Biodegradable';
    if (c === 'biodegradable') return 'Biodegradable';
    return 'Unsorted';
  };

  const getRangeByFilter = (filter, dateStr) => {
    const [y, m, d] = String(dateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const base = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    if (filter === 'daily') {
      return {
        start: new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(y, (m || 1) - 1, d || 1, 23, 59, 59, 999)),
      };
    }
    if (filter === 'weekly') {
      const dow = base.getUTCDay();
      const start = new Date(base);
      start.setUTCDate(base.getUTCDate() - dow);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    }
    const start = new Date(Date.UTC(y, (m || 1) - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, (m || 1), 0, 23, 59, 59, 999));
    return { start, end };
  };

  // Fetch waste data when time filter or selected date changes
  useEffect(() => {
    fetchWasteData();
    fetchDetailedWasteRecords();
  }, [timeFilter, selectedDate]);

  useEffect(() => {
    fetchDetailedWasteRecords();
  }, [collectorFilter, categoryFilter]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchWasteData();
      fetchDetailedWasteRecords();
    }, 10000);
    return () => clearInterval(id);
  }, [timeFilter, selectedDate, collectorFilter, categoryFilter]);

  /**
   * Fetches waste items from backend (Supabase waste_items). Backend connects to DB so
   * when the system detects waste and records it, counts show here automatically.
   */
  const EMPTY_CATEGORIES = [
    { name: 'Biodegradable', count: 0, color: '#10b981', icon: 'leaf' },
    { name: 'Non-Biodegradable', count: 0, color: '#ef4444', icon: 'trash' },
    { name: 'Recycle', count: 0, color: '#f97316', icon: 'recycle' },
    { name: 'Unsorted', count: 0, color: '#6b7280', icon: 'gear' }
  ];

  const fetchWasteData = async () => {
    try {
      const { start, end } = getRangeByFilter(timeFilter, selectedDate);
      let binIds = null;
      if (collectorFilter !== 'all') {
        const { data: collectorBins, error: collectorBinsError } = await supabase
          .from('bins')
          .select('id')
          .eq('assigned_collector_id', Number(collectorFilter));
        if (collectorBinsError) throw collectorBinsError;
        binIds = (collectorBins || []).map((b) => b.id);
        if (binIds.length === 0) {
          setWasteData(EMPTY_CATEGORIES);
          setTotalItems(0);
          return;
        }
      }

      let query = supabase
        .from('waste_items')
        .select('category, created_at, bin_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (Array.isArray(binIds)) query = query.in('bin_id', binIds);
      const { data, error } = await query;
      if (error) throw error;

      const counts = { Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 };
      (data || []).forEach((row) => {
        const key = normalizeCategoryLabel(row.category);
        if (counts[key] != null) counts[key] += 1;
      });
      let nextWaste = [
        { name: 'Biodegradable', count: counts.Biodegradable, color: '#10b981', icon: 'leaf' },
        { name: 'Non-Biodegradable', count: counts['Non-Biodegradable'], color: '#ef4444', icon: 'trash' },
        { name: 'Recycle', count: counts.Recycle, color: '#f97316', icon: 'recycle' },
        { name: 'Unsorted', count: counts.Unsorted, color: '#6b7280', icon: 'gear' }
      ];
      let nextTotal = (data || []).length;
      if (nextTotal === 0) {
        let notifQ = supabase
          .from('notification_bin')
          .select('bin_category, status, created_at, collector_id')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        const { data: notifRows } = await notifQ;
        const nc = { Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 };
        (notifRows || []).forEach((n) => {
          if (String(n.status || '').trim().toLowerCase() === 'drained') return;
          const key = normalizeCategoryLabel(n.bin_category || '');
          if (nc[key] != null) nc[key] += 1;
        });
        nextWaste = [
          { name: 'Biodegradable', count: nc.Biodegradable, color: '#10b981', icon: 'leaf' },
          { name: 'Non-Biodegradable', count: nc['Non-Biodegradable'], color: '#ef4444', icon: 'trash' },
          { name: 'Recycle', count: nc.Recycle, color: '#f97316', icon: 'recycle' },
          { name: 'Unsorted', count: nc.Unsorted, color: '#6b7280', icon: 'gear' }
        ];
        nextTotal = nc.Biodegradable + nc['Non-Biodegradable'] + nc.Recycle + nc.Unsorted;
      }
      setWasteData(nextWaste);
      setTotalItems(nextTotal);
      if (!data) {
        setWasteData(EMPTY_CATEGORIES);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
      setWasteData(EMPTY_CATEGORIES);
      setTotalItems(0);
    }
  };

  const fetchDetailedWasteRecords = async () => {
    try {
      const { start, end } = getRangeByFilter(timeFilter, selectedDate);
      const [wasteRes, collectorsRes] = await Promise.all([
        supabase
          .from('waste_items')
          .select(`
            id,
            category,
            confidence,
            created_at,
            bin_id,
            first_name,
            middle_name,
            last_name,
            bins:bins!waste_items_bin_id_fkey(
              id,
              location,
              assigned_collector_id,
              users:users!bins_assigned_collector_id_fkey(
                id,
                first_name,
                middle_name,
                last_name
              )
            )
          `)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, first_name, middle_name, last_name')
          .eq('role', 'COLLECTOR')
          .order('first_name', { ascending: true }),
      ]);

      const wasteRows = wasteRes.data || [];
      let collectors = collectorsRes.data || [];
      if (!collectors.length) {
        const seen = new Set();
        collectors = (wasteRows || []).map((r) => {
          const full = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ').trim();
          if (!full) return null;
          const key = `${(r.first_name || '').toUpperCase()}|${(r.middle_name || '').toUpperCase()}|${(r.last_name || '').toUpperCase()}`;
          if (seen.has(key)) return null;
          seen.add(key);
          return { id: key, first_name: r.first_name || '', middle_name: r.middle_name || '', last_name: r.last_name || '' };
        }).filter(Boolean);
      }
      setCollectorOptions(collectors);

      const rows = wasteRows.map((row) => {
        const user = row?.bins?.users;
        const collectorName = [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(' ').trim()
          || [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim()
          || 'Unknown';
        const fallbackCollectorKey = `${(row.first_name || '').toUpperCase()}|${(row.middle_name || '').toUpperCase()}|${(row.last_name || '').toUpperCase()}`;
        return {
          id: row.id,
          category: normalizeCategoryLabel(row.category),
          itemCategory: row.category || 'Unsorted',
          collectorId: user?.id || row?.bins?.assigned_collector_id || fallbackCollectorKey,
          collectorName,
          binLocation: row?.bins?.location || 'Unknown',
          createdAt: row.created_at,
          confidence: row.confidence,
        };
      });

      let filtered = rows.filter((row) => {
        const byCollector = collectorFilter === 'all' || String(row.collectorId) === String(collectorFilter);
        const byCategory = categoryFilter === 'all' || row.category === categoryFilter;
        return byCollector && byCategory;
      });
      if (filtered.length === 0) {
        const { data: notifRows } = await supabase
          .from('notification_bin')
          .select('id, bin_category, status, created_at, collector_id, first_name, middle_name, last_name, bin_id')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false });
        const fallbackRows = (notifRows || [])
          .filter((n) => String(n.status || '').trim().toLowerCase() !== 'drained')
          .map((n) => {
            const fallbackCollectorKey = `${(n.first_name || '').toUpperCase()}|${(n.middle_name || '').toUpperCase()}|${(n.last_name || '').toUpperCase()}`;
            const collectorName = [n.first_name, n.middle_name, n.last_name].filter(Boolean).join(' ').trim() || 'Unknown';
            return {
              id: `notif-${n.id}`,
              category: normalizeCategoryLabel(n.bin_category),
              itemCategory: normalizeCategoryLabel(n.bin_category),
              collectorId: n.collector_id || fallbackCollectorKey,
              collectorName,
              binLocation: `Bin ${n.bin_id || '-'}`,
              createdAt: n.created_at,
              confidence: null,
            };
          });
        filtered = fallbackRows.filter((row) => {
          const byCollector = collectorFilter === 'all' || String(row.collectorId) === String(collectorFilter);
          const byCategory = categoryFilter === 'all' || row.category === categoryFilter;
          return byCollector && byCategory;
        });
      }
      setDetailedRecords(filtered);
    } catch (error) {
      console.error('Error fetching detailed waste records:', error);
      setDetailedRecords([]);
    }
  };

  /**
   * Display value by period: daily ÷ 1, weekly ÷ 7, monthly ÷ 30.
   * Progress bar and shown count use this value.
   */
  const getDisplayValue = (rawCount) => {
    if (timeFilter === 'daily') return rawCount;
    if (timeFilter === 'weekly') return rawCount / 7;
    return rawCount / 30; // monthly
  };

  /** Total items text: same divisor as per-category */
  const displayTotalItems = timeFilter === 'daily' ? totalItems : timeFilter === 'weekly' ? totalItems / 7 : totalItems / 30;

  /** Level indicator: displayed number = % of bar (4 items → 4%), max 100%. */
  const getCategoryPercentage = (count) => Math.min(100, count);

  /**
   * Gets the appropriate icon component based on category
   */
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'leaf':
        return <LeafIcon />;
      case 'trash':
        return <TrashIcon />;
      case 'recycle':
        return <RecycleIcon />;
      case 'gear':
        return <GearIcon />;
      default:
        return <GearIcon />;
    }
  };

  return (
    <div className="waste-categories-container">
      {/* Header Section */}
      <div className="waste-categories-header">
        <div>
          <h1>Waste Categories</h1>
          <p className="total-items-text">{Number(displayTotalItems.toFixed(1))} items sorted</p>
        </div>
      </div>

      {/* Time Filter Buttons + Calendar (same as superadmin waste categories) */}
      <div className="time-filters">
        <div className="time-filters-left">
          <button
            className={`time-filter-btn ${timeFilter === 'daily' ? 'active' : ''}`}
            onClick={() => setTimeFilter('daily')}
          >
            <DailyIcon /> Daily
          </button>
          <button
            className={`time-filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('weekly')}
          >
            <WeeklyIcon /> Weekly
          </button>
          <button
            className={`time-filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('monthly')}
          >
            <MonthlyIcon /> Monthly
          </button>
        </div>
        <div className="date-selector-wrapper">
          <button
            className="date-nav-btn date-nav-up"
            onClick={() => {
              const date = new Date(selectedDate);
              if (timeFilter === 'daily') date.setDate(date.getDate() - 1);
              else if (timeFilter === 'weekly') date.setDate(date.getDate() - 7);
              else if (timeFilter === 'monthly') date.setMonth(date.getMonth() - 1);
              const maxDate = new Date().toISOString().split('T')[0];
              if (date.toISOString().split('T')[0] <= maxDate) setSelectedDate(date.toISOString().split('T')[0]);
            }}
            title={timeFilter === 'daily' ? 'Previous Day' : timeFilter === 'weekly' ? 'Previous Week' : 'Previous Month'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="waste-categories-date-input"
          />
          <button
            className="date-nav-btn date-nav-down"
            onClick={() => {
              const date = new Date(selectedDate);
              if (timeFilter === 'daily') date.setDate(date.getDate() + 1);
              else if (timeFilter === 'weekly') date.setDate(date.getDate() + 7);
              else if (timeFilter === 'monthly') date.setMonth(date.getMonth() + 1);
              const maxDate = new Date().toISOString().split('T')[0];
              if (date.toISOString().split('T')[0] <= maxDate) setSelectedDate(date.toISOString().split('T')[0]);
            }}
            disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            title={timeFilter === 'daily' ? 'Next Day' : timeFilter === 'weekly' ? 'Next Week' : 'Next Month'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Category Cards Grid - Now optimized for 2 columns */}
      <div className="categories-grid">
        {wasteData.map((category, index) => {
          const displayValue = getDisplayValue(category.count);
          const percentage = getCategoryPercentage(displayValue);
          const progressColor = category.color === '#6b7280' ? '#4b5563' : category.color;

          return (
            <div key={index} className="category-card">
              <div className="category-icon-section" style={{ backgroundColor: category.color }}>
                <div className="category-icon">{getCategoryIcon(category.icon)}</div>
              </div>
              <div className="category-content">
                <h3 className="category-name">{category.name}</h3>
                <div className="category-count">
                  <span className="count-number">{Number(displayValue.toFixed(1))}</span>
                  <span className="count-label">items sorted</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: progressColor
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="time-filters" style={{ marginBottom: 12 }}>
          <div className="time-filters-left">
            <select className="time-filter-btn" value={collectorFilter} onChange={(e) => setCollectorFilter(e.target.value)}>
              <option value="all">All Collectors</option>
              {collectorOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {[c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ') || `Collector ${c.id}`}
                </option>
              ))}
            </select>
            <select className="time-filter-btn" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="Biodegradable">Biodegradable</option>
              <option value="Non-Biodegradable">Non-Biodegradable</option>
              <option value="Recycle">Recycle</option>
              <option value="Unsorted">Unsorted</option>
            </select>
          </div>
        </div>
        <div className="category-card" style={{ padding: '1rem' }}>
          <h3 className="category-name" style={{ marginBottom: 10 }}>Waste Management Records</h3>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {detailedRecords.length === 0 ? (
              <div className="count-label">No records for selected filters.</div>
            ) : (
              detailedRecords.map((record) => (
                <div key={record.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 0.7fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                  <span>{record.itemCategory}</span>
                  <span>{record.collectorName}</span>
                  <span>{record.binLocation}</span>
                  <span>{record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}</span>
                  <span>{record.confidence == null ? '—' : Number(record.confidence).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteCategories;