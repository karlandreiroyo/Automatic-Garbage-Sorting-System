const express = require('express');
const router = express.Router();
const { getHardwareState, updateStateFromBridge } = require('../utils/hardwareStore');
const { handleArduinoDetection } = require('../utils/hardwareToDb');

router.get('/status', (req, res) => {
  try {
    res.json(getHardwareState());
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
