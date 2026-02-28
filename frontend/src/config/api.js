/**
 * Single source for API base URL.
 * Production (built app): use same origin so nginx can proxy /api to backend.
 * Development: use VITE_API_URL or localhost.
 */
export const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

/**
 * Parse response as JSON. If the server returns HTML (e.g. error page), throws a clear error
 * so the UI can show a friendly message instead of "Unexpected token '<'".
 */
export async function parseJsonResponse(response) {
  const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trimStart().startsWith('<')) {
      throw new Error('Server returned an error page instead of JSON. On Railway: (1) Frontend service: set BACKEND_URL to your backend\'s public URL. (2) Backend service: add SUPABASE_SERVICE_KEY and SMTP variables. See backend/RAILWAY.md. Then redeploy both.');
    }
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json();
}
