import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sidebarLogo from '../assets/whitelogo.png';
import '../supervisor/supervisorcss/supervisor.css';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Bin Monitoring', icon: '📡' },
    { name: 'Dashboard', icon: '📊' },
    { name: 'Waste Categories', icon: '🗑️' },
    { name: 'Data Analytics', icon: '📈' },
    { name: 'About', icon: 'ℹ️' },
  ];

  const stats = [
    { 
      title: 'Total Items Sorted', 
      value: '912', 
      subtitle: 'Today', 
      icon: '📦', 
      color: '#10B981',
      change: '+12.5%',
      isPositive: true
    },
    { 
      title: 'Categories Detected', 
      value: '3', 
      subtitle: 'Active categories', 
      icon: '🗑️', 
      color: '#10B981',
      change: '+2.1%',
      isPositive: true
    },
    { 
      title: 'Sorting Efficiency', 
      value: '98.2%', 
      subtitle: 'Accuracy rate', 
      icon: '📈', 
      color: '#10B981',
      change: '+2.1%',
      isPositive: true
    },
    { 
      title: 'Avg. Processing Time', 
      value: '2.3s', 
      subtitle: 'Per item', 
      icon: '⏱️', 
      color: '#10B981',
      change: '-8.4%',
      isPositive: false
    },
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
    <div className="supervisor-container">
      {/* Sidebar */}
      <div className="supervisor-sidebar">
        <div className="supervisor-logo">
          <img src={sidebarLogo} alt="Sorting System Logo" className="supervisor-logo-icon" />
          <div>
            <div className="supervisor-logo-title">Sorting System</div>
            <div className="supervisor-logo-subtitle">Supervisor</div>
          </div>
        </div>

        <nav className="supervisor-nav">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`supervisor-menu-item ${activeMenu === item.name ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="supervisor-menu-icon">{item.icon}</span>
              {item.name}
            </div>
          ))}
        </nav>

        <div className="supervisor-signout-container">
          <div className="supervisor-menu-item" onClick={handleSignOut}>
            <span className="supervisor-menu-icon">🚪</span>
            Sign Out
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="supervisor-main-content">
        <div className="supervisor-header">
          <div>
            <h1 className="supervisor-title">Dashboard Overview</h1>
            <p className="supervisor-subtitle">Waste sorting statistics</p>
          </div>
          <div className="supervisor-welcome">
            Welcome Supervisor Karl
          </div>
        </div>

        {/* Stats Cards */}
        <div className="supervisor-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="supervisor-stat-card">
              <div className="supervisor-stat-header">
                <div className="supervisor-stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                  {stat.icon}
                </div>
                <div className={`supervisor-stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                  {stat.change}
                </div>
              </div>
              <div className="supervisor-stat-content">
                <div className="supervisor-stat-title">{stat.title}</div>
                <div className="supervisor-stat-value">{stat.value}</div>
                <div className="supervisor-stat-subtitle">{stat.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="supervisor-charts-grid">
          {/* Waste Distribution Chart */}
          <div className="supervisor-chart-card">
            <h3 className="supervisor-chart-title">Today's Waste Distribution</h3>
            <div className="supervisor-bar-chart">
              <div className="supervisor-y-axis">
                {[250, 200, 150, 100, 50, 0].map((val) => (
                  <div key={val} className="supervisor-y-axis-label">{val}</div>
                ))}
              </div>
              <div className="supervisor-chart-bars">
                {wasteData.map((data, index) => (
                  <div key={index} className="supervisor-bar-container">
                    <div
                      className="supervisor-bar"
                      style={{
                        height: `${(data.count / maxCount) * 100}%`,
                        backgroundColor: data.color,
                      }}
                    />
                    <div className="supervisor-bar-label">{data.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="supervisor-activity-card">
            <h3 className="supervisor-chart-title">Recent Activity</h3>
            <div className="supervisor-activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="supervisor-activity-item">
                  <div className="supervisor-activity-left">
                    <div className="supervisor-activity-type">{activity.type}</div>
                    <div className="supervisor-activity-detail">{activity.items} items sorted</div>
                  </div>
                  <div className="supervisor-activity-time">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}