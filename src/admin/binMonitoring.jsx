import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/binMonitoring.css';

// Icons
const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const RecycleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
    <path d="m14 5 2.39 4.143"/><path d="M8.293 13.53 11 19"/><path d="M19.324 11.06 14 5"/>
  </svg>
);

const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

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

const DrainAllIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>
  </svg>
);

// LIST VIEW CARD - Shows Bin 1, Bin 2, etc.
const BinListCard = ({ bin, onClick }) => {
  const getStatus = () => {
    if (bin.fillLevel >= 90) return 'Full';
    if (bin.fillLevel >= 75) return 'Almost Full';
    return 'Normal';
  };

  const getStatusClass = () => {
    if (bin.fillLevel >= 90) return 'status-full';
    if (bin.fillLevel >= 75) return 'status-almost-full';
    return 'status-normal';
  };

  return (
    <div className="bin-horizontal-card" onClick={onClick}>
      <div className="bin-card-left">
        <div className="system-power-row">
          <span className="label-text">SYSTEM POWER</span>
          <BatteryIcon level={bin.systemPower} />
        </div>
        <div className="bin-main-info">
          <h1 className="bin-title white-text">{bin.name}</h1>
          <p className="bin-cap white-text">Capacity: {bin.capacity}</p>
        </div>
        <div className={`status-pill ${getStatusClass()}`}>
          <span className="dot"></span> {getStatus()}
        </div>
      </div>

      <div className="bin-card-right">
        <div className="fill-stats-container">
          <div className="fill-header-row">
            <span className="fill-label">Fill Level</span>
            <span className="fill-percentage-big">{bin.fillLevel}%</span>
          </div>
          
          <div className="battery-box-body">
            <div className="battery-box-fill" style={{ width: `${bin.fillLevel}%` }}></div>
          </div>
          
          <span className="time-ago">{bin.lastUpdate}</span>
        </div>

        <div className="bin-mini-visual">
           <div className="visual-box">
              <div className="visual-fill" style={{ height: `${bin.fillLevel}%`, background: bin.fillLevel >= 90 ? '#059669' : '#34d399' }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

// DETAIL VIEW CARD - Employee Style (Biodegradable, Non-Biodegradable, etc.)
const BinDetailCard = ({ bin, onDrain }) => {
  return (
    <div className={`bin-card ${bin.colorClass}`}>
      <div className="bin-left">
        <div className="bin-left-top">
          {bin.icon}
          {bin.status && <span className="bin-status">⭐ {bin.status}</span>}
        </div>
        <div className="bin-left-bottom">
          <h3>{bin.category}</h3>
          <p>Capacity: {bin.capacity}</p>
        </div>
      </div>
      <div className="bin-right">
        <div className="bin-info">
          <div className="fill-level">
            <span>Fill Level</span>
            <span className="fill-percent">{bin.fillLevel}%</span>
          </div>
          <div className="fill-bar">
            <div className="fill-progress" style={{ height: "8px", width: `${bin.fillLevel}%` }}></div>
          </div>
          
          <div className="info-footer">
            <div className="last-collection">
              <span>Last Collection</span>
              <span className="collection-time">{bin.lastCollection}</span>
            </div>
          </div>
        </div>
        <div className="bin-visual">
          <div className="bin-fill" style={{ height: `${bin.fillLevel}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const BinMonitoring = () => {
  const [view, setView] = useState('list');
  const [notification, setNotification] = useState("");
  const [showActionRequired, setShowActionRequired] = useState(true);
  
  const [bins, setBins] = useState([
    { id: 1, name: 'Bin 1', fillLevel: 80, systemPower: 100, capacity: '20kg', lastUpdate: '2 hours ago', category: 'Biodegradable' },
    { id: 2, name: 'Bin 2', fillLevel: 100, systemPower: 50, capacity: '20kg', lastUpdate: '4 hours ago', category: 'Non-Biodegradable' },
    { id: 3, name: 'Bin 3', fillLevel: 86, systemPower: 20, capacity: '20kg', lastUpdate: '1 hour ago', category: 'Recyclable' },
    { id: 4, name: 'Bin 4', fillLevel: 83, systemPower: 100, capacity: '20kg', lastUpdate: '1 hour ago', category: 'Unsorted' }
  ]);

  const [categoryBins, setCategoryBins] = useState([
    { 
      id: 1, 
      category: 'Biodegradable', 
      fillLevel: 80, 
      capacity: '100 L', 
      lastCollection: '2 hours ago', 
      colorClass: 'green', 
      status: 'Almost Full',
      icon: <LeafIcon /> 
    },
    { 
      id: 2, 
      category: 'Non Biodegradable', 
      fillLevel: 100, 
      capacity: '100 L', 
      lastCollection: '4 hours ago', 
      colorClass: 'red', 
      status: 'Full',
      icon: <TrashIcon /> 
    },
    { 
      id: 3, 
      category: 'Recyclable', 
      fillLevel: 86, 
      capacity: '100 L', 
      lastCollection: '1 hour ago', 
      colorClass: 'blue', 
      status: 'Almost Full',
      icon: <RecycleIcon /> 
    },
    { 
      id: 4, 
      category: 'Unsorted', 
      fillLevel: 83, 
      capacity: '100 L', 
      lastCollection: '1 hour ago', 
      colorClass: 'lime', 
      status: 'Almost Full',
      icon: <GearIcon /> 
    }
  ]);

  const handleDrain = (binName, id) => {
    setNotification(`${binName} bin is draining...`);
    setTimeout(() => {
      setCategoryBins(prev => prev.map(b => 
        b.id === id ? { ...b, fillLevel: 0, lastCollection: 'Just now', status: 'Normal' } : b
      ));
      setNotification(`${binName} bin has been successfully drained!`);
      setTimeout(() => setNotification(""), 3000);
    }, 2000);
  };

  const handleDrainAll = () => {
    setNotification("Draining all bins...");
    setShowActionRequired(false);
    setTimeout(() => {
      setCategoryBins(prev => prev.map(b => ({ ...b, fillLevel: 0, lastCollection: 'Just now', status: 'Normal' })));
      setNotification("All bins have been successfully drained!");
      setTimeout(() => setNotification(""), 3000);
    }, 2000);
  };

  const fullCount = categoryBins.filter(b => b.fillLevel >= 90).length;
  const almostFullCount = categoryBins.filter(b => b.fillLevel >= 75 && b.fillLevel < 90).length;

  return (
    <div className="bin-monitoring-container">
      <div className="bin-monitoring-header">
        <div>
          <h1 className="header-title">Real-Time Bin Monitoring</h1>
          <p className="header-subtitle">Monitor bin fill levels in real-time</p>
        </div>
        <div className="header-actions">
          {view === 'detail' && (
            <button className="back-btn-pill" onClick={() => setView('list')}>← BACK TO LIST</button>
          )}
        </div>
      </div>

      {notification && (
        <div className="alert-box" style={{ background: '#dcfce7', borderColor: '#86efac' }}>
          <span>✓</span>
          <div>
            <div style={{ color: '#166534' }}>Notification</div>
            <p style={{ color: '#15803d' }}>{notification}</p>
          </div>
        </div>
      )}

      {showActionRequired && view === 'detail' && (
        <div className="alert-box">
          <span>⚠️</span>
          <div>
            <div>Action Required</div>
            <p>{fullCount} bin full, {almostFullCount} bins almost full</p>
          </div>
        </div>
      )}

      <div className="bin-grid">
        {view === 'list' ? (
          bins.map(bin => <BinListCard key={bin.id} bin={bin} onClick={() => setView('detail')} />)
        ) : (
          categoryBins.map(bin => (
            <BinDetailCard 
              key={bin.id} 
              bin={bin} 
              onDrain={() => handleDrain(bin.category, bin.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BinMonitoring;