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
 * Returns fill levels for bins ASSIGNED to this collector only. Each collector sees different history/activity.
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

    // Only bins assigned to this collector (per-collector data - different history/activity)
    const { data: assignedBins, error: binsError } = await supabase
      .from('bins')
      .select('id, name')
      .eq('assigned_collector_id', userRow.id)
      .eq('status', 'ACTIVE')
      .order('id', { ascending: true });
    if (binsError) {
      console.error('collector-bins/levels binsError:', binsError);
      return res.status(500).json({ success: false, message: binsError.message });
    }
    if (!assignedBins?.length) return res.json({ success: true, categories: [], bins: [] });

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
    if (itemsError) {
      console.error('collector-bins/levels waste_items error:', itemsError);
      return res.status(500).json({ success: false, message: itemsError.message });
    }

    // Per-bin counts (each bin has its own events; new bins = 0)
    const binCutoff = {};
    assignedBins.forEach(b => {
      const cut = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
      binCutoff[b.id] = cut;
    });
    const byBin = {};
    assignedBins.forEach(b => { byBin[b.id] = { count: 0, lastAt: null }; });
    (items || []).forEach(item => {
      const bid = item.bin_id;
      if (!byBin[bid]) return;
      const cut = binCutoff[bid] || 0;
      const ts = item.created_at ? new Date(item.created_at).getTime() : 0;
      if (cut > 0 && ts < cut) return; // skip items before assignment (automatic 0 for new)
      byBin[bid].count++;
      if (ts && (!byBin[bid].lastAt || ts > byBin[bid].lastAt)) byBin[bid].lastAt = ts;
    });

    // Per-bin response (each assigned bin with its own fill level)
    const binsResponse = assignedBins.map(b => {
      const d = byBin[b.id] || { count: 0, lastAt: null };
      const fillLevel = Math.min(100, Math.round((d.count / ITEMS_FOR_FULL_CATEGORY) * 100));
      return {
        id: b.id,
        binId: b.id,
        name: b.name,
        title: b.name || `Bin ${b.id}`,
        fillLevel: Math.round(fillLevel / 10) * 10,
        lastCollection: d.lastAt ? new Date(d.lastAt).toISOString() : null,
        category: normalizeCategory(b.name),
      };
    });

    // Category fallback (for collectors without per-bin mode or legacy)
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
      const bid = item.bin_id;
      const cut = binCutoff[bid] || 0;
      const ts = item.created_at ? new Date(item.created_at).getTime() : 0;
      if (cut > 0 && ts < cut) return;
      const key = normalizeCategory(item.category);
      const card = nameToCard[key] || 'Unsorted';
      if (byCard[card]) {
        byCard[card].count++;
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

    res.json({ success: true, categories, bins: binsResponse });
  } catch (err) {
    console.error('collector-bins/levels error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/collector-bins/assigned
 * Returns bins ASSIGNED to this collector only. Each collector sees different history/activity.
 */
router.get('/assigned', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, first_name, middle_name, last_name')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    // Only bins assigned to this collector (per-collector data)
    const { data: bins, error: binsError } = await supabase
      .from('bins')
      .select('id, name, location')
      .eq('assigned_collector_id', userRow.id)
      .eq('status', 'ACTIVE')
      .order('id', { ascending: true });
    if (binsError) {
      console.error('collector-bins/assigned binsError:', binsError);
      return res.status(500).json({ success: false, message: binsError.message });
    }

    const parts = [userRow.first_name?.trim(), userRow.middle_name?.trim() !== 'EMPTY' && userRow.middle_name?.trim() !== 'NULL' ? userRow.middle_name?.trim() : null, userRow.last_name?.trim()].filter(Boolean);
    let fallbackBinId = null;
    if (!bins?.length) {
      const { data: anyBin } = await supabase.from('bins').select('id').eq('status', 'ACTIVE').limit(1).maybeSingle();
      fallbackBinId = anyBin?.id ?? null;
    } else {
      fallbackBinId = bins[0]?.id ?? null;
    }
    res.json({ success: true, collector: { id: userRow.id, name: parts.join(' ') }, bins: bins || [], fallback_bin_id: fallbackBinId });
  } catch (err) {
    console.error('collector-bins/assigned error:', err);
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

// Collection history: per-collector from notification_bin (real-time); fallback to collection-log.json
router.get('/collection-history', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data: userRow } = await supabase.from('users').select('id, first_name, middle_name, last_name').eq('auth_id', authId).maybeSingle();
    const collectorId = userRow?.id;
    const collectorFullName = [userRow?.first_name, userRow?.middle_name, userRow?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const mapNotificationBinRow = (r) => ({
      id: r.id,
      bin_category: r.bin_category || 'Unsorted',
      bin_name: r.bin_category || 'Bin',
      collector_id: r.collector_id ?? collectorId,
      collector_name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ').trim() || '—',
      drained_at: r.created_at,
      status: r.status || 'Drained',
    });

    // Try notification_bin with collector_id (after migration)
    const { data: dbRows, error: dbErr } = await supabase
      .from('notification_bin')
      .select('id, bin_id, bin_category, status, first_name, middle_name, last_name, created_at, collector_id')
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false });
    if (!dbErr && Array.isArray(dbRows) && dbRows.length > 0) {
      return res.json({ history: dbRows.map(mapNotificationBinRow) });
    }
    // Fallback: notification_bin without collector_id (match by first_name+middle_name+last_name)
    const { data: allRows, error: allErr } = await supabase
      .from('notification_bin')
      .select('id, bin_id, status, first_name, middle_name, last_name, created_at')
      .order('created_at', { ascending: false });
    if (!allErr && Array.isArray(allRows) && allRows.length > 0 && collectorFullName) {
      const match = allRows.filter((r) => {
        const rowName = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ').trim().toLowerCase();
        return rowName === collectorFullName;
      });
      if (match.length > 0) return res.json({ history: match.map(mapNotificationBinRow) });
    }
    // Fallback: collection-log.json
    const fullLog = getCollectionLog();
    const log = collectorId != null ? fullLog.filter((e) => e.collector_id === collectorId) : [];
    res.json({ history: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Drain one or more bins: only bins assigned to this collector (per-collector activity)
router.post('/drain', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    const binIds = req.body?.bin_ids;
    if (!Array.isArray(binIds) || binIds.length === 0) {
      return res.status(400).json({ success: false, message: 'bin_ids must be a non-empty array' });
    }

    const validIds = binIds.map(id => (typeof id === 'number' ? id : parseInt(id, 10))).filter(n => !isNaN(n));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: 'Invalid bin_ids' });

    // Only bins assigned to this collector (per-collector activity)
    const { data: ownedBins, error: ownedErr } = await supabase
      .from('bins')
      .select('id')
      .eq('assigned_collector_id', userRow.id)
      .in('id', validIds)
      .eq('status', 'ACTIVE');
    if (ownedErr) return res.status(500).json({ success: false, message: ownedErr.message });

    const allowedIds = (ownedBins || []).map(b => b.id);
    if (allowedIds.length === 0) return res.status(403).json({ success: false, message: 'No bins assigned to this collector' });

    const now = new Date().toISOString();
    for (const bid of allowedIds) {
      await supabase.from('bins').update({ fill_level: 0, last_update: now }).eq('id', bid);
    }
    await supabase.from('waste_items').delete().in('bin_id', allowedIds);

    // Insert into notification_bin for per-collector Collection History (real-time)
    const { data: collectorRow } = await supabase.from('users').select('first_name, middle_name, last_name').eq('id', userRow.id).maybeSingle();
    const { data: binRows } = await supabase.from('bins').select('id, name').in('id', allowedIds);
    const nameToCategory = (name) => {
      if (!name) return 'Unsorted';
      const n = String(name).toLowerCase();
      if (n.includes('bio') && !n.includes('non')) return 'Biodegradable';
      if (n.includes('non') && n.includes('bio')) return 'Non Biodegradable';
      if (n.includes('recycl')) return 'Recyclable';
      return 'Unsorted';
    };
    for (const b of binRows || []) {
      // Insert into notification_bin (your columns: id, created_at, bin_id, status, last_name, first_name, middle_name)
      const baseRow = {
        bin_id: b.id,
        status: 'Drained',
        first_name: collectorRow?.first_name ?? '',
        last_name: collectorRow?.last_name ?? '',
      };
      const rowWithMiddle = { ...baseRow, middle_name: collectorRow?.middle_name ?? '' };
      const { error: insErr } = await supabase.from('notification_bin').insert(rowWithMiddle);
      if (insErr) {
        console.error('[notification_bin] insert error:', insErr.message, insErr.details);
        const { error: fallbackErr } = await supabase.from('notification_bin').insert(baseRow);
        if (fallbackErr) {
          console.error('[notification_bin] fallback insert failed:', fallbackErr.message);
          console.error('→ Check: Supabase RLS on notification_bin may block inserts. Add policy or use service_role key in backend/.env');
        }
      } else {
        console.log('[notification_bin] inserted:', { bin_id: b.id, status: 'Drained' });
      }
    }

    res.json({ success: true, drained: allowedIds });
  } catch (err) {
    console.error('collector-bins drain error:', err);
    res.status(500).json({ success: false, message: err.message });
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
router.post('/waste-item', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ error: 'Unauthorized' });
    const { data: userRow, error: userError } = await supabase.from('users').select('id').eq('auth_id', authId).maybeSingle();
    if (userError || !userRow) return res.status(403).json({ error: 'User not found' });
    const { bin_id, category, weight, processing_time, first_name, middle_name, last_name } = req.body || {};
    if (bin_id == null || bin_id === '' || !category) {
      return res.status(400).json({ error: 'bin_id and category are required' });
    }
    const binIdVal = typeof bin_id === 'number' ? bin_id : (typeof bin_id === 'string' && /^\d+$/.test(String(bin_id).trim()) ? parseInt(bin_id, 10) : bin_id);
    const { data: binRow } = await supabase.from('bins').select('id').eq('id', binIdVal).eq('assigned_collector_id', userRow.id).maybeSingle();
    if (!binRow) {
      const { data: anyAssigned } = await supabase.from('bins').select('id').eq('assigned_collector_id', userRow.id).limit(1).maybeSingle();
      if (!anyAssigned) return res.status(403).json({ error: 'No bins assigned to this collector' });
      return res.status(403).json({ error: 'bin_id must be assigned to this collector' });
    }
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
