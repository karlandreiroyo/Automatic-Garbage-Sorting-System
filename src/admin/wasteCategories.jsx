/**
 * Waste Categories Component
 * Displays waste sorting statistics by category with time-based filtering
 * Shows: Biodegradable, Non-Biodegradable, Recycle, and Unsorted categories
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/wasteCategories.css';

// Time Filter Icons
const DailyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const WeeklyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const MonthlyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>;

const WasteCategories = () => {
  // State for waste category data (counts, colors, icons)
  const [wasteData, setWasteData] = useState([]);
  // State for total number of items sorted
  const [totalItems, setTotalItems] = useState(0);
  // State for time filter selection (daily, weekly, monthly)
  const [timeFilter, setTimeFilter] = useState('daily');

  // Fetch waste data when time filter changes
  useEffect(() => {
    fetchWasteData();
  }, [timeFilter]);

  /**
   * Fetches waste items from database and calculates category counts
   */
  const fetchWasteData = async () => {
    try {
      let query = supabase
        .from('waste_items')
        .select('*');

      // Apply time filter based on selected period
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
      setTotalItems(total);

      const formattedData = [
        {
          name: 'Biodegradable',
          count: categoryCounts.Biodegradable,
          color: '#10b981',
          icon: '🌿'
        },
        {
          name: 'Non-Biodegradable',
          count: categoryCounts['Non-Biodegradable'],
          color: '#ef4444',
          icon: '📦'
        },
        {
          name: 'Recycle',
          count: categoryCounts.Recycle,
          color: '#f97316',
          icon: '♻️'
        },
        {
          name: 'Unsorted',
          count: categoryCounts.Unsorted,
          color: '#6b7280',
          icon: '🗑️'
        }
      ];

      setWasteData(formattedData);
    } catch (error) {
      console.error('Error fetching waste data:', error);
      setWasteData([
        { name: 'Biodegradable', count: 10, color: '#10b981', icon: '🌿' },
        { name: 'Non-Biodegradable', count: 15, color: '#ef4444', icon: '📦' },
        { name: 'Recycle', count: 30, color: '#f97316', icon: '♻️' },
        { name: 'Unsorted', count: 2, color: '#6b7280', icon: '🗑️' }
      ]);
      setTotalItems(39);
    }
  };

  /**
   * Gets the maximum count from all categories
   * Used to calculate progress bar percentages
   */
  const getMaxCount = () => {
    if (wasteData.length === 0) return 1;
    return Math.max(...wasteData.map(item => item.count), 1);
  };

  return (
    <div className="waste-categories-container">
      {/* Header Section */}
      <div className="waste-categories-header">
        <div>
          <h1>Waste Categories</h1>
          <p className="total-items-text">{totalItems} items sorted</p>
        </div>
      </div>

      {/* Time Filter Buttons */}
      <div className="time-filters">
        <button
          className={`time-filter-btn ${timeFilter === 'daily' ? 'active' : ''}`}
          onClick={() => setTimeFilter('daily')}
        >
          <DailyIcon /> Daily
        </button>
        <button
          className={`time-filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
          onClick={() => setTimeFilter('weekly')}
        >
          <WeeklyIcon /> Weekly
        </button>
        <button
          className={`time-filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
          onClick={() => setTimeFilter('monthly')}
        >
          <MonthlyIcon /> Monthly
        </button>
      </div>

      {/* Category Cards Grid - Now optimized for 2 columns */}
      <div className="categories-grid">
        {wasteData.map((category, index) => {
          const maxCount = getMaxCount();
          const percentage = maxCount > 0 ? (category.count / maxCount) * 100 : 0;
          const progressColor = category.color === '#6b7280' ? '#4b5563' : category.color;

          return (
            <div key={index} className="category-card">
              <div className="category-icon-section" style={{ backgroundColor: category.color }}>
                <div className="category-icon">{category.icon}</div>
              </div>
              <div className="category-content">
                <h3 className="category-name">{category.name}</h3>
                <div className="category-count">
                  <span className="count-number">{category.count}</span>
                  <span className="count-label">items sorted</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: progressColor
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WasteCategories;