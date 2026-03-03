import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import './HardwareStatus.css';

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

  const connectionLabel = status.connected
    ? (status.source === 'bridge' ? 'Connected (bridge)' : 'Serial connected')
    : 'Not connected';
  const isLocalhost = /localhost|127\.0\.0\.1/.test(API_BASE);
  const showBridgeHint = !status.connected && !status.error && !isLocalhost;
  const showLocalHint = !status.connected && !status.error && isLocalhost;

  return (
    <div className="hardware-status">
      <div className="hardware-status-header">
        <h2>Arduino sorting status</h2>
        <span className={`badge ${status.connected ? 'badge-connected' : 'badge-disconnected'}`}>
          {connectionLabel}
        </span>
      </div>
      {(status.error) && <div className="hardware-status-error">{status.error}</div>}
      {showLocalHint && (
        <div className="hardware-status-hint">
          Start the backend (e.g. <code>npm start</code> in the <code>backend</code> folder) with <strong>ARDUINO_PORT=COM5</strong> in <code>backend/.env</code>. If the Arduino IDE Serial Monitor is open, close it — only one program can use the COM port.
        </div>
      )}
      {showBridgeHint && (
        <div className="hardware-status-hint">
          <strong>Servo detection on deployment:</strong> Run the Arduino bridge on your PC (Arduino on COM5). Set <code>BACKEND_URL</code> to this app&apos;s backend (<code>{API_BASE}</code>), then run <code>node backend/scripts/arduino-bridge.js</code>. Detections will show here and add +10% to the matching bin.
        </div>
      )}
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
