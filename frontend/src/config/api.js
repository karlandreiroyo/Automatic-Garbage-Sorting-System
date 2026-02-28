/**
 * Single source for API base URL. Works locally and when deployed (e.g. Railway).
 * Set VITE_API_URL at build time to your backend URL (e.g. https://your-app.railway.app).
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
