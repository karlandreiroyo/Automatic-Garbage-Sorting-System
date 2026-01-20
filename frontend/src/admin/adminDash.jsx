import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/adminDash.css';

// SVG Icons matching the photo
const Icons = {
  TotalBins: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M21 8l-2-2H5L3 8h18zM3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M10 12h4" />
    </svg>
  ),
  ItemsSorted: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
    </svg>
  ),
  ProcessingTime: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  Collector: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Supervisor: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 11v4M10 13h4" />
    </svg>
  ),
  TotalEmployees: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
};

const AdminDash = () => {
  const [stats, setStats] = useState({
    totalBins: 0,
    overallItemsSorted: 0,
    avgProcessingTime: 2.3,
    collectors: 0,
    supervisor: 0,
    totalEmployees: 0
  });
  
  const [distribution, setDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

const fetchDashboardData = async () => {
  try {
    // Fetch total bins
    const { data: binsData, error: binsError } = await supabase
      .from('bins')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (binsError) throw binsError;
    
    // Fetch users to get employee counts
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('role, status');

    if (usersError) throw usersError;

    const collectors = usersData?.filter(u => u.role === 'COLLECTOR' && u.status === 'ACTIVE').length || 0;
    const supervisors = usersData?.filter(u => u.role === 'SUPERVISOR' && u.status === 'ACTIVE').length || 0;
    const totalEmployees = usersData?.filter(u => u.status === 'ACTIVE').length || 0;

    // Fetch waste items for statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('waste_items')
      .select('*, bins(name)')
      .gte('created_at', today.toISOString());

    if (itemsError) throw itemsError;

    const overallItemsSorted = itemsData?.length || 0;
    
    // Calculate average processing time
    const avgTime = itemsData?.length > 0
      ? (itemsData.reduce((sum, item) => sum + (item.processing_time || 0), 0) / itemsData.length).toFixed(1)
      : 2.3;

    // Create distribution data by category
    const categoryCounts = {
      'Biodegradable': 0,
      'Non-Bio': 0,
      'Recycle': 0,
      'Unsorted': 0
    };
    
    itemsData?.forEach(item => {
      if (categoryCounts.hasOwnProperty(item.category)) {
        categoryCounts[item.category]++;
      }
    });

    const distributionArray = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));

    // Fetch recent activity
    const { data: activityData, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);

    if (activityError) throw activityError;

    const formattedActivity = activityData?.map(activity => ({
      text: activity.description,
      time: getTimeAgo(activity.created_at)
    })) || [];

    setStats({
      totalBins: binsData?.length || 0,
      overallItemsSorted,
      avgProcessingTime: avgTime,
      collectors,
      supervisor: supervisors,
      totalEmployees
    });

    setDistribution(distributionArray);
    setRecentActivity(formattedActivity);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Keep your existing fallback values
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
          <div className="stat-icon-bg"><Icons.TotalBins /></div>
          <div className="stat-info">
            <span className="stat-label">Total Bins</span>
            <h2 className="stat-value">{stats.totalBins}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.ItemsSorted /></div>
          <div className="stat-info">
            <span className="stat-label">Overall Items Sorted</span>
            <h2 className="stat-value">{stats.overallItemsSorted}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.ProcessingTime /></div>
          <div className="stat-info">
            <span className="stat-label">Average Processing Time</span>
            <h2 className="stat-value">{stats.avgProcessingTime}s</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.Collector /></div>
          <div className="stat-info">
            <span className="stat-label">Collectors</span>
            <h2 className="stat-value">{stats.collectors}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.Supervisor /></div>
          <div className="stat-info">
            <span className="stat-label">Supervisor</span>
            <h2 className="stat-value">{stats.supervisor}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-bg"><Icons.TotalEmployees /></div>
          <div className="stat-info">
            <span className="stat-label">Total Employees</span>
            <h2 className="stat-value">{stats.totalEmployees}</h2>
          </div>
        </div>
      </div>

      <div className="main-charts-layout">
        <div className="chart-card-full distribution-section">
          <h3 className="section-title">Today's Waste Distribution</h3>
          <div className="visual-chart-area">
            <div className="y-axis-labels">
              <span>200</span><span>175</span><span>150</span><span>125</span><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            <div className="bars-flex-container">
              {distribution.map((item, index) => (
                <div key={index} className="single-bar-column">
                  <div 
                    className="actual-bar" 
                    style={{ 
                      height: `${(item.count / 200) * 100}%`,
                      backgroundColor: '#10b981'
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
                <span className="act-text">{activity.text}</span>
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