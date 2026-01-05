import React, { useState } from "react";
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

const DrainAllIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>
  </svg>
);

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

// --- BIN CARD COMPONENT ---
const BinCard = ({ title, capacity, fillLevel, lastCollection, colorClass, status, icon: Icon, onDrain }) => {
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
            <span 
              className="fill-percent" 
              style={{ color: getFillLevelColor(fillLevel) }}
            >
              {fillLevel}%
            </span>
          </div>
          <div className="fill-bar">
            <div 
              className="fill-progress" 
              style={{ 
                height: "8px", 
                width: `${fillLevel}%`,
                backgroundColor: getFillLevelColor(fillLevel)
              }}
            ></div>
          </div>
          
          <div className="info-footer">
            <div className="last-collection">
              <span>Last Collection</span>
              <span className="collection-time">{lastCollection}</span>
            </div>
            <button className="drain-btn" onClick={onDrain}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>
              </svg>
              DRAIN
            </button>
          </div>
        </div>
        <div className="bin-visual">
          <div 
            className="bin-fill-section" 
            style={{ 
              height: `${fillLevel}%`,
              backgroundColor: getFillLevelColor(fillLevel)
            }}
          >
            <span className="bin-percentage-text">{fillLevel}%</span>
          </div>
          <div className="bin-empty-section"></div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const BinMonitoring = () => {
  const [notification, setNotification] = useState("");
  const [showActionRequired, setShowActionRequired] = useState(true);

  const handleDrain = (binName) => {
    setNotification(`${binName} bin is draining...`);
    setTimeout(() => {
      setNotification(`${binName} bin has been successfully drained!`);
      setTimeout(() => setNotification(""), 3000);
    }, 2000);
  };

  const handleDrainAll = () => {
    setNotification("Draining all bins...");
    setShowActionRequired(false); // Hide action required alert
    setTimeout(() => {
      setNotification("All bins have been successfully drained!");
      setTimeout(() => setNotification(""), 3000);
    }, 2000);
  };

  return (
    <div className="bin-monitoring">
      <div className="header">
        <div className="header-text">
          <h1>Real-Time Bin Monitoring</h1>
          <p>Monitor bin fill levels in real-time</p>
        </div>
        <button className="drain-all-btn" onClick={handleDrainAll}>
          <DrainAllIcon />
          DRAIN ALL
        </button>
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

      {showActionRequired && (
        <div className="alert-box">
          <span>⚠️</span>
          <div>
            <div>Action Required</div>
            <p>1 bin full, 3 bins almost full</p>
          </div>
        </div>
      )}

      <div className="bin-cards">
        <BinCard 
          title="Biodegradable" 
          capacity="100 L" 
          fillLevel={80} 
          lastCollection="2 hours ago" 
          colorClass="green" 
          status="Almost Full" 
          icon={LeafIcon}
          onDrain={() => handleDrain("Biodegradable")}
        />
        <BinCard 
          title="Non Biodegradable" 
          capacity="100 L" 
          fillLevel={100} 
          lastCollection="4 hours ago" 
          colorClass="red" 
          status="Full" 
          icon={TrashIcon}
          onDrain={() => handleDrain("Non Biodegradable")}
        />
        <BinCard 
          title="Recyclable" 
          capacity="100 L" 
          fillLevel={86} 
          lastCollection="1 hour ago" 
          colorClass="blue" 
          status="Almost Full" 
          icon={RecycleIcon}
          onDrain={() => handleDrain("Recyclable")}
        />
        <BinCard 
          title="Unsorted" 
          capacity="100 L" 
          fillLevel={83} 
          lastCollection="1 hour ago" 
          colorClass="lime" 
          status="Almost Full" 
          icon={GearIcon}
          onDrain={() => handleDrain("Unsorted")}
        />
      </div>
    </div>
  );
};

export default BinMonitoring;