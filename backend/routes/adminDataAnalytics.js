'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const requireAuth = require('../middleware/requireAuth');

/**
 * GET /api/admin/data-analytics
 * Query: timeFilter=daily|weekly|monthly, selectedDate=YYYY-MM-DD
 * Returns waste_items rows (category, created_at) from Supabase for the admin Data Analytics page.
 * Admin/superadmin only. Frontend computes distribution, accuracy %, and trend from this data.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', authId)
      .maybeSingle();

    if (userError || !userRow) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const role = (userRow.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const timeFilter = (req.query.timeFilter || 'daily').toLowerCase();
    const selectedDate = req.query.selectedDate || new Date().toISOString().split('T')[0];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, (m || 1) - 1, d || 1));

    let query = supabase.from('waste_items').select('category, created_at');

    if (timeFilter === 'daily') {
      const startOfDay = `${selectedDate}T00:00:00.000Z`;
      const endOfDay = `${selectedDate}T23:59:59.999Z`;
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    } else if (timeFilter === 'weekly') {
      const dayOfWeek = dateObj.getUTCDay();
      const startOfWeek = new Date(dateObj);
      startOfWeek.setUTCDate(dateObj.getUTCDate() - dayOfWeek);
      startOfWeek.setUTCHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      endOfWeek.setUTCHours(23, 59, 59, 999);
      query = query.gte('created_at', startOfWeek.toISOString()).lte('created_at', endOfWeek.toISOString());
    } else if (timeFilter === 'monthly') {
      const startOfMonth = new Date(Date.UTC(y, (m || 1) - 1, 1));
      const endOfMonth = new Date(Date.UTC(y, (m || 1), 0, 23, 59, 59, 999));
      query = query.gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('admin data-analytics waste_items error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('admin data-analytics route error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
