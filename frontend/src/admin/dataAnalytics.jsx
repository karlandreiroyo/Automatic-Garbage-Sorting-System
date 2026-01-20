/**
 * Data Analytics Component
 * Displays comprehensive analytics and charts for waste sorting data
 * Features: Time-based filtering, category-specific accuracy metrics, and trend analysis
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/dataAnalytics.css';

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

// Icons matching bin monitoring
const TrashIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const RecycleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
    <path d="m14 5 2.39 4.143"/>
    <path d="M8.293 13.53 11 19"/>
    <path d="M19.324 11.06 14 5"/>
    <path d="m3.727 6.465 1.272-2.119a1.84 1.84 0 0 1 1.565-.891H11.25"/>
    <path d="m14 5-2.707 4.53"/>
  </svg>
);

const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const DataAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [categoryAccuracy, setCategoryAccuracy] = useState({
    'Unsorted': 98.2,
    'Biodegradable': 89.4,
    'Non-Biodegradable': 90.6,
    'Recycle': 92.3
  });
  const [wasteDistribution, setWasteDistribution] = useState([
    { name: 'Biodegradable', percentage: 50, color: '#10b981' },
    { name: 'Non-Biodegradable', percentage: 20, color: '#ef4444' },
    { name: 'Recycle', percentage: 10, color: '#f97316' },
    { name: 'Unsorted', percentage: 20, color: '#6b7280' }
  ]);
  const [dailyTrend, setDailyTrend] = useState([
    { day: 'Mon', value: 550 },
    { day: 'Tue', value: 280 },
    { day: 'Wed', value: 980 },
    { day: 'Thu', value: 850 },
    { day: 'Fri', value: 450 },
    { day: 'Sat', value: 1150 },
    { day: 'Sun', value: 0 }
  ]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter]);

  const fetchAnalyticsData = async () => {
    try {
      let query = supabase
        .from('waste_items')
        .select('*');

      // Apply time filter
      if (timeFilter === 'daily') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (timeFilter === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (timeFilter === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distribution from actual data if available
      if (data && data.length > 0) {
        const categoryCounts = {};
        data.forEach(item => {
          const category = item.category || 'Unsorted';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const total = data.length;
        const distribution = [
          { name: 'Biodegradable', count: categoryCounts['Biodegradable'] || 0, color: '#10b981' },
          { name: 'Non-Biodegradable', count: categoryCounts['Non-Biodegradable'] || 0, color: '#ef4444' },
          { name: 'Recycle', count: categoryCounts['Recycle'] || 0, color: '#f97316' },
          { name: 'Unsorted', count: categoryCounts['Unsorted'] || 0, color: '#6b7280' }
        ].map(item => ({
          ...item,
          percentage: total > 0 ? ((item.count / total) * 100).toFixed(0) : 0
        }));

        setWasteDistribution(distribution);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
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
  const maxTrendValue = Math.max(...dailyTrend.map(d => d.value), 1200);

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

      {/* Sorting Accuracy Metrics */}
      <div className="accuracy-metrics">
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <LeafIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Biodegradable</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value">{categoryAccuracy['Biodegradable']}%</div>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <TrashIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Non-Biodegradable</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value">{categoryAccuracy['Non-Biodegradable']}%</div>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <RecycleIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Recycle</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value">{categoryAccuracy['Recycle']}%</div>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <GearIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Unsorted</h3>
            <p className="accuracy-label">Sorting Percentage</p>
            <div className="accuracy-value">{categoryAccuracy['Unsorted']}%</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Waste Distribution Donut Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Waste Distribution</h3>
          <div className="donut-chart-container">
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
          </div>
          <div className="chart-legend">
            {wasteDistribution.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Sorting Trend Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Daily Sorting Trend</h3>
          <div className="bar-chart-container">
            <div className="bar-chart-y-axis">
              <span className="y-axis-label">1200</span>
              <span className="y-axis-label">900</span>
              <span className="y-axis-label">600</span>
              <span className="y-axis-label">300</span>
              <span className="y-axis-label">0</span>
            </div>
            <div className="bar-chart-bars">
              {dailyTrend.map((item, index) => (
                <div key={index} className="bar-chart-item">
                  {item.value > 0 && (
                    <div
                      className="bar"
                      style={{ height: `${(item.value / maxTrendValue) * 100}%` }}
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
      </div>
    </div>
  );
};

export default DataAnalytics;
