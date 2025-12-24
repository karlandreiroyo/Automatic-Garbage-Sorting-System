import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sidebarLogo from '../assets/whitelogo.png';
import '../admin/admincss/admindashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Waste Categories', icon: '🗑️' },
    { name: 'Data Analytics', icon: '📈' },
    { name: 'Accounts', icon: '👥' },
    { name: 'Bin Monitoring', icon: '📡' },
    { name: 'About', icon: 'ℹ️' },
  ];

  const stats = [
    { title: 'Total Items Sorted', value: '912', subtitle: 'Today', icon: '📦', color: '#10B981' },
    { title: 'Categories Detected', value: '4', subtitle: 'Active categories', icon: '🗑️', color: '#10B981' },
    { title: 'Sorting Efficiency', value: '98.2%', subtitle: 'Accuracy rate', icon: '📈', color: '#10B981' },
    { title: 'Avg. Processing Time', value: '2.3s', subtitle: 'Per item', icon: '⏱️', color: '#10B981' },
  ];

  const wasteData = [
    { category: 'Plastic', count: 240, color: '#10B981' },
    { category: 'Paper', count: 190, color: '#10B981' },
    { category: 'Metal', count: 100, color: '#10B981' },
    { category: 'Glass', count: 50, color: '#D1D5DB' },
  ];

  const recentActivity = [
    { type: 'Plastic', time: '2 min ago', items: 12 },
    { type: 'Paper', time: '5 min ago', items: 8 },
    { type: 'Metal', time: '8 min ago', items: 5 },
  ];

  const maxCount = Math.max(...wasteData.map(d => d.count));

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo">
          <img src={sidebarLogo} alt="Sorting System Logo" className="admin-logo-icon" />
          <div>
            <div className="admin-logo-title">Sorting System</div>
            <div className="admin-logo-subtitle">Waste Management</div>
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`admin-menu-item ${activeMenu === item.name ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="admin-menu-icon">{item.icon}</span>
              {item.name}
            </div>
          ))}
        </nav>

        <div className="admin-signout-container">
          <div className="admin-menu-item" onClick={handleSignOut}>
            <span className="admin-menu-icon">🚪</span>
            Sign Out
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="admin-title">Dashboard Overview</h1>
            <p className="admin-subtitle">Waste sorting statistics</p>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827' }}>
            Welcome Admin Royo
          </div>
        </div>

        {/* Stats Cards */}
        <div className="admin-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                {stat.icon}
              </div>
              <div className="admin-stat-content">
                <div className="admin-stat-title">{stat.title}</div>
                <div className="admin-stat-value">{stat.value}</div>
                <div className="admin-stat-subtitle">{stat.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="admin-charts-grid">
          {/* Waste Distribution Chart */}
          <div className="admin-chart-card">
            <h3 className="admin-chart-title">Today's Waste Distribution</h3>
            <div className="admin-bar-chart">
              <div className="admin-y-axis">
                {[250, 200, 150, 100, 50, 0].map((val) => (
                  <div key={val} className="admin-y-axis-label">{val}</div>
                ))}
              </div>
              <div className="admin-chart-bars">
                {wasteData.map((data, index) => (
                  <div key={index} className="admin-bar-container">
                    <div
                      className="admin-bar"
                      style={{
                        height: `${(data.count / maxCount) * 100}%`,
                        backgroundColor: data.color,
                      }}
                    />
                    <div className="admin-bar-label">{data.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-activity-card">
            <h3 className="admin-chart-title">Recent Activity</h3>
            <div className="admin-activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="admin-activity-item">
                  <div className="admin-activity-left">
                    <div className="admin-activity-type">{activity.type}</div>
                    <div className="admin-activity-detail">{activity.items} items sorted</div>
                  </div>
                  <div className="admin-activity-time">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}