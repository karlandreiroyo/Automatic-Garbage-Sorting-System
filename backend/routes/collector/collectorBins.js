const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');
const { hasValidServiceKey } = require('../../utils/supabase');
const { getBinsState, setBinsState, loadFromDb, saveToDb } = require('../../utils/collectorBinStore');
const { getCollectionLog, addCollectionLogEntries } = require('../../utils/collectionLogStore');
const requireAuth = require('../../middleware/requireAuth');

/**
 * Collector Supabase tables (do not mix):
 * - notification_bin → Sort ("Sort here" = status Sorted) + bin fill alerts. Collector Notifications UI.
 * - history_binitem → Drain only. Collector Collection History UI. No sort rows here.
 */

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

// Map notification_bin row to Notifications UI shape
function notificationRowToUI(row, binName) {
  const status = (row.status || '').trim();
  const category = row.bin_category || binName || 'Bin';
  let type = 'info';
  let title = 'Notification';
  let message = `${category}: ${status}`;
  if (status === 'Drained') {
    type = 'success';
    title = 'Bin Drained';
    message = `${category} bin was drained.`;
  } else if (status === 'Sorted') {
    type = 'info';
    title = 'Sorted';
    message = `Sorted into ${category} bin.`;
  } else if (status.includes('100') || status === 'Full' || status === 'Full - no more') {
    type = 'critical';
    title = 'Bin Full Alert';
    message = `${category} is full — no more can be added. Drain the bin.`;
  } else if (status.includes('80')) {
    type = 'warning';
    title = 'Bin Warning';
    message = `${category} bin is at 80% capacity.`;
  } else if (status.includes('50')) {
    type = 'info';
    title = 'Bin update';
    message = `${category} bin is at 50% capacity.`;
  } else if (status.includes('10')) {
    type = 'info';
    title = 'Bin update';
    message = `${category} bin is at 10% capacity.`;
  }
  const created = row.created_at ? new Date(row.created_at) : new Date();
  const now = new Date();
  const diffMs = now - created;
  let time = 'Just now';

  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(diffMs / 2592000000); // 30 days
  const years = Math.floor(diffMs / 31536000000); // 365 days

  if (diffMs < 60000) {
    time = 'Just now';
  } else if (mins < 60) {
    time = mins === 1 ? '1 min ago' : `${mins} mins ago`;
  } else if (hrs < 24) {
    time = hrs === 1 ? '1h ago' : `${hrs}h ago`;
  } else if (days < 30) {
    time = days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (months < 12) {
    time = months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    time = years === 1 ? '1 year ago' : `${years} years ago`;
  }

  return {
    id: row.id,
    type,
    title,
    message,
    subtext: category,
    time,
    isUnread: row.is_read === false ? false : true,
  };
}

/**
 * GET /api/collector-bins/notifications
 * Returns notifications from notification_bin for the current collector (same DB as local; works on Railway).
 * Works with or without is_read/collector_id columns: filters by last_name when collector_id is missing.
 */
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, first_name, middle_name, last_name')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    // Default to today so collector sees today's notifications first
    const dateParam = req.query.date;
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = new Date(`${dateParam}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) {
        startDate = parsed;
      }
    }
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const baseSelect = 'id, created_at, bin_id, status, bin_category, last_name';
    let rows;

    // Try full schema first (with is_read and collector_id)
    let query = supabase
      .from('notification_bin')
      .select(`${baseSelect}, is_read, collector_id`)
      .order('created_at', { ascending: false })
      .limit(200)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());
    if (userRow.id != null) {
      query = query.or(`collector_id.eq.${userRow.id},collector_id.is.null`);
    }
    const result = await query;
    if (result.error) {
      // Fallback: table may not have is_read or collector_id yet; use columns that exist and filter by last_name
      const fallback = await supabase
        .from('notification_bin')
        .select(baseSelect)
        .order('created_at', { ascending: false })
        .limit(200)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      if (fallback.error) {
        console.error('notifications list error:', fallback.error);
        return res.status(500).json({ success: false, message: fallback.error.message });
      }
      const allRows = fallback.data || [];
      const lastName = (userRow.last_name || '').trim().toUpperCase();
      if (lastName) {
        rows = allRows.filter((r) => (r.last_name || '').trim().toUpperCase() === lastName);
        if (rows.length === 0 && allRows.length > 0) {
          rows = allRows;
        }
      } else {
        rows = allRows;
      }
    } else {
      rows = result.data || [];
    }

    const binIds = [...new Set((rows || []).map(r => r.bin_id).filter(Boolean))];
    const { data: binRows } = binIds.length
      ? await supabase.from('bins').select('id, name').in('id', binIds)
      : { data: [] };
    const binNames = {};
    (binRows || []).forEach(b => { binNames[b.id] = b.name || `Bin ${b.id}`; });

    // Notifications UI should not show "Bin Drained" entries;
    // those are dedicated to Collection History only.
    const visibleRows = (rows || []).filter(r => String(r.status || '').trim() !== 'Drained');
    const list = visibleRows.map(r => notificationRowToUI(r, binNames[r.bin_id]));
    res.json({ notifications: list });
  } catch (err) {
    console.error('notifications GET error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/collector-bins/notifications/:id/read
 * Mark a notification as read.
 */
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid notification id' });

    const { data: row } = await supabase.from('notification_bin').select('id, collector_id').eq('id', id).maybeSingle();
    if (!row) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (row.collector_id != null && row.collector_id !== userRow.id) return res.status(403).json({ success: false, message: 'Not allowed' });

    const { error } = await supabase.from('notification_bin').update({ is_read: true }).eq('id', id);
    if (error) {
      console.error('notification mark-read error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('notifications PATCH error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/collector-bins/notifications/:id
 * Delete a notification (optional; collector must own it or it’s unassigned).
 */
router.delete('/notifications/:id', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid notification id' });

    const { data: row } = await supabase.from('notification_bin').select('id, collector_id').eq('id', id).maybeSingle();
    if (!row) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (row.collector_id != null && row.collector_id !== userRow.id) return res.status(403).json({ success: false, message: 'Not allowed' });

    const { error } = await supabase.from('notification_bin').delete().eq('id', id);
    if (error) {
      console.error('notification delete error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('notifications DELETE error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Category order for the 4 bin cards (same as frontend)
const CATEGORY_IDS = ['Biodegradable', 'Non Biodegradable', 'Recyclable', 'Unsorted'];

function cardIdFromBinName(binName) {
  const c = normalizeCategory(binName);
  return c;
}

/**
 * GET /api/collector-bins
 * Returns bin state. If auth + Supabase are available, uses Supabase (same as deployed).
 * Otherwise falls back to local in-memory + file store (for local dev without Supabase).
 */
router.get('/', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    // Try to use Supabase if configured and token provided
    if (token && hasValidServiceKey) {
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        const authId = userData?.user?.id;
        if (authId) {
          const { data: userRow, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authId)
            .maybeSingle();
          if (!userError && userRow) {
            const { data: assignedBins, error: binsError } = await supabase
              .from('bins')
              .select('id, name, fill_level, last_update')
              .eq('assigned_collector_id', userRow.id)
              .eq('status', 'ACTIVE')
              .order('id', { ascending: true });
            if (!binsError && Array.isArray(assignedBins) && assignedBins.length > 0) {
              const byCategory = {};
              CATEGORY_IDS.forEach((cat) => { byCategory[cat] = { fillLevel: 0, lastCollection: 'Just now', status: 'Empty' }; });
              assignedBins.forEach((b) => {
                const cat = cardIdFromBinName(b.name);
                if (byCategory[cat] !== undefined) {
                  const fill = b.fill_level != null ? Number(b.fill_level) : 0;
                  byCategory[cat] = {
                    fillLevel: Math.min(100, Math.round(fill)),
                    lastCollection: b.last_update ? new Date(b.last_update).toLocaleString() : 'Just now',
                    status: fill >= 90 ? 'Full' : fill >= 75 ? 'Almost Full' : fill >= 50 ? 'Normal' : fill > 0 ? 'Normal' : 'Empty',
                  };
                }
              });
              const bins = CATEGORY_IDS.map((id) => ({
                id,
                fillLevel: byCategory[id].fillLevel,
                lastCollection: byCategory[id].lastCollection,
                status: byCategory[id].status,
              }));
              return res.json({ bins });
            }
          }
        }
      } catch (supabaseErr) {
        // Supabase may be misconfigured or token invalid; fall back to local state
        console.warn('collector-bins GET: Supabase fallback (token/auth failed):', supabaseErr.message);
      }
    }

    // Local fallback for dev (in-memory + file persistence)
    await loadFromDb();
    res.json({ bins: getBinsState() || [] });
  } catch (err) {
    console.error('collector-bins GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/collector-bins
 * Updates bin state. Auth+Supabase preferred (deployed); otherwise falls back to local file state.
 */
router.post('/', async (req, res) => {
  try {
    const bins = req.body?.bins;
    if (!Array.isArray(bins)) return res.status(400).json({ error: 'bins must be an array' });

    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    // Try Supabase update first (deployed behavior)
    if (token && hasValidServiceKey) {
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        const authId = userData?.user?.id;
        if (authId) {
          const { data: userRow, error: userError } = await supabase.from('users').select('id').eq('auth_id', authId).maybeSingle();
          if (!userError && userRow) {
            const { data: assignedBins, error: binsError } = await supabase
              .from('bins')
              .select('id, name')
              .eq('assigned_collector_id', userRow.id)
              .eq('status', 'ACTIVE');
            if (!binsError && Array.isArray(assignedBins) && assignedBins.length > 0) {
              const now = new Date().toISOString();
              for (const card of bins) {
                const cardId = card.id && String(card.id).trim();
                if (!cardId) continue;
                const fillLevel = card.fillLevel != null ? Math.min(100, Math.max(0, Number(card.fillLevel))) : 0;
                const bin = assignedBins.find((b) => cardIdFromBinName(b.name) === cardId);
                if (bin) {
                  await supabase.from('bins').update({ fill_level: fillLevel, last_update: now }).eq('id', bin.id);
                }
              }
              return res.json({ ok: true });
            }
          }
        }
      } catch (supabaseErr) {
        console.warn('collector-bins POST: Supabase fallback (token/auth failed):', supabaseErr.message);
      }
    }

    // Local fallback for dev
    setBinsState(bins);
    await saveToDb();
    res.json({ ok: true });
  } catch (err) {
    console.error('collector-bins POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Collection history: per-collector from history_binitem (drain events only).
// notification_bin is reserved for sort / alerts — not for drains.
router.get('/collection-history', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id, first_name, middle_name, last_name')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userErr || !userRow) return res.status(403).json({ success: false, message: 'User not found' });
    const collectorId = userRow.id;

    const { data: assignedBins, error: binsErr } = await supabase
      .from('bins')
      .select('id')
      .eq('assigned_collector_id', collectorId)
      .eq('status', 'ACTIVE');
    if (binsErr) {
      console.error('collection-history bins:', binsErr);
      return res.status(500).json({ success: false, message: binsErr.message });
    }
    const allowedBinIds = (assignedBins || []).map((b) => b.id);
    if (allowedBinIds.length === 0) return res.json({ history: [] });

    const dateParam = req.query.date;
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateStr = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr;
    const startUtc = new Date(`${dateStr}T00:00:00.000Z`);
    const endUtc = new Date(startUtc);
    endUtc.setUTCDate(endUtc.getUTCDate() + 1);

    const collectorName = [userRow.first_name, userRow.middle_name, userRow.last_name].filter(Boolean).join(' ').trim() || '—';

    const { data: rows, error: histErr } = await supabase
      .from('history_binitem')
      .select('id, bin_id, category, weight, processing_time, drained_at, created_at')
      .eq('collector_id', collectorId)
      .in('bin_id', allowedBinIds)
      .gte('drained_at', startUtc.toISOString())
      .lt('drained_at', endUtc.toISOString())
      .order('drained_at', { ascending: false });

    if (histErr) {
      console.error('collection-history history_binitem:', histErr.message);
      // Fallback: local collection log file (dev)
      const fullLog = getCollectionLog();
      const log = fullLog.filter((e) => e.collector_id === collectorId);
      const matchDate = (row) => {
        const t = row.drained_at || row.created_at;
        if (!t) return false;
        const d = new Date(t);
        return d >= startUtc && d < endUtc;
      };
      return res.json({ history: log.filter(matchDate) });
    }

    const history = (rows || []).map((r) => ({
      id: r.id,
      bin_category: r.category || 'Unsorted',
      bin_name: r.category || 'Bin',
      collector_id: collectorId,
      collector_name: collectorName,
      drained_at: r.drained_at || r.created_at,
      status: 'Drained',
    }));

    res.json({ history });
  } catch (err) {
    console.error('collection-history error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/collector-bins/recorded-items
 * Same data as admin Recorded Items: waste_items for bin(s) assigned to this collector.
 */
router.get('/recorded-items', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });
    const role = (userRow.role || '').toUpperCase();
    if (role !== 'COLLECTOR') {
      return res.status(403).json({ success: false, message: 'Collector access only' });
    }

    const { data: assignedBins, error: binsErr } = await supabase
      .from('bins')
      .select('id')
      .eq('assigned_collector_id', userRow.id)
      .eq('status', 'ACTIVE');
    if (binsErr) return res.status(500).json({ success: false, message: binsErr.message });
    const allowedIds = (assignedBins || []).map((b) => b.id);
    if (allowedIds.length === 0) return res.json({ success: true, data: [] });

    let targetIds = [...allowedIds];
    const binIdParam = req.query.bin_id;
    if (binIdParam != null && String(binIdParam).trim() !== '') {
      const bid = typeof binIdParam === 'number' ? binIdParam : parseInt(String(binIdParam).trim(), 10);
      if (!Number.isNaN(bid)) {
        if (!allowedIds.includes(bid)) {
          return res.status(403).json({ success: false, message: 'Bin is not assigned to you' });
        }
        targetIds = [bid];
      }
    }

    const { data, error } = await supabase
      .from('waste_items')
      .select('id, category, processing_time, created_at, bin_id')
      .in('bin_id', targetIds)
      .order('created_at', { ascending: false })
      .limit(150);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('collector recorded-items error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// History of what was drained from bins (from history_binitem) — per collector, optional bin_id
router.get('/drain-history', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', authId).maybeSingle();
    if (!userRow) return res.status(403).json({ success: false, message: 'User not found' });
    const binIdParam = req.query.bin_id != null ? parseInt(req.query.bin_id, 10) : null;

    const { data: assignedBins } = await supabase
      .from('bins')
      .select('id')
      .eq('assigned_collector_id', userRow.id)
      .eq('status', 'ACTIVE');
    const allowedBinIds = (assignedBins || []).map(b => b.id);
    if (allowedBinIds.length === 0) return res.json({ items: [] });

    let query = supabase
      .from('history_binitem')
      .select('id, bin_id, category, weight, processing_time, drained_at, created_at')
      .eq('collector_id', userRow.id)
      .in('bin_id', allowedBinIds)
      .order('drained_at', { ascending: false });
    if (Number.isInteger(binIdParam) && allowedBinIds.includes(binIdParam)) {
      query = query.eq('bin_id', binIdParam);
    }
    const { data: items, error } = await query;
    if (error) {
      console.error('drain-history error:', error.message);
      return res.json({ items: [] });
    }
    res.json({ items: items || [] });
  } catch (err) {
    console.error('drain-history error:', err);
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

    // Categories being drained (e.g. ["Unsorted"] when user drains only Unsorted) — only those items move; others stay in waste_items
    const rawCategories = req.body?.categories;
    const drainedCategories = Array.isArray(rawCategories) && rawCategories.length > 0
      ? rawCategories.map(c => normalizeCategory(c))
      : null;

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

    const drainedAt = new Date().toISOString();

    // Move only the drained category's items to history_binitem (e.g. only Unsorted, not Bio)
    let selectQuery = supabase
      .from('waste_items')
      .select('id, bin_id, category, weight, processing_time')
      .in('bin_id', allowedIds);
    if (drainedCategories && drainedCategories.length > 0) {
      selectQuery = selectQuery.in('category', drainedCategories);
    }
    const { data: itemsToMove, error: selectErr } = await selectQuery;
    if (!selectErr && Array.isArray(itemsToMove) && itemsToMove.length > 0) {
      const historyRows = itemsToMove.map((item) => ({
        bin_id: item.bin_id,
        category: item.category ?? 'Unsorted',
        weight: item.weight != null ? item.weight : null,
        processing_time: item.processing_time != null ? item.processing_time : null,
        drained_at: drainedAt,
        collector_id: userRow.id,
      }));
      const { error: historyErr } = await supabase.from('history_binitem').insert(historyRows);
      if (historyErr) {
        console.error('[history_binitem] insert error (run backend/scripts/add-history-binitem-columns.sql if needed):', historyErr.message, historyErr.details);
      } else {
        console.log('[history_binitem] inserted', historyRows.length, 'rows for drained category(ies)', drainedCategories || 'all');
      }
    } else if (drainedCategories && drainedCategories.length > 0) {
      // No waste_items for those categories — still log one history row per drained card (Collection History)
      const primaryBinId = allowedIds[0];
      const uniqueCats = [...new Set(drainedCategories)];
      const placeholderRows = uniqueCats.map((cat) => ({
        bin_id: primaryBinId,
        category: cat,
        weight: null,
        processing_time: null,
        drained_at: drainedAt,
        collector_id: userRow.id,
      }));
      const { error: phErr } = await supabase.from('history_binitem').insert(placeholderRows);
      if (phErr) {
        console.error('[history_binitem] placeholder insert:', phErr.message);
      }
    }

    for (const bid of allowedIds) {
      await supabase.from('bins').update({ fill_level: 0, last_update: drainedAt }).eq('id', bid);
    }
    let deleteQuery = supabase.from('waste_items').delete().in('bin_id', allowedIds);
    if (drainedCategories && drainedCategories.length > 0) {
      deleteQuery = deleteQuery.in('category', drainedCategories);
    }
    await deleteQuery;

    // Drains are recorded only in history_binitem (see above). notification_bin = sort / alerts only.

    res.json({ success: true, drained: allowedIds });
  } catch (err) {
    console.error('collector-bins drain error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record a "Sort here" action → notification_bin (collector Notifications only; drains use history_binitem)
router.post('/sort-notification', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data: userRow, error: userError } = await supabase.from('users').select('id, first_name, middle_name, last_name').eq('auth_id', authId).maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });
    const binCategory = (req.body?.bin_category || req.body?.category || '').trim() || 'Unsorted';
    const { data: bins } = await supabase.from('bins').select('id, name').eq('assigned_collector_id', userRow.id).eq('status', 'ACTIVE').limit(1);
    const bin = (bins && bins[0]) ? bins[0] : null;
    const binId = bin ? bin.id : null;
    const baseRow = {
      bin_id: binId,
      status: 'Sorted',
      first_name: userRow.first_name ?? '',
      last_name: userRow.last_name ?? '',
      middle_name: userRow.middle_name ?? '',
      bin_category: binCategory,
      ...(userRow.id != null && { collector_id: userRow.id }),
    };
    if (binId == null) {
      return res.status(400).json({ success: false, message: 'No bin assigned to this collector' });
    }
    const { error: insErr } = await supabase.from('notification_bin').insert(baseRow);
    if (insErr) {
      const fallback = await supabase.from('notification_bin').insert({ ...baseRow, bin_category: undefined });
      if (fallback.error) return res.status(500).json({ success: false, message: insErr.message });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('sort-notification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record a bin fill-level alert from Bin Monitoring → notification_bin (50%, 80%, 100%, Full - no more)
router.post('/bin-alert', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data: userRow, error: userError } = await supabase.from('users').select('id, first_name, middle_name, last_name').eq('auth_id', authId).maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });
    const { bin_id, status, bin_category } = req.body || {};
    const binIdVal = bin_id != null ? (typeof bin_id === 'number' ? bin_id : parseInt(bin_id, 10)) : null;
    if (binIdVal == null || isNaN(binIdVal) || !status || typeof status !== 'string') {
      return res.status(400).json({ success: false, message: 'bin_id and status are required' });
    }
    const { data: binRow } = await supabase.from('bins').select('id').eq('id', binIdVal).eq('assigned_collector_id', userRow.id).maybeSingle();
    if (!binRow) {
      const { data: anyAssigned } = await supabase.from('bins').select('id').eq('assigned_collector_id', userRow.id).limit(1).maybeSingle();
      if (!anyAssigned) return res.status(403).json({ success: false, message: 'No bins assigned to this collector' });
      return res.status(403).json({ success: false, message: 'bin_id must be assigned to this collector' });
    }
    const baseRow = {
      bin_id: binIdVal,
      status: String(status).trim(),
      first_name: userRow.first_name ?? '',
      last_name: userRow.last_name ?? '',
      middle_name: userRow.middle_name ?? '',
    };
    const rowWithOptional = {
      ...baseRow,
      ...(userRow.id != null && { collector_id: userRow.id }),
      ...(bin_category != null && bin_category !== '' && { bin_category: String(bin_category) }),
    };
    let { error: insErr } = await supabase.from('notification_bin').insert(rowWithOptional);
    if (insErr) {
      const fallback = await supabase.from('notification_bin').insert(baseRow);
      insErr = fallback.error;
      if (insErr) {
        console.error('[notification_bin] bin-alert insert error:', insErr.message, insErr.details);
        return res.status(500).json({ success: false, message: insErr.message });
      }
    }
    console.log('[notification_bin] bin-alert inserted:', { bin_id: binIdVal, status: rowWithOptional.status });
    res.json({ ok: true });
  } catch (err) {
    console.error('bin-alert error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Log ML detection events for categories that need explicit history/notification tracking
// (requested: Recyclable + Unsorted). This is read/write-safe and never throws to caller.
router.post('/detected-log', requireAuth, async (req, res) => {
  try {
    const authId = req.authUser?.id;
    if (!authId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, first_name, middle_name, last_name')
      .eq('auth_id', authId)
      .maybeSingle();
    if (userError || !userRow) return res.status(403).json({ success: false, message: 'User not found' });

    const rawCategory = String(req.body?.bin_category || req.body?.category || '').trim();
    const normalized = normalizeCategory(rawCategory);
    if (normalized !== 'Recyclable' && normalized !== 'Unsorted') {
      return res.json({ success: true, skipped: true });
    }

    const inputBinId = req.body?.bin_id;
    let binId = inputBinId != null ? Number(inputBinId) : null;
    if (!Number.isFinite(binId) || binId <= 0) {
      const { data: anyAssigned } = await supabase
        .from('bins')
        .select('id')
        .eq('assigned_collector_id', userRow.id)
        .eq('status', 'ACTIVE')
        .limit(1)
        .maybeSingle();
      binId = anyAssigned?.id ?? null;
    }
    if (!binId) return res.json({ success: true, skipped: true });

    const nowIso = new Date().toISOString();
    // notification_bin entry for detected recycle/unsorted
    await supabase.from('notification_bin').insert({
      bin_id: binId,
      status: 'Detected',
      first_name: userRow.first_name ?? '',
      middle_name: userRow.middle_name ?? '',
      last_name: userRow.last_name ?? '',
      collector_id: userRow.id,
      bin_category: normalized,
    });

    // history_binitem entry (requested behavior for detected events)
    await supabase.from('history_binitem').insert({
      bin_id: binId,
      category: normalized,
      weight: null,
      processing_time: req.body?.processing_time != null ? Number(req.body.processing_time) : null,
      drained_at: nowIso,
      collector_id: userRow.id,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('detected-log error:', err);
    return res.status(500).json({ success: false, message: err.message });
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
    const processingTimeNum = processing_time != null && !Number.isNaN(Number(processing_time)) ? Number(processing_time) : 0;
    const row = {
      bin_id: binIdVal,
      category: String(category),
      weight: weight != null ? Number(weight) : null,
      processing_time: Math.max(0, Math.round(processingTimeNum * 10) / 10), // always store seconds, e.g. 0, 0.5; never null
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
