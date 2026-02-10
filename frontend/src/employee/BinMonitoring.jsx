import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../supabaseClient";
import HardwareStatus from "../components/HardwareStatus";
import "../employee/employeecss/BinMonitoring.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Rounds fill level to nearest 10
 * @param {number} level - Fill level percentage
 * @returns {number} Rounded fill level (0, 10, 20, ..., 100)
 */
const roundToTen = (level) => {
  return Math.round(level / 10) * 10;
};

// --- ICONS ---
const LeafIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg> );
const TrashIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> );
const RecycleIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 5 2.39 4.143"/><path d="M8.293 13.53 11 19"/><path d="M19.324 11.06 14 5"/><path d="m3.727 6.465 1.272-2.119a1.84 1.84 0 0 1 1.565-.891H11.25"/><path d="m14 5-2.707 4.53"/></svg> );
const GearIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> );
const DrainAllIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l5 5 5-5M7 13l5 5 5-5"/></svg> );
const AlertTriangle = () => ( <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );

const getFillLevelColor = (fillLevel) => {
  if (fillLevel >= 50) return '#10b981'; 
  if (fillLevel >= 30) return '#eab308'; 
  if (fillLevel >= 15) return '#f97316'; 
  return '#ef4444'; 
};

// --- SINGLE BIN CARD COMPONENT ---
const BinCard = React.memo(({ title, capacity, fillLevel, lastCollection, colorClass, status, icon: Icon, onDrain, isSelected, onToggle }) => {
  const isEmpty = fillLevel === 0;

  return (
    <div className={`bin-card ${colorClass} ${isSelected ? 'selected-card' : ''}`}>
      <div className="bin-header">
        <div className="icon-circle"><Icon /></div>
        <h3>{title}</h3>
      </div>

      <div className="bin-body">
         <div className="fill-info">
           <span className="label">Fill Level</span>
           <span className="value" style={{ color: isEmpty ? '#9ca3af' : getFillLevelColor(fillLevel) }}>{fillLevel}%</span>
         </div>
         <div className="progress-track">
           <div className="progress-fill" style={{ width: `${fillLevel}%`, backgroundColor: getFillLevelColor(fillLevel) }}></div>
         </div>
        <div className="meta-info">
          <div className="meta-row"><span className="meta-label">Last Collection</span><strong className="meta-val">{lastCollection}</strong></div>
        </div>
      </div>
    </div>
  );
});

// --- HELPER: PORTAL COMPONENT ---
const ModalPortal = ({ children }) => {
  return ReactDOM.createPortal(
    <div className="modal-backdrop">
      {children}
    </div>,
    document.body 
  );
};

// Base bin definition (icons not serializable; use INITIAL_BINS for merge on restore)
const INITIAL_BINS = [
  { id: 'Biodegradable', title: 'Biodegradable', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'green', status: 'Empty', icon: LeafIcon },
  { id: 'Non Biodegradable', title: 'Non-Bio', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'red', status: 'Empty', icon: TrashIcon },
  { id: 'Recyclable', title: 'Recyclable', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'blue', status: 'Empty', icon: RecycleIcon },
  { id: 'Unsorted', title: 'Unsorted', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'lime', status: 'Empty', icon: GearIcon },
];

const BinMonitoring = () => {
  const [bins, setBins] = useState(INITIAL_BINS);
  const [notification, setNotification] = useState("");
  const [selectedBins, setSelectedBins] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, binsToDrain: [] });
  const [assignedBinLocationText, setAssignedBinLocationText] = useState("");
  const [collectorName, setCollectorName] = useState("");
  const [collectorInfo, setCollectorInfo] = useState(null);
  const [collectorBins, setCollectorBins] = useState([]);
  const [hasPersistedBinState, setHasPersistedBinState] = useState(false);
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const lastArduinoTypeRef = useRef("NORMAL");
  const binsRef = useRef(bins);
  binsRef.current = bins;

  // Persist bins to backend + localStorage (so tab switch / refresh keeps percentages)
  const persistBinsToBackendAndStorage = (binsToSave) => {
    const list = Array.isArray(binsToSave) ? binsToSave : binsRef.current;
    const serializable = list.map((b) => ({ id: b.id, fillLevel: b.fillLevel, status: b.status, lastCollection: b.lastCollection }));
    try {
      localStorage.setItem("agss_bin_state", JSON.stringify(serializable));
      fetch(`${API_BASE}/api/collector-bins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bins: serializable }) }).catch(() => {});
    } catch {}
  };

  // Restore: backend first, then localStorage. No DB fetch / no auto-decrease.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/collector-bins`);
        const data = res.ok ? await res.json() : {};
        const backendBins = data?.bins;
        if (cancelled) return;
        if (Array.isArray(backendBins) && backendBins.length > 0) {
          setBins(INITIAL_BINS.map((base) => {
            const ov = backendBins.find((b) => b.id === base.id);
            if (!ov) return base;
            return { ...base, fillLevel: ov.fillLevel ?? base.fillLevel, status: ov.status ?? base.status, lastCollection: ov.lastCollection ?? base.lastCollection };
          }));
          setHasPersistedBinState(true);
          setRestoreAttempted(true);
          if (!cancelled) setIsRestoring(false);
          return;
        }
        const saved = localStorage.getItem("agss_bin_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && !cancelled) {
            setBins(INITIAL_BINS.map((base) => {
              const ov = parsed.find((b) => b.id === base.id);
              if (!ov) return base;
              return { ...base, fillLevel: ov.fillLevel ?? base.fillLevel, status: ov.status ?? base.status, lastCollection: ov.lastCollection ?? base.lastCollection };
            }));
            setHasPersistedBinState(true);
          }
        }
      } catch {}
      if (!cancelled) { setRestoreAttempted(true); setIsRestoring(false); }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  // Collector name + assigned bins (for waste_items)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data: userRow, error: userError } = await supabase.from('users').select('id, first_name, middle_name, last_name').eq('auth_id', session.user.id).maybeSingle();
        if (userError || !userRow) return;
        const parts = [userRow.first_name?.trim(), userRow.middle_name?.trim() !== 'EMPTY' && userRow.middle_name?.trim() !== 'NULL' ? userRow.middle_name?.trim() : null, userRow.last_name?.trim()].filter(Boolean);
        if (parts.length) setCollectorName(parts.join(' '));
        setCollectorInfo({ id: userRow.id, first_name: userRow.first_name, middle_name: userRow.middle_name, last_name: userRow.last_name });
        const { data: assignedBins, error: binsError } = await supabase.from('bins').select('id, name, location').eq('assigned_collector_id', userRow.id).eq('status', 'ACTIVE');
        if (binsError || !assignedBins?.length) return;
        setCollectorBins(assignedBins);
        const locations = assignedBins.map((b) => (b.location?.trim() || b.name || 'Unspecified')).filter(Boolean);
        if (locations.length) setAssignedBinLocationText(locations.length === 1 ? `Located at ${locations[0]}` : `Located at ${locations.join(', ')}`);
      } catch {}
    };
    load();
  }, []);

  // Arduino detection: NORMAL -> type adds 10% to matching bin, persist, notification, waste_items
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hardware/status`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const type = (data.lastType || "").toUpperCase();
        const prev = lastArduinoTypeRef.current || "NORMAL";
        lastArduinoTypeRef.current = type || "NORMAL";
        if (!type || type === "NORMAL" || prev !== "NORMAL") return;
        // 10% → Info. 90%+ → Critical (Bin Full). No warning at 50%.
        let newNotification = null;
        const nextBins = binsRef.current.map((bin) => {
          const isTarget = (type === "BIO" && bin.id === "Biodegradable") || (type === "NON_BIO" && bin.id === "Non Biodegradable") || (type === "RECYCABLE" && bin.id === "Recyclable") || (type === "UNSORTED" && bin.id === "Unsorted");
          if (!isTarget) return bin;
          const raw = Math.min(100, bin.fillLevel + 10);
          const rounded = roundToTen(raw);
          if (rounded === 10) {
            newNotification = { id: Date.now(), type: "info", title: "Bin update", time: "Just now", date: "", message: `${bin.title} bin is at 10% capacity`, subtext: bin.title, fillLevel: "10%", capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          } else if (rounded >= 90) {
            newNotification = { id: Date.now(), type: "critical", title: "Bin Full Alert", time: "Just now", date: "", message: `${bin.title} bin has reached ${rounded}% — bin is full`, subtext: bin.title, fillLevel: `${rounded}%`, capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          }
          return { ...bin, fillLevel: rounded, status: rounded >= 90 ? "Full" : rounded >= 75 ? "Almost Full" : rounded >= 50 ? "Normal" : "Empty" };
        });
        setBins(nextBins);
        persistBinsToBackendAndStorage(nextBins);
        if (newNotification) {
          try {
            const raw = localStorage.getItem("agss_notifications");
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem("agss_notifications", JSON.stringify([...existing, newNotification].slice(-100)));
          } catch {}
        }
        if (collectorInfo && collectorBins.length > 0) {
          const categoryMap = { BIO: "Biodegradable", NON_BIO: "Non Biodegradable", RECYCABLE: "Recyclable", UNSORTED: "Unsorted" };
          const categoryText = categoryMap[type];
          if (categoryText) {
            try {
              await supabase.from("waste_items").insert({ bin_id: collectorBins[0].id, category: categoryText, weight: null, processing_time: null, last_name: collectorInfo.last_name, first_name: collectorInfo.first_name, middle_name: collectorInfo.middle_name });
            } catch {}
          }
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [collectorInfo, collectorBins]);

  // Persist on every bins change + on unmount
  useEffect(() => { persistBinsToBackendAndStorage(bins); }, [bins]);
  useEffect(() => { return () => persistBinsToBackendAndStorage(binsRef.current); }, []);

  /**
   * Fetches bin data from Supabase and aggregates category bins
   */
  const fetchBinData = async () => {
    try {
      const { data, error } = await supabase
        .from('bins')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Aggregate category bins from all bins
        // For employee view, we show aggregated fill levels across all bins for each category
        const categoryBinsMap = {
          'Biodegradable': { fillLevel: 0, lastCollection: 'Just now' },
          'Non Biodegradable': { fillLevel: 0, lastCollection: 'Just now' },
          'Recyclable': { fillLevel: 0, lastCollection: 'Just now' },
          'Unsorted': { fillLevel: 0, lastCollection: 'Just now' }
        };

        // Process each bin's category bins (simulated from bin data)
        data.forEach(bin => {
          // For now, we'll use a simple approach: distribute fill_level across categories
          // In a real system, you'd have separate category bin tables
          // This is a simplified aggregation
          const baseFillLevel = bin.fill_level || 0;
          
          // Distribute fill level across categories (example logic)
          // In production, you'd fetch from category_bins table
          categoryBinsMap['Biodegradable'].fillLevel = Math.max(
            categoryBinsMap['Biodegradable'].fillLevel,
            roundToTen(baseFillLevel * 0.3)
          );
          categoryBinsMap['Non Biodegradable'].fillLevel = Math.max(
            categoryBinsMap['Non Biodegradable'].fillLevel,
            roundToTen(baseFillLevel * 0.3)
          );
          categoryBinsMap['Recyclable'].fillLevel = Math.max(
            categoryBinsMap['Recyclable'].fillLevel,
            roundToTen(baseFillLevel * 0.2)
          );
          categoryBinsMap['Unsorted'].fillLevel = Math.max(
            categoryBinsMap['Unsorted'].fillLevel,
            roundToTen(baseFillLevel * 0.2)
          );

          if (bin.last_update) {
            const updateDate = new Date(bin.last_update);
            const now = new Date();
            const diffMinutes = Math.floor((now - updateDate) / (1000 * 60));
            
            let timeAgo = 'Just now';
            if (diffMinutes > 0) {
              if (diffMinutes === 1) timeAgo = '1 minute ago';
              else if (diffMinutes < 60) timeAgo = `${diffMinutes} minutes ago`;
              else {
                const diffHours = Math.floor(diffMinutes / 60);
                timeAgo = diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
              }
            }

            // Update last collection for the category with most recent update
            Object.keys(categoryBinsMap).forEach(cat => {
              if (!categoryBinsMap[cat].lastCollection || timeAgo < categoryBinsMap[cat].lastCollection) {
                categoryBinsMap[cat].lastCollection = timeAgo;
              }
            });
          }
        });

        // Update bins state with aggregated data
        setBins([
          { 
            id: 'Biodegradable', 
            title: 'Biodegradable', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Biodegradable'].fillLevel, 
            lastCollection: categoryBinsMap['Biodegradable'].lastCollection, 
            colorClass: 'green', 
            status: categoryBinsMap['Biodegradable'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Biodegradable'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: LeafIcon 
          },
          { 
            id: 'Non Biodegradable', 
            title: 'Non-Bio', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Non Biodegradable'].fillLevel, 
            lastCollection: categoryBinsMap['Non Biodegradable'].lastCollection, 
            colorClass: 'red', 
            status: categoryBinsMap['Non Biodegradable'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Non Biodegradable'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: TrashIcon 
          },
          { 
            id: 'Recyclable', 
            title: 'Recyclable', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Recyclable'].fillLevel, 
            lastCollection: categoryBinsMap['Recyclable'].lastCollection, 
            colorClass: 'blue', 
            status: categoryBinsMap['Recyclable'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Recyclable'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: RecycleIcon 
          },
          { 
            id: 'Unsorted', 
            title: 'Unsorted', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Unsorted'].fillLevel, 
            lastCollection: categoryBinsMap['Unsorted'].lastCollection, 
            colorClass: 'lime', 
            status: categoryBinsMap['Unsorted'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Unsorted'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: GearIcon 
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching bin data:', error);
    }
  };

  /**
   * Updates bin fill levels in real-time
   * Simulates gradual decrease and rounds to nearest 10
   */
  const updateBinFillLevels = () => {
    setBins(prevBins =>
      prevBins.map(bin => {
        if (bin.fillLevel > 0) {
          const decreaseAmount = 0.1 + (Math.random() * 0.2);
          const newFillLevel = Math.max(0, bin.fillLevel - decreaseAmount);
          return {
            ...bin,
            fillLevel: roundToTen(newFillLevel),
            status: roundToTen(newFillLevel) >= 90 ? 'Full' : roundToTen(newFillLevel) >= 75 ? 'Almost Full' : roundToTen(newFillLevel) >= 50 ? 'Normal' : 'Empty'
          };
        }
        return bin;
      })
    );
  };

  // --- STATE OF THE ART VALIDATION LOGIC ---
  
  // 1. Identify valid candidates globally (anything that HAS trash)
  const filledBins = useMemo(() => bins.filter(b => b.fillLevel > 0), [bins]);
  const urgentBinsCount = useMemo(() => bins.filter(bin => bin.fillLevel > 75).length, [bins]);

  // 2. Identify "Actionable" bins based on user selection
  const actionableBins = useMemo(() => {
    // If user has manually selected bins
    if (selectedBins.length > 0) {
      // Return intersection: Selected Bins that are ALSO Not Empty
      // This is "Forgiving Validation" - we ignore empty selections instead of blocking
      return bins.filter(b => selectedBins.includes(b.id) && b.fillLevel > 0);
    }
    // If no selection, action applies to ALL filled bins
    return filledBins;
  }, [bins, selectedBins, filledBins]);

  // 3. Determine button state
  const isButtonDisabled = actionableBins.length === 0;
  
  // 4. Determine button text
  const getButtonText = () => {
    if (selectedBins.length > 0) {
      // Smart Text: Show how many valid bins will be affected
      return `DRAIN SELECTED (${actionableBins.length})`;
    }
    return `DRAIN ALL (${actionableBins.length})`;
  };

  // --- HANDLERS ---

  const handleToggleSelect = (id) => {
    setSelectedBins(prev => 
      prev.includes(id) ? prev.filter(binId => binId !== id) : [...prev, id]
    );
  };

  const handleDrainSingle = (id) => {
    const bin = bins.find(b => b.id === id);
    if (bin && bin.fillLevel > 0) {
      setConfirmModal({ show: true, binsToDrain: [bin] });
    }
  };
  
  const handleMainButtonAction = () => {
    if (actionableBins.length > 0) {
      setConfirmModal({ show: true, binsToDrain: actionableBins });
    }
  };

  const performDrain = async () => {
    const idsToDrain = confirmModal.binsToDrain.map(b => b.id);
    
    // Update database (if you have category_bins table)
    try {
      // In a real system, you'd update the category_bins table
      // For now, we'll just update local state
      // await supabase.from('category_bins').update({ fill_level: 0 }).in('category', idsToDrain);
    } catch (error) {
      console.error('Error updating database:', error);
    }
    
    setBins(prevBins => prevBins.map(bin => {
      if (idsToDrain.includes(bin.id)) {
        return { ...bin, fillLevel: 0, status: 'Empty', lastCollection: 'Just now' };
      }
      return bin;
    }));

    setSelectedBins([]); // Clear selection after action
    setConfirmModal({ show: false, binsToDrain: [] });
    setNotification("Draining Process Complete.");
    setTimeout(() => { setNotification(""); }, 3000);
  };

  return (
    <div className="bin-monitoring-container">
      <div className="header-section">
        <div className="header-titles">
          <h1>Bin Monitoring</h1>
          <p>Monitor bin fill levels</p>
          {collectorName && <p className="collector-name">Collector: <strong>{collectorName}</strong></p>}
          {assignedBinLocationText && (
            <div className="assigned-bin-location-card">
              <span>{assignedBinLocationText}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- SMART NOTIFICATIONS (No blocking errors) --- */}
      
      {/* Informational: User selected some empty bins, but we don't block action */}
      {selectedBins.length > actionableBins.length && actionableBins.length > 0 && (
         <div className="notification-banner warning" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
           <span>ℹ️</span>
           <p>Note: {selectedBins.length - actionableBins.length} selected bin(s) are already empty and will be skipped.</p>
         </div>
      )}

      {notification && <div className="notification-banner success"><span>✓</span> <p>{notification}</p></div>}

      <HardwareStatus />

      {isRestoring ? (
        <div className="bin-levels-loading" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>Loading bin levels…</div>
      ) : (
      <div className="bin-grid-layout">
        {bins.map((bin) => (
          <BinCard 
            key={bin.id}
            {...bin}
            isSelected={selectedBins.includes(bin.id)}
            onToggle={() => handleToggleSelect(bin.id)}
            onDrain={() => handleDrainSingle(bin.id)}
            icon={bin.icon}
          />
        ))}
      </div>
      )}

      {confirmModal.show && (
        <ModalPortal>
          <div className="modal-card">
            <div className="modal-icon-wrapper"><AlertTriangle /></div>
            <h2>Confirm Drain</h2>
            <p>
              You are about to drain <strong>{confirmModal.binsToDrain.length}</strong> bin(s).
              <br/>
              <span style={{fontSize: '0.85rem', color: '#9ca3af'}}>
                ({confirmModal.binsToDrain.map(b => b.title).join(', ')})
              </span>
            </p>
            <div className="modal-btn-group">
              <button className="btn-cancel" onClick={() => setConfirmModal({ show: false, binsToDrain: [] })}>Cancel</button>
              <button className="btn-confirm" onClick={performDrain}>Yes, Drain</button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default BinMonitoring;