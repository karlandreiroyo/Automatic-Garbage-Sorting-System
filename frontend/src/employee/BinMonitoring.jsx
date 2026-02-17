import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../supabaseClient";
import HardwareStatus from "../components/HardwareStatus";
import "../employee/employeecss/BinMonitoring.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Rounds fill level to nearest 10
 * @param {number} level - Fill level percentage
 * @returns {number} Rounded fill level (0, 10, 20, ..., 100)
 */
const roundToTen = (level) => {
  return Math.round(level / 10) * 10;
};

/** Format DB last_update (ISO string) to "Just now" / "5 minutes ago" etc. */
const formatLastCollection = (iso) => {
  if (!iso) return 'Just now';
  const updateDate = new Date(iso);
  const now = new Date();
  const diffMinutes = Math.floor((now - updateDate) / (1000 * 60));
  if (diffMinutes <= 0) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
};

/** Map DB category or bin name to our card id (Biodegradable, Non Biodegradable, Recyclable, Unsorted). */
const categoryToCardId = (catOrName) => {
  if (!catOrName) return null;
  const s = String(catOrName).toLowerCase();
  if (s.includes('bio') && !s.includes('non')) return 'Biodegradable';
  if (s.includes('non') && s.includes('bio')) return 'Non Biodegradable';
  if (s.includes('recycl')) return 'Recyclable';
  if (s.includes('unsort')) return 'Unsorted';
  return null;
};

// --- ICONS ---
const LeafIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg> );
const TrashIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> );
const RecycleIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> );
const GearIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> );
const DrainAllIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l5 5 5-5M7 13l5 5 5-5"/></svg> );
const AlertTriangle = () => ( <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );

/** Map category to colorClass and icon for per-bin cards (Bin 1, Bin 2, ...). */
const CATEGORY_STYLE = {
  Biodegradable: { colorClass: 'green', icon: LeafIcon },
  'Non Biodegradable': { colorClass: 'red', icon: TrashIcon },
  Recyclable: { colorClass: 'blue', icon: RecycleIcon },
  Unsorted: { colorClass: 'lime', icon: GearIcon },
};
const getStyleForCategory = (cat) => CATEGORY_STYLE[cat] || { colorClass: 'lime', icon: GearIcon };

// Fill level color: green (low) → yellow (medium) → red (high)
const getFillLevelColor = (fillLevel) => {
  if (fillLevel >= 75) return '#ef4444'; // red — high/full
  if (fillLevel >= 40) return '#eab308'; // yellow — medium
  return '#10b981'; // green — low/ok
};

const WEIGHT_MAX_G = 500; // Weight sensor progress bar scale (0–500 g)

// --- SINGLE BIN CARD COMPONENT ---
const BinCard = React.memo(({ title, capacity, fillLevel, lastCollection, colorClass, status, icon: Icon, onDrain, isSelected, onToggle, showCheckbox, weight }) => {
  const isEmpty = fillLevel === 0;
  const weightG = weight != null ? Number(weight) : null;
  const weightPercent = weightG != null ? Math.min(100, Math.max(0, (weightG / WEIGHT_MAX_G) * 100)) : 0;

  return (
    <div className={`bin-card ${colorClass} ${isSelected ? 'selected-card' : ''}`} onClick={showCheckbox ? onToggle : undefined}>
      <div className="bin-header">
        {showCheckbox && (
          <div className="bin-card-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="bin-card-checkbox"
              checked={!!isSelected}
              onChange={() => onToggle?.()}
              aria-label={`Select ${title}`}
            />
          </div>
        )}
        <div className="icon-circle"><Icon /></div>
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
        {/* Weight sensor: reads from serial, same design in each bin */}
        <div className="bin-weight-sensor">
          <span className="bin-weight-label">Weight sensor</span>
          <div className="bin-weight-progress-wrap">
            <div className="bin-weight-progress-track">
              <div className="bin-weight-progress-fill" style={{ width: `${weightPercent}%` }} />
            </div>
            <span className="bin-weight-value">{weightG != null ? `${Number(weightG).toFixed(1)} g` : '— g'}</span>
          </div>
        </div>
        <div className="meta-info">
          <div className="meta-row"><span className="meta-label">Last Collection</span><strong className="meta-val">{lastCollection}</strong></div>
        </div>
        <button
          type="button"
          className="bin-card-drain-btn"
          disabled={isEmpty}
          onClick={(e) => { e.stopPropagation(); onDrain?.(); }}
          title={isEmpty ? 'Bin is already empty' : 'Drain this bin'}
        >
          <DrainAllIcon />
          <span>Drain Bin</span>
        </button>
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

// Base bin definition (icons not serializable; merge on restore)
const INITIAL_BINS = [
  { id: 'Biodegradable', title: 'Biodegradable', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'green', status: 'Empty', icon: LeafIcon },
  { id: 'Non Biodegradable', title: 'Non-Bio', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'red', status: 'Empty', icon: TrashIcon },
  { id: 'Recyclable', title: 'Recyclable', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'blue', status: 'Empty', icon: RecycleIcon },
  { id: 'Unsorted', title: 'Unsorted', capacity: '100 L', fillLevel: 0, lastCollection: 'Just now', colorClass: 'lime', status: 'Empty', icon: GearIcon },
];

/** Restore bins from localStorage synchronously so tab switch doesn't flash 0% */
function getInitialBins() {
  try {
    const saved = localStorage.getItem("agss_bin_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return INITIAL_BINS.map((base) => {
          const ov = parsed.find((b) => b.id === base.id);
          if (!ov) return base;
          return { ...base, fillLevel: ov.fillLevel ?? base.fillLevel, status: ov.status ?? base.status, lastCollection: ov.lastCollection ?? base.lastCollection };
        });
      }
    }
  } catch {}
  return INITIAL_BINS;
}

const BinMonitoring = () => {
  const [bins, setBins] = useState(getInitialBins);
  const [notification, setNotification] = useState("");
  const [fillLevelAlert, setFillLevelAlert] = useState(null); // { title, message, type } — popup on Bin Monitoring so collector doesn't need to switch to Notifications
  const fillLevelAlertTimeoutRef = useRef(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, binsToDrain: [] });
  const [assignedBinLocationText, setAssignedBinLocationText] = useState("");
  const [hardwareWeight, setHardwareWeight] = useState(null); // weight from serial (g), shown in each bin card — updated in real time
  const [collectorName, setCollectorName] = useState("");
  const [collectorInfo, setCollectorInfo] = useState(null);
  const [collectorBins, setCollectorBins] = useState([]);
  const [fallbackBinId, setFallbackBinId] = useState(null); // when collector has no assigned bins, use any bin for waste_items
  const [wasteItemError, setWasteItemError] = useState(null); // "Supabase did not connected" or backend error when waste_items insert fails
  const [hasPersistedBinState, setHasPersistedBinState] = useState(false);
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const lastArduinoTypeRef = useRef("NORMAL");
  const lastWasteItemInsertRef = useRef({}); // { category: timestamp } — debounce: one insert per scan
  const hasRestoredRef = useRef(false); // true after restore completes — avoid persisting initial 0% and overwriting file
  const binsRef = useRef(bins);
  const hardwareWeightRef = useRef(null);
  const collectorInfoRef = useRef(null);
  const collectorBinsRef = useRef([]);
  const fallbackBinIdRef = useRef(null);
  binsRef.current = bins;
  hardwareWeightRef.current = hardwareWeight;
  collectorInfoRef.current = collectorInfo;
  collectorBinsRef.current = collectorBins;
  fallbackBinIdRef.current = fallbackBinId;

  const persistBinsToBackendAndStorage = (binsToSave) => {
    const list = Array.isArray(binsToSave) ? binsToSave : binsRef.current;
    const serializable = list.map((b) => ({ id: b.id, fillLevel: b.fillLevel, status: b.status, lastCollection: b.lastCollection }));
    try {
      localStorage.setItem("agss_bin_state", JSON.stringify(serializable));
      fetch(`${API_BASE}/api/collector-bins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bins: serializable }) }).catch(() => {});
    } catch {}
  };

  // Restore: prefer localStorage first (persisted on drain/unmount) so tab switch preserves state; /levels for first load when localStorage empty
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        // 1. Prefer localStorage — we persist on drain and unmount, so it reflects correct state after tab switch
        const saved = localStorage.getItem("agss_bin_state");
        if (saved && !cancelled) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBins(INITIAL_BINS.map((base) => {
                const ov = parsed.find((b) => b.id === base.id);
                if (!ov) return base;
                return { ...base, fillLevel: ov.fillLevel ?? base.fillLevel, status: ov.status ?? base.status, lastCollection: ov.lastCollection ?? base.lastCollection };
              }));
              setHasPersistedBinState(true);
              if (!cancelled) setIsRestoring(false);
              if (!cancelled) hasRestoredRef.current = true;
              setRestoreAttempted(true);
              return;
            }
          } catch {}
        }
        // 2. Fallback: /levels from API (first load or empty localStorage)
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const res = await fetch(`${API_BASE}/api/collector-bins/levels`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok && !cancelled) {
            const data = await res.json();
            if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
              setBins((prev) =>
                prev.map((base) => {
                  const cat = data.categories.find((c) => c.id === base.id);
                  if (!cat) return base;
                  const fill = cat.fillLevel ?? 0;
                  const status = fill >= 90 ? 'Full' : fill >= 75 ? 'Almost Full' : fill >= 50 ? 'Normal' : 'Empty';
                  return {
                    ...base,
                    fillLevel: fill,
                    status,
                    lastCollection: cat.lastCollection ? formatLastCollection(cat.lastCollection) : base.lastCollection ?? 'Just now',
                    binId: cat.binId ?? base.binId,
                  };
                })
              );
              setHasPersistedBinState(true);
              setRestoreAttempted(true);
              if (!cancelled) setIsRestoring(false);
              if (!cancelled) hasRestoredRef.current = true;
              return;
            }
            if (data.success && (!data.bins?.length) && (!data.categories?.length)) {
              setBins(INITIAL_BINS.map((b) => ({ ...b, fillLevel: 0, status: 'Empty', lastCollection: 'Just now' })));
              setHasPersistedBinState(false);
              setRestoreAttempted(true);
              if (!cancelled) setIsRestoring(false);
              if (!cancelled) hasRestoredRef.current = true;
              return;
            }
          }
        }
        // 3. Last resort: backend in-memory store
        const res = await fetch(`${API_BASE}/api/collector-bins`);
        const data = res.ok ? await res.json() : {};
        const backendBins = data?.bins;
        if (cancelled) return;
        if (Array.isArray(backendBins) && backendBins.length > 0) {
          setBins(INITIAL_BINS.map((base) => {
            const ov = backendBins.find((b) => b.id === base.id);
            if (!ov) return base;
            return { ...base, fillLevel: ov.fillLevel ?? base.fillLevel, status: ov.status ?? base.status, lastCollection: ov.lastCollection ?? base.lastCollection };
          }));
          setHasPersistedBinState(true);
        }
      } catch {}
      if (!cancelled) { setRestoreAttempted(true); setIsRestoring(false); hasRestoredRef.current = true; }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  // Collector name + assigned bins (via backend to avoid Supabase RLS 400)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(`${API_BASE}/api/collector-bins/assigned`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setCollectorBins([]);
          return;
        }
        const data = await res.json();
        if (!data.success || !Array.isArray(data.bins)) {
          setCollectorBins([]);
          return;
        }
        const assignedBins = data.bins;
        const userRow = { id: data.collector?.id };
        if (data.collector?.name) setCollectorName(data.collector.name);
        // Get full user row for waste_items (first_name, etc.)
        const { data: userFull } = await supabase.from('users').select('id, first_name, middle_name, last_name').eq('auth_id', session.user.id).maybeSingle();
        if (userFull) {
          setCollectorInfo({ id: userFull.id, first_name: userFull.first_name, middle_name: userFull.middle_name, last_name: userFull.last_name });
        }
        if (assignedBins.length > 0) {
          setCollectorBins(assignedBins);
          const locations = assignedBins.map((b) => (b.location?.trim() || b.name || 'Unspecified')).filter(Boolean);
          if (locations.length) setAssignedBinLocationText(locations.length === 1 ? `Located at ${locations[0]}` : `Located at ${locations.join(', ')}`);

          const categoryOrder = ['Biodegradable', 'Non Biodegradable', 'Recyclable', 'Unsorted'];
          const byCardId = {};
          assignedBins.forEach((b) => {
            const cardId = categoryToCardId(b.name) ?? categoryToCardId(b.category);
            if (cardId) byCardId[cardId] = b;
          });
          assignedBins.forEach((b, i) => {
            const cardId = categoryOrder[i];
            if (cardId && !byCardId[cardId]) byCardId[cardId] = b;
          });
          setBins((prev) =>
            prev.map((base) => {
              const dbBin = byCardId[base.id];
              return {
                ...base,
                binId: dbBin?.id,
                lastCollection: base.lastCollection ?? 'Just now',
              };
            })
          );
          setHasPersistedBinState(true);
        } else {
          setCollectorBins([]);
          if (data.fallback_bin_id != null) setFallbackBinId(data.fallback_bin_id);
        }
      } catch {
        setCollectorBins([]);
      }
    };
    load();
  }, []);

  /**
   * NOTIFICATION PROMPT (based on bin monitoring fill level):
   * - 10%  → Info:    "Bin update" / bin at 10% capacity
   * - 50%  → Warning: "Your trash is in the middle"
   * - 80%  → Warning: "Bin almost full"
   * - 90%+ → Critical: "Bin Full Alert" / bin is full
   * Notifications are pushed to localStorage (agss_notifications) and shown on the Notifications page.
   */
  // Real-time weight: poll hardware every 300ms; connect serial weight to all four bins
  useEffect(() => {
    let cancelled = false;
    const pollWeight = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hardware/status`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        let w = data.lastWeight != null ? Number(data.lastWeight) : null;
        if (w == null && data.lastLine) {
          const match = String(data.lastLine).match(/Weight:\s*([-\d.]+)/i);
          if (match) w = parseFloat(match[1]);
        }
        if (!cancelled) setHardwareWeight(w != null ? w : null);
      } catch {}
    };
    pollWeight();
    const weightId = setInterval(pollWeight, 300);
    return () => { cancelled = true; clearInterval(weightId); };
  }, []);

  // Poll hardware: type for bin updates (detection logic stays at 1s)
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
        const categoryMap = { BIO: "Biodegradable", NON_BIO: "Non Biodegradable", RECYCABLE: "Recyclable", UNSORTED: "Unsorted" };
        const targetCategory = categoryMap[type];
        if (!type || type === "NORMAL" || !targetCategory) return;

        const targetBin = binsRef.current.find((b) => b.id === targetCategory || b.category === targetCategory);
        if (targetBin && targetBin.fillLevel >= 100) {
          // Bin already full: do not add more, do not insert waste_item; show Bin Full Alert so collector is notified
          const fullAlert = { id: Date.now(), type: "critical", title: "Bin Full Alert", createdAt: new Date().toISOString(), message: `${targetBin.title} bin is full — no more can be added. Drain the bin.`, subtext: targetBin.title, fillLevel: "100%", capacity: targetBin.capacity || "", location: assignedBinLocationText || "", isUnread: true };
          try {
            const raw = localStorage.getItem("agss_notifications");
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem("agss_notifications", JSON.stringify([...existing, fullAlert].slice(-100)));
          } catch {}
          if (fillLevelAlertTimeoutRef.current) clearTimeout(fillLevelAlertTimeoutRef.current);
          setFillLevelAlert({ title: fullAlert.title, message: fullAlert.message, type: "critical" });
          fillLevelAlertTimeoutRef.current = setTimeout(() => { setFillLevelAlert(null); fillLevelAlertTimeoutRef.current = null; }, 6000);
          // Record in notification_bin so alert shows in database for this specific bin
          const binIdForAlert = targetBin.binId ?? collectorBinsRef.current[0]?.id ?? fallbackBinIdRef.current;
          if (binIdForAlert != null) {
            (async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;
                await fetch(`${API_BASE}/api/collector-bins/bin-alert`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                  body: JSON.stringify({ bin_id: binIdForAlert, status: "Full - No more can be added", bin_category: targetBin.title }),
                });
              } catch {}
            })();
          }
          return;
        }

        // One detect = one addition: only when we transition TO this category (prev !== type).
        if (prev === type) return;
        let newNotification = null;
        const nextBins = binsRef.current.map((bin) => {
          const isTarget = targetCategory && (bin.id === targetCategory || bin.category === targetCategory);
          if (!isTarget) return bin;
          const raw = Math.min(100, bin.fillLevel + 10);
          const rounded = roundToTen(raw);
          if (rounded === 10) {
            newNotification = { id: Date.now(), type: "info", title: "Bin update", createdAt: new Date().toISOString(), message: `${bin.title} bin is at 10% capacity`, subtext: bin.title, fillLevel: "10%", capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          } else if (rounded === 50) {
            newNotification = { id: Date.now(), type: "warning", title: "Bin at 50%", createdAt: new Date().toISOString(), message: `${bin.title} — your trash is in the middle`, subtext: bin.title, fillLevel: "50%", capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          } else if (rounded >= 80 && rounded < 90) {
            newNotification = { id: Date.now(), type: "warning", title: "Bin Almost Full", createdAt: new Date().toISOString(), message: `${bin.title} bin is almost full (${rounded}%)`, subtext: bin.title, fillLevel: `${rounded}%`, capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          } else if (rounded >= 90) {
            newNotification = { id: Date.now(), type: "critical", title: "Bin Full Alert", createdAt: new Date().toISOString(), message: `${bin.title} bin has reached ${rounded}% — bin is full`, subtext: bin.title, fillLevel: `${rounded}%`, capacity: bin.capacity, location: assignedBinLocationText || "", isUnread: true };
          }
          return { ...bin, fillLevel: rounded, status: rounded >= 90 ? "Full" : rounded >= 75 ? "Almost Full" : rounded >= 50 ? "Normal" : "Empty" };
        });
        setBins(nextBins);
        // Only persist to global JSON when collector has no assigned bins (fallback). When assigned, DB is source of truth.
        if (!collectorBinsRef.current?.length) persistBinsToBackendAndStorage(nextBins);
        if (newNotification) {
          try {
            const raw = localStorage.getItem("agss_notifications");
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem("agss_notifications", JSON.stringify([...existing, newNotification].slice(-100)));
          } catch {}
          // Show alert popup on Bin Monitoring so collector sees it without switching to Notifications (50%, 80%, 90%+ only)
          if (newNotification.type === 'warning' || newNotification.type === 'critical') {
            if (fillLevelAlertTimeoutRef.current) clearTimeout(fillLevelAlertTimeoutRef.current);
            setFillLevelAlert({ title: newNotification.title, message: newNotification.message, type: newNotification.type });
            fillLevelAlertTimeoutRef.current = setTimeout(() => {
              setFillLevelAlert(null);
              fillLevelAlertTimeoutRef.current = null;
            }, 6000);
          }
          // Record in notification_bin so alert shows in database for this specific bin and percentage
          const alertBin = nextBins.find((b) => b.id === targetCategory || b.category === targetCategory);
          const binIdForAlert = alertBin?.binId ?? collectorBinsRef.current[0]?.id ?? fallbackBinIdRef.current;
          const statusForDb = newNotification.fillLevel || (newNotification.title === "Bin Full Alert" ? "100%" : "");
          if (binIdForAlert != null && statusForDb) {
            (async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;
                await fetch(`${API_BASE}/api/collector-bins/bin-alert`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                  body: JSON.stringify({ bin_id: binIdForAlert, status: statusForDb, bin_category: newNotification.subtext }),
                });
              } catch {}
            })();
          }
        }
        // Record detection via backend → Supabase waste_items (use refs so poll always sees latest)
        const categoryText = targetCategory;
        const info = collectorInfoRef.current;
        const cBins = collectorBinsRef.current;
        const binId = categoryText ? (nextBins.find((b) => b.id === categoryText || b.category === categoryText)?.binId ?? cBins[0]?.id ?? fallbackBinIdRef.current ?? null) : null;
        if (info && binId != null && categoryText) {
          const now = Date.now();
          const lastInsert = lastWasteItemInsertRef.current[categoryText] || 0;
          if (now - lastInsert < 2500) return; // One insert per scan — debounce 2.5s per category
          const weightG = hardwareWeightRef.current != null ? Number(hardwareWeightRef.current) : null;
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = { "Content-Type": "application/json" };
            if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
            const res = await fetch(`${API_BASE}/api/collector-bins/waste-item`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                bin_id: binId,
                category: categoryText,
                weight: weightG,
                processing_time: null,
                first_name: info.first_name ?? "",
                middle_name: info.middle_name ?? "",
                last_name: info.last_name ?? "",
              }),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              const msg = errData.error || res.statusText || "Supabase did not connected";
              console.error("waste_items backend error:", msg);
              setWasteItemError(msg);
              setTimeout(() => setWasteItemError(null), 8000);
            } else {
              lastWasteItemInsertRef.current[categoryText] = Date.now();
              setWasteItemError(null);
            }
          } catch (err) {
            console.error("waste_items request failed:", err);
            setWasteItemError("Supabase did not connected");
            setTimeout(() => setWasteItemError(null), 8000);
          }
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 500);
    return () => { cancelled = true; clearInterval(id); };
  }, [collectorInfo, collectorBins]);

  // Poll per-collector fill levels from DB (waste_items for this collector's bins) every 2s
  useEffect(() => {
    let cancelled = false;
    const pollLevels = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || cancelled) return;
        const res = await fetch(`${API_BASE}/api/collector-bins/levels`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!data.success) return;
        // Prefer 4 category cards (Biodegradable, Non-Bio, Recyclable, Unsorted)
        if (Array.isArray(data.categories) && data.categories.length === 0) return;
        setBins((prev) =>
          prev.map((base) => {
            const cat = data.categories.find((c) => c.id === base.id);
            if (!cat) return base;
            const apiFill = cat.fillLevel ?? 0;
            // Use binsRef so we never overwrite hardware-driven updates (prev can be stale due to batching)
            const localFill = binsRef.current.find((b) => b.id === base.id)?.fillLevel ?? base.fillLevel ?? 0;
            const fill = Math.max(localFill, apiFill);
            const status = fill >= 90 ? 'Full' : fill >= 75 ? 'Almost Full' : fill >= 50 ? 'Normal' : 'Empty';
            return {
              ...base,
              fillLevel: fill,
              status,
              lastCollection: cat.lastCollection ? formatLastCollection(cat.lastCollection) : base.lastCollection ?? 'Just now',
              binId: cat.binId ?? base.binId,
            };
          })
        );
      } catch {}
    };
    pollLevels();
    const id = setInterval(pollLevels, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Persist to localStorage so tab switch preserves state (DB is source of truth for /levels, but localStorage survives navigation)
  useEffect(() => {
    if (!hasRestoredRef.current) return;
    persistBinsToBackendAndStorage(bins);
  }, [bins]);
  useEffect(() => {
    return () => {
      persistBinsToBackendAndStorage(binsRef.current);
    };
  }, []);
  useEffect(() => {
    return () => {
      if (fillLevelAlertTimeoutRef.current) clearTimeout(fillLevelAlertTimeoutRef.current);
    };
  }, []);

  /**
   * Fetches bin data from Supabase and aggregates category bins
   */
  const fetchBinData = async () => {
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
  const updateBinFillLevels = () => {
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
  const urgentBinsCount = useMemo(() => bins.filter(bin => bin.fillLevel > 75).length, [bins]);

  // --- HANDLERS ---

  const handleDrainSingle = (id) => {
    const bin = bins.find(b => b.id === id);
    if (bin && bin.fillLevel > 0) {
      setConfirmModal({ show: true, binsToDrain: [bin] });
    }
  };

  const handleDrainAll = () => {
    const allBinsWithIds = bins.filter(b => b.binId != null);
    if (allBinsWithIds.length > 0) {
      setConfirmModal({ show: true, binsToDrain: allBinsWithIds });
    }
  };

  const performDrain = async () => {
    const binsToDrain = confirmModal.binsToDrain;
    const idsToDrain = binsToDrain.map(b => b.id);

    // Call backend drain API (clears waste_items and updates bins so next poll shows 0%)
    const binIdsToDrain = binsToDrain.map((b) => b.binId).filter(Boolean);
    if (binIdsToDrain.length > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const categoriesToDrain = binsToDrain.map((b) => b.id);
        const res = await fetch(`${API_BASE}/api/collector-bins/drain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
          body: JSON.stringify({ bin_ids: binIdsToDrain, categories: categoriesToDrain }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Drain failed');
        }
      } catch (error) {
        console.error('Error draining bins:', error);
        // Fallback: update bins only (fill level may not persist across poll)
        try {
          for (const bin of binsToDrain) {
            if (bin.binId) {
              await supabase.from('bins').update({ fill_level: 0, last_update: new Date().toISOString() }).eq('id', bin.binId);
            }
          }
        } catch (e) {}
      }
    }

    // Log each drained bin to collection history (real-time)
    const logEntries = binsToDrain.map((bin) => ({
      bin_category: bin.id,
      bin_name: bin.title || bin.id,
      collector_id: collectorInfo?.id ?? null,
      collector_name: collectorName || '',
    }));
    try {
      await fetch(`${API_BASE}/api/collector-bins/collection-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: logEntries }),
      });
    } catch (err) {
      console.error('Error logging collection:', err);
    }

    // Notify which bin(s) were drained (per bin, so collector sees each one)
    try {
      const raw = localStorage.getItem('agss_notifications');
      const existing = raw ? JSON.parse(raw) : [];
      const drainNotifications = binsToDrain.map((bin, i) => ({
        id: Date.now() + i,
        type: 'success',
        title: 'Bin Drained',
        createdAt: new Date().toISOString(),
        message: `${bin.title} bin has been drained`,
        subtext: bin.title,
        isUnread: true,
      }));
      localStorage.setItem('agss_notifications', JSON.stringify([...existing, ...drainNotifications].slice(-100)));
    } catch {}

    const updatedBins = binsRef.current.map(bin => {
      if (idsToDrain.includes(bin.id)) {
        return { ...bin, fillLevel: 0, status: 'Empty', lastCollection: 'Just now' };
      }
      return bin;
    });
    setBins(updatedBins);
    persistBinsToBackendAndStorage(updatedBins);

    setConfirmModal({ show: false, binsToDrain: [] });
    setNotification("Draining Process Complete.");
    setTimeout(() => { setNotification(""); }, 3000);
  };

  return (
    <div className={`bin-monitoring-container ${fillLevelAlert ? 'has-fill-alert' : ''}`}>
      <div className="header-section">
        <div className="header-titles">
          <h1>Bin Monitoring</h1>
          {collectorName && <p className="collector-name">Collector: <strong>{collectorName}</strong></p>}
          {assignedBinLocationText && (
            <div className="assigned-bin-location-card">
              <span>{assignedBinLocationText}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="drain-bin-header-btn"
            disabled={filledBins.length === 0}
            onClick={handleDrainAll}
            title={filledBins.length === 0 ? 'All bins are empty' : 'Drain all bins'}
          >
            <DrainAllIcon />
            <span>Drain All</span>
          </button>
        </div>
      </div>

      {notification && <div className="notification-banner success"><span>✓</span> <p>{notification}</p></div>}
      {wasteItemError && <div className="notification-banner warning"><span>!</span> <p>waste_items: {wasteItemError}</p></div>}

      {fillLevelAlert && (
        <div className={`bin-fill-alert-popup ${fillLevelAlert.type}`} role="alert">
          <div className="bin-fill-alert-content">
            <strong>{fillLevelAlert.title}</strong>
            <p>{fillLevelAlert.message}</p>
            <button type="button" className="bin-fill-alert-dismiss" onClick={() => { if (fillLevelAlertTimeoutRef.current) clearTimeout(fillLevelAlertTimeoutRef.current); setFillLevelAlert(null); fillLevelAlertTimeoutRef.current = null; }} aria-label="Dismiss">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <HardwareStatus />

      {isRestoring ? (
        <div className="bin-levels-loading" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>Loading bin levels…</div>
      ) : (
      <div className="bin-grid-layout">
        {bins.map((bin) => (
          <BinCard 
            key={bin.id}
            {...bin}
            weight={hardwareWeight}
            isSelected={false}
            onToggle={() => {}}
            onDrain={() => handleDrainSingle(bin.id)}
            icon={bin.icon}
            showCheckbox={false}
          />
        ))}
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