/**
 * Super Admin Data Analytics
 * Same UI and behavior as Admin Data Analytics; standalone code for Super Admin only.
 * Uses backend GET /api/admin/data-analytics (Supabase waste_items).
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './superadmincss/dataAnalytics.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Time filter icons
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CalendarDatesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
  </svg>
);

// Icons matching bin monitoring - accept color prop to match category numbers
const TrashIcon = ({ color = '#ef4444' }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const LeafIcon = ({ color = '#10b981' }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const RecycleIcon = ({ color = '#f97316' }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const GearIcon = ({ color = '#6b7280' }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const DataAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryAccuracy, setCategoryAccuracy] = useState({
  'Unsorted': 0,
  'Biodegradable': 0,
  'Non-Biodegradable': 0,
  'Recycle': 0
});

const [wasteDistribution, setWasteDistribution] = useState([
  { name: 'Biodegradable', percentage: 0, count: 0, color: '#10b981' },
  { name: 'Non-Biodegradable', percentage: 0, count: 0, color: '#ef4444' },
  { name: 'Recycle', percentage: 0, count: 0, color: '#f97316' },
  { name: 'Unsorted', percentage: 0, count: 0, color: '#6b7280' }
]);
  const [dailyTrend, setDailyTrend] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter, selectedDate]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setWasteDistribution([
          { name: 'Biodegradable', count: 0, percentage: 0, color: '#10b981' },
          { name: 'Non-Biodegradable', count: 0, percentage: 0, color: '#ef4444' },
          { name: 'Recycle', count: 0, percentage: 0, color: '#f97316' },
          { name: 'Unsorted', count: 0, percentage: 0, color: '#6b7280' }
        ]);
        setCategoryAccuracy({ Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 });
        setDailyTrend([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ timeFilter, selectedDate });
      const res = await fetch(`${API_BASE}/api/admin/data-analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Data analytics API error:', json.message || res.statusText);
        setWasteDistribution([
          { name: 'Biodegradable', count: 0, percentage: 0, color: '#10b981' },
          { name: 'Non-Biodegradable', count: 0, percentage: 0, color: '#ef4444' },
          { name: 'Recycle', count: 0, percentage: 0, color: '#f97316' },
          { name: 'Unsorted', count: 0, percentage: 0, color: '#6b7280' }
        ]);
        setCategoryAccuracy({ Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 });
        setDailyTrend([]);
        setLoading(false);
        return;
      }
      const data = json.success && Array.isArray(json.data) ? json.data : [];

      if (data && data.length > 0) {
        const categoryCounts = {
          'Biodegradable': 0,
          'Non-Biodegradable': 0,
          'Recycle': 0,
          'Unsorted': 0
        };

        const normalizeCategory = (cat) => {
          if (!cat) return 'Unsorted';
          const c = String(cat).trim().toLowerCase();
          if (c === 'recyclable' || c === 'recycle') return 'Recycle';
          if (c === 'non biodegradable' || c === 'non-biodegradable' || c === 'non bio' || c === 'non-bio') return 'Non-Biodegradable';
          if (c === 'biodegradable' || c === 'unsorted') return c === 'biodegradable' ? 'Biodegradable' : 'Unsorted';
          return 'Unsorted';
        };

        data.forEach(item => {
          const key = normalizeCategory(item.category);
          if (categoryCounts.hasOwnProperty(key)) categoryCounts[key]++;
          else categoryCounts['Unsorted']++;
        });

        const total = data.length;
        const distribution = [
          { name: 'Biodegradable', count: categoryCounts['Biodegradable'], color: '#10b981' },
          { name: 'Non-Biodegradable', count: categoryCounts['Non-Biodegradable'], color: '#ef4444' },
          { name: 'Recycle', count: categoryCounts['Recycle'], color: '#f97316' },
          { name: 'Unsorted', count: categoryCounts['Unsorted'], color: '#6b7280' }
        ].map(item => ({
          ...item,
          percentage: total > 0 ? parseFloat(((item.count / total) * 100).toFixed(1)) : 0
        }));

        setWasteDistribution(distribution);

        const accuracy = {
          'Biodegradable': total > 0 ? ((categoryCounts['Biodegradable'] / total) * 100).toFixed(1) : 0,
          'Non-Biodegradable': total > 0 ? ((categoryCounts['Non-Biodegradable'] / total) * 100).toFixed(1) : 0,
          'Recycle': total > 0 ? ((categoryCounts['Recycle'] / total) * 100).toFixed(1) : 0,
          'Unsorted': total > 0 ? ((categoryCounts['Unsorted'] / total) * 100).toFixed(1) : 0
        };

        setCategoryAccuracy(accuracy);
        await calculateDailyTrend(timeFilter, data);
      } else {
        setWasteDistribution([
          { name: 'Biodegradable', count: 0, percentage: 0, color: '#10b981' },
          { name: 'Non-Biodegradable', count: 0, percentage: 0, color: '#ef4444' },
          { name: 'Recycle', count: 0, percentage: 0, color: '#f97316' },
          { name: 'Unsorted', count: 0, percentage: 0, color: '#6b7280' }
        ]);
        setCategoryAccuracy({ Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 });
        setDailyTrend([]);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setWasteDistribution([
        { name: 'Biodegradable', count: 0, percentage: 0, color: '#10b981' },
        { name: 'Non-Biodegradable', count: 0, percentage: 0, color: '#ef4444' },
        { name: 'Recycle', count: 0, percentage: 0, color: '#f97316' },
        { name: 'Unsorted', count: 0, percentage: 0, color: '#6b7280' }
      ]);
      setCategoryAccuracy({ Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 });
      setDailyTrend([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyTrend = async (filter, wasteData) => {
    try {
      let trendData = [];
      if (filter === 'daily') {
        const hourCounts = new Array(24).fill(0);
        wasteData.forEach(item => {
          const hour = new Date(item.created_at).getHours();
          hourCounts[hour]++;
        });
        const currentHour = new Date().getHours();
        const labels = [];
        const values = [];
        for (let i = 6; i >= 0; i--) {
          const hour = (currentHour - i + 24) % 24;
          labels.push(`${hour}:00`);
          values.push(hourCounts[hour]);
        }
        trendData = labels.map((label, idx) => ({ day: label, value: values[idx] }));
      } else if (filter === 'weekly') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = new Array(7).fill(0);
        wasteData.forEach(item => {
          const dayOfWeek = new Date(item.created_at).getDay();
          dayCounts[dayOfWeek]++;
        });
        trendData = dayNames.map((day, idx) => ({ day, value: dayCounts[idx] }));
      } else if (filter === 'monthly') {
        const weekCounts = {};
        wasteData.forEach(item => {
          const date = new Date(item.created_at);
          const weekNum = Math.ceil(date.getDate() / 7);
          const weekKey = `Week ${weekNum}`;
          weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
        });
        trendData = Object.keys(weekCounts).map(week => ({ day: week, value: weekCounts[week] }));
        for (let i = 1; i <= 4; i++) {
          const weekKey = `Week ${i}`;
          if (!trendData.find(d => d.day === weekKey)) {
            trendData.push({ day: weekKey, value: 0 });
          }
        }
        trendData.sort((a, b) => {
          const weekA = parseInt(a.day.split(' ')[1]);
          const weekB = parseInt(b.day.split(' ')[1]);
          return weekA - weekB;
        });
      }
      setDailyTrend(trendData);
    } catch (error) {
      console.error('Error calculating daily trend:', error);
    }
  };

  // Calculate pie chart segments
  const calculateDonutSegments = () => {
    let currentAngle = -90; // Start from top
    const radius = 90; // Increased radius for larger pie chart
    const segments = wasteDistribution.map(item => {
      const percentage = parseFloat(item.percentage);
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startX = 100 + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = 100 + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = 100 + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = 100 + radius * Math.sin((endAngle * Math.PI) / 180);
      const largeArcFlag = angle > 180 ? 1 : 0;

      return {
        ...item,
        path: `M 100 100 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
      };
    });
    return segments;
  };

  const donutSegments = calculateDonutSegments();
  const _maxTrendValue = Math.max(...dailyTrend.map(d => d.value), 100); // Minimum of 100 for better visualization

const calculateYAxisLabels = () => {
  const maxValue = Math.max(...dailyTrend.map(d => d.value), 0);
  
  // Round up to nearest nice number
  let roundedMax;
  if (maxValue === 0) {
    roundedMax = 100; // Default minimum scale
  } else if (maxValue <= 10) {
    roundedMax = 10;
  } else if (maxValue <= 50) {
    roundedMax = 50;
  } else if (maxValue <= 100) {
    roundedMax = 100;
  } else if (maxValue <= 200) {
    roundedMax = 200;
  } else if (maxValue <= 500) {
    roundedMax = 500;
  } else if (maxValue <= 1000) {
    roundedMax = 1000;
  } else {
    roundedMax = Math.ceil(maxValue / 500) * 500;
  }
  
  // Create 5 labels (including 0)
  const step = roundedMax / 4;
  return [
    roundedMax,
    Math.round(roundedMax - step),
    Math.round(roundedMax - (step * 2)),
    Math.round(roundedMax - (step * 3)),
    0
  ];
};

  return (
    <div className="data-analytics-container">
      <div className="data-analytics-header">
        <div>
          <h1>Data Analytics</h1>
          <p>Comprehensive waste sorting statistics and insights</p>
        </div>
      </div>

      {/* Time Filters */}
      <div className="time-filters">
        <div className="time-filters-left">
          <button
            className={`time-filter-btn ${timeFilter === 'daily' ? 'active' : ''}`}
            onClick={() => setTimeFilter('daily')}
          >
            <ClockIcon />
            Daily
          </button>
          <button
            className={`time-filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('weekly')}
          >
            <CalendarIcon />
            Weekly
          </button>
          <button
            className={`time-filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFilter('monthly')}
          >
            <CalendarDatesIcon />
            Monthly
          </button>
        </div>
        <div className="date-selector-wrapper">
          <button
            className="date-nav-btn date-nav-up"
            onClick={() => {
              const date = new Date(selectedDate);
              if (timeFilter === 'daily') {
                date.setDate(date.getDate() - 1);
              } else if (timeFilter === 'weekly') {
                date.setDate(date.getDate() - 7);
              } else if (timeFilter === 'monthly') {
                date.setMonth(date.getMonth() - 1);
              }
              const maxDate = new Date().toISOString().split('T')[0];
              if (date.toISOString().split('T')[0] <= maxDate) {
                setSelectedDate(date.toISOString().split('T')[0]);
              }
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
            className="analytics-date-input"
          />
          <button
            className="date-nav-btn date-nav-down"
            onClick={() => {
              const date = new Date(selectedDate);
              if (timeFilter === 'daily') {
                date.setDate(date.getDate() + 1);
              } else if (timeFilter === 'weekly') {
                date.setDate(date.getDate() + 7);
              } else if (timeFilter === 'monthly') {
                date.setMonth(date.getMonth() + 1);
              }
              const maxDate = new Date().toISOString().split('T')[0];
              if (date.toISOString().split('T')[0] <= maxDate) {
                setSelectedDate(date.toISOString().split('T')[0]);
              }
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

      {/* Sorting Accuracy Metrics - icon circle and % match pie graph colors (same as admin) */}
      <div className="accuracy-metrics">
        <div className="accuracy-card">
          <div
            className="accuracy-icon"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              borderColor: 'rgba(16, 185, 129, 0.35)'
            }}
          >
            <LeafIcon color="#10b981" />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Biodegradable</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value accuracy-value-wrap" style={{ color: '#10b981' }}>
              {loading ? <span className="analytics-value-spinner" aria-hidden /> : `${categoryAccuracy['Biodegradable']}%`}
            </div>
          </div>
        </div>
        <div className="accuracy-card">
          <div
            className="accuracy-icon"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              borderColor: 'rgba(239, 68, 68, 0.35)'
            }}
          >
            <TrashIcon color="#ef4444" />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Non-Biodegradable</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value accuracy-value-wrap" style={{ color: '#ef4444' }}>
              {loading ? <span className="analytics-value-spinner" aria-hidden /> : `${categoryAccuracy['Non-Biodegradable']}%`}
            </div>
          </div>
        </div>
        <div className="accuracy-card">
          <div
            className="accuracy-icon"
            style={{
              background: 'rgba(249, 115, 22, 0.12)',
              borderColor: 'rgba(249, 115, 22, 0.35)'
            }}
          >
            <RecycleIcon color="#f97316" />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Recycle</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value accuracy-value-wrap" style={{ color: '#f97316' }}>
              {loading ? <span className="analytics-value-spinner" aria-hidden /> : `${categoryAccuracy['Recycle']}%`}
            </div>
          </div>
        </div>
        <div className="accuracy-card">
          <div
            className="accuracy-icon"
            style={{
              background: 'rgba(107, 114, 128, 0.12)',
              borderColor: 'rgba(107, 114, 128, 0.35)'
            }}
          >
            <GearIcon color="#6b7280" />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Unsorted</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value accuracy-value-wrap" style={{ color: '#6b7280' }}>
              {loading ? <span className="analytics-value-spinner" aria-hidden /> : `${categoryAccuracy['Unsorted']}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Waste Distribution Donut Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Waste Distribution</h3>
          <div className="donut-chart-container">
            {loading ? (
              <div className="analytics-loading-spinner" aria-label="Loading">
                <div className="analytics-spinner" />
              </div>
            ) : (
            <svg className="donut-chart" viewBox="0 0 200 200">
              {donutSegments.map((segment, index) => (
                <path
                  key={index}
                  className="donut-segment"
                  d={segment.path}
                  fill={segment.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
            </svg>
            )}
          </div>
          {!loading && (
          <div className="chart-legend">
            {wasteDistribution.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">{item.percentage}%</span>
              </div>
            ))}
          </div>
          )}
        </div>

{/* Daily Sorting Trend Bar Chart - horizontal scroll when many bars */}
<div className="chart-card">
  <h3 className="chart-title">Daily Sorting Trend</h3>
  {loading ? (
    <div className="analytics-loading-spinner analytics-loading-trend" aria-label="Loading">
      <div className="analytics-spinner" />
    </div>
  ) : (
  <div className="bar-chart-scroll-wrapper">
    <div className="bar-chart-container">
      <div className="bar-chart-y-axis">
        {calculateYAxisLabels().map((label, index) => (
          <span key={index} className="y-axis-label">{label}</span>
        ))}
      </div>
      <div className="bar-chart-bars">
        {dailyTrend.map((item, index) => (
          <div key={index} className="bar-chart-item">
            {item.value > 0 && (
              <div
                className="bar"
                style={{ height: `${(item.value / calculateYAxisLabels()[0]) * 100}%` }}
              >
                <span className="bar-value">{item.value}</span>
              </div>
            )}
            <span className="bar-label">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
  )}
</div>
      </div>
    </div>
  );
};

export default DataAnalytics;
