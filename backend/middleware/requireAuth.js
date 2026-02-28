require('dotenv').config();
const supabase = require('../utils/supabase');

const AUTH_MESSAGE_MISSING = process.env.AUTH_MESSAGE_MISSING || 'Missing Authorization bearer token';
const AUTH_MESSAGE_INVALID = process.env.AUTH_MESSAGE_INVALID || 'Invalid or expired session';
const AUTH_MESSAGE_NO_EMAIL = process.env.AUTH_MESSAGE_NO_EMAIL || 'Authenticated user has no email';
const AUTH_MESSAGE_FAILED = process.env.AUTH_MESSAGE_FAILED || 'Auth check failed';

/**
 * Extract Bearer token from request.
 * Uses standard "Authorization: Bearer <token>" or custom header from env AUTH_HEADER (e.g. "x-access-token").
 */
function getToken(req) {
  const headerName = (process.env.AUTH_HEADER || 'authorization').toLowerCase();
  const header = req.headers[headerName] || req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * Requires a valid Supabase access token.
 * Adds req.authUser = { id, email } on success.
 *
 * Options (for dynamic behavior):
 *   - optional: if true, missing/invalid token calls next() without 401; req.authUser will be undefined.
 *
 * Env (deployment-friendly):
 *   - AUTH_HEADER: header name for token (default: "authorization"; use "Authorization: Bearer <token>").
 *   - AUTH_MESSAGE_MISSING, AUTH_MESSAGE_INVALID, AUTH_MESSAGE_NO_EMAIL, AUTH_MESSAGE_FAILED: override messages.
 */
function requireAuth(options = {}) {
  const optional = Boolean(options.optional);

  return async function requireAuthHandler(req, res, next) {
    try {
      const token = getToken(req);

      if (!token) {
        if (optional) return next();
        return res.status(401).json({ success: false, message: AUTH_MESSAGE_MISSING });
      }

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        if (optional) return next();
        return res.status(401).json({ success: false, message: AUTH_MESSAGE_INVALID });
      }

      req.authUser = {
        id: data.user.id,
        email: (data.user.email || '').toLowerCase(),
      };

      if (!req.authUser.email) {
        if (optional) return next();
        return res.status(401).json({ success: false, message: AUTH_MESSAGE_NO_EMAIL });
      }

      return next();
    } catch (e) {
      console.error('Auth middleware error:', e);
      return res.status(500).json({ success: false, message: AUTH_MESSAGE_FAILED });
    }
  };
}

// Default export: required auth (same behavior as before)
module.exports = requireAuth();

// Export factory for routes that need optional auth or custom behavior
module.exports.requireAuth = requireAuth;
module.exports.getToken = getToken;
