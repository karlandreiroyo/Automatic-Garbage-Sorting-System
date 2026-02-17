/**
 * Bin Monitoring Component
 * Real-time monitoring of waste bin fill levels with two views:
 * 1. List View: Shows all bins with system power indicators
 * 2. Detail View: Shows category-specific bins with drain functionality
 * Features: Click bins to view details, drain individual or all bins
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BinListCard from '../components/BinListCard';
import './admincss/binMonitoring.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Add this helper function at the top of your BinMonitoring.jsx file, after the imports

/**
 * Rounds fill level to nearest 10
 * @param {number} level - Fill level percentage
 * @returns {number} Rounded fill level (0, 10, 20, ..., 100)
 */
const roundToTen = (level) => {
  return Math.round(level / 10) * 10;
};

/**
 * Format last_update from Supabase for display (date/time, no "minutes ago")
 * @param {string|null|undefined} isoString - ISO date string from DB
 * @returns {string} Formatted string or "—" if missing
 */
const formatLastCollection = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '—';
  }
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
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
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
            <div className="meta-row meta-row-stacked">
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
  // State to control the visibility of the drain all confirmation modal
  const [showDrainAllModal, setShowDrainAllModal] = useState(false);
  // selectedBinsForArchive kept for filter logic (admin: no dropdown, so always show all bins)
  const [selectedBinsForArchive, setSelectedBinsForArchive] = useState([]);
  const [binSearchTerm, setBinSearchTerm] = useState('');
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [binToUnarchive, setBinToUnarchive] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const binsPerPage = 4;
  // State for Add Bin modal (kept for code; no button to open in admin)
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  const [binFormData, setBinFormData] = useState({
    location: '',
    assigned_collector_id: '',
    device_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  
  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Alert');

  // Collection history modal (Recent button on list view) and inline section (Recent on detail view)
  const [showCollectionHistoryModal, setShowCollectionHistoryModal] = useState(false);
  const [showCollectionHistoryInline, setShowCollectionHistoryInline] = useState(false);
  const [collectionHistoryBin, setCollectionHistoryBin] = useState(null);
  const [collectionHistoryCategory, setCollectionHistoryCategory] = useState(null);
  const [collectionHistoryItems, setCollectionHistoryItems] = useState([]);
  const [loadingCollectionHistory, setLoadingCollectionHistory] = useState(false);
  
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
const binsRef = React.useRef(bins);
binsRef.current = bins;
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

  const openCollectionHistory = async (bin, categoryBinOrFilter, showOnPage = false) => {
    const mainBin = bin && bin.id && typeof bin.id === 'number' ? bin : null;
    const categoryLabel = categoryBinOrFilter && typeof categoryBinOrFilter === 'object' ? categoryBinOrFilter.category : (categoryBinOrFilter || null);
    const binToUse = mainBin || bin;
    setCollectionHistoryBin(binToUse);
    setCollectionHistoryCategory(categoryLabel);
    if (showOnPage) {
      setShowCollectionHistoryInline(true);
    } else {
      setShowCollectionHistoryModal(true);
    }
    setLoadingCollectionHistory(true);
    setCollectionHistoryItems([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCollectionHistoryItems([]);
        setLoadingCollectionHistory(false);
        return;
      }
      const params = new URLSearchParams({ bin_id: String(binToUse.id) });
      if (categoryLabel) {
        const dbCategory = categoryLabel === 'Non Biodegradable' ? 'Non-Bio' : categoryLabel === 'Recyclable' ? 'Recycle' : categoryLabel;
        params.set('category', dbCategory);
      }
      const res = await fetch(`${API_BASE}/api/admin/recorded-items?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Recorded items API error:', json.message || res.statusText);
        setCollectionHistoryItems([]);
        setLoadingCollectionHistory(false);
        return;
      }
      setCollectionHistoryItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error('Error fetching collection history:', err);
      setCollectionHistoryItems([]);
    } finally {
      setLoadingCollectionHistory(false);
    }
  };

  const closeCollectionHistory = () => {
    setShowCollectionHistoryModal(false);
    setShowCollectionHistoryInline(false);
    setCollectionHistoryBin(null);
    setCollectionHistoryCategory(null);
    setCollectionHistoryItems([]);
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
  fetchCollectors();
  
  const interval = setInterval(() => {
    updateBinFillLevelsFromBackend();
  }, 5000);

  // Real-time: update bin levels as soon as waste_items or bins change in the database
  const channel = supabase
    .channel('admin_bin_levels_realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waste_items' }, () => {
      updateBinFillLevelsFromBackend();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'waste_items' }, () => {
      updateBinFillLevelsFromBackend();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bins' }, () => {
      updateBinFillLevelsFromBackend();
    })
    .subscribe();

  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}, [isArchiveView]);

  // Reset to page 1 when filter selection (Search Bin checkboxes) or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBinsForArchive, binSearchTerm]);

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
        lastUpdate: formatLastCollection(bin.last_update),
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
      updateBinFillLevelsFromBackend(updatedBins);
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

const ITEMS_FOR_FULL_BIN = 50;   // 50 waste items = 100% fill level
const ITEMS_FOR_FULL_CATEGORY = 20; // 20 items per category = 100%

/** Normalize waste_items category to our category bin key */
const normalizeCategory = (cat) => {
  if (!cat) return 'Unsorted';
  const s = String(cat).toLowerCase();
  if (s.includes('bio') && !s.includes('non')) return 'Biodegradable';
  if (s.includes('non') && s.includes('bio')) return 'Non Biodegradable';
  if (s.includes('recycl')) return 'Recyclable';
  return 'Unsorted';
};

/** Fetch fill levels from backend (same source as database) so admin matches collector/DB */
const updateBinFillLevelsFromBackend = async (binsOverride) => {
  const currentBins = binsOverride ?? binsRef.current;
  if (!currentBins || currentBins.length === 0) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const status = isArchiveView ? 'INACTIVE' : 'ACTIVE';
    const res = await fetch(`${API_BASE}/api/admin/bin-levels?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const json = await res.json().catch(() => ({}));
    if (!json.success || !Array.isArray(json.bins)) return;
    const levelsByBin = {};
    json.bins.forEach(b => { levelsByBin[b.id] = b; });
    const merged = currentBins.map(bin => {
      const fromApi = levelsByBin[bin.id];
      if (!fromApi) return bin;
      const lastUpdateStr = fromApi.last_update ? formatLastCollection(fromApi.last_update) : bin.lastUpdate;
      const categoryFillByCat = {};
      const categoryLastCollectionByCat = {};
      (fromApi.byCategory || []).forEach(c => {
        categoryFillByCat[c.category] = c.fillLevel;
        categoryLastCollectionByCat[c.category] = c.last_update ? formatLastCollection(c.last_update) : '—';
      });
      const updatedCategoryBins = bin.categoryBins.map(cb => ({
        ...cb,
        fillLevel: categoryFillByCat[cb.category] ?? cb.fillLevel,
        lastCollection: categoryLastCollectionByCat[cb.category] ?? cb.lastCollection ?? '—'
      }));
      return {
        ...bin,
        fillLevel: fromApi.fillLevel ?? bin.fillLevel,
        lastUpdate: lastUpdateStr,
        categoryBins: updatedCategoryBins
      };
    });
    setBins(merged);
  } catch (err) {
    console.warn('updateBinFillLevelsFromBackend:', err);
  }
};

  /**
   * Handles bin click to navigate to detail view
   * Sets the selected bin ID to show that bin's category bins
   * @param {Object} bin - The clicked bin object
   */
  const handleBinClick = (bin) => {
    if (isArchiveView) {
      setBinToUnarchive(bin);
      setShowUnarchiveModal(true);
    } else {
      setSelectedBinId(bin.id);
      setView('detail');
      setShowCollectionHistoryInline(true);
      openCollectionHistory(bin, null, true);
    }
  };

  /**
   * Handles back button click to return to list view
   */
  const handleBack = () => {
    setShowCollectionHistoryInline(false);
    setView('list');
  };

  /**
   * Drains a specific category bin by setting fill level to 0%
   * Only affects the category bin for the currently selected bin
   * @param {string} categoryBinId - The ID of the category bin to drain (e.g., 'non-bio-1')
   */
  const handleDrain = async (categoryBinId) => {
    try {
      const match = categoryBinId?.match(/^(bio|non-bio|recycle|unsorted)-(\d+)$/i);
      const physicalBinId = match ? parseInt(match[2], 10) : null;
      const catKey = match ? { bio: 'Biodegradable', 'non-bio': 'Non Biodegradable', recycle: 'Recyclable', unsorted: 'Unsorted' }[match[1].toLowerCase()] : null;
      if (physicalBinId && catKey) {
        const variants = catKey === 'Non Biodegradable' ? ['Non Biodegradable', 'Non-Bio'] : catKey === 'Recyclable' ? ['Recyclable', 'Recycle'] : [catKey];
        await supabase.from('waste_items').delete().eq('bin_id', physicalBinId).in('category', variants);
      }
      if (selectedBinId) {
        await supabase.from('bins').update({ last_update: new Date().toISOString() }).eq('id', selectedBinId);
      }
      const formattedNow = formatLastCollection(new Date().toISOString());
      if (selectedBinId) {
        setBins(prevBins =>
          prevBins.map(bin =>
            bin.id === selectedBinId
              ? {
                  ...bin,
                  lastUpdate: formattedNow,
                  categoryBins: bin.categoryBins.map(catBin =>
                    catBin.id === categoryBinId
                      ? { ...catBin, fillLevel: 0, lastCollection: formattedNow }
                      : catBin
                  )
                }
              : bin
          )
        );
      }
    } catch (error) {
      console.error('Error draining category bin:', error);
      const formattedNow = formatLastCollection(new Date().toISOString());
      if (selectedBinId) {
        setBins(prevBins =>
          prevBins.map(bin =>
            bin.id === selectedBinId
              ? {
                  ...bin,
                  lastUpdate: formattedNow,
                  categoryBins: bin.categoryBins.map(catBin =>
                    catBin.id === categoryBinId
                      ? { ...catBin, fillLevel: 0, lastCollection: formattedNow }
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
      await supabase.from('waste_items').delete().eq('bin_id', binId);
      await supabase.from('bins').update({ fill_level: 0, last_update: new Date().toISOString() }).eq('id', binId);
      // Update the bin and all its category bins
      const formattedNow = formatLastCollection(new Date().toISOString());
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === binId
            ? {
                ...bin,
                fillLevel: 0,
                lastUpdate: formattedNow,
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: formattedNow
                }))
              }
            : bin
        )
      );
    } catch (error) {
      console.error('Error draining list bin:', error);
      const formattedNow = formatLastCollection(new Date().toISOString());
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === binId
            ? {
                ...bin,
                fillLevel: 0,
                lastUpdate: formattedNow,
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: formattedNow
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

  const handleUnassignBin = async (bin, e) => {
    if (e) e.stopPropagation();
    if (!bin?.id || !bin.assigned_collector_id) return;
    try {
      const { error } = await supabase
        .from('bins')
        .update({ assigned_collector_id: null, assigned_at: null })
        .eq('id', bin.id);
      if (error) throw error;
      setBins(prevBins =>
        prevBins.map(b =>
          b.id === bin.id
            ? { ...b, assigned_collector_id: null, assigned_collector_name: 'Unassigned' }
            : b
        )
      );
    } catch (err) {
      console.error('Error unassigning bin:', err);
      setAlertTitle('Error');
      setAlertMessage(err.message || 'Failed to unassign bin.');
      setShowAlertModal(true);
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
      await supabase.from('waste_items').delete().eq('bin_id', selectedBinId);
      await supabase.from('bins').update({ fill_level: 0, last_update: new Date().toISOString() }).eq('id', selectedBinId);
      const formattedNow = formatLastCollection(new Date().toISOString());
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === selectedBinId
            ? {
                ...bin,
                lastUpdate: formattedNow,
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: formattedNow
                }))
              }
            : bin
        )
      );

      const selectedBin = bins.find(b => b.id === selectedBinId);
      await supabase.from('activity_logs').insert([{
        activity_type: 'BIN_DRAINED_ALL',
        description: `Drained all category bins for ${selectedBin?.name || 'Bin'}`,
        bin_id: selectedBinId
      }]);
      setShowDrainAllModal(false);
    } catch (error) {
      console.error('Error draining all category bins:', error);
      const formattedNow = formatLastCollection(new Date().toISOString());
      setBins(prevBins =>
        prevBins.map(bin =>
          bin.id === selectedBinId
            ? {
                ...bin,
                lastUpdate: formattedNow,
                categoryBins: bin.categoryBins.map(catBin => ({
                  ...catBin,
                  fillLevel: 0,
                  lastCollection: formattedNow
                }))
              }
            : bin
        )
      );
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
            <p>Monitor bin fill levels {selectedBin?.id != null && `· Bin ID: ${selectedBin.id}`}</p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="action-btn recent-btn"
              onClick={() => openCollectionHistory(selectedBin, null, true)}
              aria-label={`View collection history for ${selectedBin?.name}`}
            >
              Recent
            </button>
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

        {/* Recorded Items / Collection History (shown when bin is clicked) */}
        {showCollectionHistoryInline && collectionHistoryBin && (
          <div className="collection-history-inline">
            <div className="collection-history-inline-header">
              <h3>Recorded Items – {collectionHistoryBin.name}{collectionHistoryCategory ? ` (${collectionHistoryCategory})` : ''}</h3>
              <button type="button" className="collection-history-inline-close" onClick={() => setShowCollectionHistoryInline(false)} aria-label="Hide collection history">×</button>
            </div>
            {loadingCollectionHistory ? (
              <div className="collection-history-inline-loading">Loading collection history...</div>
            ) : collectionHistoryItems.length === 0 ? (
              <div className="collection-history-inline-empty">No items recorded in this bin yet.</div>
            ) : (
              <div className="collection-history-inline-list-wrap">
                <ul className="collection-history-inline-list">
                  {collectionHistoryItems.map((item) => (
                    <li key={item.id} className="collection-history-inline-item">
                      <span className="collection-history-inline-date">
                        {item.created_at ? new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </span>
                      <span className="collection-history-inline-category">{item.category || 'Unsorted'}</span>
                      {item.processing_time != null && (
                        <span className="collection-history-inline-time">{item.processing_time}s</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // When checkboxes in Search Bin are selected, show only those bins; when none selected, show all. Then filter by search (multiple bin numbers e.g. "4, 9, 10").
  const binsBySelection = selectedBinsForArchive.length > 0
    ? bins.filter(bin => selectedBinsForArchive.includes(bin.id))
    : bins;
  const searchTerms = binSearchTerm
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => /^\d+$/.test(s));
  const displayBins = searchTerms.length === 0
    ? binsBySelection
    : binsBySelection.filter(bin => {
        const binNumber = (bin.name || '').replace(/[^0-9]/g, '');
        const binNum = binNumber ? parseInt(binNumber, 10) : NaN;
        if (Number.isNaN(binNum)) return false;
        return searchTerms.some(term => binNum === parseInt(term, 10));
      });

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
  
  if (!binFormData.assigned_collector_id) {
    setAlertTitle('Validation Error');
    setAlertMessage('Please select a collector to assign to this bin.');
    setShowAlertModal(true);
    return;
  }

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

    // Insert into database (device_id links bin to hardware)
    const insertPayload = {
      name: newBinName,
      location: binFormData.location.trim(),
      capacity: '20kg',
      assigned_collector_id: parseInt(binFormData.assigned_collector_id),
      assigned_at: new Date().toISOString(),
      system_power: 100,
      status: 'ACTIVE'
    };
    if (binFormData.device_id?.trim()) insertPayload.device_id = binFormData.device_id.trim();

    const { data: newBinData, error } = await supabase
      .from('bins')
      .insert([insertPayload])
      .select(`
        *,
        assigned_collector:users!bins_assigned_collector_id_fkey(
          id,
          first_name,
          last_name,
          middle_name
        )
      `)
      .single();

    if (error) throw error;

    // Create new bin object for local state
    const newBin = {
      id: newBinData.id,
      name: newBinData.name,
      fillLevel: 0,
      systemPower: 100,
      capacity: newBinData.capacity,
      lastUpdate: formatLastCollection(newBinData.last_update ?? new Date().toISOString()),
      category: 'Biodegradable',
      location: newBinData.location,
      assigned_collector_id: newBinData.assigned_collector_id,
      assigned_collector_name: newBinData.assigned_collector 
        ? `${newBinData.assigned_collector.first_name} ${newBinData.assigned_collector.middle_name || ''} ${newBinData.assigned_collector.last_name}`.trim()
        : 'Unassigned',
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
      location: '',
      assigned_collector_id: '',
      device_id: ''
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
    
    <div className="form-group">
      <label>Assigned Collector *</label>
      <select 
        name="assigned_collector_id" 
        value={binFormData.assigned_collector_id} 
        onChange={handleBinInputChange}
        required
      >
        <option value="">Select Collector</option>
        {collectors.map(collector => (
          <option key={collector.id} value={collector.id}>
            {collector.first_name} {collector.middle_name ? collector.middle_name + ' ' : ''}{collector.last_name}
          </option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label>Device ID (optional)</label>
      <input
        type="text"
        name="device_id"
        value={binFormData.device_id}
        onChange={handleBinInputChange}
        placeholder="e.g., raspberry-pi-1 or arduino-com7"
      />
      <span className="form-hint">Links this bin to hardware. Hardware sends this ID so detections go to this bin.</span>
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

      {/* List View Header - title left, search + Add Bin right (same layout as superadmin) */}
      <div className="bin-monitoring-header">
        <div>
          <h1>{isArchiveView ? 'Archive Bins' : 'Bin Monitoring'}</h1>
          <p>{isArchiveView ? 'View archived bins' : 'Monitor bin fill levels'}</p>
        </div>
        <div className="bin-header-right-column">
          <div className="bin-search-and-archive-row bin-search-and-archive-in-header">
            <div className="bin-search-bar-above-cards">
              <div className="bin-search-input-inner">
                <input
                  type="text"
                  className="bin-search-input"
                  placeholder="Search by bin # (e.g. 4, 9, 10)"
                  value={binSearchTerm}
                  onChange={(e) => setBinSearchTerm(e.target.value)}
                  aria-label="Search bins"
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bin-search-icon">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>
            {!isArchiveView && (
              <button
                type="button"
                className="bin-add-bin-button-inline"
                onClick={() => setShowAddBinModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Bin
              </button>
            )}
          </div>
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
            assignedPosition="header"
            showUnassignButton={!isArchiveView}
            onUnassign={handleUnassignBin}
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
          <button
            className="pagination-btn pagination-last"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last Page
          </button>
        </div>
      )}

      {/* Collection History Modal (Recent button) */}
      {showCollectionHistoryModal && collectionHistoryBin && (
        <div className="modal-overlay collection-history-overlay" onClick={closeCollectionHistory}>
          <div className="modal-card collection-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="collection-history-header">
              <h2>Collection History – {collectionHistoryBin.name}{collectionHistoryCategory ? ` (${collectionHistoryCategory})` : ''}</h2>
              <button type="button" className="collection-history-close" onClick={closeCollectionHistory} aria-label="Close">×</button>
            </div>
            {loadingCollectionHistory ? (
              <div className="collection-history-loading">Loading collection history...</div>
            ) : collectionHistoryItems.length === 0 ? (
              <div className="collection-history-empty">No collection history for this bin yet.</div>
            ) : (
              <div className="collection-history-list-wrap">
                <ul className="collection-history-list">
                  {collectionHistoryItems.map((item) => (
                    <li key={item.id} className="collection-history-item">
                      <span className="collection-history-date">
                        {item.created_at ? new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </span>
                      <span className="collection-history-category">{item.category || 'Unsorted'}</span>
                      {item.processing_time != null && (
                        <span className="collection-history-time">{item.processing_time}s</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
