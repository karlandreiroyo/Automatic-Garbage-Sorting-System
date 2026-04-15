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

/** WebSocket URL for ML bin updates. Order: VITE_WS_URL, then window.__AGSS_WS_URL__, then VITE_MODE, then hostname rules. */
export function getWsUrl() {
  const env = import.meta.env.VITE_WS_URL;
  if (env && String(env).trim()) return String(env).trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.__AGSS_WS_URL__) {
    const u = String(window.__AGSS_WS_URL__).trim();
    if (u) return u.replace(/\/+$/, '');
  }
  
  // For WebSocket, always prefer production server to ensure desktop_app.py and frontend connect to the same server
  const productionWs = 'wss://ws-server-production-ab05.up.railway.app';
  
  const viteMode = String(import.meta.env.VITE_MODE || '').trim().toLowerCase();
  if (viteMode === 'local') {
    // Even in local mode, use production WebSocket to match desktop_app.py
    return productionWs;
  }
  
  if (typeof window !== 'undefined') {
    const h = (window.location.hostname || '').toLowerCase();
    if (h.includes('automatic-garbage-sorting-system')) {
      return productionWs;
    }
  }
  
  // Default to production for consistency
  return productionWs;
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
