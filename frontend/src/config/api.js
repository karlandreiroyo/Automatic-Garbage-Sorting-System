/**
 * Single source for API base URL.
 * Production (built app): use same origin so nginx can proxy /api to backend.
 * Development: use VITE_API_URL or localhost.
 */
export const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
