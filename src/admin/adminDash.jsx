import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/AdminDash.css';

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
      // Fetch stats from your database
      const { data: itemsData, error: itemsError } = await supabase
        .from('waste_items')
        .select('*');

      if (itemsError) throw itemsError;

      // Calculate stats
      const totalItems = itemsData?.length || 0;
      const categoriesSet = new Set(itemsData?.map(item => item.category));
      const categories = categoriesSet.size;

      // Calculate distribution
      const dist = {};
      itemsData?.forEach(item => {
        dist[item.category] = (dist[item.category] || 0) + 1;
      });

      const distributionArray = Object.entries(dist).map(([name, count]) => ({
        name,
        count
      }));

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('waste_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

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
      <div className="dashboard-title">
        <h1>Dashboard Overview</h1>
        <p>Waste sorting statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dcfce7'}}>
            <span>📦</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Items Sorted</p>
            <h2 className="stat-value">{stats.totalItems}</h2>
            <span className="stat-subtitle">Today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dbeafe'}}>
            <span>🗑️</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Categories Detected</p>
            <h2 className="stat-value">{stats.categories}</h2>
            <span className="stat-subtitle">Active categories</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#e0e7ff'}}>
            <span>📊</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Sorting Efficiency</p>
            <h2 className="stat-value">{stats.efficiency}%</h2>
            <span className="stat-subtitle">Accuracy rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fce7f3'}}>
            <span>⏱️</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg. Processing Time</p>
            <h2 className="stat-value">{stats.avgProcessingTime}s</h2>
            <span className="stat-subtitle">Per item</span>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card distribution-card">
          <h3>Today's Waste Distribution</h3>
          <div className="bar-chart">
            <div className="y-axis">
              <span>250</span>
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="bars-container">
              {distribution.map((item, index) => (
                <div key={index} className="bar-wrapper">
                  <div 
                    className="bar" 
                    style={{
                      height: `${(item.count / maxCount) * 100}%`,
                      background: index === 0 ? '#10b981' : index === 1 ? '#6ee7b7' : index === 2 ? '#86efac' : '#d1fae5'
                    }}
                  ></div>
                  <span className="bar-label">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card activity-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-left">
                    <h4>{activity.category}</h4>
                    <p>{activity.count} items sorted</p>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;