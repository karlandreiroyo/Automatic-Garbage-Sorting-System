// src/BinMonitoring.jsx
import React from 'react';
import './App.css';

// Icons specific to this view
const LeafIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
const TrashIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const RecycleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 5 2.39 4.143"/><path d="M8.293 13.53 11 19"/><path d="M19.324 11.06 14 5"/><path d="m3.727 6.465 1.272-2.119a1.84 1.84 0 0 1 1.565-.891H11.25"/><path d="m14 5-2.707 4.53"/></svg>;
const GearIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;

const BinCard = ({ title, capacity, fillLevel, lastCollection, colorClass, status, icon: Icon }) => (
  <div className="bin-card">
    <div className={`bin-card-left ${colorClass}`}>
      <div className="bin-header">
        <Icon />
        {status && <span className="status-badge">{status}</span>}
      </div>
      <h3>{title}</h3>
      <p className="capacity-text">Capacity: {capacity}</p>
    </div>
    <div className="bin-card-right">
      <div className="fill-info">
        <div className="fill-text"><span>Fill Level</span><span className="percentage">{fillLevel}%</span></div>
        <div className="progress-bar-bg"><div className={`progress-bar-fill ${colorClass}-bg`} style={{ width: `${fillLevel}%` }}></div></div>
        <p className="last-collection">{lastCollection}</p>
      </div>
      <div className="visual-bin-container">
        <div className="visual-bin">
          <div className={`visual-liquid ${colorClass}-bg`} style={{ height: `${fillLevel}%` }}></div>
          <div className="glass-shine"></div>
        </div>
      </div>
    </div>
  </div>
);

const BinMonitoring = () => {
  return (
    <div className="bin-monitoring-container">
      <div className="alert-banner">
        <span className="alert-icon">⚠️</span>
        <div>
          <strong>Action Required</strong>
          <p>1 bin full , 3 bins almost full</p>
        </div>
      </div>
      <div className="bins-grid">
        <BinCard title="Biodegradable" capacity="100 L" fillLevel={80} lastCollection="2 hours ago" colorClass="green" status="Almost Full" icon={LeafIcon} />
        <BinCard title="Non Biodegradable" capacity="100 L" fillLevel={100} lastCollection="4 hours ago" colorClass="red" status="Full" icon={TrashIcon} />
        <BinCard title="Recyclable" capacity="100 L" fillLevel={86} lastCollection="1 hours ago" colorClass="blue" status="Almost Full" icon={RecycleIcon} />
        <BinCard title="Unsorted" capacity="100 L" fillLevel={83} lastCollection="1 hours ago" colorClass="lime" status="Almost Full" icon={GearIcon} />
      </div>
    </div>
  );
};

export default BinMonitoring;