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
          <div className="meta-row"><span className="meta-label">Capacity</span><strong className="meta-val">{capacity}</strong></div>
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
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', target: '' });

  const urgentBinsCount = useMemo(() => bins.filter(bin => bin.fillLevel > 75).length, [bins]);

  // Check 1: Did the user select a bin that is empty?
  const hasEmptyBinSelected = useMemo(() => {
    return bins.some(b => selectedBins.includes(b.id) && b.fillLevel === 0);
  }, [bins, selectedBins]);

  // Check 2: Are ALL bins in the system empty?
  const areAllBinsEmpty = useMemo(() => {
    return bins.every(b => b.fillLevel === 0);
  }, [bins]);

  // Main Validation Logic
  const isDrainActionValid = useMemo(() => {
    // 1. If selection contains an empty bin -> INVALID
    if (hasEmptyBinSelected) return false;
    
    // 2. If NO selection, but ALL bins are empty -> INVALID
    if (selectedBins.length === 0 && areAllBinsEmpty) return false;

    // 3. Otherwise valid
    return true;
  }, [selectedBins, hasEmptyBinSelected, areAllBinsEmpty]);

  const handleToggleSelect = (id) => setSelectedBins(prev => prev.includes(id) ? prev.filter(binId => binId !== id) : [...prev, id]);
  const handleDrainSingle = (id) => setConfirmModal({ show: true, type: 'single', target: id });
  
  const handleMainButtonAction = () => {
    if (selectedBins.length > 0) setConfirmModal({ show: true, type: 'selected', target: `${selectedBins.length} selected` });
    else setConfirmModal({ show: true, type: 'all', target: 'ALL' });
  };

  const performDrain = () => {
    setBins(prevBins => prevBins.map(bin => {
      let shouldDrain = false;
      if (confirmModal.type === 'all') shouldDrain = true;
      if (confirmModal.type === 'selected' && selectedBins.includes(bin.id)) shouldDrain = true;
      if (confirmModal.type === 'single' && confirmModal.target === bin.id) shouldDrain = true;

      if (shouldDrain && bin.fillLevel > 0) {
        return { ...bin, fillLevel: 0, status: '', lastCollection: 'Just now' };
      }
      return bin;
    }));

    if (confirmModal.type === 'selected') setSelectedBins([]);
    setConfirmModal({ show: false, type: '', target: '' });
    setNotification("Draining Process Complete.");
    setTimeout(() => { setNotification(""); }, 3000);
  };

  return (
    <div className="bin-monitoring-container">
      <div className="header-section">
        <div className="header-titles">
          <h1>Bin Monitoring</h1>
          <p>Monitor bin fill levels</p>
        </div>
      </div>

      {/* --- VALIDATION 1: Selection Error --- */}
      {hasEmptyBinSelected && (
        <div className="notification-banner error">
           <span>🚫</span>
           <p><strong>Selection Error:</strong> You have selected an empty bin. Please deselect it to proceed.</p>
        </div>
      )}

      {/* --- VALIDATION 2: All Bins Empty (System Notice) --- */}
      {areAllBinsEmpty && selectedBins.length === 0 && (
        <div className="notification-banner error">
           <span>ℹ️</span>
           <p><strong>System Notice:</strong> All bins are currently empty. No drainage required.</p>
        </div>
      )}

      {notification && <div className="notification-banner success"><span>✓</span> <p>{notification}</p></div>}

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
            <p>Are you sure you want to drain the bin(s)?</p>
            <div className="modal-btn-group">
              <button className="btn-cancel" onClick={() => setConfirmModal({ show: false })}>Cancel</button>
              <button className="btn-confirm" onClick={performDrain}>Yes, Drain</button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default BinMonitoring;