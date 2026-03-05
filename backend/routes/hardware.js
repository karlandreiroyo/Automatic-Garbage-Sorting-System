const express = require('express');
const router = express.Router();
const { getHardwareState, updateStateFromBridge, sendCommandToArduino, setPendingSortCommand, getAndClearPendingSortCommand } = require('../utils/hardwareStore');
const { handleArduinoDetection } = require('../utils/hardwareToDb');

router.get('/status', (req, res) => {
  try {
    res.json(getHardwareState());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/hardware/sort — send sort command to Arduino (Recycle, Non-Bio, Biodegradable, Unsorted).
 * Localhost: sends over serial. Railway: stores pending; bridge on PC polls GET /pending-sort and sends to Arduino.
 */
router.post('/sort', (req, res) => {
  try {
    const category = String((req.body && req.body.category) || '').trim();
    const map = {
      recycle: 'Recycle',
      'non-bio': 'Non-Bio',
      biodegradable: 'Biodegradable',
      unsorted: 'Unsorted',
    };
    const cmd = map[category.toLowerCase()] || category || '';
    if (!cmd) {
      return res.status(400).json({ success: false, message: 'Missing or invalid category. Use: Recycle, Non-Bio, Biodegradable, Unsorted.' });
    }
    const sent = sendCommandToArduino(cmd);
    if (sent) {
      return res.json({ success: true, message: `Sent "${cmd}" to Arduino.` });
    }
    // No serial (e.g. Railway): store for bridge to pick up
    setPendingSortCommand(cmd);
    res.json({ success: true, message: `Sort "${cmd}" queued for bridge. Run arduino-bridge on PC with Arduino.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/hardware/pending-sort — bridge on PC polls this; returns and clears one pending sort command.
 * Used when deployed on Railway (no serial on server).
 */
router.get('/pending-sort', (req, res) => {
  try {
    const command = getAndClearPendingSortCommand();
    res.json({ command: command || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
