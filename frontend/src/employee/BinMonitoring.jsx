import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../supabaseClient";
import { API_BASE, getWsUrl } from "../config/api";
import HardwareStatus from "../components/HardwareStatus";
import "../employee/employeecss/BinMonitoring.css";

/**
 * Rounds fill level to nearest 10
 * @param {number} level - Fill level percentage
 * @returns {number} Rounded fill level (0, 10, 20, ..., 100)
 */
const roundToTen = (level) => {
  return Math.round(level / 10) * 10;
};

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

// Map bin id to API category for POST /api/hardware/sort (Arduino servo tilt)
const BIN_TO_SORT_CATEGORY = {
  'Biodegradable': 'Biodegradable',
  'Non Biodegradable': 'Non-Bio',
  'Recyclable': 'Recycle',
  'Unsorted': 'Unsorted',
};
// Reverse: API category → bin id (for adding % after sort)
const SORT_CATEGORY_TO_BIN_ID = {
  'Recycle': 'Recyclable',
  'Non-Bio': 'Non Biodegradable',
  'Biodegradable': 'Biodegradable',
  'Unsorted': 'Unsorted',
};
// API category → lastType value (so hardware poll doesn't double-add)
const SORT_CATEGORY_TO_LAST_TYPE = {
  'Recycle': 'RECYCABLE',
  'Non-Bio': 'NON_BIO',
  'Biodegradable': 'BIO',
  'Unsorted': 'UNSORTED',
};
const WS_BIN_TO_CARD_ID = {
  bin_1: 'Biodegradable',
  bin_2: 'Recyclable',
  bin_3: 'Non Biodegradable',
  bin_4: 'Unsorted',
};

const playAlertSound = (type) => {
  try {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const makeBeep = (start, freq = 880, duration = 0.09) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    if (type === 'critical') {
      makeBeep(now, 900);
      makeBeep(now + 0.14, 900);
      makeBeep(now + 0.28, 900);
    } else {
      makeBeep(now, 720);
      makeBeep(now + 0.16, 720);
    }
  } catch (_) {}
};

// --- SINGLE BIN CARD COMPONENT ---
const BinCard = React.memo(({ title, capacity: _capacity, fillLevel, lastCollection, colorClass, status: _status, icon: _Icon, onDrain, onSort, sortCategory, isSorting, isDraining, isSelected, onToggle: _onToggle, last_ml_category, last_ml_confidence, last_ml_detected_at }) => {
  const isEmpty = fillLevel === 0;
  const isAlmostFull = fillLevel >= 80 && fillLevel < 100;
  const isFull = fillLevel >= 100;
  const canSort = sortCategory && typeof onSort === 'function';
  const canDrain = typeof onDrain === 'function';

  return (
    <div className={`bin-card ${colorClass} ${isSelected ? 'selected-card' : ''}`}>
      <div className="bin-header">
        {isAlmostFull && <div className="bin-alert-badge warning">⚠️ Almost Full — Sorting Active</div>}
        {isFull && <div className="bin-alert-badge critical">🚨 FULL — Sorting Paused</div>}
        <div className="icon-circle"><_Icon /></div>
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
          <div className="meta-row"><span className="meta-label">Last Collection</span><strong className="meta-val">{lastCollection}</strong></div>
          {last_ml_category && (
            <div className="meta-row">
              <span className="meta-label">ML Detection</span>
              <strong className="meta-val">
                {last_ml_category}
                {Number.isFinite(Number(last_ml_confidence)) ? ` (${(Number(last_ml_confidence) * 100).toFixed(1)}%)` : ""}
                {last_ml_detected_at ? ` • ${new Date(last_ml_detected_at).toLocaleTimeString()}` : ""}
              </strong>
            </div>
          )}
        </div>
        {canSort && (
          <button
            type="button"
            className="bin-sort-here-btn"
            onClick={() => onSort(sortCategory)}
            disabled={isSorting || isFull}
            title={isFull ? `${title} is full` : `Tilt servo to sort into ${title} bin`}
          >
            {isFull ? 'Bin Full' : isSorting ? 'Tilting…' : 'Sort here'}
          </button>
        )}
        {canDrain && (
          <button
            type="button"
            className="bin-drain-btn"
            onClick={() => onDrain()}
            disabled={isDraining}
            title={`Drain ${title} bin (saved to Collection History)`}
          >
            {isDraining ? 'Draining…' : 'Drain'}
          </button>
        )}
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

// Base bin definition (icons not serializable; use INITIAL_BINS for merge on restore)
const INITIAL_BINS = [
  { id: 'Biodegradable', title: 'Biodegradable', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'green', status: 'Empty', icon: LeafIcon },
  { id: 'Non Biodegradable', title: 'Non-Bio', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'red', status: 'Empty', icon: TrashIcon },
  { id: 'Recyclable', title: 'Recyclable', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'blue', status: 'Empty', icon: RecycleIcon },
  { id: 'Unsorted', title: 'Unsorted', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'lime', status: 'Empty', icon: GearIcon },
];

// Hydrate initial state from localStorage so refresh/sidebar navigation doesn't flash 0%
function getInitialBinsFromStorage() {
  try {
    const raw = localStorage.getItem("agss_bin_state");
    if (!raw) return INITIAL_BINS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_BINS;
    return INITIAL_BINS.map((base) => {
      const saved = parsed.find((b) => b.id === base.id);
      const fillLevel = saved?.fillLevel != null ? Math.min(100, Math.max(0, Number(saved.fillLevel))) : 0;
      const lastCollection = saved?.lastCollection ?? base.lastCollection;
      const status = saved?.status ?? (fillLevel >= 90 ? 'Full' : fillLevel >= 75 ? 'Almost Full' : fillLevel > 0 ? 'Normal' : 'Empty');
      return {
        ...base,
        fillLevel,
        lastCollection,
        status,
      };
    });
  } catch {
    return INITIAL_BINS;
  }
}

const BinMonitoring = () => {
  const [bins, setBins] = useState(getInitialBinsFromStorage);
  const [notification, setNotification] = useState("");
  const [selectedBins, setSelectedBins] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, binsToDrain: [] });
  const [assignedBinLocationText, setAssignedBinLocationText] = useState("");
  const [collectorName, setCollectorName] = useState("");
  const [collectorInfo, setCollectorInfo] = useState(null);
  const [collectorBins, setCollectorBins] = useState([]);
  const [_hasPersistedBinState, setHasPersistedBinState] = useState(false);
  const [_restoreAttempted, setRestoreAttempted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sortingCategory, setSortingCategory] = useState(null);
  const [drainingBinId, setDrainingBinId] = useState(null);
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsAlertBanner, setWsAlertBanner] = useState(null);
  const wsBannerTimerRef = useRef(null);
  const fullBinsLockRef = useRef(new Set());
  const lastArduinoTypeRef = useRef("NORMAL");
  const binsRef = useRef(bins);
  binsRef.current = bins;

  // Map card category id to physical bin_id (for drain API)
  const getBinIdForCard = (cardId, assignedBins) => {
    if (!Array.isArray(assignedBins) || assignedBins.length === 0) return null;
    const n = (cardId || '').toLowerCase();
    const match = assignedBins.find((b) => {
      const name = (b.name || '').toLowerCase();
      if (n.includes('recycl') && name.includes('recycl')) return true;
      if (n.includes('biodegradable') && !n.includes('non') && name.includes('bio') && !name.includes('non')) return true;
      if (n.includes('non') && n.includes('bio') && (name.includes('non') || name.includes('non-bio'))) return true;
      if (n.includes('unsorted') && name.includes('unsort')) return true;
      return false;
    });
    return (match || assignedBins[0])?.id ?? null;
  };

  // Persist bins to backend + localStorage. With auth: saves to Supabase (Railway + localhost). Without: in-memory fallback.
  const persistBinsToBackendAndStorage = (binsToSave) => {
    const list = Array.isArray(binsToSave) ? binsToSave : binsRef.current;
    const serializable = list.map((b) => ({ id: b.id, fillLevel: b.fillLevel, status: b.status, lastCollection: b.lastCollection }));
    try {
      localStorage.setItem("agss_bin_state", JSON.stringify(serializable));
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const headers = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          await fetch(`${API_BASE}/api/collector-bins`, { method: "POST", headers, body: JSON.stringify({ bins: serializable }) });
        } catch (_) {}
      })();
    } catch {}
  };

  // Restore: backend (Supabase when auth = Railway + localhost) + localStorage merged so fill levels persist.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        let backendBins = [];
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const headers = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/api/collector-bins`, { headers });
          const data = res.ok ? await res.json() : {};
          backendBins = Array.isArray(data?.bins) ? data.bins : [];
        } catch (_) {}
        const savedRaw = localStorage.getItem("agss_bin_state");
        let localBins = [];
        try {
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            if (Array.isArray(parsed)) localBins = parsed;
          }
        } catch (_) {}
        if (cancelled) return;
        setBins(INITIAL_BINS.map((base) => {
          const fromBackend = backendBins.find((b) => b.id === base.id);
          const fromLocal = localBins.find((b) => b.id === base.id);
          const fillBackend = fromBackend?.fillLevel ?? 0;
          const fillLocal = fromLocal?.fillLevel ?? 0;
          const fillLevel = Math.max(fillBackend, fillLocal);
          const status = (fromBackend?.status ?? fromLocal?.status ?? base.status);
          const lastCollection = (fromBackend?.lastCollection ?? fromLocal?.lastCollection ?? base.lastCollection);
          return {
            ...base,
            fillLevel,
            status: fillLevel >= 90 ? 'Full' : fillLevel >= 75 ? 'Almost Full' : fillLevel >= 50 ? 'Normal' : fillLevel > 0 ? 'Normal' : 'Empty',
            lastCollection,
          };
        }));
        setHasPersistedBinState(true);
        setRestoreAttempted(true);
        if (!cancelled) setIsRestoring(false);
      } catch (_) {
        if (!cancelled) { setRestoreAttempted(true); setIsRestoring(false); }
      }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  // Collector name + assigned bins (for waste_items)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data: userRow, error: userError } = await supabase.from('users').select('id, first_name, middle_name, last_name').eq('auth_id', session.user.id).maybeSingle();
        if (userError || !userRow) return;
        const parts = [userRow.first_name?.trim(), userRow.middle_name?.trim() !== 'EMPTY' && userRow.middle_name?.trim() !== 'NULL' ? userRow.middle_name?.trim() : null, userRow.last_name?.trim()].filter(Boolean);
        if (parts.length) setCollectorName(parts.join(' '));
        setCollectorInfo({ id: userRow.id, first_name: userRow.first_name, middle_name: userRow.middle_name, last_name: userRow.last_name });
        const { data: assignedBins, error: binsError } = await supabase.from('bins').select('id, name, location').eq('assigned_collector_id', userRow.id).eq('status', 'ACTIVE');
        if (binsError || !assignedBins?.length) return;
        setCollectorBins(assignedBins);
        const locations = assignedBins.map((b) => (b.location?.trim() || b.name || 'Unspecified')).filter(Boolean);
        if (locations.length) setAssignedBinLocationText(locations.length === 1 ? `Located at ${locations[0]}` : `Located at ${locations.join(', ')}`);
      } catch {}
    };
    load();
  }, []);

  const [recordedItems, setRecordedItems] = useState([]);
  const [loadingRecordedItems, setLoadingRecordedItems] = useState(false);
  const recordedItemsInitRef = useRef(false);

  /** Same fill % as admin Bin Monitoring (from waste_items via /levels). */
  const syncFillFromLevels = React.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/collector-bins/levels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const j = await res.json();
      if (!j.success || !Array.isArray(j.categories)) return;
      const categories = j.categories;
      const next = INITIAL_BINS.map((base) => {
        const cat = categories.find((c) => c.id === base.id);
        if (!cat) {
          return { ...base, fillLevel: 0, lastCollection: 'Just now', status: 'Empty' };
        }
        const fl = Math.min(100, Number(cat.fillLevel) || 0);
        const last = cat.lastCollection
          ? new Date(cat.lastCollection).toLocaleString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: '2-digit',
              hour: 'numeric',
              minute: '2-digit',
            })
          : 'Just now';
        return {
          ...base,
          fillLevel: fl,
          lastCollection: last,
          status:
            fl >= 90 ? 'Full' : fl >= 75 ? 'Almost Full' : fl >= 50 ? 'Normal' : fl > 0 ? 'Normal' : 'Empty',
        };
      });
      setBins(next);
      const serializable = next.map((b) => ({ id: b.id, fillLevel: b.fillLevel, status: b.status, lastCollection: b.lastCollection }));
      try {
        localStorage.setItem('agss_bin_state', JSON.stringify(serializable));
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        await fetch(`${API_BASE}/api/collector-bins`, { method: 'POST', headers, body: JSON.stringify({ bins: serializable }) });
      } catch (_) {}
    } catch (_) {}
  }, []);

  const fetchRecordedItems = React.useCallback(async (opts = {}) => {
    const { showLoadingOnlyFirst = true } = opts;
    const firstLoad = showLoadingOnlyFirst && !recordedItemsInitRef.current;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setRecordedItems([]);
        return;
      }
      if (firstLoad) setLoadingRecordedItems(true);
      const res = await fetch(`${API_BASE}/api/collector-bins/recorded-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      setRecordedItems(res.ok && Array.isArray(j.data) ? j.data : []);
      recordedItemsInitRef.current = true;
    } catch (_) {
      setRecordedItems([]);
    } finally {
      if (firstLoad) setLoadingRecordedItems(false);
    }
  }, []);

  useEffect(() => {
    if (isRestoring) return;
    let cancelled = false;
    const tick = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;
      await syncFillFromLevels();
      if (cancelled) return;
      await fetchRecordedItems();
    };
    tick();
    const id = setInterval(() => {
      syncFillFromLevels();
      fetchRecordedItems({ showLoadingOnlyFirst: false });
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isRestoring, syncFillFromLevels, fetchRecordedItems]);

  // Arduino detection: NORMAL -> type adds 10% to matching bin, persist, notification, waste_items
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hardware/status`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const type = (data.lastType || "").toUpperCase();
        const prev = lastArduinoTypeRef.current || "NORMAL";
        lastArduinoTypeRef.current = type || "NORMAL";
        if (!type || type === "NORMAL" || prev !== "NORMAL") return;
        // 10% → Info. 90%+ → Critical (Bin Full). No warning at 50%.
        let newNotification = null;
        const nextBins = binsRef.current.map((bin) => {
          const isTarget = (type === "BIO" && bin.id === "Biodegradable") || (type === "NON_BIO" && bin.id === "Non Biodegradable") || (type === "RECYCABLE" && bin.id === "Recyclable") || (type === "UNSORTED" && bin.id === "Unsorted");
          if (!isTarget) return bin;
          const raw = Math.min(100, bin.fillLevel + 10);
          const rounded = roundToTen(raw);
          if (rounded === 10) {
            newNotification = { id: Date.now(), type: "info", title: "Bin update", time: "Just now", date: "", message: `${bin.title} bin is at 10% capacity`, subtext: bin.title, fillLevel: "10%", capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          } else if (rounded >= 90) {
            newNotification = { id: Date.now(), type: "critical", title: "Bin Full Alert", time: "Just now", date: "", message: `${bin.title} bin has reached ${rounded}% — bin is full`, subtext: bin.title, fillLevel: `${rounded}%`, capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          }
          return { ...bin, fillLevel: rounded, status: rounded >= 90 ? "Full" : rounded >= 75 ? "Almost Full" : rounded >= 50 ? "Normal" : "Empty" };
        });
        setBins(nextBins);
        persistBinsToBackendAndStorage(nextBins);
        if (newNotification) {
          try {
            const raw = localStorage.getItem("agss_notifications");
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem("agss_notifications", JSON.stringify([...existing, newNotification].slice(-100)));
          } catch {}
          // Persist to database (same DB locally and on Railway) so Notifications page shows them
          if (collectorInfo && collectorBins.length > 0) {
            const statusText = newNotification.fillLevel || (newNotification.type === "critical" ? "100%" : "10%");
            const binCategory = newNotification.subtext || newNotification.title;
            const matchBin = collectorBins.find((b) => {
              const n = (b.name || "").toLowerCase();
              if (binCategory === "Biodegradable") return n.includes("bio") && !n.includes("non");
              if (binCategory === "Non Biodegradable" || binCategory === "Non-Bio") return n.includes("non");
              if (binCategory === "Recyclable") return n.includes("recycl");
              if (binCategory === "Unsorted") return n.includes("unsort") || !n;
              return true;
            });
            const binId = matchBin ? matchBin.id : collectorBins[0]?.id;
            if (binId != null) {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              if (token) {
                fetch(`${API_BASE}/api/collector-bins/bin-alert`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ bin_id: binId, status: statusText, bin_category: binCategory }),
                }).catch(() => {});
              }
            }
          }
        }
        if (collectorInfo && collectorBins.length > 0) {
          const categoryMap = { BIO: "Biodegradable", NON_BIO: "Non Biodegradable", RECYCABLE: "Recyclable", UNSORTED: "Unsorted" };
          const categoryText = categoryMap[type];
          if (categoryText) {
            try {
              await supabase.from("waste_items").insert({ bin_id: collectorBins[0].id, category: categoryText, weight: null, processing_time: null, last_name: collectorInfo.last_name, first_name: collectorInfo.first_name, middle_name: collectorInfo.middle_name });
            } catch {}
          }
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [collectorInfo, collectorBins]);

  // Unlock full-bin WS pause only after existing drain logic resets fillLevel to 0.
  useEffect(() => {
    bins.forEach((b) => {
      if (b.fillLevel === 0) fullBinsLockRef.current.delete(b.id);
    });
  }, [bins]);

  // WebSocket: ML desktop app -> realtime updates for biodeg/non-bio cards only.
  useEffect(() => {
    let reconnectTimer = null;
    let closedByCleanup = false;

    const pushLocalNotification = (alertObj) => {
      try {
        const raw = localStorage.getItem("agss_notifications");
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem("agss_notifications", JSON.stringify([...existing, alertObj].slice(-100)));
      } catch (_) {}
    };

    const sendAlertToBackend = async (alert) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const status = alert.type === 'critical' ? "100% - Bin Full" : `${alert.fill_level}% - Almost Full`;
        await fetch(`${API_BASE}/api/collector-bins/bin-alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            bin_category: alert.bin_label,
            status,
            isUnread: true,
          }),
        });
      } catch (_) {}
    };

    const applyWsBinUpdate = (wsData) => {
      if (!wsData || typeof wsData !== "object") return;
      setBins((prevBins) =>
        prevBins.map((bin) => {
          const wsKey = Object.keys(WS_BIN_TO_CARD_ID).find((k) => WS_BIN_TO_CARD_ID[k] === bin.id);
          const wsBin = wsKey ? wsData[wsKey] : null;
          if (wsBin) {
            const incomingFill = Number(wsBin.fill_level ?? bin.fillLevel);
            const isLocked = fullBinsLockRef.current.has(bin.id);
            const nextFill = (isLocked && incomingFill > bin.fillLevel) ? bin.fillLevel : incomingFill;
            return {
              ...bin,
              fillLevel: Math.min(100, Math.max(0, Number.isFinite(nextFill) ? nextFill : bin.fillLevel)),
              status: (Number.isFinite(nextFill) ? nextFill : bin.fillLevel) >= 100 ? 'Full' : bin.status,
              last_ml_category: wsBin.last_category ?? null,
              last_ml_confidence: wsBin.last_confidence ?? null,
              last_ml_detected_at: wsBin.last_detected_at ?? null,
            };
          }
          return bin;
        })
      );
    };

    const connect = () => {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || (payload.type !== "init" && payload.type !== "update")) return;
          applyWsBinUpdate(payload.data);
          if (payload.alert) {
            const alert = payload.alert;
            const cardId = WS_BIN_TO_CARD_ID[alert.bin_id] || alert.bin_label;
            if (alert.type === 'critical' && cardId) {
              fullBinsLockRef.current.add(cardId);
            }
            const bannerMessage = alert.type === 'critical'
              ? `🚨 ${alert.bin_label} bin is FULL — automatic sorting paused for this bin`
              : `⚠️ ${alert.bin_label} bin is almost full — machine will continue sorting`;
            setWsAlertBanner({ type: alert.type, message: bannerMessage });
            if (wsBannerTimerRef.current) clearTimeout(wsBannerTimerRef.current);
            wsBannerTimerRef.current = setTimeout(() => setWsAlertBanner(null), 8000);
            playAlertSound(alert.type);

            const binForMeta = binsRef.current.find((b) => b.id === cardId);
            const fillText = `${Math.min(100, Number(alert.fill_level) || 0)}%`;
            const notificationObj = {
              id: Date.now(),
              type: alert.type,
              title: alert.type === 'critical' ? "Bin Full Alert" : "Bin update",
              time: "Just now",
              date: "",
              message: bannerMessage,
              subtext: alert.bin_label,
              fillLevel: fillText,
              capacity: binForMeta?.capacity || "100 L",
              location: assignedBinLocationText || "",
              isUnread: true,
            };
            pushLocalNotification(notificationObj);
            sendAlertToBackend(alert);
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!closedByCleanup) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      closedByCleanup = true;
      setWsConnected(false);
      if (wsBannerTimerRef.current) clearTimeout(wsBannerTimerRef.current);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        wsRef.current?.close();
      } catch (_) {}
    };
  }, [assignedBinLocationText]);

  // Persist on every bins change + on unmount
  useEffect(() => { persistBinsToBackendAndStorage(bins); }, [bins]);
  useEffect(() => { return () => persistBinsToBackendAndStorage(binsRef.current); }, []);

  /**
   * Fetches bin data from Supabase and aggregates category bins
   */
  const _fetchBinData = async () => {
    try {
      const { data, error } = await supabase
        .from('bins')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Aggregate category bins from all bins
        // For employee view, we show aggregated fill levels across all bins for each category
        const categoryBinsMap = {
          'Biodegradable': { fillLevel: 0, lastCollection: 'Just now' },
          'Non Biodegradable': { fillLevel: 0, lastCollection: 'Just now' },
          'Recyclable': { fillLevel: 0, lastCollection: 'Just now' },
          'Unsorted': { fillLevel: 0, lastCollection: 'Just now' }
        };

        // Process each bin's category bins (simulated from bin data)
        data.forEach(bin => {
          // For now, we'll use a simple approach: distribute fill_level across categories
          // In a real system, you'd have separate category bin tables
          // This is a simplified aggregation
          const baseFillLevel = bin.fill_level || 0;
          
          // Distribute fill level across categories (example logic)
          // In production, you'd fetch from category_bins table
          categoryBinsMap['Biodegradable'].fillLevel = Math.max(
            categoryBinsMap['Biodegradable'].fillLevel,
            roundToTen(baseFillLevel * 0.3)
          );
          categoryBinsMap['Non Biodegradable'].fillLevel = Math.max(
            categoryBinsMap['Non Biodegradable'].fillLevel,
            roundToTen(baseFillLevel * 0.3)
          );
          categoryBinsMap['Recyclable'].fillLevel = Math.max(
            categoryBinsMap['Recyclable'].fillLevel,
            roundToTen(baseFillLevel * 0.2)
          );
          categoryBinsMap['Unsorted'].fillLevel = Math.max(
            categoryBinsMap['Unsorted'].fillLevel,
            roundToTen(baseFillLevel * 0.2)
          );

          if (bin.last_update) {
            const updateDate = new Date(bin.last_update);
            const now = new Date();
            const diffMinutes = Math.floor((now - updateDate) / (1000 * 60));
            
            let timeAgo = 'Just now';
            if (diffMinutes > 0) {
              if (diffMinutes === 1) timeAgo = '1 minute ago';
              else if (diffMinutes < 60) timeAgo = `${diffMinutes} minutes ago`;
              else {
                const diffHours = Math.floor(diffMinutes / 60);
                timeAgo = diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
              }
            }

            // Update last collection for the category with most recent update
            Object.keys(categoryBinsMap).forEach(cat => {
              if (!categoryBinsMap[cat].lastCollection || timeAgo < categoryBinsMap[cat].lastCollection) {
                categoryBinsMap[cat].lastCollection = timeAgo;
              }
            });
          }
        });

        // Update bins state with aggregated data
        setBins([
          { 
            id: 'Biodegradable', 
            title: 'Biodegradable', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Biodegradable'].fillLevel, 
            lastCollection: categoryBinsMap['Biodegradable'].lastCollection, 
            colorClass: 'green', 
            status: categoryBinsMap['Biodegradable'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Biodegradable'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: LeafIcon 
          },
          { 
            id: 'Non Biodegradable', 
            title: 'Non-Bio', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Non Biodegradable'].fillLevel, 
            lastCollection: categoryBinsMap['Non Biodegradable'].lastCollection, 
            colorClass: 'red', 
            status: categoryBinsMap['Non Biodegradable'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Non Biodegradable'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: TrashIcon 
          },
          { 
            id: 'Recyclable', 
            title: 'Recyclable', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Recyclable'].fillLevel, 
            lastCollection: categoryBinsMap['Recyclable'].lastCollection, 
            colorClass: 'blue', 
            status: categoryBinsMap['Recyclable'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Recyclable'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: RecycleIcon 
          },
          { 
            id: 'Unsorted', 
            title: 'Unsorted', 
            capacity: '100 L', 
            fillLevel: categoryBinsMap['Unsorted'].fillLevel, 
            lastCollection: categoryBinsMap['Unsorted'].lastCollection, 
            colorClass: 'lime', 
            status: categoryBinsMap['Unsorted'].fillLevel >= 90 ? 'Full' : categoryBinsMap['Unsorted'].fillLevel >= 75 ? 'Almost Full' : 'Normal', 
            icon: GearIcon 
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching bin data:', error);
    }
  };

  /**
   * Updates bin fill levels in real-time
   * Simulates gradual decrease and rounds to nearest 10
   */
  const _updateBinFillLevels = () => {
    setBins(prevBins =>
      prevBins.map(bin => {
        if (bin.fillLevel > 0) {
          const decreaseAmount = 0.1 + (Math.random() * 0.2);
          const newFillLevel = Math.max(0, bin.fillLevel - decreaseAmount);
          return {
            ...bin,
            fillLevel: roundToTen(newFillLevel),
            status: roundToTen(newFillLevel) >= 90 ? 'Full' : roundToTen(newFillLevel) >= 75 ? 'Almost Full' : roundToTen(newFillLevel) >= 50 ? 'Normal' : 'Empty'
          };
        }
        return bin;
      })
    );
  };

  // --- STATE OF THE ART VALIDATION LOGIC ---
  
  // 1. Identify valid candidates globally (anything that HAS trash)
  const filledBins = useMemo(() => bins.filter(b => b.fillLevel > 0), [bins]);
  const _urgentBinsCount = useMemo(() => bins.filter(bin => bin.fillLevel > 75).length, [bins]);

  // 2. Identify "Actionable" bins based on user selection
  const actionableBins = useMemo(() => {
    // If user has manually selected bins
    if (selectedBins.length > 0) {
      // Return intersection: Selected Bins that are ALSO Not Empty
      // This is "Forgiving Validation" - we ignore empty selections instead of blocking
      return bins.filter(b => selectedBins.includes(b.id) && b.fillLevel > 0);
    }
    // If no selection, action applies to ALL filled bins
    return filledBins;
  }, [bins, selectedBins, filledBins]);

  // 3. Determine button state
  const _isButtonDisabled = actionableBins.length === 0;
  
  // 4. Determine button text
  const _getButtonText = () => {
    if (selectedBins.length > 0) {
      // Smart Text: Show how many valid bins will be affected
      return `DRAIN SELECTED (${actionableBins.length})`;
    }
    return `DRAIN ALL (${actionableBins.length})`;
  };

  // --- HANDLERS ---

  const handleToggleSelect = (id) => {
    setSelectedBins(prev => 
      prev.includes(id) ? prev.filter(binId => binId !== id) : [...prev, id]
    );
  };

  const handleDrainSingle = (id) => {
    const bin = bins.find(b => b.id === id);
    if (bin) setConfirmModal({ show: true, binsToDrain: [bin] });
  };
  
  const _handleMainButtonAction = () => {
    if (actionableBins.length > 0) {
      setConfirmModal({ show: true, binsToDrain: actionableBins });
    }
  };

  /** Send sort command to Arduino so servo tilts to the selected bin; add +10% to that bin. */
  const handleSortToBin = async (category) => {
    if (!category) return;
    setSortingCategory(category);
    setNotification("");
    try {
      const res = await fetch(`${API_BASE}/api/hardware/sort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      if (!res.ok) {
        const msg = data.message || (res.status === 503 ? 'Arduino not connected. Check cable and backend.' : 'Sort failed.');
        setNotification(msg);
        return;
      }
      // So hardware poll doesn't double-add when Arduino echoes TYPE:XXX
      const lastTypeValue = SORT_CATEGORY_TO_LAST_TYPE[category];
      if (lastTypeValue) lastArduinoTypeRef.current = lastTypeValue;

      const displayCategory = SORT_CATEGORY_TO_BIN_ID[category] || category;
      const msg = (data?.message || '').toString().toLowerCase();
      const isQueuedForBridge = msg.includes('queued');
      const isRailway = !/localhost|127\.0\.0\.1/.test(API_BASE);
      if (isQueuedForBridge || isRailway) {
        setNotification(`Sorted into ${displayCategory} bin (+10%). Run the Arduino bridge on your PC (see instructions above) to move the servo.`);
      } else {
        setNotification(`Sorted into ${displayCategory} bin (+10%)`);
      }
      setTimeout(() => setNotification(''), 5000);

      // notification_bin (Notifications) + waste_items (Supabase — visible in Table Editor & used on drain)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          await fetch(`${API_BASE}/api/collector-bins/sort-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ bin_category: displayCategory }),
          });
          const wasteBinId = getBinIdForCard(displayCategory, collectorBins);
          if (wasteBinId && collectorInfo) {
            await fetch(`${API_BASE}/api/collector-bins/waste-item`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                bin_id: wasteBinId,
                category: displayCategory,
                weight: null,
                processing_time: 0,
                first_name: collectorInfo.first_name ?? '',
                middle_name: collectorInfo.middle_name ?? '',
                last_name: collectorInfo.last_name ?? '',
              }),
            });
          }
        }
      } catch (_) {}
      await syncFillFromLevels();
      await fetchRecordedItems({ showLoadingOnlyFirst: false });
    } catch (err) {
      setNotification(err.message || 'Could not send sort command.');
    } finally {
      setSortingCategory(null);
    }
  };

  const performDrain = async () => {
    const binsToDrain = confirmModal.binsToDrain;
    const categories = binsToDrain.map((b) => b.id);
    const binIds = [...new Set(binsToDrain.map((b) => getBinIdForCard(b.id, collectorBins)).filter(Boolean))];
    if (binIds.length === 0) {
      setNotification('No assigned bin for this category. Ask admin to assign bins.');
      setConfirmModal({ show: false, binsToDrain: [] });
      return;
    }
    setDrainingBinId(binsToDrain[0]?.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setNotification('Please sign in again.');
        setConfirmModal({ show: false, binsToDrain: [] });
        return;
      }
      const res = await fetch(`${API_BASE}/api/collector-bins/drain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bin_ids: binIds, categories }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      if (!res.ok) {
        setNotification(data.message || 'Drain failed.');
        setConfirmModal({ show: false, binsToDrain: [] });
        return;
      }
      setBins((prevBins) =>
        prevBins.map((bin) =>
          categories.includes(bin.id) ? { ...bin, fillLevel: 0, status: 'Empty', lastCollection: 'Just now' } : bin
        )
      );
      persistBinsToBackendAndStorage(
        binsRef.current.map((b) => (categories.includes(b.id) ? { ...b, fillLevel: 0, status: 'Empty', lastCollection: 'Just now' } : b))
      );
      setSelectedBins([]);
      setConfirmModal({ show: false, binsToDrain: [] });
      setNotification('Bin(s) drained. See Collection History.');
      setTimeout(() => setNotification(''), 4000);
      await syncFillFromLevels();
      await fetchRecordedItems({ showLoadingOnlyFirst: false });
    } catch (err) {
      setNotification(err.message || 'Drain failed.');
      setConfirmModal({ show: false, binsToDrain: [] });
    } finally {
      setDrainingBinId(null);
    }
  };

  return (
    <div className="bin-monitoring-container">
      <div className="header-section">
        <div className="header-titles">
          <h1>Bin Monitoring</h1>
          <p>
            Monitor bin fill levels
            {collectorBins.length === 1 && collectorBins[0]?.id != null && (
              <> · Bin ID: {collectorBins[0].id}</>
            )}
            {collectorBins.length > 1 && (
              <> · {collectorBins.length} assigned bins</>
            )}
          </p>
          {collectorName && <p className="collector-name">Collector: <strong>{collectorName}</strong></p>}
          {assignedBinLocationText && (
            <div className="assigned-bin-location-card">
              <span>{assignedBinLocationText}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- SMART NOTIFICATIONS (No blocking errors) --- */}
      
      {/* Informational: User selected some empty bins, but we don't block action */}
      {selectedBins.length > actionableBins.length && actionableBins.length > 0 && (
         <div className="notification-banner warning" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
           <span>ℹ️</span>
           <p>Note: {selectedBins.length - actionableBins.length} selected bin(s) are already empty and will be skipped.</p>
         </div>
      )}

      {notification && <div className="notification-banner success"><span>✓</span> <p>{notification}</p></div>}
      {wsAlertBanner && (
        <div className={`notification-banner ${wsAlertBanner.type === 'critical' ? 'ml-critical' : 'ml-warning'}`}>
          <span>{wsAlertBanner.type === 'critical' ? '🚨' : '⚠️'}</span>
          <p>{wsAlertBanner.message}</p>
        </div>
      )}

      <HardwareStatus />
      <div style={{ marginTop: "0.5rem", color: wsConnected ? "#16a34a" : "#6b7280", fontSize: "0.9rem" }}>
        ● ML Camera: {wsConnected ? "Live" : "Disconnected"}
      </div>

      {isRestoring ? (
        <div className="bin-levels-loading" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>Loading bin levels…</div>
      ) : (
      <div className="bin-grid-layout">
        {bins.map((bin) => (
          <BinCard 
            key={bin.id}
            {...bin}
            isSelected={selectedBins.includes(bin.id)}
            onToggle={() => handleToggleSelect(bin.id)}
            onDrain={() => handleDrainSingle(bin.id)}
            onSort={handleSortToBin}
            sortCategory={BIN_TO_SORT_CATEGORY[bin.id]}
            isSorting={sortingCategory === BIN_TO_SORT_CATEGORY[bin.id]}
            isDraining={drainingBinId === bin.id}
            icon={bin.icon}
          />
        ))}
      </div>
      )}

      {collectorBins.length > 0 && (
        <div className="collection-history-inline">
          <div className="collection-history-inline-header">
            <h3>
              Recorded Items – {collectorBins.map((b) => b.name || `Bin ${b.id}`).join(', ')}
            </h3>
          </div>
          {loadingRecordedItems && recordedItems.length === 0 ? (
            <div className="collection-history-inline-loading">Loading…</div>
          ) : recordedItems.length === 0 ? (
            <div className="collection-history-inline-empty">No items recorded in this bin yet.</div>
          ) : (
            <div className="collection-history-inline-list-wrap">
              <ul className="collection-history-inline-list">
                {recordedItems.map((item) => (
                  <li key={item.id} className="collection-history-inline-item">
                    <span className="collection-history-inline-date">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </span>
                    <span className="collection-history-inline-category">{item.category || 'Unsorted'}</span>
                    {item.processing_time != null && (
                      <span className="collection-history-inline-time">{item.processing_time}s</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {confirmModal.show && (
        <ModalPortal>
          <div className="modal-card">
            <div className="modal-icon-wrapper"><AlertTriangle /></div>
            <h2>Confirm Drain</h2>
            <p>
              You are about to drain <strong>{confirmModal.binsToDrain.length}</strong> bin(s).
              <br/>
              <span style={{fontSize: '0.85rem', color: '#9ca3af'}}>
                ({confirmModal.binsToDrain.map(b => b.title).join(', ')})
              </span>
            </p>
            <div className="modal-btn-group">
              <button className="btn-cancel" onClick={() => setConfirmModal({ show: false, binsToDrain: [] })}>Cancel</button>
              <button className="btn-confirm" onClick={performDrain}>Yes, Drain</button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default BinMonitoring;