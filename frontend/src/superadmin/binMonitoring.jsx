/**
 * Bin Monitoring Component
 * Real-time monitoring of waste bin fill levels with two views:
 * 1. List View: Shows all bins with system power indicators
 * 2. Detail View: Shows category-specific bins with drain functionality
 * Features: Click bins to view details, drain individual or all bins
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './superadmincss/binMonitoring.css';

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
const BinListCard = ({ bin, onClick, isArchived = false }) => {
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

  // Get color class based on category
  const getColorClass = () => {
    if (bin.category === 'Biodegradable') return 'green';
    if (bin.category === 'Non-Biodegradable' || bin.category === 'Non Biodegradable') return 'red';
    if (bin.category === 'Recyclable') return 'blue';
    return 'lime'; // Default for Unsorted or others
  };

  // Get icon based on category - All bins use TrashIcon like Bin 2
  const getCategoryIcon = () => {
    return <TrashIcon />; // All bins use the same icon as Bin 2
  };

  return (
    <div className={`bin-list-card ${isArchived ? 'archived' : getColorClass()}`} onClick={onClick}>
      {/* Colored Header Section */}
      <div className="bin-list-header">
        {/* Icon Circle */}
        <div className="bin-list-icon-wrapper">
          {getCategoryIcon()}
          </div>
        
        {/* Bin Name */}
        <h3 className="bin-list-category-name">{bin.name}</h3>
        {/* Assigned Collector */}
        <p className="bin-list-assigned-for">
          Assign For: <span className="assign-for-name">{bin.assigned_collector_name || 'Unassigned'}</span>
        </p>
      </div>

      {/* White Body Section */}
      <div className="bin-list-body">
        <div className="bin-list-fill-info">
          <div className="fill-level-section">
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
          <div className="bin-list-meta-info">
            <div className="bin-list-info-row">
              <span className="info-label">Last Collection</span>
              <span className="info-value">{bin.lastUpdate}</span>
            </div>
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

  // Get the icon based on category
  const getCategoryIcon = () => {
    if (bin.icon) return bin.icon;
    // Default icons based on color class
    if (bin.colorClass === 'green') return <LeafIcon />;
    if (bin.colorClass === 'red') return <TrashIcon />;
    if (bin.colorClass === 'blue') return <RecycleIcon />;
    return <GearIcon />;
  };

  // Get category color based on colorClass
  const getCategoryColor = () => {
    if (bin.colorClass === 'green') return '#10b981'; // Biodegradable
    if (bin.colorClass === 'red') return '#ef4444'; // Non-Biodegradable
    if (bin.colorClass === 'blue') return '#f97316'; // Recyclable
    return '#6b7280'; // Unsorted (lime)
  };

  return (
    <div className={`bin-detail-card ${bin.colorClass}`}>
      {/* Colored Header Section - Top */}
      <div className="bin-detail-header">
        <div className="bin-detail-icon-wrapper">
          {getCategoryIcon()}
        </div>
        <h3 className="bin-detail-category-name">{bin.category}</h3>
      </div>
      
      {/* White Body Section - Bottom */}
      <div className="bin-detail-body">
        <div className="bin-detail-fill-info">
          <div className="fill-info">
            <div className="fill-level-section">
            <span className="fill-level-label">Fill Level</span>
            <span 
              className="fill-percent" 
                style={{ color: getCategoryColor() }}
            >
              {bin.fillLevel}%
            </span>
          </div>
            <div className="progress-track">
            <div 
                className="progress-fill" 
              style={{ 
                width: `${bin.fillLevel}%`,
                  backgroundColor: getCategoryColor()
              }}
            ></div>
          </div>
            </div>
          <div className="meta-info">
            <div className="meta-row">
              <span className="meta-label">Last Collection</span>
              <strong className="meta-val">{bin.lastCollection}</strong>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

/**
 * Main Bin Monitoring Component
 * Manages two views: list view and detail view
 * Handles bin data fetching, draining operations, and navigation
 * @param {Object} props - openArchiveFromSidebar: open archive view when true; onViewedArchiveFromSidebar: callback to clear sidebar request; onArchiveViewChange: callback(isArchive) when archive view toggles; requestExitArchiveView: when true, exit archive view; onExitedArchiveView: callback to clear exit request
 */
const BinMonitoring = ({ openArchiveFromSidebar, onViewedArchiveFromSidebar, onArchiveViewChange, requestExitArchiveView, onExitedArchiveView }) => {
  // State to track current view ('list' or 'detail')
  const [view, setView] = useState('list');
  // State to track which bin is currently selected for detail view
  const [selectedBinId, setSelectedBinId] = useState(null);
  // State to control Search Bin dropdown visibility
  const [isBinDropdownOpen, setIsBinDropdownOpen] = useState(false);
  // State for selected bins (for archiving)
  const [selectedBinsForArchive, setSelectedBinsForArchive] = useState([]);
  // State for bin search term
  const [binSearchTerm, setBinSearchTerm] = useState('');
  // State to track if we're viewing archived bins
  const [isArchiveView, setIsArchiveView] = useState(false);
  // State to control the visibility of the drain all confirmation modal
  const [showDrainAllModal, setShowDrainAllModal] = useState(false);
  // State for unarchive confirmation modal
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [binToUnarchive, setBinToUnarchive] = useState(null);
  // State for archive confirmation modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const binsPerPage = 4;
  // State for Add Bin modal
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  const [binFormData, setBinFormData] = useState({
  location: ''
});
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  
  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Alert');
  
const fetchCollectors = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, middle_name')
      .eq('role', 'COLLECTOR')
      .eq('status', 'ACTIVE')
      .order('first_name', { ascending: true });
    
    if (error) throw error;
    setCollectors(data || []);
  } catch (error) {
    console.error('Error fetching collectors:', error);
  }
};

  // State for list view bins, each with its own independent category bins
const [bins, setBins] = useState([]);
const [collectors, setCollectors] = useState([]);

  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setIsNotificationHiding(false);

    setTimeout(() => {
      setIsNotificationHiding(true);
      setTimeout(() => {
        setShowNotification(false);
        setIsNotificationHiding(false);
      }, 300);
    }, 3000);
  };

  const closeNotification = () => {
    setIsNotificationHiding(true);
    setTimeout(() => {
      setShowNotification(false);
      setIsNotificationHiding(false);
    }, 300);
  };

  // Open archive view when requested from sidebar
  useEffect(() => {
    if (openArchiveFromSidebar) {
      setIsArchiveView(true);
      setView('list');
      setCurrentPage(1);
      onViewedArchiveFromSidebar?.();
    }
  }, [openArchiveFromSidebar, onViewedArchiveFromSidebar]);

  // Notify parent when archive view changes (for sidebar: know when to exit on trigger click)
  useEffect(() => {
    onArchiveViewChange?.(isArchiveView);
  }, [isArchiveView, onArchiveViewChange]);

  // Exit archive view when user clicks "Bin Monitoring" in sidebar while in archive view
  useEffect(() => {
    if (requestExitArchiveView) {
      setIsArchiveView(false);
      setView('list');
      setCurrentPage(1);
      onExitedArchiveView?.();
    }
  }, [requestExitArchiveView, onExitedArchiveView]);

  // Fetch bin data on component mount and when archive view toggles
  useEffect(() => {
  fetchBinData();
  fetchCollectors(); // Add this line
  
  const interval = setInterval(() => {
    updateBinFillLevels();
  }, 2000);

  return () => clearInterval(interval);
}, [isArchiveView]);

  // Reset to page 1 when filter selection (Search Bin checkboxes) changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBinsForArchive]);

  /**
   * Fetches bin data from Supabase database
   * Falls back to default data if database fetch fails
   */
const fetchBinData = async () => {
  try {
    const statusFilter = isArchiveView ? 'INACTIVE' : 'ACTIVE';
    const { data, error } = await supabase
      .from('bins')
      .select(`
        *,
        assigned_collector:users!bins_assigned_collector_id_fkey(
          id,
          first_name,
          last_name,
          middle_name
        )
      `)
      .eq('status', statusFilter)
      .order('id', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const updatedBins = data.map(bin => ({
        id: bin.id,
        name: bin.name,
        fillLevel: 0, // Will be updated from IoT later
        systemPower: bin.system_power || 100,
        capacity: bin.capacity || '20kg',
        lastUpdate: 'Just now',
        category: 'Biodegradable',
        location: bin.location,
        assigned_collector_id: bin.assigned_collector_id,
        assigned_collector_name: bin.assigned_collector 
          ? `${bin.assigned_collector.first_name} ${bin.assigned_collector.middle_name || ''} ${bin.assigned_collector.last_name}`.trim()
          : 'Unassigned',
        categoryBins: [
          {
            id: `bio-${bin.id}`,
            category: 'Biodegradable',
            fillLevel: 0,
            capacity: '100 L',
            lastCollection: 'Just now',
            colorClass: 'green',
            icon: <LeafIcon />
          },
          {
            id: `non-bio-${bin.id}`,
            category: 'Non Biodegradable',
            fillLevel: 0,
            capacity: '100 L',
            lastCollection: 'Just now',
            colorClass: 'red',
            icon: <TrashIcon />
          },
          {
            id: `recycle-${bin.id}`,
            category: 'Recyclable',
            fillLevel: 0,
            capacity: '100L',
            lastCollection: 'Just now',
            colorClass: 'blue',
            icon: <RecycleIcon />
          },
          {
            id: `unsorted-${bin.id}`,
            category: 'Unsorted',
            fillLevel: 0,
            capacity: '100L',
            lastCollection: 'Just now',
            colorClass: 'lime',
            icon: <GearIcon />
          }
        ]
      }));
      
      setBins(updatedBins);
    } else {
      // No bins in database
      setBins([]);
    }
  } catch (error) {
    console.error('Error fetching bin data:', error);
    setBins([]);
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
   * For archived bins, shows unarchive confirmation instead
   * @param {Object} bin - The clicked bin object
   */
  const handleBinClick = (bin) => {
    if (isArchiveView) {
      // Show unarchive confirmation for archived bins
      setBinToUnarchive(bin);
      setShowUnarchiveModal(true);
    } else {
      // Navigate to detail view for active bins
      setSelectedBinId(bin.id);
      setView('detail');
    }
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
    // After updating local state, add:
await supabase.from('activity_logs').insert([{
  activity_type: 'BIN_DRAINED',
  description: `Drained ${bins.find(b => b.id === binId)?.name || 'Bin'}`,
  bin_id: binId
}]);
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

      // After closing the modal, add:
      const selectedBin = bins.find(b => b.id === selectedBinId);
        await supabase.from('activity_logs').insert([{
          activity_type: 'BIN_DRAINED_ALL',
          description: `Drained all category bins for ${selectedBin?.name || 'Bin'}`,
          bin_id: selectedBinId
      }]);

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
        {/* Unarchive Confirmation Modal */}
        {showUnarchiveModal && binToUnarchive && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-icon-wrapper">
                <AlertIcon />
              </div>
              <h3>Unarchive Bin?</h3>
              <p>Are you sure you want to unarchive {binToUnarchive.name}? This will restore it to the active bins list.</p>
              <div className="modal-actions">
                <button className="btn-modal btn-cancel" onClick={() => {
                  setShowUnarchiveModal(false);
                  setBinToUnarchive(null);
                }}>
                  No, Cancel
                </button>
                <button className="btn-modal btn-confirm" onClick={async () => {
                  try {
                    setLoading(true);
                    // Unarchive the bin
                    const { error } = await supabase
                      .from('bins')
                      .update({ status: 'ACTIVE' })
                      .eq('id', binToUnarchive.id);
                    
                    if (error) throw error;
                    
                    // Log activity
                    await supabase.from('activity_logs').insert([{
                      activity_type: 'BIN_UNARCHIVED',
                      description: `Unarchived ${binToUnarchive.name}`,
                      bin_id: binToUnarchive.id
                    }]);
                    
                    // Remove from local state
                    setBins(prevBins => prevBins.filter(b => b.id !== binToUnarchive.id));
                    setShowUnarchiveModal(false);
                    setBinToUnarchive(null);
                    showSuccessNotification(`${binToUnarchive.name} unarchived successfully!`);
                  } catch (error) {
                    console.error('Error unarchiving bin:', error);
                    setAlertTitle('Error');
                    setAlertMessage('Error unarchiving bin: ' + error.message);
                    setShowAlertModal(true);
                    setShowUnarchiveModal(false);
                    setBinToUnarchive(null);
                  } finally {
                    setLoading(false);
                  }
                }}>
                  {loading ? 'Unarchiving...' : 'Yes, Unarchive'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            <p>Monitor bin fill levels</p>
          </div>
          <div className="header-actions">
            <button className="action-btn back-btn" onClick={handleBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
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

  // When checkboxes in Search Bin are selected, show only those bins on the page; when none selected, show all
  const displayBins = selectedBinsForArchive.length > 0
    ? bins.filter(bin => selectedBinsForArchive.includes(bin.id))
    : bins;

  // Calculate pagination from displayBins
  const totalPages = Math.max(1, Math.ceil(displayBins.length / binsPerPage));
  const indexOfLastBin = currentPage * binsPerPage;
  const indexOfFirstBin = indexOfLastBin - binsPerPage;
  const currentBins = displayBins.slice(indexOfFirstBin, indexOfLastBin);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle Add Bin form input change
  const handleBinInputChange = (e) => {
    const { name, value } = e.target;
    setBinFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Add Bin form submission
const handleAddBin = async (e) => {
  e.preventDefault();

  if (!binFormData.location || !binFormData.location.trim()) {
    setAlertTitle('Validation Error');
    setAlertMessage('Please enter the bin location.');
    setShowAlertModal(true);
    return;
  }
  
  setLoading(true);

  try {
    // Get current bins count to generate next bin number
    const { data: existingBins, error: countError } = await supabase
      .from('bins')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    // Generate bin name (Bin 1, Bin 2, etc.)
    const nextBinNumber = existingBins && existingBins.length > 0 
      ? existingBins[0].id + 1 
      : 1;
    const newBinName = `Bin ${nextBinNumber}`;

    // Insert into database (no assigned collector on add)
    const { data: newBinData, error } = await supabase
      .from('bins')
      .insert([{
        name: newBinName,
        location: binFormData.location.trim(),
        capacity: '20kg', // Default capacity
        system_power: 100,
        status: 'ACTIVE'
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Create new bin object for local state (unassigned on add)
    const newBin = {
      id: newBinData.id,
      name: newBinData.name,
      fillLevel: 0,
      systemPower: 100,
      capacity: newBinData.capacity,
      lastUpdate: 'Just now',
      category: 'Biodegradable',
      location: newBinData.location,
      assigned_collector_id: newBinData.assigned_collector_id || null,
      assigned_collector_name: 'Unassigned',
      categoryBins: [
        {
          id: `bio-${newBinData.id}`,
          category: 'Biodegradable',
          fillLevel: 0,
          capacity: '100 L',
          lastCollection: 'Just now',
          colorClass: 'green',
          icon: <LeafIcon />
        },
        {
          id: `non-bio-${newBinData.id}`,
          category: 'Non Biodegradable',
          fillLevel: 0,
          capacity: '100 L',
          lastCollection: 'Just now',
          colorClass: 'red',
          icon: <TrashIcon />
        },
        {
          id: `recycle-${newBinData.id}`,
          category: 'Recyclable',
          fillLevel: 0,
          capacity: '100L',
          lastCollection: 'Just now',
          colorClass: 'blue',
          icon: <RecycleIcon />
        },
        {
          id: `unsorted-${newBinData.id}`,
          category: 'Unsorted',
          fillLevel: 0,
          capacity: '100L',
          lastCollection: 'Just now',
          colorClass: 'lime',
          icon: <GearIcon />
        }
      ]
    };

    // Add to bins array
    setBins(prev => [...prev, newBin]);

    // Log activity
    await supabase.from('activity_logs').insert([{
      activity_type: 'BIN_ADDED',
      description: `Added ${newBinData.name} at ${newBinData.location}`,
      bin_id: newBinData.id
    }]);

    // Reset form
    setBinFormData({
      location: ''
    });

    // Close modal
    setShowAddBinModal(false);
    showSuccessNotification(`${newBinName} created successfully at ${newBinData.location}!`);
  } catch (error) {
    console.error('Error adding bin:', error);
    setAlertTitle('Error');
    setAlertMessage('Error adding bin: ' + error.message);
    setShowAlertModal(true);
  } finally {
    setLoading(false);
  }
};

  // Render list view (default) - Shows main bins (Bin 1, Bin 2, etc.)
  return (
    <div className="bin-monitoring-container">
      {/* Unarchive Confirmation Modal */}
      {showUnarchiveModal && binToUnarchive && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon-wrapper">
              <AlertIcon />
            </div>
            <h3>Unarchive Bin?</h3>
            <p>Are you sure you want to unarchive {binToUnarchive.name}? This will restore it to the active bins list.</p>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={() => {
                setShowUnarchiveModal(false);
                setBinToUnarchive(null);
              }}>
                No, Cancel
              </button>
              <button className="btn-modal btn-confirm" onClick={async () => {
                try {
                  setLoading(true);
                  // Unarchive the bin
                  const { error } = await supabase
                    .from('bins')
                    .update({ status: 'ACTIVE' })
                    .eq('id', binToUnarchive.id);
                  
                  if (error) throw error;
                  
                  // Log activity
                  await supabase.from('activity_logs').insert([{
                    activity_type: 'BIN_UNARCHIVED',
                    description: `Unarchived ${binToUnarchive.name}`,
                    bin_id: binToUnarchive.id
                  }]);
                  
                  // Remove from local state
                  setBins(prevBins => prevBins.filter(b => b.id !== binToUnarchive.id));
                  setShowUnarchiveModal(false);
                  setBinToUnarchive(null);
                  showSuccessNotification(`${binToUnarchive.name} unarchived successfully!`);
                } catch (error) {
                  console.error('Error unarchiving bin:', error);
                  setAlertTitle('Error');
                  setAlertMessage('Error unarchiving bin: ' + error.message);
                  setShowAlertModal(true);
                  setShowUnarchiveModal(false);
                  setBinToUnarchive(null);
                } finally {
                  setLoading(false);
                }
              }}>
                {loading ? 'Unarchiving...' : 'Yes, Unarchive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (() => {
        // Get bin names for selected bins
        const selectedBinNames = bins
          .filter(bin => selectedBinsForArchive.includes(bin.id))
          .map(bin => bin.name)
          .join(', ');
        
        return (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-icon-wrapper">
                <AlertIcon />
              </div>
              <h3>{isArchiveView ? 'Unarchive Bins?' : 'Archive Bins?'}</h3>
              <p>Are you sure you want to {isArchiveView ? 'unarchive' : 'archive'} {selectedBinNames}? {isArchiveView ? 'They will be restored to the active bins list.' : 'They will be moved to the archive.'}</p>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={() => {
                setShowArchiveModal(false);
              }}>
                No, Cancel
              </button>
              <button className="btn-modal btn-confirm" onClick={async () => {
                try {
                  setLoading(true);
                  if (isArchiveView) {
                    // Unarchive selected bins
                    const { error } = await supabase
                      .from('bins')
                      .update({ status: 'ACTIVE' })
                      .in('id', selectedBinsForArchive);
                    
                    if (error) throw error;
                    
                    // Log activity
                    for (const binId of selectedBinsForArchive) {
                      const bin = bins.find(b => b.id === binId);
                      await supabase.from('activity_logs').insert([{
                        activity_type: 'BIN_UNARCHIVED',
                        description: `Unarchived ${bin?.name || 'Bin'}`,
                        bin_id: binId
                      }]);
                    }
                    
                    // Remove unarchived bins from local state (they'll appear in active view)
                    setBins(prevBins => prevBins.filter(b => !selectedBinsForArchive.includes(b.id)));
                    setSelectedBinsForArchive([]);
                    setIsBinDropdownOpen(false);
                    setShowArchiveModal(false);
                    showSuccessNotification(`${selectedBinsForArchive.length} bin(s) unarchived successfully!`);
                  } else {
                    // Archive selected bins
                    const { error } = await supabase
                      .from('bins')
                      .update({ status: 'INACTIVE' })
                      .in('id', selectedBinsForArchive);
                    
                    if (error) throw error;
                    
                    // Log activity
                    for (const binId of selectedBinsForArchive) {
                      const bin = bins.find(b => b.id === binId);
                      await supabase.from('activity_logs').insert([{
                        activity_type: 'BIN_ARCHIVED',
                        description: `Archived ${bin?.name || 'Bin'}`,
                        bin_id: binId
                      }]);
                    }
                    
                    // Remove archived bins from local state
                    setBins(prevBins => prevBins.filter(b => !selectedBinsForArchive.includes(b.id)));
                    setSelectedBinsForArchive([]);
                    setIsBinDropdownOpen(false);
                    setShowArchiveModal(false);
                    showSuccessNotification(`${selectedBinsForArchive.length} bin(s) archived successfully!`);
                  }
                } catch (error) {
                  console.error(`Error ${isArchiveView ? 'unarchiving' : 'archiving'} bins:`, error);
                  setAlertTitle('Error');
                  setAlertMessage(`Error ${isArchiveView ? 'unarchiving' : 'archiving'} bins: ` + error.message);
                  setShowAlertModal(true);
                  setShowArchiveModal(false);
                } finally {
                  setLoading(false);
                }
              }}>
                {loading ? (isArchiveView ? 'Unarchiving...' : 'Archiving...') : (isArchiveView ? 'Yes, Unarchive' : 'Yes, Archive')}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Success Notification Toast */}
      {showNotification && (
        <div className={`notification-toast ${isNotificationHiding ? 'hiding' : ''}`}>
          <div className="notification-icon">✓</div>
          <div className="notification-content">
            <p className="notification-title">Success!</p>
            <p className="notification-message">{notificationMessage}</p>
          </div>
          <button className="notification-close" onClick={closeNotification}>×</button>
        </div>
      )}
      
      {/* Add Bin Modal */}
      {showAddBinModal && (
        <div className="modal-overlay">
          <div className="modal-content maximized">
            <div className="modal-header">
              <h2>Add New Bin</h2>
        </div>
            <form onSubmit={handleAddBin} className="employee-form">
  <div className="form-grid">
    <div className="form-group">
      <label>Bin Location *</label>
      <input
        type="text"
        name="location"
        value={binFormData.location}
        onChange={handleBinInputChange}
        placeholder="e.g., Building A - 1st Floor"
        required
      />
    </div>
  </div>
  
  <div className="modal-footer">
    <button type="button" className="btn-secondary" onClick={() => setShowAddBinModal(false)}>
      Cancel
    </button>
    <button type="submit" className="btn-primary" disabled={loading}>
      {loading ? 'Creating...' : 'Create Bin'}
    </button>
  </div>
</form>
          </div>
        </div>
      )}

      {/* List View Header */}
      <div className="bin-monitoring-header">
        <div>
          <h1>{isArchiveView ? 'Archive Bins' : 'Bin Monitoring'}</h1>
          <p>{isArchiveView ? 'View archived bins' : 'Monitor bin fill levels'}</p>
        </div>
        {/* Search Bin Dropdown Button - same style as Add Bin */}
        <div className="bin-search-dropdown-wrapper">
          <button
            className="add-bin-header-button"
            onClick={() => {
              setIsBinDropdownOpen((prev) => {
                if (!prev) {
                  // Opening dropdown - keep search term
                  return true;
                } else {
                  // Closing dropdown - reset search term
                  setBinSearchTerm('');
                  return false;
                }
              });
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8h16" />
              <path d="M4 16h16" />
              <path d="M10 12h10" />
            </svg>
            Search Bin
            <span className="bin-search-caret">▾</span>
          </button>

          {isBinDropdownOpen && (
            <div className="bin-search-dropdown">
              {/* Search bar at the top */}
              <div className="bin-search-input-wrapper">
                <input
                  type="text"
                  className="bin-search-input"
                  placeholder="Search Bin #"
                  value={binSearchTerm}
                  onChange={(e) => setBinSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="bin-search-icon"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              {/* Archive button as second item */}
              <div className="bin-search-dropdown-item bin-search-archive-item">
                <button
                  className={`bin-archive-button ${isArchiveView ? 'bin-unarchive-button' : ''}`}
                  onClick={() => {
                    if (selectedBinsForArchive.length === 0) {
                      setAlertTitle('No Selection');
                      setAlertMessage(`Please select at least one bin to ${isArchiveView ? 'unarchive' : 'archive'}.`);
                      setShowAlertModal(true);
                      return;
                    }
                    // Show confirmation modal
                    setShowArchiveModal(true);
                  }}
                  disabled={loading || selectedBinsForArchive.length === 0}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {isArchiveView ? (
                      <>
                        <path d="M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/>
                        <path d="M21 9l-9-6-9 6"/>
                        <path d="M12 3v12"/>
                      </>
                    ) : (
                      <>
                        <polyline points="21 8 21 21 3 21 3 8"/>
                        <rect x="1" y="3" width="22" height="5"/>
                        <line x1="10" y1="12" x2="14" y2="12"/>
                      </>
                    )}
                  </svg>
                  {isArchiveView ? `Unarchive (${selectedBinsForArchive.length})` : `Archive (${selectedBinsForArchive.length})`}
                </button>
              </div>
              {/* Add Bin button as second item (hidden in archive view) */}
              {!isArchiveView && (
                <button
                  className="bin-search-dropdown-item bin-search-add-item"
                  onClick={() => {
                    setShowAddBinModal(true);
                    setIsBinDropdownOpen(false);
                  }}
                >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '8px', verticalAlign: 'middle' }}
                >
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Bin
              </button>
              )}
              {(() => {
                // Filter bins based on search term (bin number only)
                const filteredBins = bins.filter(bin => {
                  if (!binSearchTerm.trim()) return true;
                  // Extract number from bin name (e.g., "Bin 6" -> "6")
                  const binNumber = bin.name.replace(/[^0-9]/g, '');
                  return binNumber.includes(binSearchTerm.trim());
                });

                // Check if all filtered bins are selected
                const allFilteredSelected = filteredBins.length > 0 && filteredBins.every(bin => selectedBinsForArchive.includes(bin.id));
                const someFilteredSelected = filteredBins.some(bin => selectedBinsForArchive.includes(bin.id));

                if (filteredBins.length === 0) {
                  return (
                    <>
                      {/* Select All button - appears when at least one checkbox is selected */}
                      {selectedBinsForArchive.length > 0 && (
                        <button
                          className="bin-search-dropdown-item bin-search-select-all-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBinsForArchive([]);
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginRight: '8px', verticalAlign: 'middle' }}
                          >
                            <polyline points="9 11 12 14 22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                          Deselect All
                        </button>
                      )}
                      <div className="bin-search-dropdown-item bin-search-empty">
                        {bins.length === 0 ? 'No bins available' : 'No bins found'}
                      </div>
                    </>
                  );
                }

                return (
                  <>
                    {/* Select All button - appears when at least one checkbox is selected */}
                    {selectedBinsForArchive.length > 0 && (
                      <button
                        className="bin-search-dropdown-item bin-search-select-all-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allFilteredSelected) {
                            // Deselect all filtered bins
                            setSelectedBinsForArchive(prev => prev.filter(id => !filteredBins.some(b => b.id === id)));
                          } else {
                            // Select all filtered bins
                            const filteredBinIds = filteredBins.map(b => b.id);
                            setSelectedBinsForArchive(prev => {
                              const newSelection = [...prev];
                              filteredBinIds.forEach(id => {
                                if (!newSelection.includes(id)) {
                                  newSelection.push(id);
                                }
                              });
                              return newSelection;
                            });
                          }
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ marginRight: '8px', verticalAlign: 'middle' }}
                        >
                          {allFilteredSelected ? (
                            <>
                              <polyline points="9 11 12 14 22 4"/>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </>
                          ) : (
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          )}
                        </svg>
                        {allFilteredSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                    {filteredBins.map((bin) => (
                        <div
                          key={bin.id}
                          className="bin-search-dropdown-item bin-search-item-with-checkbox"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBinsForArchive.includes(bin.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedBinsForArchive(prev => [...prev, bin.id]);
                              } else {
                                setSelectedBinsForArchive(prev => prev.filter(id => id !== bin.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bin-checkbox"
                          />
                          <span className="bin-name-text">{bin.name}</span>
                        </div>
                      ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Bin List Cards - Clickable to view details */}
      <div className="bin-list-cards">
        {currentBins.map(bin => (
          <BinListCard 
            key={bin.id} 
            bin={bin} 
            onClick={() => handleBinClick(bin)}
            isArchived={isArchiveView}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          {currentPage > 1 && (
            <button 
              className="pagination-btn pagination-first"
              onClick={() => handlePageChange(1)}
            >
              First Page
            </button>
          )}
          <button 
            className="pagination-btn pagination-prev"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                className={`pagination-btn pagination-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            );
          })}
          <button 
            className="pagination-btn pagination-next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          {currentPage < totalPages && (
            <button 
              className="pagination-btn pagination-last"
              onClick={() => handlePageChange(totalPages)}
            >
              Last Page
            </button>
          )}
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowAlertModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="modal-icon-wrapper">
              <AlertIcon />
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#1f2937' }}>{alertTitle}</h2>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
              {alertMessage}
            </p>
            <div className="modal-btn-group">
              <button 
                className="btn-confirm" 
                onClick={() => setShowAlertModal(false)}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinMonitoring;
