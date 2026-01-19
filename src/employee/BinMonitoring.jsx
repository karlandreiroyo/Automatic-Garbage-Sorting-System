import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom"; 
import "../employee/employeecss/BinMonitoring.css";

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
        <div className="bin-checkbox-wrapper" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <input 
            type="checkbox" 
            className="bin-checkbox" 
            checked={isSelected} 
            onChange={() => {}} // Controlled by wrapper click
          />
        </div>
        <div className="icon-circle"><Icon /></div>
        <h3>{title}</h3>
        {!isEmpty && status && <span className="bin-status">{status}</span>}
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
          <div className="meta-row"><span className="meta-label">Capacity</span><strong className="meta-val">{capacity}</strong></div>
          <div className="meta-row"><span className="meta-label">Last Collection</span><strong className="meta-val">{lastCollection}</strong></div>
        </div>
        <button className="drain-btn" onClick={(e) => { e.stopPropagation(); onDrain(); }} disabled={isEmpty}>
           {isEmpty ? 'Empty' : 'Drain Bin'}
        </button>
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

// --- MAIN COMPONENT ---
const BinMonitoring = () => {
  const [bins, setBins] = useState([
    { id: 'Biodegradable', title: 'Biodegradable', capacity: '100 L', fillLevel: 80, lastCollection: '2h ago', colorClass: 'green', status: 'Almost Full', icon: LeafIcon },
    { id: 'Non Biodegradable', title: 'Non-Bio', capacity: '100 L', fillLevel: 100, lastCollection: '4h ago', colorClass: 'red', status: 'Full', icon: TrashIcon },
    { id: 'Recyclable', title: 'Recyclable', capacity: '100 L', fillLevel: 86, lastCollection: '1h ago', colorClass: 'blue', status: 'Almost Full', icon: RecycleIcon },
    { id: 'Unsorted', title: 'Unsorted', capacity: '100 L', fillLevel: 83, lastCollection: '1h ago', colorClass: 'lime', status: 'Almost Full', icon: GearIcon },
  ]);

  const [notification, setNotification] = useState("");
  const [selectedBins, setSelectedBins] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, binsToDrain: [] });

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

  const performDrain = () => {
    const idsToDrain = confirmModal.binsToDrain.map(b => b.id);
    
    setBins(prevBins => prevBins.map(bin => {
      if (idsToDrain.includes(bin.id)) {
        return { ...bin, fillLevel: 0, status: '', lastCollection: 'Just now' };
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
          <h1>Real-Time Bin Monitoring</h1>
          <p>Monitor bin fill levels in real-time</p>
        </div>
        
        {/* SMART BUTTON */}
        <button 
          className={`primary-action-btn ${selectedBins.length > 0 ? 'btn-blue' : 'btn-green'}`} 
          onClick={handleMainButtonAction}
          disabled={isButtonDisabled} 
        >
          <DrainAllIcon />
          {getButtonText()}
        </button>
      </div>

      {/* --- SMART NOTIFICATIONS (No blocking errors) --- */}
      
      {/* Informational: User selected some empty bins, but we don't block action */}
      {selectedBins.length > actionableBins.length && actionableBins.length > 0 && (
         <div className="notification-banner warning" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
           <span>ℹ️</span>
           <p>Note: {selectedBins.length - actionableBins.length} selected bin(s) are already empty and will be skipped.</p>
         </div>
      )}

      {/* System Notice: Everything is empty */}
      {filledBins.length === 0 && (
        <div className="notification-banner success">
           <span>✓</span>
           <p><strong>System Optimized:</strong> All bins are currently empty. No actions needed.</p>
        </div>
      )}

      {notification && <div className="notification-banner success"><span>✓</span> <p>{notification}</p></div>}
      
      {urgentBinsCount > 0 && filledBins.length > 0 && !notification && (
        <div className="notification-banner warning">
          <span>⚠️</span> 
          <div><strong>Action Required:</strong> {urgentBinsCount} bin{urgentBinsCount > 1 ? 's' : ''} almost full or full</div>
        </div>
      )}

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