const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const crypto = require('crypto');

const COOKIE_NAME = 'remember_me_token';
const COOKIE_MAX_AGE_DAYS = 365;
const isProduction = process.env.NODE_ENV === 'production';

function getTokenFromRequest(req) {
  return req.cookies && req.cookies[COOKIE_NAME] ? req.cookies[COOKIE_NAME].trim() : null;
}

function getCookieOptions(res) {
  const opts = {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  };
  return opts;
}

// GET: Return saved email/password for this browser (identified by cookie).
// Returns 200 with empty email/password when none saved (avoids 404 in console).
router.get('/', async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(200).json({ success: true, email: '', password: '' });
    }

    const { data, error } = await supabase
      .from('remember_me_tokens')
      .select('email, password')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.warn('[remember-me GET] DB error:', error.message);
      return res.status(200).json({ success: true, email: '', password: '' });
    }
    if (!data) {
      return res.status(200).json({ success: true, email: '', password: '' });
    }

    return res.status(200).json({
      success: true,
      email: data.email || '',
      password: data.password || '',
    });
  } catch (err) {
    console.error('Remember me GET error:', err);
    return res.status(200).json({ success: true, email: '', password: '' });
  }
});

// POST: Save email/password and set cookie (call after successful login when "Remember me" is checked)
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const passwordVal = typeof password === 'string' ? password : '';

    if (!emailTrim) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const oldToken = getTokenFromRequest(req);
    if (oldToken) {
      await supabase.from('remember_me_tokens').delete().eq('token', oldToken);
    }

    const { error } = await supabase.from('remember_me_tokens').insert({
      token,
      email: emailTrim,
      password: passwordVal,
    });

    if (error) {
      console.warn('[remember-me POST] DB error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to save remembered login' });
    }

    res.cookie(COOKIE_NAME, token, getCookieOptions(res));
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Remember me POST error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE: Clear saved login and cookie (call after login when "Remember me" is not checked)
router.delete('/', async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      await supabase.from('remember_me_tokens').delete().eq('token', token);
    }
    res.clearCookie(COOKIE_NAME, { path: '/', sameSite: isProduction ? 'none' : 'lax', secure: isProduction });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Remember me DELETE error:', err);
    res.clearCookie(COOKIE_NAME, { path: '/', sameSite: isProduction ? 'none' : 'lax', secure: isProduction });
    return res.status(200).json({ success: true });
  }
});

module.exports = router;
