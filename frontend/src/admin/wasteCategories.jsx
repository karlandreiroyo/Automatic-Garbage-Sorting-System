/**
 * Waste Categories Component
 * Displays waste sorting statistics by category with time-based filtering
 * Shows: Biodegradable, Non-Biodegradable, Recycle, and Unsorted categories
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/wasteCategories.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://automatic-garbage-sorting-system-production.up.railway.app';

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

  // Fetch waste data when time filter or selected date changes
  useEffect(() => {
    fetchWasteData();
  }, [timeFilter, selectedDate]);

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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setWasteData(EMPTY_CATEGORIES);
        setTotalItems(0);
        return;
      }
      const params = new URLSearchParams({ timeFilter, selectedDate });
      const res = await fetch(`${API_BASE}/api/admin/waste-categories?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Waste categories API error:', json.message || res.statusText);
        setWasteData(EMPTY_CATEGORIES);
        setTotalItems(0);
        return;
      }
      if (json.success && Array.isArray(json.wasteData) && json.wasteData.length > 0) {
        setWasteData(json.wasteData);
        setTotalItems(json.totalItems ?? 0);
      } else {
        setWasteData(EMPTY_CATEGORIES);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
      setWasteData(EMPTY_CATEGORIES);
      setTotalItems(0);
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
    </div>
  );
};

export default WasteCategories;