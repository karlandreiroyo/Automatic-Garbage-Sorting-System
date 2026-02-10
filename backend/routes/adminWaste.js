'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const requireAuth = require('../middleware/requireAuth');

/**
 * Normalize category string to one of: Biodegradable, Non-Biodegradable, Recycle, Unsorted
 */
function normalizeCategory(cat) {
  if (!cat) return 'Unsorted';
  const c = String(cat).trim().toLowerCase();
  if (c === 'recyclable' || c === 'recycle') return 'Recycle';
  if (c === 'non biodegradable' || c === 'non-biodegradable' || c === 'non bio' || c === 'non-bio') return 'Non-Biodegradable';
  if (c === 'biodegradable') return 'Biodegradable';
  if (c === 'unsorted') return 'Unsorted';
  return 'Unsorted';
}

/**
 * GET /api/admin/waste-categories
 * Query: timeFilter=daily|weekly|monthly, selectedDate=YYYY-MM-DD
 * Returns waste_items counts by category from Supabase (admin/superadmin only).
 * Backend connects to Supabase so the admin dashboard uses one source of truth.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Restrict to admin and superadmin only
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
    // Use UTC bounds so Supabase created_at (timestamptz) matches. Avoid local time which can exclude records.
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, (m || 1) - 1, d || 1));

    let query = supabase.from('waste_items').select('id, category, created_at');

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
      console.error('admin waste_items error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const categoryCounts = {
      Biodegradable: 0,
      'Non-Biodegradable': 0,
      Recycle: 0,
      Unsorted: 0
    };

    if (data && data.length > 0) {
      data.forEach((item) => {
        const key = normalizeCategory(item.category);
        if (categoryCounts.hasOwnProperty(key)) categoryCounts[key]++;
        else categoryCounts.Unsorted++;
      });
    }

    const totalItems = data ? data.length : 0;
    const wasteData = [
      { name: 'Biodegradable', count: categoryCounts.Biodegradable, color: '#10b981', icon: 'leaf' },
      { name: 'Non-Biodegradable', count: categoryCounts['Non-Biodegradable'], color: '#ef4444', icon: 'trash' },
      { name: 'Recycle', count: categoryCounts.Recycle, color: '#f97316', icon: 'recycle' },
      { name: 'Unsorted', count: categoryCounts.Unsorted, color: '#6b7280', icon: 'gear' }
    ];

    res.json({ success: true, wasteData, totalItems });
  } catch (err) {
    console.error('admin waste-categories route error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
