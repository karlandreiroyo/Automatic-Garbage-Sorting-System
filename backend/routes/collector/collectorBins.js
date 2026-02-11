const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const { getBinsState, setBinsState } = require('../../utils/collectorBinStore');
const { getCollectionLog, addCollectionLogEntries } = require('../../utils/collectionLogStore');
const requireAuth = require('../../middleware/requireAuth');

function normalizeCategory(cat) {
  if (!cat) return 'Unsorted';
  const c = String(cat).trim().toLowerCase();
  if (c === 'recyclable' || c === 'recycle') return 'Recyclable';
  if (c === 'non biodegradable' || c === 'non-biodegradable' || c === 'non bio' || c === 'non-bio') return 'Non Biodegradable';
  if (c === 'biodegradable') return 'Biodegradable';
  if (c === 'unsorted') return 'Unsorted';
  return 'Unsorted';
}

const ITEMS_FOR_FULL_CATEGORY = 20;

/**
 * GET /api/collector-bins/levels
 * Requires: Authorization: Bearer <supabase_access_token>
 * Query: date=YYYY-MM-DD (optional) - fill levels as of end of that day
 * Returns fill levels for the 4 category cards from waste_items for bins assigned to the collector.
 */
router.get('/levels', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    const { data: assignedBins, error: binsError } = await supabase
      .from('bins')
      .select('id, name, fill_level, last_update')
      .eq('assigned_collector_id', userRow.id)
      .eq('status', 'ACTIVE');
    if (binsError) return res.status(500).json({ success: false, message: binsError.message });
    if (!assignedBins?.length) return res.json({ success: true, categories: [] });

    const binIds = assignedBins.map(b => b.id);
    const dateParam = req.query.date;
    let query = supabase
      .from('waste_items')
      .select('bin_id, category, created_at')
      .in('bin_id', binIds);
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      query = query.lte('created_at', `${dateParam}T23:59:59.999Z`);
    }
    const { data: items, error: itemsError } = await query;
    if (itemsError) return res.status(500).json({ success: false, message: itemsError.message });

    const categoryOrder = ['Biodegradable', 'Non Biodegradable', 'Recyclable', 'Unsorted'];
    const byCard = {};
    categoryOrder.forEach(cat => { byCard[cat] = { count: 0, lastAt: null, binId: null }; });

    const nameToCard = { Biodegradable: 'Biodegradable', 'Non Biodegradable': 'Non Biodegradable', Recyclable: 'Recyclable', Unsorted: 'Unsorted' };
    assignedBins.forEach((b, i) => {
      const card = categoryOrder[i];
      if (card && !byCard[card].binId) byCard[card].binId = b.id;
    });
    assignedBins.forEach(b => {
      const c = normalizeCategory(b.name);
      if (nameToCard[c] && !byCard[nameToCard[c]].binId) byCard[nameToCard[c]].binId = b.id;
    });

    (items || []).forEach(item => {
      const key = normalizeCategory(item.category);
      const card = nameToCard[key] || 'Unsorted';
      if (byCard[card]) {
        byCard[card].count++;
        const ts = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (ts && (!byCard[card].lastAt || ts > byCard[card].lastAt)) byCard[card].lastAt = ts;
      }
    });

    const categories = categoryOrder.map(cat => {
      const d = byCard[cat];
      const fillLevel = Math.min(100, Math.round((d.count / ITEMS_FOR_FULL_CATEGORY) * 100));
      const lastCollection = d.lastAt ? new Date(d.lastAt).toISOString() : null;
      return {
        id: cat,
        title: cat === 'Non Biodegradable' ? 'Non-Bio' : cat,
        fillLevel: Math.round(fillLevel / 10) * 10,
        lastCollection,
        binId: d.binId || assignedBins[0]?.id,
      };
    });
    res.json({ success: true, categories });
  } catch (err) {
    console.error('collector-bins/levels error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', (req, res) => { try { res.json({ bins: getBinsState() || [] }); } catch (err) { res.status(500).json({ error: err.message }); } });
router.post('/', (req, res) => {
  try {
    const bins = req.body?.bins;
    if (!Array.isArray(bins)) return res.status(400).json({ error: 'bins must be an array' });
    setBinsState(bins);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Collection history: real-time log of drained bins (from Bin Monitoring)
router.get('/collection-history', (req, res) => {
  try {
    const log = getCollectionLog();
    res.json({ history: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log one or more bin drains (called when collector drains bins in Bin Monitoring)
router.post('/collection-log', (req, res) => {
  try {
    const entries = req.body?.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries must be a non-empty array' });
    }
    const added = addCollectionLogEntries(entries);
    res.json({ ok: true, added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a waste item detection from Bin Monitoring → Supabase waste_items (backend connects to Supabase)
router.post('/waste-item', async (req, res) => {
  try {
    const { bin_id, category, weight, processing_time, first_name, middle_name, last_name } = req.body || {};
    if (bin_id == null || bin_id === '' || !category) {
      return res.status(400).json({ error: 'bin_id and category are required' });
    }
    // bin_id can be number (int8) or string (e.g. UUID)
    let binIdVal = typeof bin_id === 'number' ? bin_id : (typeof bin_id === 'string' && /^\d+$/.test(String(bin_id).trim()) ? parseInt(bin_id, 10) : bin_id);
    // Collector uses bin 2; normalize bin_id 1 → 2 so waste_items match the collector bin
    if (binIdVal === 1) binIdVal = 2;
    const row = {
      bin_id: binIdVal,
      category: String(category),
      weight: weight != null ? Number(weight) : null,
      processing_time: processing_time != null ? Number(processing_time) : null,
      created_at: new Date().toISOString(),
      first_name: first_name != null ? String(first_name) : '',
      middle_name: middle_name != null ? String(middle_name) : '',
      last_name: last_name != null ? String(last_name) : '',
    };
    const { data, error } = await supabase.from('waste_items').insert(row).select('id').single();
    if (error) {
      console.error('waste_items insert error:', error.message, error.details || '');
      return res.status(500).json({ error: error.message });
    }
    console.log('waste_items inserted:', { id: data?.id, category: row.category, bin_id: row.bin_id, last_name: row.last_name });
    res.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('waste_items route error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
