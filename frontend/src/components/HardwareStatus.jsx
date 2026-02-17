import React, { useState, useEffect } from 'react';
import './HardwareStatus.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function HardwareStatus() {
  const [status, setStatus] = useState({ lastType: 'NORMAL', lastLine: null, lastUpdated: null, connected: false, error: null });

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hardware/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStatus((prev) => ({ ...prev, ...data }));
      } catch {}
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 500);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const formatTime = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleTimeString(undefined, { timeStyle: 'medium' }); } catch { return '—'; } };

  return (
    <div className="hardware-status">
      <div className="hardware-status-header">
        <h2>Arduino sorting status</h2>
        <span className={`badge ${status.connected ? 'badge-connected' : 'badge-disconnected'}`}>
          {status.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      {status.error && (
        <div className="hardware-status-error">
          {status.error}
          <p className="hardware-hint">Check backend is running, Arduino is on the correct port (e.g. ARDUINO_PORT in backend .env), and Serial Monitor is closed.</p>
        </div>
      )}
      {!status.connected && !status.error && (
        <p className="hardware-hint">Connect Arduino and start the backend so fill levels and weight update from the collector bin monitoring system.</p>
      )}
      <div className="hardware-cards">
        <div className="hardware-card">
          <span className="hardware-label">Detected type</span>
          <span className="hardware-value">{status.lastType || 'NORMAL'}</span>
          {status.lastUpdated && <span className="hardware-time">{formatTime(status.lastUpdated)}</span>}
        </div>
      </div>
      <div className="hardware-events">
        <h3>Last raw serial line</h3>
        <ul className="hardware-events-list">
          <li className="hardware-event-item">
            <span className="event-type">Serial</span>
            <span className="event-data">
              {status.lastLine
                ? status.lastLine
                : status.connected
                  ? 'Waiting for serial data…'
                  : '—'}
            </span>
            <span className="event-time">{formatTime(status.lastUpdated)}</span>
          </li>
        </ul>
        {status.connected && !status.lastLine && (
          <p className="hardware-hint">Arduino is connected. Place waste in front of the sensor or wait for Weight/Time lines.</p>
        )}
      </div>
    </div>
  );
}
