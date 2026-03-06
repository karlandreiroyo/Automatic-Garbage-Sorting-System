'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const requireAuth = require('../../middleware/requireAuth');

/**
 * GET /api/admin/dashboard-stats
 * Returns overall items sorted = count of rows (ids) in waste_items.
 * E.g. 614 rows => overallItemsSorted 614; when new items are added, count increases.
 * For admin and superadmin dashboards; works with same DB on Railway.
 */
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
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Admin or Superadmin access required' });
    }

    const { count, error: countError } = await supabase
      .from('waste_items')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('admin dashboard-stats waste_items count error:', countError.message);
      return res.status(500).json({ success: false, message: countError.message });
    }

    const overallItemsSorted = typeof count === 'number' ? count : 0;

    const { data: timeData, error: timeError } = await supabase
      .from('waste_items')
      .select('processing_time')
      .not('processing_time', 'is', null)
      .limit(5000);

    let avgProcessingTime = 0;
    if (!timeError && Array.isArray(timeData) && timeData.length > 0) {
      const sum = timeData.reduce((s, row) => s + (Number(row.processing_time) || 0), 0);
      avgProcessingTime = Number((sum / timeData.length).toFixed(1));
    }

    res.json({
      success: true,
      overallItemsSorted,
      avgProcessingTime,
    });
  } catch (err) {
    console.error('admin dashboard-stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
