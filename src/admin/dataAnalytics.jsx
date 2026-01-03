import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/dataAnalytics.css';

const DataAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [accuracyData, setAccuracyData] = useState([
    { name: 'General Waste', value: 98.2, icon: '🎯' },
    { name: 'Biodegradable', value: 89.4, icon: '➕' },
    { name: 'Non-Biodegradable', value: 90.6, icon: '📦' },
    { name: 'Recycle', value: 92.3, icon: '♻️' }
  ]);
  const [distributionData, setDistributionData] = useState([
    { name: 'Biodegradable', value: 50, color: '#047857' },
    { name: 'Non-Biodegradable', value: 20, color: '#ef4444' },
    { name: 'Recycle', value: 20, color: '#f97316' },
    { name: 'Unsorted', value: 10, color: '#6ee7b7' }
  ]);
  const [dailyTrendData, setDailyTrendData] = useState([
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

      // Calculate distribution
      const categoryCounts = {
        Biodegradable: 0,
        'Non-Biodegradable': 0,
        Recycle: 0,
        Unsorted: 0
      };

      if (data) {
        data.forEach(item => {
          const category = item.category || 'Unsorted';
          if (categoryCounts.hasOwnProperty(category)) {
            categoryCounts[category]++;
          } else {
            categoryCounts.Unsorted++;
          }
        });
      }

      const total = data ? data.length : 0;
      
      if (total > 0) {
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

  // Calculate donut chart
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

  const segments = calculateDonutChart();
  const maxBarValue = Math.max(...dailyTrendData.map(d => d.value), 1200);

  return (
    <div className="data-analytics-container">
      <div className="data-analytics-header">
        <div>
          <h1>Data Analytics</h1>
          <p>Comprehensive waste sorting statistics and insights</p>
        </div>
      </div>

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

      <div className="charts-section">
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

