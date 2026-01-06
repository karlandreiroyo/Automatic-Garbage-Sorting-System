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

// Add this helper function at the top of your BinMonitoring.jsx file, after the imports

/**
 * Rounds fill level to nearest 10
 * @param {number} level - Fill level percentage
 * @returns {number} Rounded fill level (0, 10, 20, ..., 100)
 */
const roundToTen = (level) => {
  return Math.round(level / 10) * 10;
};

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
  return (
    <div className="battery-icon-wrapper">
      <div className="battery-outline" style={{ borderColor: 'white' }}>
        <div className="battery-fill" style={{ width: `${level}%`, backgroundColor: 'white' }}></div>
      </div>
      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{level}%</span>
    </div>
  );
};

/**
 * Gets color based on fill level percentage
 * 0-15% = Red, 15-30% = Orange, 30-50% = Yellow, 50-100% = Green
 * @param {number} fillLevel - Fill level percentage (0-100)
 * @returns {string} Hex color code
 */
const getFillLevelColor = (fillLevel) => {
  if (fillLevel >= 50) return '#10b981'; // Green
  if (fillLevel >= 30) return '#eab308'; // Yellow
  if (fillLevel >= 15) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

/**
 * Bin List Card Component
 * Displays bin information in list view with system power and fill level
 * @param {Object} bin - Bin data object
 * @param {Function} onClick - Callback when bin is clicked
 * @param {Function} onDrain - Callback when drain button is clicked
 */
const BinListCard = ({ bin, onClick }) => {
  /**
   * Gets status text based on fill level
   * Returns: "Full" (>=90%), "Almost Full" (75-89%), "Normal" (50-74%), or "Empty" (<50%)
   * @returns {string} Status text
   */
  const getStatus = () => {
    if (bin.fillLevel >= 90) return 'Full';
    if (bin.fillLevel >= 75) return 'Almost Full';
    if (bin.fillLevel >= 50) return 'Normal';
    return 'Empty';
  };

  /**
   * Gets CSS class for status badge based on fill level
   * @returns {string} CSS class name
   */
  const getStatusClass = () => {
    if (bin.fillLevel >= 90) return 'status-full';
    if (bin.fillLevel >= 75) return 'status-almost-full';
    if (bin.fillLevel >= 50) return 'status-normal';
    return 'status-empty';
  };

  return (
    <div className="bin-list-card" onClick={onClick}>
      {/* Left Panel - Green Section */}
      <div className="bin-list-left-panel">
        <div className="bin-list-system-power">
          <span className="system-power-label">SYSTEM POWER</span>
          <div className="system-power-content">
            <BatteryIcon level={bin.systemPower} />
          </div>
        </div>
        <div className="bin-list-title-section">
          <h1 className="bin-list-title">{bin.name}</h1>
          <p className="bin-list-capacity">Capacity: {bin.capacity}</p>
        </div>
        <span className={`bin-list-status-badge ${getStatusClass()}`}>
          <span className="status-dot"></span>
          {getStatus()}
        </span>
      </div>

      {/* Right Panel - White Section */}
      <div className="bin-list-right-panel">
        <div className="bin-list-fill-section">
          <span className="fill-level-label">Fill Level</span>
          <div className="bin-list-progress-container">
            <div className="bin-list-fill-bar">
              <div 
                className="bin-list-fill-progress" 
                style={{ 
                  width: `${bin.fillLevel}%`,
                  backgroundColor: getFillLevelColor(bin.fillLevel)
                }}
              ></div>
            </div>
            <span 
              className="bin-list-fill-percentage"
              style={{ color: getFillLevelColor(bin.fillLevel) }}
            >
              {bin.fillLevel}%
            </span>
          </div>
          <span className="bin-list-last-update">{bin.lastUpdate}</span>
        </div>
        <div className="bin-list-visual">
          <div className="bin-list-icon-visual">
            <div 
              className="bin-list-fill-section-visual" 
              style={{ 
                height: `${bin.fillLevel}%`,
                backgroundColor: getFillLevelColor(bin.fillLevel)
              }}
            >
              <span className="bin-list-percentage-text">{bin.fillLevel}%</span>
            </div>
            <div className="bin-list-empty-section-visual"></div>
          </div>
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
const BinDetailCard = ({ bin, onDrain }) => {
  /**
   * Gets status text based on fill level
   * Returns: "Full" (>=90%), "Almost Full" (75-89%), "Normal" (50-74%), or "Empty" (<50%)
   * @returns {string} Status text
   */
  const getStatus = () => {
    if (bin.fillLevel >= 90) return 'Full';
    if (bin.fillLevel >= 75) return 'Almost Full';
    if (bin.fillLevel >= 50) return 'Normal';
    return 'Empty';
  };

  /**
   * Gets CSS class for status badge based on fill level
   * @returns {string} CSS class name
   */
  const getStatusClass = () => {
    if (bin.fillLevel >= 90) return 'status-full';
    if (bin.fillLevel >= 75) return 'status-almost-full';
    if (bin.fillLevel >= 50) return 'status-normal';
    return 'status-empty';
  };

  return (
    <div className={`bin-detail-card ${bin.colorClass}`}>
      <div className="bin-detail-left">
        <div className="bin-detail-info">
          <h3>{bin.category}</h3>
          <p>Capacity: {bin.capacity}</p>
        </div>
      </div>
      <div className="bin-detail-middle">
        <div className="bin-detail-fill-info">
          <div className="fill-level-header">
            <span className="fill-level-label">Fill Level</span>
            <span 
              className="fill-percent" 
              style={{ color: getFillLevelColor(bin.fillLevel) }}
            >
              {bin.fillLevel}%
            </span>
          </div>
          <div className="fill-bar">
            <div 
              className="fill-progress" 
              style={{ 
                width: `${bin.fillLevel}%`,
                backgroundColor: getFillLevelColor(bin.fillLevel)
              }}
            ></div>
          </div>
          <div className="last-collection-row">
            <div className="last-collection">
              <span>Last Collection</span>
              <span className="collection-time">{bin.lastCollection}</span>
            </div>
            <button className="drain-bin-btn" onClick={(e) => {
              e.stopPropagation();
              if (onDrain) onDrain(bin.id);
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>
              </svg>
              DRAIN
            </button>
          </div>
        </div>
      </div>
      <div className="bin-detail-right">
        <div className="bin-visual">
          <div 
            className="bin-fill-section" 
            style={{ 
              height: `${bin.fillLevel}%`,
              backgroundColor: getFillLevelColor(bin.fillLevel)
            }}
          >
            <span className="bin-percentage-text">{bin.fillLevel}%</span>
          </div>
          <div className="bin-empty-section"></div>
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
  // State to track which bin is currently selected for detail view
  const [selectedBinId, setSelectedBinId] = useState(null);
  // State to control the visibility of the drain all confirmation modal
  const [showDrainAllModal, setShowDrainAllModal] = useState(false);
  
  // State for list view bins, each with its own independent category bins
  const [bins, setBins] = useState([
  { 
    id: 1, 
    name: 'Bin 1', 
    fillLevel: 80, // Already multiple of 10
    systemPower: 100, 
    capacity: '20kg', 
    lastUpdate: '2 hours ago', 
    category: 'Biodegradable',
    categoryBins: [
      { 
        id: 'non-bio-1', 
        category: 'Non Biodegradable', 
        fillLevel: 100, // Already multiple of 10
        capacity: '100 L', 
        lastCollection: '4 hours ago',
        colorClass: 'red',
        icon: <TrashIcon />
      },
      { 
        id: 'bio-1', 
        category: 'Biodegradable', 
        fillLevel: 80, // Already multiple of 10
        capacity: '100 L', 
        lastCollection: '2 hours ago',
        colorClass: 'green',
        icon: <LeafIcon />
      },
      { 
        id: 'recycle-1', 
        category: 'Recyclable', 
        fillLevel: 90, // Changed from 86 to 90
        capacity: '100L', 
        lastCollection: '1 hours ago',
        colorClass: 'blue',
        icon: <RecycleIcon />
      },
      { 
        id: 'unsorted-1', 
        category: 'Unsorted', 
        fillLevel: 80, // Changed from 83 to 80
        capacity: '100L', 
        lastCollection: '1 hours ago',
        colorClass: 'lime',
        icon: <GearIcon />
      }
    ]
  },
  { 
    id: 2, 
    name: 'Bin 2', 
    fillLevel: 90, // Changed from 86 to 90
    systemPower: 50, 
    capacity: '20kg', 
    lastUpdate: '1 hour ago', 
    category: 'Non-Biodegradable',
    categoryBins: [
      { 
        id: 'non-bio-2', 
        category: 'Non Biodegradable', 
        fillLevel: 100, // Changed from 95 to 100
        capacity: '100 L', 
        lastCollection: '3 hours ago',
        colorClass: 'red',
        icon: <TrashIcon />
      },
      { 
        id: 'bio-2', 
        category: 'Biodegradable', 
        fillLevel: 80, // Changed from 75 to 80
        capacity: '100 L', 
        lastCollection: '1 hour ago',
        colorClass: 'green',
        icon: <LeafIcon />
      },
      { 
        id: 'recycle-2', 
        category: 'Recyclable', 
        fillLevel: 90, // Already multiple of 10
        capacity: '100L', 
        lastCollection: '2 hours ago',
        colorClass: 'blue',
        icon: <RecycleIcon />
      },
      { 
        id: 'unsorted-2', 
        category: 'Unsorted', 
        fillLevel: 70, // Already multiple of 10
        capacity: '100L', 
        lastCollection: '30 minutes ago',
        colorClass: 'lime',
        icon: <GearIcon />
      }
    ]
  },
  { 
    id: 3, 
    name: 'Bin 3', 
    fillLevel: 90, // Changed from 85 to 90
    systemPower: 20, 
    capacity: '20kg', 
    lastUpdate: '3 hours ago', 
    category: 'Recycle',
    categoryBins: [
      { 
        id: 'non-bio-3', 
        category: 'Non Biodegradable', 
        fillLevel: 90, // Changed from 88 to 90
        capacity: '100 L', 
        lastCollection: '5 hours ago',
        colorClass: 'red',
        icon: <TrashIcon />
      },
      { 
        id: 'bio-3', 
        category: 'Biodegradable', 
        fillLevel: 80, // Changed from 82 to 80
        capacity: '100 L', 
        lastCollection: '2 hours ago',
        colorClass: 'green',
        icon: <LeafIcon />
      },
      { 
        id: 'recycle-3', 
        category: 'Recyclable', 
        fillLevel: 90, // Changed from 85 to 90
        capacity: '100L', 
        lastCollection: '1 hour ago',
        colorClass: 'blue',
        icon: <RecycleIcon />
      },
      { 
        id: 'unsorted-3', 
        category: 'Unsorted', 
        fillLevel: 90, // Already multiple of 10
        capacity: '100L', 
        lastCollection: '45 minutes ago',
        colorClass: 'lime',
        icon: <GearIcon />
      }
    ]
  },
  { 
    id: 4, 
    name: 'Bin 4', 
    fillLevel: 90, // Already multiple of 10
    systemPower: 100, 
    capacity: '20kg', 
    lastUpdate: '1 hour ago', 
    category: 'Unsorted',
    categoryBins: [
      { 
        id: 'non-bio-4', 
        category: 'Non Biodegradable', 
        fillLevel: 90, // Changed from 92 to 90
        capacity: '100 L', 
        lastCollection: '6 hours ago',
        colorClass: 'red',
        icon: <TrashIcon />
      },
      { 
        id: 'bio-4', 
        category: 'Biodegradable', 
        fillLevel: 90, // Changed from 88 to 90
        capacity: '100 L', 
        lastCollection: '3 hours ago',
        colorClass: 'green',
        icon: <LeafIcon />
      },
      { 
        id: 'recycle-4', 
        category: 'Recyclable', 
        fillLevel: 90, // Changed from 91 to 90
        capacity: '100L', 
        lastCollection: '2 hours ago',
        colorClass: 'blue',
        icon: <RecycleIcon />
      },
      { 
        id: 'unsorted-4', 
        category: 'Unsorted', 
        fillLevel: 90, // Already multiple of 10
        capacity: '100L', 
        lastCollection: '1 hour ago',
        colorClass: 'lime',
        icon: <GearIcon />
      }
    ]
  }
]);

  // Fetch bin data on component mount and set up real-time updates
  useEffect(() => {
    fetchBinData();
    
    // Set up real-time polling every 2 seconds to update bin fill levels
    const interval = setInterval(() => {
      updateBinFillLevels();
    }, 2000); // Update every 2 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
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
        // Note: If you have category bins in database, you'll need to fetch them separately
        // For now, we'll keep the default category bins structure
        const updatedBins = data.map(bin => ({
          id: bin.id,
          name: bin.name || `Bin ${bin.id}`,
          fillLevel: bin.fill_level || bin.fillLevel || 0,
          systemPower: bin.system_power || bin.systemPower || 100,
          capacity: bin.capacity || '20kg',
          lastUpdate: bin.last_update || 'Just now',
          category: bin.category || 'General',
          // Keep existing categoryBins or initialize with defaults
          categoryBins: bins.find(b => b.id === bin.id)?.categoryBins || []
        }));
        setBins(updatedBins);
      }
    } catch (error) {
      console.error('Error fetching bin data:', error);
      // Use default data if fetch fails
    }
  };

  /**
   * Updates bin fill levels in real-time based on category bins
   * Calculates the overall fill level as the maximum fill level among category bins
   * Simulates natural decrease over time (waste being processed/removed)
   * Bins decrease gradually unless manually drained or new waste is added
   */
  // Then in your updateBinFillLevels function, update this part:

const updateBinFillLevels = () => {
  setBins(prevBins =>
    prevBins.map(bin => {
      const updatedCategoryBins = bin.categoryBins.map(catBin => {
        if (catBin.fillLevel > 0) {
          const decreaseAmount = 0.1 + (Math.random() * 0.2);
          const newCatFillLevel = Math.max(0, catBin.fillLevel - decreaseAmount);
          // Round to nearest 10
          return {
            ...catBin,
            fillLevel: roundToTen(newCatFillLevel)
          };
        }
        return {
          ...catBin,
          fillLevel: 0
        };
      });

      const maxFillLevel = updatedCategoryBins.length > 0
        ? Math.max(...updatedCategoryBins.map(cb => cb.fillLevel))
        : bin.fillLevel;

      const minutesAgo = Math.floor(Math.random() * 3) + 1;
      const updateTime = minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`;

      return {
        ...bin,
        fillLevel: roundToTen(maxFillLevel), // Round to nearest 10
        lastUpdate: updateTime,
        categoryBins: updatedCategoryBins
      };
    })
  );
};

  /**
   * Handles bin click to navigate to detail view
   * Sets the selected bin ID to show that bin's category bins
   * @param {Object} bin - The clicked bin object
   */
  const handleBinClick = (bin) => {
    setSelectedBinId(bin.id);
    setView('detail');
  };

  /**
   * Handles back button click to return to list view
   */
  const handleBack = () => {
    setView('list');
  };

  /**
   * Drains a specific category bin by setting fill level to 0%
   * Only affects the category bin for the currently selected bin
   * @param {string} categoryBinId - The ID of the category bin to drain (e.g., 'non-bio-1')
   */
  const handleDrain = async (categoryBinId) => {
    try {
      // Update in Supabase if you have a bins table (for category bins)
      const { error } = await supabase
        .from('bins')
        .update({ fill_level: 0, last_update: new Date().toISOString() })
        .eq('id', categoryBinId);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means table doesn't exist, which is okay for now
        console.warn('Bins table may not exist:', error);
      }

      // Update only the category bin for the selected bin
      if (selectedBinId) {
        setBins(prevBins =>
          prevBins.map(bin =>
            bin.id === selectedBinId
              ? {
                  ...bin,
                  categoryBins: bin.categoryBins.map(catBin =>
                    catBin.id === categoryBinId
                      ? { ...catBin, fillLevel: 0, lastCollection: 'Just now' }
                      : catBin
                  )
                }
              : bin
          )
        );
      }
    } catch (error) {
      console.error('Error draining category bin:', error);
      // Still update local state even if database update fails
      if (selectedBinId) {
        setBins(prevBins =>
          prevBins.map(bin =>
            bin.id === selectedBinId
              ? {
                  ...bin,
                  categoryBins: bin.categoryBins.map(catBin =>
                    catBin.id === categoryBinId
                      ? { ...catBin, fillLevel: 0, lastCollection: 'Just now' }
                      : catBin
                  )
                }
              : bin
          )
        );
      }
    }
  };

  /**
   * Drains a specific list view bin (Bin 1, Bin 2, etc.)
   * Only affects the specific bin in the list view
   * @param {number} binId - The ID of the list view bin to drain
   */
  const handleDrainListBin = async (binId) => {
    try {
      // Update in Supabase if you have a bins table
      const { error } = await supabase
        .from('bins')
        .update({ fill_level: 0, last_update: new Date().toISOString() })
        .eq('id', binId);

      if (error && error.code !== 'PGRST116') {
        console.warn('Bins table may not exist:', error);
      }

      // Update the bin and all its category bins
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === binId
            ? {
                ...bin,
                fillLevel: 0,
                lastUpdate: 'Just now',
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: 'Just now'
                }))
              }
            : bin
        )
      );
    } catch (error) {
      console.error('Error draining list bin:', error);
      // Still update local state even if database update fails
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === binId
            ? {
                ...bin,
                fillLevel: 0,
                lastUpdate: 'Just now',
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: 'Just now'
                }))
              }
            : bin
        )
      );
    }
  };

  /**
   * Shows the drain all confirmation modal
   * Called when user clicks "Drain All" button
   * Prevents accidental draining by requiring user confirmation
   */
  const handleDrainAll = () => {
    if (!selectedBinId) return;
    // Show confirmation modal before draining
    setShowDrainAllModal(true);
  };

  /**
   * Confirms and executes draining all category bins for the currently selected bin
   * Only affects the category bins of the selected bin, not other bins
   * Called after user confirms in the modal
   */
  const confirmDrainAll = async () => {
    if (!selectedBinId) return;

    try {
      // Update all category bins for the selected bin in Supabase
      const selectedBin = bins.find(b => b.id === selectedBinId);
      if (selectedBin) {
        const categoryBinIds = selectedBin.categoryBins.map(cb => cb.id);
        for (const catBinId of categoryBinIds) {
          const { error } = await supabase
            .from('bins')
            .update({ fill_level: 0, last_update: new Date().toISOString() })
            .eq('id', catBinId);

          if (error && error.code !== 'PGRST116') {
            // PGRST116 means table doesn't exist, which is okay for now
            console.warn('Bins table may not exist:', error);
          }
        }
      }

      // Update local state - only drain category bins for the selected bin
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === selectedBinId
            ? {
                ...bin,
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: 'Just now'
                }))
              }
            : bin
        )
      );

      // Close the modal after successful drain
      setShowDrainAllModal(false);
    } catch (error) {
      console.error('Error draining all category bins:', error);
      // Still update local state even if database update fails
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === selectedBinId
            ? {
                ...bin,
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: 'Just now'
                }))
              }
            : bin
        )
      );
      // Close the modal even if there's an error
      setShowDrainAllModal(false);
    }
  };

  /**
   * Calculates number of category bins requiring action for the selected bin
   * Counts full bins (>=90%) and almost full bins (75-89%)
   * @returns {Object} Object with full and almostFull counts
   */
  const getActionRequiredCount = () => {
    if (!selectedBinId) return { full: 0, almostFull: 0 };
    
    const selectedBin = bins.find(b => b.id === selectedBinId);
    if (!selectedBin || !selectedBin.categoryBins) return { full: 0, almostFull: 0 };
    
    const full = selectedBin.categoryBins.filter(b => b.fillLevel >= 90).length;
    const almostFull = selectedBin.categoryBins.filter(b => b.fillLevel >= 75 && b.fillLevel < 90).length;
    return { full, almostFull };
  };

  const { full, almostFull } = getActionRequiredCount();
  
  // Get the selected bin's category bins for display
  const selectedBin = bins.find(b => b.id === selectedBinId);
  const currentCategoryBins = selectedBin?.categoryBins || [];

  /**
   * Alert Icon Component for confirmation modals
   * Displays a warning icon in modals
   * @returns {JSX.Element} Alert icon SVG
   */
  const AlertIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );

  /**
   * Gets status text based on fill level for the main bin
   * @param {number} fillLevel - Fill level percentage
   * @returns {string} Status text
   */
  const getMainBinStatus = (fillLevel) => {
    if (fillLevel >= 90) return 'Full';
    if (fillLevel >= 75) return 'Almost Full';
    if (fillLevel >= 50) return 'Normal';
    return 'Empty';
  };

  /**
   * Gets CSS class for status badge based on fill level
   * @param {number} fillLevel - Fill level percentage
   * @returns {string} CSS class name
   */
  const getMainBinStatusClass = (fillLevel) => {
    if (fillLevel >= 90) return 'status-full';
    if (fillLevel >= 75) return 'status-almost-full';
    if (fillLevel >= 50) return 'status-normal';
    return 'status-empty';
  };

  // Render detail view when a bin is clicked - Shows category bins
  if (view === 'detail' && selectedBin) {
    return (
      <div className="bin-monitoring-container">
        {/* Drain All Confirmation Modal */}
        {showDrainAllModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-icon-wrapper">
                <AlertIcon />
              </div>
              <h3>Drain All Bins?</h3>
              <p>Are you sure you want to drain all category bins for {selectedBin?.name || 'this bin'}? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn-modal btn-cancel" onClick={() => setShowDrainAllModal(false)}>
                  No, Cancel
                </button>
                <button className="btn-modal btn-confirm" onClick={confirmDrainAll}>
                  Yes, Drain All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail View Header */}
        <div className="bin-monitoring-header">
          <div className="header-left-detail">
            <h1 className="bin-name-header">{selectedBin?.name || 'BIN'}</h1>
            <p>Monitor bin fill levels in real-time</p>
          </div>
          <div className="header-actions">
            <button className="action-btn back-btn" onClick={handleBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <button className="action-btn drain-all-btn" onClick={handleDrainAll}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>
              </svg>
              DRAIN ALL
            </button>
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

        {/* Category Bin Cards with Drain Buttons - Shows only selected bin's category bins */}
        <div className="bin-detail-cards">
          {currentCategoryBins.map(catBin => (
            <BinDetailCard 
              key={catBin.id} 
              bin={catBin} 
              onDrain={handleDrain}
            />
          ))}
        </div>
      </div>
    );
  }

  // Calculate action required for main bins
  const mainBinsFull = bins.filter(b => b.fillLevel >= 90).length;
  const mainBinsAlmostFull = bins.filter(b => b.fillLevel >= 75 && b.fillLevel < 90).length;

  // Render list view (default) - Shows main bins (Bin 1, Bin 2, etc.)
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
          <p>{mainBinsFull} bin full, {mainBinsAlmostFull} bins almost full</p>
        </div>
      </div>

      {/* Bin List Cards - Clickable to view details */}
      <div className="bin-list-cards">
        {bins.map(bin => (
          <BinListCard 
            key={bin.id} 
            bin={bin} 
            onClick={() => handleBinClick(bin)} 
          />
        ))}
      </div>
    </div>
  );
};

export default BinMonitoring;
