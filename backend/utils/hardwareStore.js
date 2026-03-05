/**
 * Arduino: serial (local COM) or bridge (POST from PC when deployed e.g. Railway).
 * GET /api/hardware/status for frontend. POST /api/hardware/arduino for bridge.
 */
let SerialPort, ReadlineParser;
try {
  const serial = require('serialport');
  SerialPort = serial.SerialPort || serial;
  try {
    ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
  } catch {
    ReadlineParser = serial.ReadlineParser;
  }
} catch (e) {
  console.warn('serialport not installed: npm install serialport');
}

// Use any COM port (COM3, COM5, COM7, COM8, etc.) via ARDUINO_PORT in backend/.env
const PORT_NAME = process.env.ARDUINO_PORT || 'COM5';
const BAUD_RATE = Number(process.env.ARDUINO_BAUD || 9600);
const BRIDGE_CONNECTED_SEC = 90; // treat as connected for this long after last bridge update
const WASTE_TYPE_HOLD_MS = 4000;  // keep lastType as waste type this long so frontend can count (Railway poll ~1s)

let port;
let parser;
let serialAttempted = false;

const WASTE_TYPES = ['RECYCABLE', 'NON_BIO', 'BIO', 'UNSORTED'];

const hardwareState = {
  lastType: 'NORMAL',
  lastLine: null,
  lastUpdated: null,
  connected: false,
  error: null,
  source: null, // 'serial' | 'bridge' | null
  _wasteTypeSetAt: 0, // when we last set a waste type (for bridge hold)
};

// Railway (no serial): store pending sort so bridge on PC can poll and send to Arduino
let pendingSortCommand = null;
function setPendingSortCommand(cmd) {
  pendingSortCommand = cmd ? String(cmd).trim() : null;
}
function getAndClearPendingSortCommand() {
  const c = pendingSortCommand;
  pendingSortCommand = null;
  return c;
}

function initHardware() {
  if (port || !SerialPort) return;
  serialAttempted = true;
  try {
    port = new SerialPort(
      { path: PORT_NAME, baudRate: BAUD_RATE },
      (err) => {
        if (err) {
          console.error('Error opening serial port:', err.message);
          hardwareState.error = err.message;
          hardwareState.connected = false;
        }
      }
    );
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
      console.log(`✅ Serial port opened on ${PORT_NAME} @ ${BAUD_RATE}`);
      hardwareState.connected = true;
      hardwareState.error = null;
      hardwareState.source = 'serial';
    });
    port.on('close', () => {
      hardwareState.connected = false;
    });
    port.on('error', (err) => {
      hardwareState.error = err.message;
      hardwareState.connected = false;
    });

    parser.on('data', (line) => {
      const clean = String(line).trim();
      hardwareState.lastLine = clean;
      hardwareState.lastUpdated = new Date().toISOString();
      const upper = clean.toUpperCase();
      if (upper.startsWith('TYPE:')) {
        const type = clean.split(':')[1] || '';
        hardwareState.lastType = type.trim().toUpperCase() || 'NORMAL';
        return;
      }
      // Bin fullness lines (e.g. "Bin 1: 50%") – do not overwrite lastType
      if (/^BIN \d+:\s*\d+%?$/i.test(clean)) return;
      // Accept both RECYCABLE (AGSS.ino) and RECYCLABLE ("Detected: Recyclable")
      if (upper.includes('RECYCABLE') || upper.includes('RECYCLABLE')) hardwareState.lastType = 'RECYCABLE';
      else if (upper.includes('NON - BIO') || upper.includes('NON-BIO')) hardwareState.lastType = 'NON_BIO';
      else if (upper.includes('BIO') && !upper.includes('NON')) hardwareState.lastType = 'BIO';
      else if (upper.includes('UNSORTED')) hardwareState.lastType = 'UNSORTED';
      else if (upper.includes('NORMAL POSITION') || upper.includes('NO OBJECT')) hardwareState.lastType = 'NORMAL';
      else hardwareState.lastType = 'NORMAL';
    });
  } catch (err) {
    console.error('Failed to init hardware:', err.message);
    hardwareState.error = err.message;
  }
}

/**
 * Update state from Arduino bridge (when deployed e.g. Railway). Bridge runs on PC and POSTs here.
 * Keep waste type visible for WASTE_TYPE_HOLD_MS so frontend poll can count it (Railway).
 */
function updateStateFromBridge(type, weightG = null, rawLine = null) {
  const upper = String(type || '').toUpperCase();
  let lastType = 'NORMAL';
  if (upper.includes('RECYCABLE')) lastType = 'RECYCABLE';
  else if (upper.includes('NON_BIO') || upper.includes('NON-BIO')) lastType = 'NON_BIO';
  else if (upper.includes('BIO')) lastType = 'BIO';
  else if (upper.includes('UNSORTED')) lastType = 'UNSORTED';
  else if (upper === 'NORMAL' || upper === '') lastType = 'NORMAL';
  else lastType = upper || 'NORMAL';

  const now = Date.now();
  const isWasteType = WASTE_TYPES.includes(lastType);
  const withinHold = hardwareState._wasteTypeSetAt && (now - hardwareState._wasteTypeSetAt) < WASTE_TYPE_HOLD_MS;
  // Don't overwrite a recent waste type with NORMAL so frontend has time to poll and count
  if (lastType === 'NORMAL' && withinHold && WASTE_TYPES.includes(hardwareState.lastType)) {
    // Keep lastType as-is; only update connection and lastLine
    hardwareState.lastLine = rawLine != null ? String(rawLine) : hardwareState.lastLine;
    hardwareState.connected = true;
    hardwareState.error = null;
    hardwareState.source = 'bridge';
    hardwareState._bridgeLastAt = now;
    return;
  }

  if (isWasteType) hardwareState._wasteTypeSetAt = now;
  hardwareState.lastType = lastType;
  hardwareState.lastLine = rawLine != null ? String(rawLine) : hardwareState.lastLine;
  hardwareState.lastUpdated = new Date().toISOString();
  hardwareState.connected = true;
  hardwareState.error = null;
  hardwareState.source = 'bridge';
  hardwareState._bridgeLastAt = now;
}

function getHardwareState() {
  const out = { ...hardwareState };
  // If we never tried serial, don't expose a stale error (e.g. from another env)
  if (!serialAttempted && out.error) out.error = null;
  // Bridge: show connected only for a while after last update
  if (out.source === 'bridge' && out._bridgeLastAt) {
    const elapsed = (Date.now() - out._bridgeLastAt) / 1000;
    if (elapsed > BRIDGE_CONNECTED_SEC) out.connected = false;
  }
  delete out._bridgeLastAt;
  delete out._wasteTypeSetAt;
  return out;
}

/**
 * Send a command to the Arduino over serial (e.g. "Recycle", "Non-Bio", "Biodegradable", "Unsorted").
 * Used by POST /api/hardware/sort. No-op if serial not open.
 */
function sendCommandToArduino(command) {
  if (!port || typeof port.write !== 'function') return false;
  try {
    const line = String(command).trim() + '\n';
    port.write(line);
    return true;
  } catch (err) {
    console.error('Send command to Arduino failed:', err.message);
    return false;
  }
}

module.exports = {
  initHardware,
  getHardwareState,
  updateStateFromBridge,
  sendCommandToArduino,
  setPendingSortCommand,
  getAndClearPendingSortCommand,
};
