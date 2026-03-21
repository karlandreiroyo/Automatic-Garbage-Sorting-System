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
  // Requested UI scale:
  // low fill -> green, mid fill -> orange, full -> red
  if (fillLevel >= 90) return '#ef4444';
  if (fillLevel >= 50) return '#f97316';
  return '#10b981';
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
  bin_bio: 'Biodegradable',
  bin_nonbio: 'Non Biodegradable',
  bin_recycle: 'Recyclable',
  bin_unsorted: 'Unsorted',
};
/** Card id → WS payload key (O(1) merge in onmessage). */
const CARD_ID_TO_WS_BIN_KEY = {
  Biodegradable: 'bin_bio',
  'Non Biodegradable': 'bin_nonbio',
  Recyclable: 'bin_recycle',
  Unsorted: 'bin_unsorted',
};

const playAlertSound = (type) => {
  try {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const makeBeep = (start, freq = 440, duration = 0.1) => {
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
      makeBeep(now, 880, 0.15);
      makeBeep(now + 0.2, 880, 0.15);
      makeBeep(now + 0.4, 880, 0.15);
    } else {
      makeBeep(now, 440, 0.1);
      makeBeep(now + 0.16, 440, 0.1);
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
        {isAlmostFull && <div className="bin-alert-badge warning">⚠️ Almost Full</div>}
        {isFull && <div className="bin-alert-badge critical">🚨 FULL</div>}
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
         {last_ml_category && (
           <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '-8px' }}>
             🤖 {last_ml_category} · {Number.isFinite(Number(last_ml_confidence)) ? `${(Number(last_ml_confidence) * 100).toFixed(1)}%` : '0.0%'} · just now
           </div>
         )}
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
  const lastArduinoTypeRef = useRef("NORMAL");
  const binsRef = useRef(bins);
  binsRef.current = bins;
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [detectionLog, setDetectionLog] = useState([]);
  const [wsAlertBanner, setWsAlertBanner] = useState(null);
  const wsBannerTimerRef = useRef(null);
  const fullBinsLockRef = useRef(new Set());
  const wsThresholdSentRef = useRef(new Map());
  const wsDetectedAuditRef = useRef(new Map());

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
        // Merge with current state so WebSocket fill updates that arrived before restore finishes are not wiped.
        setBins((prevBins) =>
          INITIAL_BINS.map((base) => {
            const fromBackend = backendBins.find((b) => b.id === base.id);
            const fromLocal = localBins.find((b) => b.id === base.id);
            const prev = prevBins.find((b) => b.id === base.id);
            const fillBackend = fromBackend?.fillLevel ?? 0;
            const fillLocal = fromLocal?.fillLevel ?? 0;
            const fillFromWs = Number(prev?.fillLevel) || 0;
            const fillLevel = Math.max(fillBackend, fillLocal, fillFromWs);
            const lastCollection =
              fromBackend?.lastCollection ?? fromLocal?.lastCollection ?? prev?.lastCollection ?? base.lastCollection;
            return {
              ...base,
              ...prev,
              fillLevel,
              status:
                fillLevel >= 90 ? 'Full' : fillLevel >= 75 ? 'Almost Full' : fillLevel >= 50 ? 'Normal' : fillLevel > 0 ? 'Normal' : 'Empty',
              lastCollection,
            };
          })
        );
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

  /** Same fill % as admin Bin Monitoring (from waste_items via /levels). Keeps the higher fill level so websocket updates are not overwritten by slower polling. */
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
      setBins((prevBins) =>
        prevBins.map((prevBin) => {
          const base = INITIAL_BINS.find((b) => b.id === prevBin.id);
          const cat = categories.find((c) => c.id === prevBin.id);
          const apiFill = cat ? Math.min(100, Number(cat.fillLevel) || 0) : 0;
          const prevFill = Math.min(100, Number(prevBin.fillLevel) || 0);
          const fl = Math.max(apiFill, prevFill);
          const last = cat?.lastCollection
            ? new Date(cat.lastCollection).toLocaleString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit',
                hour: 'numeric',
                minute: '2-digit',
              })
            : prevBin.lastCollection || 'Just now';
          return {
            ...(base || {}),
            ...prevBin,
            fillLevel: fl,
            lastCollection: last,
            status:
              fl >= 90 ? 'Full' : fl >= 75 ? 'Almost Full' : fl >= 50 ? 'Normal' : fl > 0 ? 'Normal' : 'Empty',
          };
        })
      );
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

  // WebSocket: ML desktop app -> realtime updates.
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
        const status = alert.type === 'critical' ? "100%" : "80%";
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

    const sendMlThresholdNotification = async (cardId, thresholdLevel) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        // Prefer exact category mapping; fallback to any assigned collector bin so
        // non-bio/recycle/unsorted threshold notifications are not dropped.
        const binId = getBinIdForCard(cardId, collectorBins) ?? collectorBins?.[0]?.id ?? null;
        if (!binId) return;
        await fetch(`${API_BASE}/api/collector-bins/bin-alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            bin_id: binId,
            bin_category: cardId,
            status: `${thresholdLevel}%`,
            isUnread: true,
          }),
        });
      } catch (_) {}
    };

    const sendDetectedRecycleOrUnsortedLog = async (latest) => {
      try {
        if (!latest) return;
        const label = String(latest.bin_label || '').trim();
        const normalized = label.toLowerCase();
        const isRecycle = normalized.includes('recycl');
        const isUnsorted = normalized.includes('unsort');
        if (!isRecycle && !isUnsorted) return;
        const cardId = isRecycle ? 'recyclable' : 'unsorted';
        const dedupeKey = `${cardId}:${String(latest.last_category || '').toUpperCase()}`;
        const now = Date.now();
        const lastTs = Number(wsDetectedAuditRef.current.get(dedupeKey) || 0);
        if (now - lastTs < 10000) return; // avoid flooding on rapid repeated detections
        wsDetectedAuditRef.current.set(dedupeKey, now);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const binId = getBinIdForCard(cardId, collectorBins) ?? collectorBins?.[0]?.id ?? null;
        if (!binId) return;
        await fetch(`${API_BASE}/api/collector-bins/detected-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            bin_id: binId,
            bin_category: isRecycle ? 'Recyclable' : 'Unsorted',
            category: latest.last_category ?? null,
            processing_time: null,
          }),
        });
      } catch (_) {}
    };

    const applyWsBinUpdate = (wsData) => {
      if (!wsData || typeof wsData !== "object") return;
      setBins((prevBins) =>
        prevBins.map((bin) => {
          const wsKey = CARD_ID_TO_WS_BIN_KEY[bin.id];
          if (!wsKey) return bin;
          const wsBin = wsData[wsKey];
          if (!wsBin || typeof wsBin !== "object") return bin;
          const rawFill = wsBin.fill_level ?? wsBin.fillLevel;
          const incomingFill = Number(rawFill);
          const currentFull = Number(bin.fillLevel) >= 100;
          const clampedIncoming = Math.min(100, Math.max(0, Number(incomingFill) || 0));
          // Keep updates monotonic per bin except explicit reset (0) after drain.
          const nextFill = Number.isFinite(incomingFill) && !currentFull
            ? (clampedIncoming === 0 ? 0 : Math.max(Number(bin.fillLevel) || 0, clampedIncoming))
            : bin.fillLevel;
          const status = nextFill === 0 ? "Empty" : nextFill <= 74 ? "Normal" : nextFill <= 89 ? "Almost Full" : "Full";
          return {
            ...bin,
            fillLevel: Math.min(100, Math.max(0, Number(nextFill) || 0)),
            status,
            last_ml_category: wsBin.last_category ?? null,
            last_ml_confidence: wsBin.last_confidence ?? null,
            last_ml_detected_at: wsBin.last_detected_at ?? new Date().toISOString(),
          };
        })
      );
    };

    const connect = () => {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log("[WS] Browser connected");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("[WS] Message received:", payload);
          if (!payload || (payload.type !== "init" && payload.type !== "update")) return;
          applyWsBinUpdate(payload.data);
          if (payload.type === "update" && payload?.data && typeof payload.data === "object") {
            try {
              Object.entries(payload.data).forEach(([wsKey, wsBin]) => {
                if (!wsBin || typeof wsBin !== "object") return;
                const cardId = WS_BIN_TO_CARD_ID[wsKey];
                if (!cardId) return;
                const incoming = Number(wsBin.fill_level ?? wsBin.fillLevel);
                const clamped = Math.min(100, Math.max(0, Number(incoming) || 0));
                const threshold = Math.floor(clamped / 10) * 10;
                const lastSent = Number(wsThresholdSentRef.current.get(cardId) || 0);
                if (threshold <= 0) {
                  wsThresholdSentRef.current.set(cardId, 0);
                  return;
                }
                if (threshold <= lastSent) return;
                for (let lvl = Math.max(10, lastSent + 10); lvl <= threshold; lvl += 10) {
                  sendMlThresholdNotification(cardId, lvl);
                }
                wsThresholdSentRef.current.set(cardId, threshold);
              });
            } catch (_) {}
          }
          setTimeout(() => {
            try {
              persistBinsToBackendAndStorage(binsRef.current);
            } catch (_) {}
          }, 0);
          if (payload?.data && typeof payload.data === "object") {
            const entries = Object.values(payload.data).filter(Boolean);
            if (entries.length) {
              const latest = entries
                .filter((b) => b.last_category && b.last_detected_at)
                .sort((a, b) => new Date(b.last_detected_at).getTime() - new Date(a.last_detected_at).getTime())[0];
              if (latest) {
                sendDetectedRecycleOrUnsortedLog(latest);
                setDetectionLog((prev) => {
                  const latestTs = latest.last_detected_at ? new Date(latest.last_detected_at).getTime() : Date.now();
                  const prevTop = prev[0];
                  if (prevTop) {
                    const prevTs = prevTop.timestamp ? new Date(prevTop.timestamp).getTime() : 0;
                    const sameClass = (prevTop.category || "") === (latest.last_category || "");
                    const sameBin = (prevTop.bin_label || "") === (latest.bin_label || "");
                    if (sameClass && sameBin && latestTs - prevTs < 2000) {
                      return prev;
                    }
                  }
                  const next = [
                    {
                      id: Date.now(),
                      bin_label: latest.bin_label,
                      category: latest.last_category,
                      confidence: latest.last_confidence,
                      timestamp: latest.last_detected_at,
                      colorClass:
                        latest.bin_label === "Biodegradable" ? "green" :
                        latest.bin_label === "Recyclable" ? "blue" :
                        latest.bin_label === "Non-Biodegradable" ? "red" : "lime",
                    },
                    ...prev,
                  ];
                  return next.slice(0, 10);
                });
              }
            }
          }
          if (payload.alert) {
            const alert = payload.alert;
            const cardId = WS_BIN_TO_CARD_ID[alert.bin_id] || alert.bin_label;
            if (alert.type === 'critical' && cardId) {
              fullBinsLockRef.current.add(cardId);
            }
            const bannerMessage = alert.type === 'critical'
              ? `🚨 ${alert.bin_label} bin is FULL at 100%! Sorting paused for this bin.`
              : `⚠️ ${alert.bin_label} bin is almost full at 80%! Machine continues sorting.`;
            setWsAlertBanner({ type: alert.type, message: bannerMessage });
            if (wsBannerTimerRef.current) clearTimeout(wsBannerTimerRef.current);
            wsBannerTimerRef.current = setTimeout(() => setWsAlertBanner(null), 8000);
            playAlertSound(alert.type);

            const binForMeta = binsRef.current.find((b) => b.id === cardId);
            const fillText = `${Math.min(100, Number(alert.fill_level) || 0)}%`;
            const notificationObj = {
              id: Date.now(),
              type: alert.type,
              title: alert.type === 'critical' ? "Bin Full Alert" : "Bin Almost Full",
              time: "Just now",
              date: "",
              message: alert.type === 'critical' ? `${alert.bin_label} bin is 100% full` : `${alert.bin_label} bin reached 80%`,
              subtext: alert.bin_label,
              fillLevel: alert.type === 'critical' ? "100%" : "80%",
              capacity: binForMeta?.capacity || "100 L",
              location: assignedBinLocationText || "",
              isUnread: true,
            };
            pushLocalNotification(notificationObj);
            sendAlertToBackend(alert);
          }
        } catch (err) {
          console.error("[WS] onmessage error:", err);
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
        // Do not force-close here; closing while CONNECTING triggers
        // "WebSocket is closed before the connection is established".
        // Let onclose handle reconnect.
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
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      } catch (_) {}
    };
  }, [assignedBinLocationText, collectorBins]);

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
          categories.includes(bin.id)
            ? {
                ...bin,
                fillLevel: 0,
                status: 'Empty',
                lastCollection: 'Just now',
                last_ml_category: null,
                last_ml_confidence: null,
                last_ml_detected_at: null,
              }
            : bin
        )
      );
      try {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          categories.forEach((cat) => {
            const wsBinId = CARD_ID_TO_WS_BIN_KEY[cat];
            if (wsBinId) ws.send(JSON.stringify({ type: 'reset_bin', bin_id: wsBinId }));
            wsThresholdSentRef.current.set(cat, 0);
          });
        }
      } catch (_) {}
      persistBinsToBackendAndStorage(
        binsRef.current.map((b) =>
          categories.includes(b.id)
            ? {
                ...b,
                fillLevel: 0,
                status: 'Empty',
                lastCollection: 'Just now',
                last_ml_category: null,
                last_ml_confidence: null,
                last_ml_detected_at: null,
              }
            : b
        )
      );
      // Do not insert history_binitem from frontend.
      // Backend /api/collector-bins/drain already writes authoritative drain history.
      try {
        const { data: { session: sessionNow } } = await supabase.auth.getSession();
        const tokenNow = sessionNow?.access_token;
        if (tokenNow) {
          for (const cat of categories) {
            const resolvedBinId = getBinIdForCard(cat, collectorBins) ?? binIds[0] ?? null;
            if (!resolvedBinId) continue;
            await fetch(`${API_BASE}/api/collector-bins/bin-alert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenNow}` },
              body: JSON.stringify({
                bin_id: resolvedBinId,
                bin_category: cat,
                status: 'Drained',
                isUnread: true,
                message: `${cat} bin was drained and reset to 0%`,
              }),
            });
          }
        }
      } catch (_) {}
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
      <div style={{ fontSize: "0.8rem", marginBottom: 8, color: wsConnected ? "#16a34a" : "#dc2626" }}>
        ● ML Camera: {wsConnected ? "Live" : "Disconnected"}
        <span style={{ display: "block", color: "#64748b", fontSize: "0.75rem", marginTop: 4 }}>
          WebSocket: {getWsUrl()}
          {!wsConnected && " — start ws-server (node ws-server.js) on port 3001, then refresh."}
        </span>
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
      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>🤖 Live Detection Feed</div>
        {detectionLog.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>No detections yet</div>
        ) : (
          <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {detectionLog.map((d) => (
              <div key={d.id} style={{ fontSize: "0.85rem", color: "#334155" }}>
                <span style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  marginRight: 8,
                  background:
                    d.colorClass === "green" ? "#10b981" :
                    d.colorClass === "blue" ? "#f97316" :
                    d.colorClass === "red" ? "#ef4444" : "#6b7280"
                }} />
                {d.bin_label} · {d.category} · {Number.isFinite(Number(d.confidence)) ? `${(Number(d.confidence) * 100).toFixed(1)}%` : "0.0%"} · {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : "—"}
              </div>
            ))}
          </div>
        )}
      </div>

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