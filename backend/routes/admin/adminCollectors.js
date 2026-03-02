'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const requireAuth = require('../../middleware/requireAuth');

/**
 * GET /api/admin/collectors-with-stats
 * Returns all users with role COLLECTOR (for admin Data Analytics search).
 * Includes item_count from waste_items in bins assigned to each collector.
 * Collectors with zero items are included so admins can select any collector.
 */
/**
 * GET /api/admin/total-collection
 * Returns count of notification_bin rows where status = 'Drained'.
 * Backend uses service key so RLS does not block admin from seeing the count.
 */
router.get('/total-collection', requireAuth, async (req, res) => {
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

    const { count, error } = await supabase
      .from('notification_bin')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Drained');
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, totalCollection: count ?? 0 });
  } catch (err) {
    console.error('admin total-collection error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/collectors-with-stats', requireAuth, async (req, res) => {
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

    const { data: collectors, error: collectorsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, middle_name')
      .eq('role', 'COLLECTOR')
      .order('first_name');
    if (collectorsError) return res.status(500).json({ success: false, message: collectorsError.message });

    const { data: bins, error: binsError } = await supabase
      .from('bins')
      .select('id, assigned_collector_id');
    if (binsError) return res.status(500).json({ success: false, message: binsError.message });

    const binIdsByCollector = {};
    (bins || []).forEach((b) => {
      const cid = b.assigned_collector_id;
      if (cid == null) return;
      if (!binIdsByCollector[cid]) binIdsByCollector[cid] = [];
      binIdsByCollector[cid].push(b.id);
    });

    const { data: items, error: itemsError } = await supabase
      .from('waste_items')
      .select('bin_id');
    if (itemsError) return res.status(500).json({ success: false, message: itemsError.message });

    const countByCollector = {};
    (collectors || []).forEach((c) => { countByCollector[c.id] = 0; });
    const binToCollector = {};
    Object.entries(binIdsByCollector).forEach(([cid, ids]) => {
      ids.forEach((bid) => (binToCollector[bid] = cid));
    });
    (items || []).forEach((item) => {
      const cid = binToCollector[item.bin_id];
      if (cid != null && countByCollector[cid] !== undefined) countByCollector[cid]++;
    });

    const list = (collectors || []).map((c) => {
      const name = [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ').trim() || `Collector ${c.id}`;
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        middle_name: c.middle_name,
        name,
        item_count: countByCollector[c.id] ?? 0
      };
    });
    list.sort((a, b) => b.item_count - a.item_count);

    return res.json({ success: true, collectors: list });
  } catch (err) {
    console.error('admin collectors-with-stats error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
