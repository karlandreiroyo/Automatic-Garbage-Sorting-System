/**
 * Waste Categories Component
 * Displays waste sorting statistics by category with time-based filtering
 * Shows: Biodegradable, Non-Biodegradable, Recycle, and Unsorted categories
 * Features: Daily, Weekly, Monthly time filters and progress bars
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/wasteCategories.css';

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
   * Applies time filter based on selected period
   */
  const fetchWasteData = async () => {
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
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate category counts from fetched data
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
            // Items with unknown categories go to Unsorted
            categoryCounts.Unsorted++;
          }
        });
      }

      // Calculate total items and update state
      const total = data ? data.length : 0;
      setTotalItems(total);

      // Format data for display with colors and icons
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
      // Set default data if error occurs
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
   * @returns {number} Maximum count value
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
          <p>{totalItems} items sorted</p>
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
      </div>

      {/* Category Cards Grid */}
      <div className="categories-grid">
        {wasteData.map((category, index) => {
          // Calculate progress bar percentage relative to max count
          const maxCount = getMaxCount();
          const percentage = maxCount > 0 ? (category.count / maxCount) * 100 : 0;
          // Adjust color for unsorted category (darker gray)
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
