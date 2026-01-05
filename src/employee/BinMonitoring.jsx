import React from "react";
import "../employee/employeecss/BinMonitoring.css"; // Link the CSS file

// --- ICONS (No changes) ---
export const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

export const TrashIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

export const RecycleIcon = () => (
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

export const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// --- BIN CARD COMPONENT ---
const BinCard = ({ title, capacity, fillLevel, lastCollection, colorClass, status, icon: Icon }) => {
  return (
    <div className={`bin-card ${colorClass}`}>
      <div className="bin-left">
        <div className="bin-left-top">
          <Icon />
          {status && <span className="bin-status">⭐ {status}</span>}
        </div>
        <div className="bin-left-bottom">
          <h3>{title}</h3>
          <p>Capacity: {capacity}</p>
        </div>
      </div>
      <div className="bin-right">
        <div className="bin-info">
          <div className="fill-level">
            <span>Fill Level</span>
            <span className="fill-percent">{fillLevel}%</span>
          </div>
          <div className="fill-bar">
            <div className="fill-progress" style={{ height: "8px", width: `${fillLevel}%` }}></div>
          </div>
          
          {/* UPDATED: Wrapper para magkatabi ang Last Collection at Button */}
          <div className="info-footer">
            <div className="last-collection">
              <span>Last Collection</span>
              <span className="collection-time">{lastCollection}</span>
            </div>
            <button className="drain-btn" onClick={() => alert(`${title} bin is draining...`)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>
              </svg>
              DRAIN
            </button>
          </div>
        </div>
        <div className="bin-visual">
          <div className="bin-fill" style={{ height: `${fillLevel}%` }}></div>
          <div className="bin-icon"><Icon /></div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const BinMonitoring = () => {
  return (
    <div className="bin-monitoring">
      <div className="header">
        <h1>Real-Time Bin Monitoring</h1>
        <p>Monitor bin fill levels in real-time</p>
      </div>

      <div className="alert-box">
        <span>⚠️</span>
        <div>
          <div>Action Required</div>
          <p>1 bin full, 3 bins almost full</p>
        </div>
      </div>

      <div className="bin-cards">
        <BinCard 
          title="Biodegradable" 
          capacity="100 L" 
          fillLevel={80} 
          lastCollection="2 hours ago" 
          colorClass="green" 
          status="Almost Full" 
          icon={LeafIcon} 
        />
        <BinCard 
          title="Non Biodegradable" 
          capacity="100 L" 
          fillLevel={100} 
          lastCollection="4 hours ago" 
          colorClass="red" 
          status="Full" 
          icon={TrashIcon} 
        />
        <BinCard 
          title="Recyclable" 
          capacity="100 L" 
          fillLevel={86} 
          lastCollection="1 hour ago" 
          colorClass="blue" 
          status="Almost Full" 
          icon={RecycleIcon} 
        />
        <BinCard 
          title="Unsorted" 
          capacity="100 L" 
          fillLevel={83} 
          lastCollection="1 hour ago" 
          colorClass="lime" 
          status="Almost Full" 
          icon={GearIcon} 
        />
      </div>
    </div>
  );
};

export default BinMonitoring;