'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const requireAuth = require('../../middleware/requireAuth');

const ITEMS_FOR_FULL_BIN = 50;
const ITEMS_FOR_FULL_CATEGORY = 20;

function normalizeCategory(cat) {
  if (!cat) return 'Unsorted';
  const c = String(cat).trim().toLowerCase();
  if (c === 'recyclable' || c === 'recycle') return 'Recyclable';
  if (c === 'non biodegradable' || c === 'non-biodegradable' || c === 'non bio' || c === 'non-bio') return 'Non Biodegradable';
  if (c === 'biodegradable') return 'Biodegradable';
  if (c === 'unsorted') return 'Unsorted';
  return 'Unsorted';
}

function roundToTen(level) {
  return Math.round(level / 10) * 10;
}

/**
 * GET /api/admin/bin-levels
 * Returns all active bins with fill levels computed from waste_items (database).
 * Single source of truth so admin Bin Monitoring matches database/backend.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const statusFilter = (req.query.status === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE';
    const { data: binsData, error: binsError } = await supabase
      .from('bins')
      .select(`
        id,
        name,
        location,
        last_update,
        system_power,
        capacity,
        assigned_collector_id,
        assigned_collector:users!bins_assigned_collector_id_fkey(id, first_name, last_name, middle_name)
      `)
      .eq('status', statusFilter)
      .order('id', { ascending: true });

    if (binsError) {
      console.error('admin/bin-levels bins error:', binsError);
      return res.status(500).json({ success: false, message: binsError.message });
    }
    if (!binsData || binsData.length === 0) {
      return res.json({ success: true, bins: [] });
    }

    const binIds = binsData.map(b => b.id);
    const { data: items, error: itemsError } = await supabase
      .from('waste_items')
      .select('bin_id, category, created_at')
      .in('bin_id', binIds);

    if (itemsError) {
      console.error('admin/bin-levels waste_items error:', itemsError);
      return res.status(500).json({ success: false, message: itemsError.message });
    }

    const byBin = {};
    binIds.forEach(id => {
      byBin[id] = {
        total: 0,
        byCategory: { Biodegradable: 0, 'Non Biodegradable': 0, Recyclable: 0, Unsorted: 0 },
        lastAtByCategory: { Biodegradable: null, 'Non Biodegradable': null, Recyclable: null, Unsorted: null },
        lastAt: null
      };
    });
    (items || []).forEach(item => {
      const bid = item.bin_id;
      if (byBin[bid]) {
        byBin[bid].total++;
        const key = normalizeCategory(item.category);
        if (byBin[bid].byCategory[key] !== undefined) byBin[bid].byCategory[key]++;
        const ts = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (ts) {
          if (!byBin[bid].lastAt || ts > byBin[bid].lastAt) byBin[bid].lastAt = ts;
          if (byBin[bid].lastAtByCategory[key] !== undefined && (!byBin[bid].lastAtByCategory[key] || ts > byBin[bid].lastAtByCategory[key])) {
            byBin[bid].lastAtByCategory[key] = ts;
          }
        }
      }
    });

    const categoryOrder = ['Biodegradable', 'Non Biodegradable', 'Recyclable', 'Unsorted'];
    const bins = binsData.map(bin => {
      const stats = byBin[bin.id] || { total: 0, byCategory: {}, lastAtByCategory: {}, lastAt: null };
      const mainFill = Math.min(100, Math.round((stats.total / ITEMS_FOR_FULL_BIN) * 100));
      const categoryBins = categoryOrder.map((cat, i) => {
        const count = stats.byCategory[cat] || 0;
        const catFill = Math.min(100, Math.round((count / ITEMS_FOR_FULL_CATEGORY) * 100));
        const lastAt = stats.lastAtByCategory && stats.lastAtByCategory[cat];
        return {
          category: cat,
          fillLevel: roundToTen(catFill),
          count,
          last_update: lastAt ? new Date(lastAt).toISOString() : null
        };
      });
      const lastUpdate = stats.lastAt ? new Date(stats.lastAt).toISOString() : bin.last_update;
      const assigned = bin.assigned_collector;
      const assigned_collector_name = assigned
        ? [assigned.first_name, assigned.middle_name, assigned.last_name].filter(Boolean).join(' ').trim()
        : 'Unassigned';
      return {
        id: bin.id,
        name: bin.name,
        location: bin.location,
        fillLevel: roundToTen(mainFill),
        last_update: lastUpdate,
        system_power: bin.system_power ?? 100,
        capacity: bin.capacity ?? '20kg',
        assigned_collector_id: bin.assigned_collector_id,
        assigned_collector_name,
        byCategory: categoryBins
      };
    });

    res.json({ success: true, bins });
  } catch (err) {
    console.error('admin/bin-levels error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
