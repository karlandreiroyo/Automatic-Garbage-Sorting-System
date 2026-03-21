/**
 * Single source for API base URL.
 * Order: (1) window.__AGSS_BACKEND_URL__ (runtime, e.g. set in index.html), (2) VITE_API_URL (build-time), (3) default.
 * Local dev: set VITE_API_URL=http://localhost:3001. Railway: set VITE_API_URL in the **Frontend** service to your backend URL, then redeploy frontend.
 */
function getApiBase() {
  if (typeof window !== 'undefined' && window.__AGSS_BACKEND_URL__) {
    const url = String(window.__AGSS_BACKEND_URL__).trim().replace(/\/+$/, '');
    if (url) return url;
  }
  return import.meta.env.VITE_API_URL || 'https://brave-adaptation-production.up.railway.app';
}
export const API_BASE = getApiBase();

const LOCAL_ML_WS = 'ws://localhost:3001';

function isBrowserLocalhost() {
  if (typeof window === 'undefined') return false;
  const h = (window.location.hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

/** Same machine / LAN dev (Vite --host). Use page hostname so ws:// matches (not localhost when opened via 192.168.x.x). */
function isLANOrLocalPage() {
  if (typeof window === 'undefined') return false;
  const h = (window.location.hostname || '').toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/** WebSocket URL for ML bin updates. Override with VITE_WS_URL or window.__AGSS_WS_URL__. */
export function getWsUrl() {
  if (typeof window !== 'undefined' && window.__AGSS_WS_URL__) {
    const u = String(window.__AGSS_WS_URL__).trim();
    if (u) return u.replace(/\/+$/, '');
  }
  const env = import.meta.env.VITE_WS_URL;
  if (env && String(env).trim()) return String(env).trim().replace(/\/+$/, '');
  // Python ML server is almost always ws://localhost:3001. If env is missing (wrong cwd, stale build),
  // do not derive from Railway API_BASE or the UI will never see local detections.
  if (import.meta.env.DEV || isBrowserLocalhost()) {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname || '';
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) {
        return `ws://${h}:3001`;
      }
    }
    return LOCAL_ML_WS;
  }
  if (typeof window !== 'undefined' && isLANOrLocalPage() && !isBrowserLocalhost()) {
    const h = window.location.hostname;
    return `ws://${h}:3001`;
  }
  try {
    const base = getApiBase();
    const url = new URL(base.startsWith('http') ? base : `https://${base}`);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${url.host}`;
  } catch {
    return LOCAL_ML_WS;
  }
}
/**
 * Parse response as JSON. If the server returns HTML (e.g. error page), throws a clear error
 * so the UI can show a friendly message instead of "Unexpected token '<'".
 */
export async function parseJsonResponse(response) {
  const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trimStart().startsWith('<')) {
      throw new Error('Server returned an error page instead of JSON. On Railway: (1) Frontend: set BACKEND_URL to your backend URL. (2) Backend: add SUPABASE_SERVICE_KEY and SMTP. See DOCS.md. Then redeploy both.');
    }
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json();
}
