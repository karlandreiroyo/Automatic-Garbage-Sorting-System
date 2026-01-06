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

const CalendarYearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01"/>
  </svg>
);

// Target icon for accuracy cards
const TargetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const DataAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [categoryAccuracy, setCategoryAccuracy] = useState({
    'General Waste': 98.2,
    'Biodegradable': 89.4,
    'Non-Biodegradable': 90.6,
    'Recycle': 92.3
  });
  const [wasteDistribution, setWasteDistribution] = useState([
    { name: 'Biodegradable', percentage: 50, color: '#047857' },
    { name: 'Non-Biodegradable', percentage: 20, color: '#ef4444' },
    { name: 'Recycle', percentage: 10, color: '#f97316' },
    { name: 'Unsorted', percentage: 20, color: '#84cc16' }
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
      } else if (timeFilter === 'yearly') {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        query = query.gte('created_at', yearAgo.toISOString());
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
          { name: 'Biodegradable', count: categoryCounts['Biodegradable'] || 0, color: '#047857' },
          { name: 'Non-Biodegradable', count: categoryCounts['Non-Biodegradable'] || 0, color: '#ef4444' },
          { name: 'Recycle', count: categoryCounts['Recycle'] || 0, color: '#f97316' },
          { name: 'Unsorted', count: categoryCounts['Unsorted'] || 0, color: '#84cc16' }
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

  // Calculate donut chart segments
  const calculateDonutSegments = () => {
    let currentAngle = -90; // Start from top
    const segments = wasteDistribution.map(item => {
      const percentage = parseFloat(item.percentage);
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
      const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
      const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
      const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
      const largeArcFlag = angle > 180 ? 1 : 0;

      return {
        ...item,
        path: `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
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
        <button
          className={`time-filter-btn ${timeFilter === 'yearly' ? 'active' : ''}`}
          onClick={() => setTimeFilter('yearly')}
        >
          <CalendarYearIcon />
          Yearly
        </button>
      </div>

      {/* Sorting Accuracy Metrics */}
      <div className="accuracy-metrics">
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <TargetIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">General Waste</h3>
            <p className="accuracy-label">Sorting Accuracy</p>
            <div className="accuracy-value">{categoryAccuracy['General Waste']}%</div>
            <p className="accuracy-subtitle">Average accuracy rate</p>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <TargetIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Biodegradable</h3>
            <p className="accuracy-label">Sorting Accuracy</p>
            <div className="accuracy-value">{categoryAccuracy['Biodegradable']}%</div>
            <p className="accuracy-subtitle">Average accuracy rate</p>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <TargetIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Non-Biodegradable</h3>
            <p className="accuracy-label">Sorting Accuracy</p>
            <div className="accuracy-value">{categoryAccuracy['Non-Biodegradable']}%</div>
            <p className="accuracy-subtitle">Average accuracy rate</p>
          </div>
        </div>
        <div className="accuracy-card">
          <div className="accuracy-icon">
            <TargetIcon />
          </div>
          <div className="accuracy-content">
            <h3 className="accuracy-title">Recycle</h3>
            <p className="accuracy-label">Sorting Accuracy</p>
            <div className="accuracy-value">{categoryAccuracy['Recycle']}%</div>
            <p className="accuracy-subtitle">Average accuracy rate</p>
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
              <circle
                className="donut-ring"
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="40"
              />
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
            <div className="donut-center">
              <div className="donut-total">100%</div>
            </div>
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
