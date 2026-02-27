const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabase');

/**
 * POST /api/device/sensor
 * Accepts sensor/reading data from Raspberry Pi (or any device).
 * Body: { bin_id?, category, processing_time?, device_id? }
 * - bin_id: use directly if provided
 * - device_id: if bin_id not provided, look up bin by device_id (links hardware to database)
 */
router.post('/sensor', async (req, res) => {
  try {
    let { bin_id, category, processing_time, device_id } = req.body || {};

    const c = String(category || '').trim().toLowerCase();
    let categoryVal = 'Unsorted';
    if (c.includes('bio') && !c.includes('non')) categoryVal = 'Biodegradable';
    else if (c.includes('non') && c.includes('bio')) categoryVal = 'Non Biodegradable';
    else if (c.includes('recycl')) categoryVal = 'Recyclable';
    else if (c.includes('unsort')) categoryVal = 'Unsorted';

    // Resolve bin_id from device_id if bin_id not provided (hardware → database linkage)
    if ((bin_id == null || bin_id === '') && device_id) {
      const { data: binRow, error: binErr } = await supabase
        .from('bins')
        .select('id')
        .eq('device_id', String(device_id).trim())
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (!binErr && binRow?.id) {
        bin_id = binRow.id;
        console.log('[device/sensor] resolved bin_id', bin_id, 'from device_id:', device_id);
      }
    }

    const row = {
      category: categoryVal,
      processing_time: typeof processing_time === 'number' ? processing_time : 0,
      ...(bin_id != null && bin_id !== '' && { bin_id: Number(bin_id) || bin_id }),
      created_at: new Date().toISOString(),
    };
    if (device_id) console.log('[device/sensor] device_id:', device_id);

    const { data, error } = await supabase
      .from('waste_items')
      .insert([row])
      .select('id')
      .single();

    if (error) {
      console.error('Device sensor insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save sensor reading.',
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Sensor reading saved.',
      id: data?.id,
    });
  } catch (err) {
    console.error('Device sensor error:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred.',
    });
  }
});

/**
 * GET /api/device/health
 * Simple check for the Pi to verify it can reach the backend.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'device-api' });
});

module.exports = router;
