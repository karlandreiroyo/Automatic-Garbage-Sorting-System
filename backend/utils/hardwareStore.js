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

const PORT_NAME = process.env.ARDUINO_PORT || 'COM3';
const BAUD_RATE = Number(process.env.ARDUINO_BAUD || 9600);
const BRIDGE_CONNECTED_SEC = 90; // treat as connected for this long after last bridge update

let port;
let parser;
let serialAttempted = false;

const hardwareState = {
  lastType: 'NORMAL',
  lastLine: null,
  lastUpdated: null,
  connected: false,
  error: null,
  source: null, // 'serial' | 'bridge' | null
};

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
      if (upper.includes('RECYCABLE')) hardwareState.lastType = 'RECYCABLE';
      else if (upper.includes('NON - BIO') || upper.includes('NON-BIO')) hardwareState.lastType = 'NON_BIO';
      else if (upper.includes('BIO')) hardwareState.lastType = 'BIO';
      else if (upper.includes('UNSORTED')) hardwareState.lastType = 'UNSORTED';
      else if (upper.includes('NORMAL POSITION')) hardwareState.lastType = 'NORMAL';
    });
  } catch (err) {
    console.error('Failed to init hardware:', err.message);
    hardwareState.error = err.message;
  }
}

/**
 * Update state from Arduino bridge (when deployed e.g. Railway). Bridge runs on PC and POSTs here.
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

  hardwareState.lastType = lastType;
  hardwareState.lastLine = rawLine != null ? String(rawLine) : hardwareState.lastLine;
  hardwareState.lastUpdated = new Date().toISOString();
  hardwareState.connected = true;
  hardwareState.error = null;
  hardwareState.source = 'bridge';
  hardwareState._bridgeLastAt = Date.now();
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
  return out;
}

module.exports = {
  initHardware,
  getHardwareState,
  updateStateFromBridge,
};
