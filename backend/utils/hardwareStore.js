/**
 * Arduino serial reader. Parses new Arduino output:
 * - RECYCABLE, NON-BIO, BIO, UNSORTED (waste type detected)
 * - "Weight: X.X g" (no object → NORMAL)
 * If configured port (e.g. COM3) is not found, tries first available port.
 * GET /api/hardware/status for frontend.
 */
let SerialPort, ReadlineParser, listPorts;
try {
  const serial = require('serialport');
  SerialPort = serial.SerialPort || serial;
  listPorts = serial.list || SerialPort.list;
  try { ReadlineParser = require('@serialport/parser-readline').ReadlineParser; } catch { ReadlineParser = serial.ReadlineParser; }
} catch (e) {
  console.warn('serialport not installed: npm install serialport');
}

const PORT_NAME = process.env.ARDUINO_PORT || 'COM7';
const BAUD_RATE = Number(process.env.ARDUINO_BAUD || 9600);

let port, parser;
const hardwareState = { lastType: 'NORMAL', lastLine: null, lastUpdated: null, connected: false, error: null, availablePorts: [], attemptedPort: null, lastWeight: null };

function attachParser(portInstance) {
  parser = portInstance.pipe(new ReadlineParser({ delimiter: '\n' }));
  portInstance.on('open', () => { hardwareState.connected = true; hardwareState.error = null; });
  portInstance.on('close', () => { hardwareState.connected = false; });
  portInstance.on('error', (err) => { hardwareState.error = err.message; hardwareState.connected = false; });
  parser.on('data', (line) => {
    const clean = String(line).trim();
    hardwareState.lastLine = clean;
    hardwareState.lastUpdated = new Date().toISOString();
    const upper = clean.toUpperCase();
    let detectedType = null;
    let weightG = null;
    if (upper === 'RECYCABLE') { hardwareState.lastType = 'RECYCABLE'; detectedType = 'RECYCABLE'; }
    else if (upper === 'NON-BIO') { hardwareState.lastType = 'NON_BIO'; detectedType = 'NON_BIO'; }
    else if (upper === 'BIO') { hardwareState.lastType = 'BIO'; detectedType = 'BIO'; }
    else if (upper === 'UNSORTED') { hardwareState.lastType = 'UNSORTED'; detectedType = 'UNSORTED'; }
    else if (upper.startsWith('WEIGHT:')) {
      hardwareState.lastType = 'NORMAL';
      const match = clean.match(/Weight:\s*([-\d.]+)/i);
      if (match) {
        const val = parseFloat(match[1]);
        if (!Number.isNaN(val)) { hardwareState.lastWeight = val; weightG = val; }
      }
    }
    else if (upper.startsWith('TYPE:')) { hardwareState.lastType = (clean.split(':')[1] || '').trim().toUpperCase().replace('-', '_') || 'NORMAL'; }
    else if (upper.includes('RECYCABLE')) { hardwareState.lastType = 'RECYCABLE'; detectedType = 'RECYCABLE'; }
    else if (upper.includes('NON-BIO') || upper.includes('NON_BIO')) { hardwareState.lastType = 'NON_BIO'; detectedType = 'NON_BIO'; }
    else if (upper.includes('BIO') && !upper.includes('NON')) { hardwareState.lastType = 'BIO'; detectedType = 'BIO'; }
    else if (upper.includes('UNSORTED')) { hardwareState.lastType = 'UNSORTED'; detectedType = 'UNSORTED'; }
    else if (upper.includes('NORMAL') || upper.includes('WEIGHT')) hardwareState.lastType = 'NORMAL';

    // Do NOT insert here — frontend POST /api/collector-bins/waste-item does it with collector context.
    // Inserting here would double up (one per scan).
  });
}

function openPort(pathToTry) {
  hardwareState.attemptedPort = pathToTry;
  port = new SerialPort({ path: pathToTry, baudRate: BAUD_RATE }, (err) => {
    if (err) {
      hardwareState.error = err.message;
      hardwareState.connected = false;
      if (hardwareState.availablePorts && hardwareState.availablePorts.length > 0) {
        hardwareState.error += ' Available: ' + hardwareState.availablePorts.join(', ') + '. Set ARDUINO_PORT in backend/.env and restart.';
      }
      return;
    }
    hardwareState.connected = true;
    hardwareState.error = null;
    attachParser(port);
  });
}

async function initHardware() {
  if (port || !SerialPort) return;
  try {
    const list = listPorts ? await (typeof listPorts === 'function' ? listPorts() : Promise.resolve([])) : [];
    const paths = (list || []).map((p) => p.path || p.comName).filter(Boolean);
    hardwareState.availablePorts = paths;

    if (paths.length === 0) {
      hardwareState.error = 'No serial ports found. Connect Arduino, check Device Manager (or Arduino IDE Tools > Port), then restart the server.';
      return;
    }

    const portToTry = paths.includes(PORT_NAME) ? PORT_NAME : paths[0];
    if (portToTry !== PORT_NAME && paths.length > 0) {
      hardwareState.error = null;
      openPort(portToTry);
      setTimeout(() => {
        if (hardwareState.connected && hardwareState.availablePorts.length) {
          hardwareState.error = null;
        } else if (!hardwareState.connected && hardwareState.error) {
          hardwareState.error = (hardwareState.error || '') + ' Try closing Arduino Serial Monitor and other apps using the port.';
        }
      }, 500);
    } else {
      openPort(portToTry);
    }
  } catch (err) {
    hardwareState.error = err.message;
    if (err.message && err.message.includes('list') === false && SerialPort) {
      try {
        openPort(PORT_NAME);
      } catch (e2) {
        hardwareState.error = (hardwareState.error || '') + ' (Port list failed: ' + e2.message + ')';
      }
    }
  }
}

function getHardwareState() { return { ...hardwareState }; }

module.exports = { initHardware, getHardwareState };
