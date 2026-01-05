import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/binMonitoring.css';

// Icons - Walang binago sa icons
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

// LIST VIEW CARD - Horizontal Format (Based on Screenshot)
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
      {/* KALIWANG PARTE (Green/Color Profile) */}
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

      {/* KANANG PARTE (White/Stats) */}
      <div className="bin-card-right">
        <div className="fill-stats-container">
          <div className="fill-header-row">
            <span className="fill-label">Fill Level</span>
            <span className="fill-percentage-big">{bin.fillLevel}%</span>
          </div>
          
          {/* Box Battery Style Indicator */}
          <div className="battery-box-body">
            <div className="battery-box-fill" style={{ width: `${bin.fillLevel}%` }}></div>
          </div>
          
          <span className="time-ago">{bin.lastUpdate}</span>
        </div>

        {/* Mini Bin Visual Icon */}
        <div className="bin-mini-visual">
           <div className="visual-box">
              <div className="visual-fill" style={{ height: `${bin.fillLevel}%`, background: bin.fillLevel >= 90 ? '#059669' : '#34d399' }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

// DETAIL VIEW CARD - Horizontal Format
const BinDetailCard = ({ bin }) => {
  return (
    <div className={`bin-horizontal-card detail-mode ${bin.colorClass}`}>
      <div className="bin-card-left">
        <div className="bin-detail-icon">{bin.icon}</div>
        <div className="bin-main-info">
          <h2 className="bin-title white-text" style={{fontSize: '2rem'}}>{bin.category}</h2>
          <p className="bin-cap white-text">Capacity: {bin.capacity}</p>
        </div>
      </div>
      <div className="bin-card-right">
        <div className="fill-stats-container">
          <div className="fill-header-row">
            <span className="fill-label">Fill Level</span>
            <span className="fill-percentage-big">{bin.fillLevel}%</span>
          </div>
          <div className="battery-box-body">
            <div className="battery-box-fill" style={{ width: `${bin.fillLevel}%`, background: '#10b981' }}></div>
          </div>
          <span className="time-ago">Last Collection: {bin.lastCollection}</span>
        </div>
      </div>
    </div>
  );
};

const BinMonitoring = () => {
  const [view, setView] = useState('list');
  const [bins, setBins] = useState([
    { id: 1, name: 'Bin 1', fillLevel: 80, systemPower: 100, capacity: '20kg', lastUpdate: '2 hours ago', category: 'Biodegradable' },
    { id: 2, name: 'Bin 2', fillLevel: 86, systemPower: 50, capacity: '20kg', lastUpdate: '2 hours ago', category: 'Non-Biodegradable' },
    { id: 3, name: 'Bin 3', fillLevel: 85, systemPower: 20, capacity: '20kg', lastUpdate: '2 hours ago', category: 'Recycle' },
    { id: 4, name: 'Bin 4', fillLevel: 90, systemPower: 100, capacity: '20kg', lastUpdate: '2 hours ago', category: 'Unsorted' }
  ]);

  const [categoryBins, setCategoryBins] = useState([
    { id: 1, category: 'Non-Biodegradable', fillLevel: 92, capacity: '100L', lastCollection: '4h ago', colorClass: 'red', icon: <TrashIcon /> },
    { id: 2, category: 'Biodegradable', fillLevel: 80, capacity: '100L', lastCollection: '2h ago', colorClass: 'green', icon: <LeafIcon /> },
    { id: 3, category: 'Recyclable', fillLevel: 45, capacity: '100L', lastCollection: '1h ago', colorClass: 'blue', icon: <RecycleIcon /> }
  ]);

  const handleDrain = (id) => {
    setCategoryBins(prev => prev.map(b => b.id === id ? { ...b, fillLevel: 0, lastCollection: 'Just now' } : b));
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
        {view === 'detail' && (
          <div className="header-actions">
            <button className="back-btn-pill" onClick={() => setView('list')}>← BACK TO LIST</button>
          </div>
        )}
      </div>

      <div className="action-required-alert">
        <span className="warning-icon">⚠️</span>
        <div>
          <span className="action-text">Action Required</span>
          <p>{fullCount} full, {almostFullCount} almost full</p>
        </div>
      </div>

      <div className="bin-grid">
        {view === 'list' ? (
          bins.map(bin => <BinListCard key={bin.id} bin={bin} onClick={() => setView('detail')} />)
        ) : (
          categoryBins.map(bin => (
            <div key={bin.id} style={{position: 'relative'}}>
              <BinDetailCard bin={bin} />
              <button className="drain-btn-float" onClick={() => handleDrain(bin.id)}>Drain</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BinMonitoring;