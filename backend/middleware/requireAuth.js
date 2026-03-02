const supabase = require('../utils/supabase');
const { hasValidServiceKey } = require('../utils/supabase');

/**
 * Requires a valid Supabase access token in:
 *   Authorization: Bearer <access_token>
 *
 * Adds req.authUser = { id, email }
 * When SUPABASE_SERVICE_KEY is not set, returns 503 JSON so the frontend never gets HTML.
 */
module.exports = async function requireAuth(req, res, next) {
  if (!hasValidServiceKey) {
    return res.status(503).setHeader('Content-Type', 'application/json').json({
      success: false,
      message: 'Server misconfigured: SUPABASE_SERVICE_KEY not set. In Railway: Backend service → Variables → add SUPABASE_SERVICE_KEY (Supabase Dashboard → Settings → API → service_role key), then redeploy.'
    });
  }

  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing Authorization bearer token' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    req.authUser = {
      id: data.user.id,
      email: (data.user.email || '').toLowerCase(),
    };

    if (!req.authUser.email) {
      return res.status(401).json({ success: false, message: 'Authenticated user has no email' });
    }

    return next();
  } catch (e) {
    console.error('Auth middleware error:', e);
    if (!res.headersSent) res.status(500).setHeader('Content-Type', 'application/json').json({ success: false, message: 'Auth check failed' });
  }
};
