const express = require('express');
const router = express.Router();
const { getHardwareState } = require('../utils/hardwareStore');

// GET /status — used by Bin Monitoring to connect weight to the four bins
router.get('/status', (req, res) => {
  try {
    const state = getHardwareState();
    let lastWeight = state.lastWeight != null ? Number(state.lastWeight) : null;
    if (lastWeight == null && state.lastLine) {
      const match = String(state.lastLine).match(/Weight:\s*([-\d.]+)/i);
      if (match) lastWeight = parseFloat(match[1]);
    }
    res.json({ ...state, lastWeight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
