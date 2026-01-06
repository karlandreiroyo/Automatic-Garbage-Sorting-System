import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/dataAnalytics.css';

<<<<<<< HEAD
=======
// Time Filter Icons
const DailyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const WeeklyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const MonthlyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>;
const YearlyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="18" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 4v6M17 4v6"/></svg>;

>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
const DataAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('daily');

  const [accuracyData, setAccuracyData] = useState([
    { name: 'General Waste', value: 98.2 },
    { name: 'Biodegradable', value: 89.4 },
    { name: 'Non-Biodegradable', value: 90.6 },
    { name: 'Recycle', value: 92.3 }
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
      let query = supabase.from('waste_items').select('*');

      const now = new Date();
      if (timeFilter === 'daily') {
        now.setHours(0, 0, 0, 0);
        query = query.gte('created_at', now.toISOString());
      } else if (timeFilter === 'weekly') {
        now.setDate(now.getDate() - 7);
        query = query.gte('created_at', now.toISOString());
      } else if (timeFilter === 'monthly') {
        now.setMonth(now.getMonth() - 1);
        query = query.gte('created_at', now.toISOString());
      } else if (timeFilter === 'yearly') {
        now.setFullYear(now.getFullYear() - 1);
        query = query.gte('created_at', now.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const categoryCounts = {
        Biodegradable: 0,
        'Non-Biodegradable': 0,
        Recycle: 0,
        Unsorted: 0
      };

      data?.forEach(item => {
        const category = item.category || 'Unsorted';
        categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
      });

      const total = data?.length || 0;
      if (total > 0) {
        setDistributionData([
          { name: 'Biodegradable', value: Math.round((categoryCounts.Biodegradable / total) * 100), color: '#047857' },
          { name: 'Non-Biodegradable', value: Math.round((categoryCounts['Non-Biodegradable'] / total) * 100), color: '#ef4444' },
          { name: 'Recycle', value: Math.round((categoryCounts.Recycle / total) * 100), color: '#f97316' },
          { name: 'Unsorted', value: Math.round((categoryCounts.Unsorted / total) * 100), color: '#6ee7b7' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const calculateDonutChart = () => {
    const total = distributionData.reduce((sum, item) => sum + item.value, 0);
    if (!total) return [];

    const circumference = 2 * Math.PI * 45;
    let offset = 0;

    return distributionData.map(item => {
      const length = (item.value / total) * circumference;
      const segment = {
        ...item,
        strokeDasharray: length,
        strokeDashoffset: circumference - offset
      };
      offset += length;
      return segment;
    });
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
        {['daily', 'weekly', 'monthly', 'yearly'].map(filter => (
          <button
            key={filter}
            className={`time-filter-btn ${timeFilter === filter ? 'active' : ''}`}
            onClick={() => setTimeFilter(filter)}
          >
<<<<<<< HEAD
=======
            {filter === 'daily' && <DailyIcon />}
            {filter === 'weekly' && <WeeklyIcon />}
            {filter === 'monthly' && <MonthlyIcon />}
            {filter === 'yearly' && <YearlyIcon />}
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="accuracy-metrics">
        {accuracyData.map((metric, index) => (
          <div key={index} className="accuracy-card">
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
              <circle cx="60" cy="60" r="45" fill="none" stroke="#f3f4f6" strokeWidth="20" />
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="20"
                  strokeDasharray={`${seg.strokeDasharray} 999`}
                  strokeDashoffset={seg.strokeDashoffset}
                  transform="rotate(-90 60 60)"
                />
              ))}
            </svg>
            <div className="donut-center">
              <span className="donut-total">
                {distributionData.reduce((s, i) => s + i.value, 0)}%
              </span>
            </div>
          </div>

          <div className="chart-legend">
            {distributionData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Daily Sorting Trend</h3>
          <div className="bar-chart-container">
            <div className="bar-chart-bars">
              {dailyTrendData.map((d, i) => (
                <div key={i} className="bar-chart-item">
                  <div className="bar" style={{ height: `${(d.value / maxBarValue) * 100}%` }}>
                    <span className="bar-value">{d.value}</span>
                  </div>
                  <div className="bar-label">{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

<<<<<<< HEAD
export default DataAnalytics;
=======
export default DataAnalytics;
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
