/**
 * Bin Monitoring Component
 * Real-time monitoring of waste bin fill levels with two views:
 * 1. List View: Shows all bins with system power indicators
 * 2. Detail View: Shows category-specific bins with drain functionality
 * Features: Click bins to view details, drain individual or all bins
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/binMonitoring.css';

// Icon Components for different waste categories
const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const RecycleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
    <path d="m14 5 2.39 4.143"/>
    <path d="M8.293 13.53 11 19"/>
    <path d="M19.324 11.06 14 5"/>
    <path d="m3.727 6.465 1.272-2.119a1.84 1.84 0 0 1 1.565-.891H11.25"/>
    <path d="m14 5-2.707 4.53"/>
  </svg>
);

const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/**
 * Battery Icon Component
 * Displays system power level with color coding
 * @param {number} level - Battery level percentage (0-100)
 * @returns {JSX.Element} Battery icon with fill level
 */
const BatteryIcon = ({ level }) => {
  /**
   * Determines battery color based on level
   * Green (>=80%), Yellow (50-79%), Red (<50%)
   * @returns {string} Hex color code
   */
  const getColor = () => {
    if (level >= 80) return '#10b981';
    if (level >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="battery-icon-wrapper">
      <div className="battery-outline" style={{ borderColor: getColor() }}>
        <div className="battery-fill" style={{ width: `${level}%`, backgroundColor: getColor() }}></div>
      </div>
      <span style={{ color: getColor() }}>{level}%</span>
    </div>
  );
};

/**
 * Bin List Card Component
 * Displays bin information in list view with system power and fill level
 * @param {Object} bin - Bin data object
 * @param {Function} onClick - Callback when bin is clicked
 */
const BinListCard = ({ bin, onClick }) => {
  /**
   * Gets status text based on fill level
   * @returns {string} Status text (Full, Almost Full, Normal)
   */
  const getStatus = () => {
    if (bin.fillLevel >= 90) return 'Full';
    if (bin.fillLevel >= 75) return 'Almost Full';
    return 'Normal';
  };

  /**
   * Gets CSS class for status badge
   * @returns {string} CSS class name
   */
  const getStatusClass = () => {
    if (bin.fillLevel >= 90) return 'status-full';
    if (bin.fillLevel >= 75) return 'status-almost-full';
    return 'status-normal';
  };

  return (
    <div className="bin-list-card" onClick={onClick}>
      <div className="bin-list-header">
        <div className="system-power">
          <span>SYSTEM POWER</span>
          <BatteryIcon level={bin.systemPower} />
        </div>
        <span className={`status-badge ${getStatusClass()}`}>{getStatus()}</span>
      </div>
      <div className="bin-list-content">
        <h2>{bin.name}</h2>
        <p>Capacity: {bin.capacity}</p>
        <div className="bin-list-fill-info">
          <div>
            <span>Fill Level</span>
            <span className="fill-percent">{bin.fillLevel}%</span>
          </div>
          <div className="fill-bar">
            <div className="fill-progress" style={{ width: `${bin.fillLevel}%` }}></div>
          </div>
          <span className="last-update">{bin.lastUpdate}</span>
        </div>
      </div>
      <div className="bin-list-icon">
        <div className="bin-icon-visual" style={{ height: `${bin.fillLevel}%` }}>
          <span>{bin.fillLevel}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Bin Detail Card Component
 * Displays detailed bin information in detail view
 * Shows category, fill level, last collection time, and visual bin representation
 * @param {Object} bin - Bin data object with category information
 */
const BinDetailCard = ({ bin }) => {
  /**
   * Gets status text based on fill level
   * @returns {string} Status text (Full, Almost Full, Normal)
   */
  const getStatus = () => {
    if (bin.fillLevel >= 90) return 'Full';
    if (bin.fillLevel >= 75) return 'Almost Full';
    return 'Normal';
  };

  /**
   * Gets CSS class for status badge
   * @returns {string} CSS class name
   */
  const getStatusClass = () => {
    if (bin.fillLevel >= 90) return 'status-full';
    if (bin.fillLevel >= 75) return 'status-almost-full';
    return 'status-normal';
  };

  return (
    <div className={`bin-detail-card ${bin.colorClass}`}>
      <div className="bin-detail-left">
        <div className="bin-detail-icon">
          {bin.icon}
        </div>
        <div className="bin-detail-info">
          <h3>{bin.category}</h3>
          <p>Capacity: {bin.capacity}</p>
        </div>
      </div>
      <div className="bin-detail-right">
        <div className="bin-detail-status">
          <span className={`status-badge ${getStatusClass()}`}>{getStatus()}</span>
        </div>
        <div className="bin-detail-fill-wrapper">
          <div className="bin-detail-fill">
            <span>Fill Level</span>
            <span className="fill-percent">{bin.fillLevel}%</span>
          </div>
          <div className="fill-bar">
            <div className="fill-progress" style={{ width: `${bin.fillLevel}%` }}></div>
          </div>
          <div className="last-collection">
            <span>Last Collection</span>
            <span>{bin.lastCollection}</span>
          </div>
        </div>
        <div className="bin-visual">
          <div className="bin-fill" style={{ height: `${bin.fillLevel}%` }}></div>
          <div className="bin-icon">{bin.icon}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Bin Monitoring Component
 * Manages two views: list view and detail view
 * Handles bin data fetching, draining operations, and navigation
 */
const BinMonitoring = () => {
  // State to track current view ('list' or 'detail')
  const [view, setView] = useState('list');
  // State for list view bins (Bin 1, Bin 2, etc.)
  const [bins, setBins] = useState([
    { id: 1, name: 'Bin 1', fillLevel: 80, systemPower: 100, capacity: '20kg', lastUpdate: '2 hours ago', category: 'Biodegradable' },
    { id: 2, name: 'Bin 2', fillLevel: 86, systemPower: 50, capacity: '20kg', lastUpdate: '1 hour ago', category: 'Non-Biodegradable' },
    { id: 3, name: 'Bin 3', fillLevel: 85, systemPower: 20, capacity: '20kg', lastUpdate: '3 hours ago', category: 'Recycle' },
    { id: 4, name: 'Bin 4', fillLevel: 90, systemPower: 100, capacity: '20kg', lastUpdate: '1 hour ago', category: 'Unsorted' }
  ]);

  // State for detail view category bins (Biodegradable, Non-Biodegradable, etc.)
  const [categoryBins, setCategoryBins] = useState([
    { 
      id: 1, 
      category: 'Non Biodegradable', 
      fillLevel: 100, 
      capacity: '100 L', 
      lastCollection: '4 hours ago',
      colorClass: 'red',
      icon: <TrashIcon />
    },
    { 
      id: 2, 
      category: 'Biodegradable', 
      fillLevel: 80, 
      capacity: '100 L', 
      lastCollection: '2 hours ago',
      colorClass: 'green',
      icon: <LeafIcon />
    },
    { 
      id: 3, 
      category: 'Recyclable', 
      fillLevel: 86, 
      capacity: '100L', 
      lastCollection: '1 hours ago',
      colorClass: 'blue',
      icon: <RecycleIcon />
    },
    { 
      id: 4, 
      category: 'Unsorted', 
      fillLevel: 83, 
      capacity: '100L', 
      lastCollection: '1 hours ago',
      colorClass: 'lime',
      icon: <GearIcon />
    }
  ]);

  // Fetch bin data on component mount
  useEffect(() => {
    fetchBinData();
  }, []);

  /**
   * Fetches bin data from Supabase database
   * Falls back to default data if database fetch fails
   */
  const fetchBinData = async () => {
    try {
      // Try to fetch from Supabase if you have a bins table
      const { data, error } = await supabase
        .from('bins')
        .select('*');

      if (!error && data) {
        // Update bins from database
        const updatedBins = data.map(bin => ({
          id: bin.id,
          name: bin.name || `Bin ${bin.id}`,
          fillLevel: bin.fill_level || bin.fillLevel || 0,
          systemPower: bin.system_power || bin.systemPower || 100,
          capacity: bin.capacity || '20kg',
          lastUpdate: bin.last_update || 'Just now',
          category: bin.category || 'General'
        }));
        setBins(updatedBins);
      }
    } catch (error) {
      console.error('Error fetching bin data:', error);
      // Use default data if fetch fails
    }
  };

  /**
   * Handles bin click to navigate to detail view
   * @param {Object} bin - The clicked bin object
   */
  const handleBinClick = (bin) => {
    setView('detail');
  };

  /**
   * Handles back button click to return to list view
   */
  const handleBack = () => {
    setView('list');
  };

  /**
   * Drains a specific bin by setting fill level to 0%
   * Updates both database and local state
   * @param {number} binId - The ID of the bin to drain
   */
  const handleDrain = async (binId) => {
    try {
      // Update in Supabase if you have a bins table
      const { error } = await supabase
        .from('bins')
        .update({ fill_level: 0, last_update: new Date().toISOString() })
        .eq('id', binId);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means table doesn't exist, which is okay for now
        console.warn('Bins table may not exist:', error);
      }

      // Update local state
      setCategoryBins(prevBins => 
        prevBins.map(bin => 
          bin.id === binId ? { ...bin, fillLevel: 0, lastCollection: 'Just now' } : bin
        )
      );

      // Also update the list view bins
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === binId ? { ...bin, fillLevel: 0, lastUpdate: 'Just now' } : bin
        )
      );
    } catch (error) {
      console.error('Error draining bin:', error);
      // Still update local state even if database update fails
      setCategoryBins(prevBins => 
        prevBins.map(bin => 
          bin.id === binId ? { ...bin, fillLevel: 0, lastCollection: 'Just now' } : bin
        )
      );
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === binId ? { ...bin, fillLevel: 0, lastUpdate: 'Just now' } : bin
        )
      );
    }
  };

  /**
   * Drains all bins by setting fill levels to 0%
   * Updates both database and local state for all bins
   */
  const handleDrainAll = async () => {
    try {
      // Update all bins in Supabase
      const { error } = await supabase
        .from('bins')
        .update({ fill_level: 0, last_update: new Date().toISOString() });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means table doesn't exist, which is okay for now
        console.warn('Bins table may not exist:', error);
      }

      // Update local state for all bins
      setCategoryBins(prevBins => 
        prevBins.map(bin => ({ ...bin, fillLevel: 0, lastCollection: 'Just now' }))
      );

      setBins(prevBins =>
        prevBins.map(bin => ({ ...bin, fillLevel: 0, lastUpdate: 'Just now' }))
      );
    } catch (error) {
      console.error('Error draining all bins:', error);
      // Still update local state
      setCategoryBins(prevBins => 
        prevBins.map(bin => ({ ...bin, fillLevel: 0, lastCollection: 'Just now' }))
      );
      setBins(prevBins =>
        prevBins.map(bin => ({ ...bin, fillLevel: 0, lastUpdate: 'Just now' }))
      );
    }
  };

  /**
   * Calculates number of bins requiring action
   * Counts full bins (>=90%) and almost full bins (75-89%)
   * @returns {Object} Object with full and almostFull counts
   */
  const getActionRequiredCount = () => {
    const full = categoryBins.filter(b => b.fillLevel >= 90).length;
    const almostFull = categoryBins.filter(b => b.fillLevel >= 75 && b.fillLevel < 90).length;
    return { full, almostFull };
  };

  const { full, almostFull } = getActionRequiredCount();

  // Render detail view when a bin is clicked
  if (view === 'detail') {
    return (
      <div className="bin-monitoring-container">
        {/* Detail View Header with Back and Drain All buttons */}
        <div className="bin-monitoring-header">
          <div>
            <h1>Real-Time Bin Monitoring</h1>
            <p>Monitor bin fill levels in real-time</p>
          </div>
          <div className="header-actions">
            <button className="action-btn back-btn" onClick={handleBack}>Back</button>
            <button className="action-btn drain-btn" onClick={handleDrainAll}>Drain All</button>
          </div>
        </div>

        {/* Bin Status Summary */}
        <div className="bin-status-summary">
          <h2>BIN 1</h2>
          <div className="action-required-alert">
            <span className="warning-icon">⚠️</span>
            <div>
              <span className="action-text">Action Required</span>
              <p>{full} bin full, {almostFull} bins almost full</p>
            </div>
          </div>
        </div>

        {/* Category Bin Cards with Drain Buttons */}
        <div className="bin-detail-cards">
          {categoryBins.map(bin => (
            <div key={bin.id} className="bin-detail-wrapper">
              <BinDetailCard bin={bin} />
              <button className="drain-bin-btn" onClick={() => handleDrain(bin.id)}>
                Drain
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render list view (default)
  return (
    <div className="bin-monitoring-container">
      {/* List View Header */}
      <div className="bin-monitoring-header">
        <div>
          <h1>Real-Time Bin Monitoring</h1>
          <p>Monitor bin fill levels in real-time</p>
        </div>
      </div>

      {/* Action Required Alert */}
      <div className="action-required-alert">
        <span className="warning-icon">⚠️</span>
        <div>
          <span className="action-text">Action Required</span>
          <p>{full} bin full, {almostFull} bins almost full</p>
        </div>
      </div>

      {/* Bin List Cards - Clickable to view details */}
      <div className="bin-list-cards">
        {bins.map(bin => (
          <BinListCard key={bin.id} bin={bin} onClick={() => handleBinClick(bin)} />
        ))}
      </div>
    </div>
  );
};

export default BinMonitoring;

