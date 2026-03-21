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

/**
 * ML Bin Monitoring WebSocket URL.
 * - Optional override: window.__AGSS_WS_URL__ or VITE_WS_URL (e.g. separate WS host).
 * - Default: derive from API_BASE — https → wss, http → ws (same host as backend; ML WS is attached in server.js).
 * - Local unchanged when VITE_API_URL=http://localhost:3001 → ws://localhost:3001
 */
export function getWsUrl() {
  if (typeof window !== 'undefined' && window.__AGSS_WS_URL__) {
    const u = String(window.__AGSS_WS_URL__).trim().replace(/\/+$/, '');
    if (u) return u;
  }
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit != null && String(explicit).trim() !== '') {
    return String(explicit).trim().replace(/\/+$/, '');
  }
  const api = getApiBase();
  try {
    const url = new URL(api);
    const wsScheme = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsScheme}//${url.host}`;
  } catch {
    return 'ws://localhost:3001';
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
