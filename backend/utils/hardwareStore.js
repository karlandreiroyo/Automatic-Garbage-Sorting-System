/**
 * Arduino serial reader (COM3). Parses TYPE:BIO, RECYCABLE, etc. from Serial.
 * GET /api/hardware/status for frontend.
 */
let SerialPort, ReadlineParser;
try {
  const serial = require('serialport');
  SerialPort = serial.SerialPort || serial;
  try { ReadlineParser = require('@serialport/parser-readline').ReadlineParser; } catch { ReadlineParser = serial.ReadlineParser; }
} catch (e) {
  console.warn('serialport not installed: npm install serialport');
}

const PORT_NAME = process.env.ARDUINO_PORT || 'COM3';
const BAUD_RATE = Number(process.env.ARDUINO_BAUD || 9600);

let port, parser;
const hardwareState = { lastType: 'NORMAL', lastLine: null, lastUpdated: null, connected: false, error: null };

function initHardware() {
  if (port || !SerialPort) return;
  try {
    port = new SerialPort({ path: PORT_NAME, baudRate: BAUD_RATE }, (err) => {
      if (err) { hardwareState.error = err.message; hardwareState.connected = false; }
    });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    port.on('open', () => { hardwareState.connected = true; hardwareState.error = null; });
    port.on('close', () => { hardwareState.connected = false; });
    port.on('error', (err) => { hardwareState.error = err.message; hardwareState.connected = false; });
    parser.on('data', (line) => {
      const clean = String(line).trim();
      hardwareState.lastLine = clean;
      hardwareState.lastUpdated = new Date().toISOString();
      const upper = clean.toUpperCase();
      if (upper.startsWith('TYPE:')) { hardwareState.lastType = (clean.split(':')[1] || '').trim().toUpperCase() || 'NORMAL'; return; }
      if (upper.includes('RECYCABLE')) hardwareState.lastType = 'RECYCABLE';
      else if (upper.includes('NON - BIO') || upper.includes('NON-BIO')) hardwareState.lastType = 'NON_BIO';
      else if (upper.includes('BIO')) hardwareState.lastType = 'BIO';
      else if (upper.includes('UNSORTED')) hardwareState.lastType = 'UNSORTED';
      else if (upper.includes('NORMAL POSITION')) hardwareState.lastType = 'NORMAL';
    });
  } catch (err) {
    hardwareState.error = err.message;
  }
}

function getHardwareState() { return { ...hardwareState }; }

module.exports = { initHardware, getHardwareState };
