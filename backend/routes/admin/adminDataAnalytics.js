'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const requireAuth = require('../../middleware/requireAuth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'Access denied' });
    const role = (userRow.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') return res.status(403).json({ success: false, message: 'Admin access required' });

    const timeFilter = (req.query.timeFilter || 'daily').toLowerCase();
    const selectedDate = req.query.selectedDate || new Date().toISOString().split('T')[0];
    const collectorId = req.query.collectorId ? String(req.query.collectorId).trim() : null;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, (m || 1) - 1, d || 1));

    let query = supabase.from('waste_items').select('category, created_at, bin_id');
    if (collectorId) {
      const { data: bins, error: binsErr } = await supabase
        .from('bins')
        .select('id')
        .eq('assigned_collector_id', collectorId);
      if (binsErr) return res.status(500).json({ success: false, message: binsErr.message });
      const binIds = (bins || []).map((b) => b.id);
      if (binIds.length === 0) return res.json({ success: true, data: [] });
      query = query.in('bin_id', binIds);
    }
    if (timeFilter === 'daily') {
      query = query.gte('created_at', `${selectedDate}T00:00:00.000Z`).lte('created_at', `${selectedDate}T23:59:59.999Z`);
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

    const { data: rawData, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });
    const data = (rawData || []).map(({ category, created_at }) => ({ category, created_at }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('admin data-analytics route error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
