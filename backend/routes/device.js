const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

/**
 * POST /api/device/sensor
 * Accepts sensor/reading data from Raspberry Pi (or any device).
 * Body: { bin_id?, category, processing_time?, device_id? }
 * - bin_id: optional Supabase bins.id (UUID)
 * - category: one of 'Biodegradable' | 'Non-Biodegradable' | 'Recycle' | 'Unsorted'
 * - processing_time: optional number (seconds)
 * - device_id: optional string (e.g. Pi identifier)
 * Writes to Supabase waste_items so the dashboard shows real-time data.
 */
router.post('/sensor', async (req, res) => {
  try {
    const { bin_id, category, processing_time, device_id } = req.body || {};

    const allowedCategories = ['Biodegradable', 'Non-Biodegradable', 'Recycle', 'Unsorted'];
    const categoryVal = (category && allowedCategories.includes(category))
      ? category
      : 'Unsorted';

    const row = {
      category: categoryVal,
      processing_time: typeof processing_time === 'number' ? processing_time : 0,
      ...(bin_id && { bin_id }),
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
