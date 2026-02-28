import React, { useState, useEffect } from 'react';
import './HardwareStatus.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://automatic-garbage-sorting-system-production.up.railway.app';

export default function HardwareStatus() {
  const [status, setStatus] = useState({
    lastType: 'NORMAL',
    lastLine: null,
    lastUpdated: null,
    connected: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hardware/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStatus((prev) => ({ ...prev, ...data }));
      } catch {
        // ignore
      }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const formatTime = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString(undefined, { timeStyle: 'medium' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="hardware-status">
      <div className="hardware-status-header">
        <h2>Arduino sorting status</h2>
        <span className={`badge ${status.connected ? 'badge-connected' : 'badge-disconnected'}`}>
          {status.connected ? 'Serial connected' : 'Not connected'}
        </span>
      </div>
      {(status.error) && <div className="hardware-status-error">{status.error}</div>}
      <div className="hardware-cards">
        <div className="hardware-card">
          <span className="hardware-label">Detected type</span>
          <span className="hardware-value">{status.lastType || 'NORMAL'}</span>
          {status.lastUpdated && (
            <span className="hardware-time">{formatTime(status.lastUpdated)}</span>
          )}
        </div>
      </div>
      {status.lastLine && (
        <div className="hardware-events">
          <h3>Last raw serial line</h3>
          <ul className="hardware-events-list">
            <li className="hardware-event-item">
              <span className="event-type">Serial</span>
              <span className="event-data">{status.lastLine}</span>
              <span className="event-time">{formatTime(status.lastUpdated)}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
