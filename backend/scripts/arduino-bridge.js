#!/usr/bin/env node
/**
 * Arduino Bridge — run this on your PC when the app is deployed (e.g. Railway).
 * Reads from the Arduino serial port (COM7) and POSTs detections to your backend.
 *
 * Usage (PowerShell):
 *   set BACKEND_URL=https://your-backend.up.railway.app
 *   set ARDUINO_PORT=COM7
 *   node backend/scripts/arduino-bridge.js
 *
 * Or with .env in backend folder:
 *   BACKEND_URL=https://... ARDUINO_PORT=COM7 node backend/scripts/arduino-bridge.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const BACKEND_URL = (process.env.BACKEND_URL || process.env.API_URL || process.env.VITE_API_URL || '').replace(/\/$/, '');
const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM7';
const BAUD = Number(process.env.ARDUINO_BAUD || 9600);

if (!BACKEND_URL) {
  console.error('Set BACKEND_URL (or API_URL) to your Railway backend, e.g. https://your-backend.up.railway.app');
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
  if (upper.includes('RECYCABLE')) return { type: 'RECYCABLE', rawLine: s };
  if (upper.includes('NON_BIO') || upper.includes('NON-BIO')) return { type: 'NON_BIO', rawLine: s };
  if (upper.includes('BIO') && !upper.includes('NON')) return { type: 'BIO', rawLine: s };
  if (upper.includes('UNSORTED')) return { type: 'UNSORTED', rawLine: s };
  const wMatch = s.match(/Weight:\s*([\d.]+)\s*g/i);
  if (wMatch) return { type: 'NORMAL', weight: parseFloat(wMatch[1]), rawLine: s };
  if (upper.startsWith('TIME:')) return null;
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

function main() {
  const port = new SerialPort(
    { path: ARDUINO_PORT, baudRate: BAUD },
    (err) => {
      if (err) {
        console.error('Cannot open', ARDUINO_PORT, err.message);
        process.exit(1);
      }
      console.log('Arduino bridge: reading from', ARDUINO_PORT, '->', BACKEND_URL);
    }
  );

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const parsed = parseLine(line);
    if (!parsed) return;
    const body = { type: parsed.type, rawLine: parsed.rawLine };
    if (parsed.weight != null) body.weight = parsed.weight;
    sendToBackend(body);
  });

  port.on('error', (err) => {
    console.error('Serial error:', err.message);
  });
}

main();
