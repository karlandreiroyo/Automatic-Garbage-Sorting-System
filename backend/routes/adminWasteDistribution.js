'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const requireAuth = require('../middleware/requireAuth');

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
 * GET /api/admin/waste-distribution
 * Query: selectedDate=YYYY-MM-DD
 * Returns waste distribution by category for the Waste Distribution graph.
 * Super Admin only. Backend connects to Supabase waste_items table.
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

    const selectedDate = req.query.selectedDate || new Date().toISOString().split('T')[0];
    const startOfDay = `${selectedDate}T00:00:00.000Z`;
    const endOfDay = `${selectedDate}T23:59:59.999Z`;

    const { data: rows, error } = await supabase
      .from('waste_items')
      .select('category')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (error) {
      console.error('admin waste-distribution waste_items error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const categoryCounts = { Biodegradable: 0, 'Non-Biodegradable': 0, Recycle: 0, Unsorted: 0 };
    (rows || []).forEach((item) => {
      const key = normalizeCategory(item.category);
      if (categoryCounts.hasOwnProperty(key)) categoryCounts[key]++;
      else categoryCounts.Unsorted++;
    });

    const wasteDistribution = [
      { name: 'Biodegradable', count: categoryCounts.Biodegradable },
      { name: 'Non-Biodegradable', count: categoryCounts['Non-Biodegradable'] },
      { name: 'Recycle', count: categoryCounts.Recycle },
      { name: 'Unsorted', count: categoryCounts.Unsorted }
    ];

    res.json({ success: true, wasteDistribution });
  } catch (err) {
    console.error('admin waste-distribution route error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
