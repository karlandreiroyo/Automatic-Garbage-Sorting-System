/**
 * Data Analytics Component
 * Displays comprehensive waste sorting statistics and visualizations
 * Features: Accuracy metrics, donut chart for distribution, bar chart for daily trends
 * Includes time-based filtering (Daily, Weekly, Monthly, Yearly)
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/dataAnalytics.css';

const DataAnalytics = () => {
  // State for time filter selection
  const [timeFilter, setTimeFilter] = useState('daily');
  // State for sorting accuracy data by category
  const [accuracyData, setAccuracyData] = useState([
    { name: 'General Waste', value: 98.2, icon: '🎯' },
    { name: 'Biodegradable', value: 89.4, icon: '➕' },
    { name: 'Non-Biodegradable', value: 90.6, icon: '📦' },
    { name: 'Recycle', value: 92.3, icon: '♻️' }
  ]);
  // State for waste distribution percentages (for donut chart)
  const [distributionData, setDistributionData] = useState([
    { name: 'Biodegradable', value: 50, color: '#047857' },
    { name: 'Non-Biodegradable', value: 20, color: '#ef4444' },
    { name: 'Recycle', value: 20, color: '#f97316' },
    { name: 'Unsorted', value: 10, color: '#6ee7b7' }
  ]);
  // State for daily sorting trend data (for bar chart)
  const [dailyTrendData, setDailyTrendData] = useState([
    { day: 'Mon', value: 550 },
    { day: 'Tue', value: 280 },
    { day: 'Wed', value: 980 },
    { day: 'Thu', value: 850 },
    { day: 'Fri', value: 450 },
    { day: 'Sat', value: 1150 },
    { day: 'Sun', value: 0 }
  ]);

  // Fetch analytics data when time filter changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter]);

  /**
   * Fetches waste items from database and calculates distribution percentages
   * Applies time filter and updates distribution data for charts
   */
  const fetchAnalyticsData = async () => {
    try {
      let query = supabase
        .from('waste_items')
        .select('*');

      // Apply time filter based on selected period
      if (timeFilter === 'daily') {
        // Filter for today's data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (timeFilter === 'weekly') {
        // Filter for last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (timeFilter === 'monthly') {
        // Filter for last 30 days
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      } else if (timeFilter === 'yearly') {
        // Filter for last 365 days
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        query = query.gte('created_at', yearAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distribution percentages for donut chart
      const categoryCounts = {
        Biodegradable: 0,
        'Non-Biodegradable': 0,
        Recycle: 0,
        Unsorted: 0
      };

      // Count items by category
      if (data) {
        data.forEach(item => {
          const category = item.category || 'Unsorted';
          if (categoryCounts.hasOwnProperty(category)) {
            categoryCounts[category]++;
          } else {
            // Unknown categories go to Unsorted
            categoryCounts.Unsorted++;
          }
        });
      }

      // Calculate percentages for each category
      const total = data ? data.length : 0;
      
      if (total > 0) {
        // Format distribution data with percentages and colors
        const distribution = [
          {
            name: 'Biodegradable',
            value: Math.round((categoryCounts.Biodegradable / total) * 100),
            color: '#047857'
          },
          {
            name: 'Non-Biodegradable',
            value: Math.round((categoryCounts['Non-Biodegradable'] / total) * 100),
            color: '#ef4444'
          },
          {
            name: 'Recycle',
            value: Math.round((categoryCounts.Recycle / total) * 100),
            color: '#f97316'
          },
          {
            name: 'Unsorted',
            value: Math.round((categoryCounts.Unsorted / total) * 100),
            color: '#6ee7b7'
          }
        ];
        setDistributionData(distribution);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  /**
   * Calculates donut chart segments with proper offsets
   * Returns array of segments with strokeDasharray and strokeDashoffset
   * @returns {Array} Array of segment objects for donut chart rendering
   */
  const calculateDonutChart = () => {
    const total = distributionData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 45; // radius = 45
    let currentOffset = 0;
    
    const segments = distributionData.map(item => {
      const percentage = item.value / total;
      const strokeDasharray = circumference * percentage;
      const segment = {
        ...item,
        strokeDasharray,
        strokeDashoffset: circumference - currentOffset
      };
      currentOffset += strokeDasharray;
      return segment;
    });

    return segments;
  };

  // Calculate donut chart segments for rendering
  const segments = calculateDonutChart();
  // Get maximum value for bar chart scaling (default 1200 if no data)
  const maxBarValue = Math.max(...dailyTrendData.map(d => d.value), 1200);

  return (
    <div className="data-analytics-container">
      {/* Header Section */}
      <div className="data-analytics-header">
        <div>
          <h1>Data Analytics</h1>
          <p>Comprehensive waste sorting statistics and insights</p>
        </div>
      </div>

      {/* Time Filter Buttons */}
      <div className="time-filters">
        <button
          className={`time-filter-btn ${timeFilter === 'daily' ? 'active' : ''}`}
          onClick={() => setTimeFilter('daily')}
        >
          Daily
        </button>
        <button
          className={`time-filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
          onClick={() => setTimeFilter('weekly')}
        >
          Weekly
        </button>
        <button
          className={`time-filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
          onClick={() => setTimeFilter('monthly')}
        >
          Monthly
        </button>
        <button
          className={`time-filter-btn ${timeFilter === 'yearly' ? 'active' : ''}`}
          onClick={() => setTimeFilter('yearly')}
        >
          Yearly
        </button>
      </div>

      {/* Accuracy Metrics Cards */}
      <div className="accuracy-metrics">
        {accuracyData.map((metric, index) => (
          <div key={index} className="accuracy-card">
            <div className="accuracy-icon">{metric.icon}</div>
            <div className="accuracy-content">
              <h3 className="accuracy-title">{metric.name}</h3>
              <p className="accuracy-label">Sorting Accuracy</p>
              <p className="accuracy-value">{metric.value}%</p>
              <p className="accuracy-subtitle">Average accuracy rate</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Donut Chart for Waste Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Waste Distribution</h3>
          <div className="donut-chart-container">
            <svg className="donut-chart" viewBox="0 0 120 120">
              <circle
                className="donut-ring"
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="20"
              />
              {segments.map((segment, index) => {
                const total = distributionData.reduce((sum, item) => sum + item.value, 0);
                if (total === 0) return null;
                
                const circumference = 2 * Math.PI * 45;
                const percentage = segment.value / total;
                const strokeDasharray = circumference * percentage;
                
                // Calculate cumulative offset for previous segments
                let previousLength = 0;
                for (let i = 0; i < index; i++) {
                  const prevPercentage = distributionData[i].value / total;
                  previousLength += circumference * prevPercentage;
                }
                
                const strokeDashoffset = circumference - previousLength;
                
                return (
                  <circle
                    key={index}
                    className="donut-segment"
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="20"
                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 60 60)"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="donut-center">
              <span className="donut-total">
                {distributionData.reduce((sum, item) => sum + item.value, 0)}%
              </span>
            </div>
          </div>
          <div className="chart-legend">
            {distributionData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart for Daily Sorting Trend */}
        <div className="chart-card">
          <h3 className="chart-title">Daily Sorting Trend</h3>
          <div className="bar-chart-container">
            <div className="bar-chart-y-axis">
              {[0, 300, 600, 900, 1200].map((value) => (
                <div key={value} className="y-axis-label">{value}</div>
              ))}
            </div>
            <div className="bar-chart-bars">
              {dailyTrendData.map((data, index) => (
                <div key={index} className="bar-chart-item">
                  <div
                    className="bar"
                    style={{
                      height: `${(data.value / maxBarValue) * 100}%`,
                      backgroundColor: '#047857'
                    }}
                  >
                    <span className="bar-value">{data.value}</span>
                  </div>
                  <div className="bar-label">{data.day}</div>
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

