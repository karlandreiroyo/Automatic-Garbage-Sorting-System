import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/AdminDash.css';

// Simple SVG Icons base sa images mo
const Icons = {
  Total: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M21 8l-2-2H5L3 8h18zM3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M10 12h4" />
    </svg>
  ),
  Category: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  Efficiency: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Time: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
};

const AdminDash = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    categories: 0,
    efficiency: 0,
    avgProcessingTime: 0
  });
  
  const [distribution, setDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('waste_items')
        .select('*');

      if (itemsError) throw itemsError;

      const totalItems = itemsData?.length || 0;
      const categoriesSet = new Set(itemsData?.map(item => item.category));
      const categories = categoriesSet.size;

      const dist = {};
      itemsData?.forEach(item => {
        dist[item.category] = (dist[item.category] || 0) + 1;
      });

      const distributionArray = Object.entries(dist).map(([name, count]) => ({
        name,
        count
      }));

      const { data: activityData, error: activityError } = await supabase
        .from('waste_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); // Tinaasan natin para mapuno ang listahan

      if (activityError) throw activityError;

      const formattedActivity = activityData?.map(item => ({
        category: item.category,
        count: 1,
        time: getTimeAgo(item.created_at)
      })) || [];

      setStats({
        totalItems,
        categories,
        efficiency: 98.2,
        avgProcessingTime: 2.3
      });

      setDistribution(distributionArray);
      setRecentActivity(formattedActivity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hr ago`;
  };

  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="admin-dash-container">
      <div className="dashboard-title-section">
        <h1 className="main-title">Dashboard Overview</h1>
        <p className="sub-title">Waste sorting statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.Total /></div>
          <div className="stat-info">
            <span className="stat-label">Total Items Sorted</span>
            <h2 className="stat-value">{stats.totalItems}</h2>
            <span className="stat-footer">Today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.Category /></div>
          <div className="stat-info">
            <span className="stat-label">Categories Detected</span>
            <h2 className="stat-value">{stats.categories}</h2>
            <span className="stat-footer">Active categories</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.Efficiency /></div>
          <div className="stat-info">
            <span className="stat-label">Sorting Efficiency</span>
            <h2 className="stat-value">{stats.efficiency}%</h2>
            <span className="stat-footer">Accuracy rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.Time /></div>
          <div className="stat-info">
            <span className="stat-label">Avg. Processing Time</span>
            <h2 className="stat-value">{stats.avgProcessingTime}s</h2>
            <span className="stat-footer">Per item</span>
          </div>
        </div>
      </div>

      <div className="main-charts-layout">
        <div className="chart-card-full distribution-section">
          <h3 className="section-title">Today's Waste Distribution</h3>
          <div className="visual-chart-area">
            <div className="y-axis-labels">
              <span>250</span><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span>
            </div>
            <div className="bars-flex-container">
              {distribution.map((item, index) => (
                <div key={index} className="single-bar-column">
                  <div 
                    className="actual-bar" 
                    style={{ 
                      height: `${(item.count / 250) * 100}%`,
                      backgroundColor: index === 0 ? '#86efac' : index === 1 ? '#6ee7b7' : '#10b981'
                    }}
                  ></div>
                  <span className="bar-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="activity-card-full recent-activity-section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-scroll-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-row">
                <div className="activity-details">
                  <span className="act-category">{activity.category}</span>
                  <span className="act-count">{activity.count} items sorted</span>
                </div>
                <span className="act-timestamp">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;