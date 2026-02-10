const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { getBinsState, setBinsState } = require('../utils/collectorBinStore');
const { getCollectionLog, addCollectionLogEntries } = require('../utils/collectionLogStore');

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

// Recorded items for collector's bin (Bin 2) – same data as admin "Recorded Items – Bin 2"
router.get('/recorded-items', async (req, res) => {
  try {
    const binId = req.query.bin_id != null ? req.query.bin_id : 2;
    const binIdVal = typeof binId === 'number' ? binId : (/^\d+$/.test(String(binId).trim()) ? parseInt(binId, 10) : 2);
    const { data, error } = await supabase
      .from('waste_items')
      .select('id, category, processing_time, created_at')
      .eq('bin_id', binIdVal)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('collector recorded-items error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('collector recorded-items route error:', err);
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
