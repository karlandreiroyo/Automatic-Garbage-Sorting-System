#!/usr/bin/env node
/**
 * Arduino Bridge — run this on your PC when the app is deployed (e.g. Railway).
 * - Reads from Arduino serial and POSTs detections to your backend.
 * - Polls backend for pending sort commands (when user clicks "Sort here" in the app) and sends them to the Arduino.
 * Same behavior as localhost: sort button → Arduino tilts → TYPE:XXX → app shows +10%.
 *
 * Usage (PowerShell):
 *   set BACKEND_URL=https://your-backend.up.railway.app
 *   set ARDUINO_PORT=COM5
 *   node backend/scripts/arduino-bridge.js
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.bridge') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BACKEND_URL = String(process.env.BACKEND_URL || '').trim().replace(/\/$/, '');
const ARDUINO_PORT = String(process.env.ARDUINO_PORT || '').trim();
const BAUD = Number(process.env.ARDUINO_BAUD || 9600);
const SCAN_RETRY_MS = 5000;

if (!BACKEND_URL) {
  console.error('ERROR: BACKEND_URL is not set. Add it to backend/.env');
  console.error('Create .env.bridge file with: BACKEND_URL=https://your-railway-url');
  process.exit(1);
}

let SerialPort, ReadlineParser;
try {
  const serial = require('serialport');
  SerialPort = serial.SerialPort || serial;
  ReadlineParser = require('@serialport/parser-readline').ReadlineParser || serial.ReadlineParser;
} catch (e) {
  console.error('Install serialport: cd backend && npm install serialport');
  process.exit(1);
}

function parseLine(line) {
  const s = String(line).trim();
  const upper = s.toUpperCase();
  if (upper.startsWith('TYPE:')) {
    const type = (s.split(':')[1] || '').trim().toUpperCase();
    if (type === 'RECYCABLE') return { type: 'RECYCABLE', rawLine: s };
    if (type === 'NON_BIO') return { type: 'NON_BIO', rawLine: s };
    if (type === 'BIO') return { type: 'BIO', rawLine: s };
    if (type === 'UNSORTED') return { type: 'UNSORTED', rawLine: s };
  }
  if (upper.includes('RECYCABLE') || upper.includes('RECYCLABLE')) return { type: 'RECYCABLE', rawLine: s };
  if (upper.includes('NON_BIO') || upper.includes('NON-BIO')) return { type: 'NON_BIO', rawLine: s };
  if (upper.includes('BIO') && !upper.includes('NON')) return { type: 'BIO', rawLine: s };
  if (upper.includes('UNSORTED')) return { type: 'UNSORTED', rawLine: s };
  const wMatch = s.match(/Weight:\s*([\d.]+)\s*g/i);
  if (wMatch) return { type: 'NORMAL', weight: parseFloat(wMatch[1]), rawLine: s };
  if (upper.startsWith('TIME:') || upper.includes('NO OBJECT')) return null;
  if (/^BIN \d+:\s*\d+%?$/i.test(s)) return null;
  return { type: 'NORMAL', rawLine: s };
}

async function sendToBackend(payload) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/hardware/arduino`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn('Bridge POST failed:', res.status, await res.text());
  } catch (err) {
    console.warn('Bridge POST error:', err.message);
  }
}

let _pendingSortLoggedFailure = false;
let _backendConnectedLogged = false;
let port = null;
let parser = null;
let reconnectTimer = null;
let startedPolling = false;
const queuedSortCommands = [];
let lastConnectedPath = '';

const KNOWN_USB_MANUFACTURERS = ['arduino', 'wch.cn', 'ftdi', 'silicon labs', 'ch340', 'ch341'];
const KNOWN_VENDOR_IDS = new Set(['2341', '0403', '1a86', '10c4']);

function normalizeVendorId(value) {
  const s = String(value || '').toLowerCase().replace(/^0x/, '');
  return s.padStart(4, '0');
}

function isLikelyArduino(p) {
  const m = String(p.manufacturer || '').toLowerCase();
  const vid = normalizeVendorId(p.vendorId);
  return KNOWN_USB_MANUFACTURERS.some((x) => m.includes(x)) || KNOWN_VENDOR_IDS.has(vid);
}

async function sendHeartbeat() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/hardware/bridge-heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: port?.path || ARDUINO_PORT || 'auto' }),
    });
    if (res.ok) {
      if (!_backendConnectedLogged) {
        console.log('Bridge connected to backend');
        _backendConnectedLogged = true;
      }
      return;
    }
    console.warn('Bridge heartbeat failed:', res.status, await res.text());
  } catch (err) {
    console.warn('Bridge heartbeat error:', err.message);
  }
}

function flushQueuedCommands() {
  if (!port || !port.isOpen || !queuedSortCommands.length) return;
  while (queuedSortCommands.length) {
    const cmd = queuedSortCommands.shift();
    console.log(`Writing queued command to Arduino: ${cmd}`);
    port.write(`${cmd}\n`, (err) => {
      if (err) {
        console.error(`Bridge serial write failed for queued "${cmd}":`, err.message);
      } else {
        console.log(`Bridge serial write success: ${JSON.stringify(`${cmd}\n`)}`);
      }
    });
  }
}

async function pollPendingSort() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/hardware/pending-sort`);
    if (!res.ok) {
      if (!_pendingSortLoggedFailure) {
        console.warn('Bridge could not reach backend (pending-sort):', res.status, BACKEND_URL);
        _pendingSortLoggedFailure = true;
      }
      return;
    }
    const data = await res.json();
    const cmd = data && data.command;
    if (!cmd) return;
    const cleanCmd = String(cmd).trim();
    console.log(`Sort command received: ${cleanCmd}`);
    if (!port || !port.isOpen) {
      console.log('Sort command received but Arduino not connected — queuing');
      queuedSortCommands.push(cleanCmd);
      return;
    }
    console.log(`Writing to Arduino: ${cleanCmd}`);
    port.write(`${cleanCmd}\n`, (err) => {
      if (err) {
        console.error(`Bridge serial write failed for "${cleanCmd}":`, err.message);
      } else {
        console.log(`Bridge serial write success: ${JSON.stringify(`${cleanCmd}\n`)}`);
      }
    });
  } catch (err) {
    if (!_pendingSortLoggedFailure) {
      console.warn('Bridge pending-sort error:', err.message, '- is BACKEND_URL correct?', BACKEND_URL);
      _pendingSortLoggedFailure = true;
    }
  }
}

function attachSerialHandlers(openPort, usingPath) {
  port = openPort;
  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const parsed = parseLine(line);
    const clean = String(line).trim();
    if (clean.toUpperCase().startsWith('TYPE:')) {
      console.log(`Arduino responded: ${clean}`);
    }
    if (!parsed) return;
    const body = { type: parsed.type, rawLine: parsed.rawLine };
    if (parsed.weight != null) body.weight = parsed.weight;
    sendToBackend(body);
  });

  port.on('open', () => {
    console.log(`Arduino auto-detected on ${usingPath} — connected`);
    console.log(`Bridge serial ready on ${usingPath} @ ${BAUD}`);
    sendHeartbeat();
    flushQueuedCommands();
    if (!startedPolling) {
      startedPolling = true;
      setInterval(() => pollPendingSort(), 500);
      setInterval(() => sendHeartbeat(), 5000);
    }
  });

  port.on('close', () => {
    console.log('Arduino disconnected. Waiting for reconnect...');
    try {
      parser?.removeAllListeners();
    } catch {}
    parser = null;
    port = null;
    scheduleReconnect();
  });

  port.on('error', (err) => {
    console.error('Serial error:', err.message);
    if (!port || !port.isOpen) scheduleReconnect();
  });
}

async function detectArduinoPortPath() {
  const ports = await SerialPort.list();
  const availablePaths = new Set(ports.map((p) => String(p.path || '').toUpperCase()));
  if (ARDUINO_PORT) {
    const exact = ports.find((p) => String(p.path || '').toUpperCase() === ARDUINO_PORT.toUpperCase());
    if (!exact) {
      console.log(`${ARDUINO_PORT} busy or not found — retrying in 5s. Close Arduino IDE if open.`);
      return null;
    }
    return exact.path;
  }
  if (lastConnectedPath && !availablePaths.has(lastConnectedPath.toUpperCase())) {
    console.log(`${lastConnectedPath} busy or not found — retrying in 5s. Close Arduino IDE if open.`);
    return null;
  }
  const match = ports.find((p) => isLikelyArduino(p));
  return match?.path || null;
}

async function tryConnectArduino() {
  if (port && port.isOpen) return;
  try {
    const path = await detectArduinoPortPath();
    if (!path) {
      console.log('No Arduino detected. Plug in Arduino USB... retrying in 5s');
      scheduleReconnect();
      return;
    }
    const nextPort = new SerialPort({ path, baudRate: BAUD }, (err) => {
      if (err) {
        console.error(`Cannot open ${path}: ${err.message}`);
        scheduleReconnect();
      }
    });
    attachSerialHandlers(nextPort, path);
    lastConnectedPath = path;
    console.log('Arduino bridge connected to backend polling:', BACKEND_URL);
  } catch (err) {
    console.warn('Auto-detect failed:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await tryConnectArduino();
  }, SCAN_RETRY_MS);
}

async function main() {
  console.log('Bridge starting. Run this once and keep terminal open.');
  console.log(`Connecting bridge to: ${BACKEND_URL}`);
  sendHeartbeat();
  if (!startedPolling) {
    startedPolling = true;
    setInterval(() => pollPendingSort(), 500);
    setInterval(() => sendHeartbeat(), 5000);
  }
  await tryConnectArduino();
}

main();
