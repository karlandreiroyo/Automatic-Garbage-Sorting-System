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

// Use any COM port and baud from env (read at init so .env / Railway vars are used)
const getSerialPortConfig = () => ({
  path: process.env.ARDUINO_PORT || 'COM5',
  baudRate: Number(process.env.ARDUINO_BAUD || 9600),
});
const BRIDGE_CONNECTED_SEC = 90; // treat as connected for this long after last bridge update
const WASTE_TYPE_HOLD_MS = 4000;  // keep lastType as waste type this long so frontend can count (Railway poll ~1s)
const BRIDGE_HEARTBEAT_TIMEOUT_MS = 15000;

let port;
let parser;
let serialAttempted = false;
let latestBins = { bin1: 0, bin2: 0, bin3: 0, bin4: 0 };
const typeWaiters = new Set();
let bridgeHeartbeatAt = 0;

const WASTE_TYPES = ['RECYCABLE', 'NON_BIO', 'BIO', 'UNSORTED'];

const hardwareState = {
  lastType: 'NORMAL',
  lastLine: null,
  lastUpdated: null,
  connected: false,
  error: null,
  source: null, // 'serial' | 'bridge' | null
  _wasteTypeSetAt: 0, // when we last set a waste type (for bridge hold)
  bin1: 0,
  bin2: 0,
  bin3: 0,
  bin4: 0,
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
  const { path: portPath, baudRate } = getSerialPortConfig();
  try {
    port = new SerialPort(
      { path: portPath, baudRate },
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
      console.log(`✅ Serial port opened on ${portPath} @ ${baudRate}`);
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
        console.log(`[hardwareStore] Arduino TYPE response received: ${type.trim().toUpperCase() || 'NORMAL'}`);
        setDetectedType(type.trim().toUpperCase() || 'NORMAL');
        return;
      }
      // Accept both RECYCABLE (AGSS.ino) and RECYCLABLE ("Detected: Recyclable")
      if (upper.includes('RECYCABLE') || upper.includes('RECYCLABLE')) setDetectedType('RECYCABLE');
      else if (upper.includes('NON - BIO') || upper.includes('NON-BIO')) setDetectedType('NON_BIO');
      else if (upper.includes('BIO') && !upper.includes('NON')) setDetectedType('BIO');
      else if (upper.includes('UNSORTED')) setDetectedType('UNSORTED');
      else if (upper.includes('NORMAL POSITION') || upper.includes('NO OBJECT')) setDetectedType('NORMAL');
      else setDetectedType('NORMAL');
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
  setDetectedType(lastType);
  hardwareState.lastLine = rawLine != null ? String(rawLine) : hardwareState.lastLine;
  if (rawLine != null) parseBinLine(String(rawLine));
  hardwareState.lastUpdated = new Date().toISOString();
  hardwareState.connected = true;
  hardwareState.error = null;
  hardwareState.source = 'bridge';
  hardwareState._bridgeLastAt = now;
  bridgeHeartbeatAt = now;
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

function parseBinLine(line) {
  const m = String(line || '').match(/^Bin\s+([1-4])\s*:\s*(\d{1,3})%?$/i);
  if (!m) return;
  const key = `bin${Number(m[1])}`;
  const value = Math.max(0, Math.min(100, Number(m[2])));
  latestBins = { ...latestBins, [key]: value };
}

function setDetectedType(type) {
  hardwareState.lastType = type || 'NORMAL';
  if (WASTE_TYPES.includes(hardwareState.lastType)) {
    hardwareState._wasteTypeSetAt = Date.now();
  }
  if (!WASTE_TYPES.includes(hardwareState.lastType)) return;
  for (const waiter of [...typeWaiters]) {
    try {
      waiter.resolve(hardwareState.lastType);
    } catch {}
    typeWaiters.delete(waiter);
  }
}

function waitForTypeResponse(timeoutMs = 5000) {
  return new Promise((resolve) => {
    const waiter = { resolve: (t) => resolve(t) };
    typeWaiters.add(waiter);
    console.log(`[hardwareStore] Waiting for Arduino TYPE response (timeout=${Math.max(250, Number(timeoutMs) || 5000)}ms)`);
    const timer = setTimeout(() => {
      typeWaiters.delete(waiter);
      console.warn('[hardwareStore] TYPE response timeout');
      resolve(null);
    }, Math.max(250, Number(timeoutMs) || 5000));
    waiter.resolve = (t) => {
      clearTimeout(timer);
      console.log(`[hardwareStore] TYPE response resolved: ${t}`);
      resolve(t);
    };
  });
}

function getLatestBins() {
  return { ...latestBins };
}

function markBridgeHeartbeat(meta = {}) {
  bridgeHeartbeatAt = Date.now();
  hardwareState.connected = true;
  hardwareState.error = null;
  hardwareState.source = 'bridge';
  hardwareState._bridgeLastAt = bridgeHeartbeatAt;
  if (meta && meta.rawLine) {
    hardwareState.lastLine = String(meta.rawLine);
    hardwareState.lastUpdated = new Date().toISOString();
  }
}

function getBridgeStatus() {
  const elapsed = bridgeHeartbeatAt ? (Date.now() - bridgeHeartbeatAt) : Number.POSITIVE_INFINITY;
  return { connected: elapsed <= BRIDGE_HEARTBEAT_TIMEOUT_MS };
}

/**
 * Send a command to the Arduino over serial (e.g. "Recycle", "Non-Bio", "Biodegradable", "Unsorted").
 * Used by POST /api/hardware/sort. No-op if serial not open.
 */
function sendCommandToArduino(command) {
  if (!port || typeof port.write !== 'function') {
    console.error(`[hardwareStore] Arduino not connected - sort command dropped: ${command}`);
    return false;
  }
  if (!port.isOpen) {
    console.error(`[hardwareStore] Arduino not connected - sort command dropped: ${command}`);
    return false;
  }
  try {
    const line = String(command).trim() + '\n';
    port.write(line, (err) => {
      if (err) {
        console.error(`[hardwareStore] Serial write failed for "${String(command).trim()}": ${err.message}`);
      } else {
        console.log(`[hardwareStore] Serial write ok: ${JSON.stringify(line)}`);
      }
    });
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
  waitForTypeResponse,
  getLatestBins,
  markBridgeHeartbeat,
  getBridgeStatus,
  setPendingSortCommand,
  getAndClearPendingSortCommand,
};
