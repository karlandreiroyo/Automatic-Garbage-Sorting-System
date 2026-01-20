const supabase = require('../utils/supabase');

/**
 * Requires a valid Supabase access token in:
 *   Authorization: Bearer <access_token>
 *
 * Adds req.authUser = { id, email }
 */
module.exports = async function requireAuth(req, res, next) {
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
    return res.status(500).json({ success: false, message: 'Auth check failed' });
  }
};

