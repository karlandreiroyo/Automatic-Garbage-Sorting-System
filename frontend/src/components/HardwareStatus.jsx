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
  const [bridgeConnected, setBridgeConnected] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    const fetchBridgeStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hardware/bridge-status`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setBridgeConnected(Boolean(data?.connected));
      } catch {
        if (!cancelled) setBridgeConnected(false);
      }
    };
    fetchBridgeStatus();
    const id = setInterval(fetchBridgeStatus, 5000);
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

  const isLocalhost = /localhost|127\.0\.0\.1/.test(API_BASE);
  const isRailwayOrRemote = !isLocalhost;
  const uiConnected = isRailwayOrRemote ? bridgeConnected : status.connected;
  const connectionLabel = isRailwayOrRemote
    ? (bridgeConnected ? 'Bridge connected' : 'Bridge required')
    : (status.connected ? 'Serial connected' : 'Not connected');
  const showBridgeHint = !bridgeConnected && !status.error && !isLocalhost;
  const showLocalHint = !status.connected && !status.error && isLocalhost;

  return (
    <div className="hardware-status">
      <div className="hardware-status-header">
        <h2>Arduino sorting status</h2>
        <span className={`badge ${uiConnected ? 'badge-connected' : 'badge-disconnected'}`}>
          {connectionLabel}
        </span>
      </div>
      {(status.error) && <div className="hardware-status-error">{status.error}</div>}
      {showLocalHint && (
        <div className="hardware-status-hint">
          In <code>backend/.env</code> set <strong>ARDUINO_LOCAL=true</strong> and <strong>ARDUINO_PORT=</strong> your port (e.g. COM5, COM8), then start the backend. If the Arduino IDE Serial Monitor is open, close it — only one program can use the COM port.
        </div>
      )}
      {showBridgeHint && (
        <div className="hardware-status-hint">
          <strong>Railway — connect Arduino from your PC</strong>
          <p className="hardware-bridge-note">The badge above shows &quot;Bridge required&quot; because the server has no Arduino. Run the bridge on your PC to enable sorting.</p>
          <ol className="hardware-steps">
            <li>On the PC with the Arduino plugged in via USB, open PowerShell in the <strong>project folder</strong> (where <code>backend</code> and <code>frontend</code> folders are).</li>
            <li>Make sure <code>.env.bridge</code> has your Railway URL: <code>BACKEND_URL=https://your-railway-url</code>.</li>
            <li>Run: <code>npm run bridge</code>.</li>
            <li>Plug in Arduino — it auto-detects and connects. Keep the terminal open.</li>
          </ol>
          <pre className="hardware-bridge-cmd">
{`npm run bridge`}
          </pre>
          <p>Keep the terminal open. Then <strong>click &quot;Sort here&quot;</strong> on a bin below — the servo will move and the bin will get +10%.</p>
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
