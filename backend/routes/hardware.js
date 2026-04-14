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
 * POST /api/hardware/sort — send sort command to Arduino (Recycle, Non-Bio, Biodegradable, Unsorted).
 * Localhost: sends over serial. Railway: stores pending; bridge on PC polls GET /pending-sort and sends to Arduino.
 */
router.post('/sort', async (req, res) => {
  try {
    const incomingType = String((req.body && (req.body.type || req.body.category)) || '').trim();
    const map = {
      recycle: 'Recycle',
      'non-bio': 'Non-Bio',
      nonbio: 'Non-Bio',
      'non biodegradable': 'Non-Bio',
      biodegradable: 'Biodegradable',
      unsorted: 'Unsorted',
    };
    const cmd = map[incomingType.toLowerCase()] || incomingType || '';
    console.log(`[hardware/sort] Received sort request. incoming="${incomingType}" mapped="${cmd}" bodyType="${req.body?.type || ''}"`);
    if (!cmd) {
      return res.status(400).json({ success: false, message: 'Missing or invalid category. Use: Recycle, Non-Bio, Biodegradable, Unsorted.' });
    }
    console.log(`[hardware/sort] Attempting serial write: ${JSON.stringify(`${cmd}\n`)}`);
    const sent = sendCommandToArduino(cmd);
    if (sent) {
      const typeResponse = await waitForTypeResponse(5000);
      if (!typeResponse) {
        console.warn(`[hardware/sort] Serial command sent but no TYPE response within timeout for "${cmd}"`);
      } else {
        console.log(`[hardware/sort] Arduino TYPE response for "${cmd}": ${typeResponse}`);
      }
      return res.json({
        success: true,
        message: `Sent "${cmd}" to Arduino.`,
        command: cmd,
        arduinoType: typeResponse,
      });
    }
    // No serial (e.g. Railway): store for bridge to pick up
    console.error(`[hardware/sort] Arduino not connected - sort command dropped: ${cmd}`);
    const bridgePushed = typeof req.app?.locals?.sendBridgeCommand === 'function'
      ? req.app.locals.sendBridgeCommand(cmd)
      : false;
    if (bridgePushed) {
      console.log(`[hardware/sort] Sent to WebSocket bridge: "${cmd}"`);
    }
    setPendingSortCommand(cmd);
    console.log(`[hardware/sort] Queued for bridge polling: "${cmd}"`);
    const typeResponse = await waitForTypeResponse(8000);
    if (!typeResponse) {
      console.warn(`[hardware/sort] Bridge did not return TYPE in time for "${cmd}"`);
    } else {
      console.log(`[hardware/sort] Bridge returned TYPE for "${cmd}": ${typeResponse}`);
    }
    res.json({
      success: true,
      message: `Sort "${cmd}" queued for bridge. Run arduino-bridge on PC with Arduino.`,
      command: cmd,
      arduinoType: typeResponse,
    });
  } catch (err) {
    console.error('[hardware/sort] Unexpected error:', err);
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
