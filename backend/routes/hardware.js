const express = require('express');
const router = express.Router();
const {
  getHardwareState,
  updateStateFromBridge,
  sendCommandToArduino,
  waitForTypeResponse,
  getLatestBins,
  markBridgeHeartbeat,
  setPendingSortCommand,
  getAndClearPendingSortCommand
} = require('../utils/hardwareStore');
const { handleArduinoDetection } = require('../utils/hardwareToDb');

router.get('/status', (req, res) => {
  try {
    res.json(getHardwareState());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/hardware/bin-status — returns current bin fullness percentages
 */
router.get('/bin-status', (req, res) => {
  try {
    const state = getHardwareState();
    res.json({
      bin1: state.bin1 || 0,
      bin2: state.bin2 || 0,
      bin3: state.bin3 || 0,
      bin4: state.bin4 || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/hardware/sort — send sort command to Arduino (Recycle, Non-Bio, Biodegradable, Unsorted).
 * Accepts { category } for backward compatibility, or { waste_type, source, confidence } for ML.
 * Localhost: sends over serial. Railway: stores pending; bridge on PC polls GET /pending-sort and sends to Arduino.
 */
router.post('/sort', async (req, res) => {
  try {
    let waste_type, source, confidence;
    if (req.body.waste_type) {
      // New ML format
      waste_type = String(req.body.waste_type).trim();
      source = String(req.body.source || 'manual_button').trim();
      confidence = req.body.confidence != null ? Number(req.body.confidence) : null;
    } else {
      // Backward compatibility with category
      const category = String((req.body && req.body.category) || '').trim();
      const map = {
        recycle: 'Recycle',
        'non-bio': 'Non-Bio',
        biodegradable: 'Biodegradable',
        unsorted: 'Unsorted',
      };
      waste_type = map[category.toLowerCase()] || category || '';
      source = 'manual_button';
      confidence = null;
    }

    const valid_types = ['Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted'];
    if (!waste_type || !valid_types.includes(waste_type)) {
      return res.status(400).json({ success: false, message: 'Missing or invalid waste_type. Use: Recycle, Non-Bio, Biodegradable, Unsorted.' });
    }

    const sent = sendCommandToArduino(waste_type);
    if (sent) {
      // Save to sort_events
      try {
        const supabase = require('../utils/supabase');
        await supabase.from('sort_events').insert({
          waste_type,
          source,
          confidence,
          triggered_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error('Failed to save sort event:', dbErr.message);
        // Don't fail the request
      }
      return res.json({ success: true, message: `Sent "${waste_type}" to Arduino.` });
    }
    // No serial (e.g. Railway): store for bridge to pick up
    setPendingSortCommand(waste_type);
    // Still save to DB even if queued
    try {
      const supabase = require('../utils/supabase');
      await supabase.from('sort_events').insert({
        waste_type,
        source,
        confidence,
        triggered_at: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('Failed to save sort event:', dbErr.message);
    }
    res.json({ success: true, message: `Sort "${waste_type}" queued for bridge. Run arduino-bridge on PC.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/hardware/bins — latest bin fullness percentages parsed from serial output.
 */
router.get('/bins', (req, res) => {
  try {
    res.json(getLatestBins());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/hardware/pending-sort — bridge on PC polls this; returns and clears one pending sort command.
 * Used when deployed on Railway (no serial on server).
 */
router.get('/pending-sort', (req, res) => {
  try {
    const command = getAndClearPendingSortCommand();
    const pendingQueue = command ? [command] : [];
    console.log('[PENDING-SORT] queue length:', pendingQueue.length, 'returning:', command || null);
    console.log('[BRIDGE-POLL] pending commands:', command ? [command] : []);
    if (command) console.log('[SORT-DEQUEUED] sending to bridge:', command);
    if (command) console.log(`[hardware/pending-sort] Bridge picked command: "${command}"`);
    res.json({ command: command || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bridge-heartbeat', (req, res) => {
  try {
    markBridgeHeartbeat({ rawLine: `bridge-heartbeat:${req.body?.port || 'unknown-port'}` });
    res.json({ success: true, connected: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hardware/arduino — for Arduino bridge when deployed (e.g. Railway).
 * Body: { type: 'RECYCABLE'|'BIO'|'NON_BIO'|'UNSORTED'|'NORMAL', weight?: number, rawLine?: string }
 */
router.post('/arduino', (req, res) => {
  try {
    const { type, weight, rawLine } = req.body || {};
    const t = String(type || 'NORMAL').trim().toUpperCase();
    updateStateFromBridge(t, weight != null ? Number(weight) : null, rawLine);
    const wasteTypes = ['RECYCABLE', 'NON_BIO', 'BIO', 'UNSORTED'];
    if (wasteTypes.includes(t)) {
      handleArduinoDetection(t, weight != null ? Number(weight) : null).catch(() => {});
    }
    res.json({ success: true, lastType: getHardwareState().lastType });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
