/**
 * Raspberry Pi – small app to send sensor data to the backend (real time).
 * Uses API_URL (your Node.js backend). Backend writes to Supabase.
 *
 * On the Pi:
 *   1. Copy this folder to the Pi (e.g. /home/admin/raspberry).
 *   2. Create .env with:  API_URL=http://YOUR_PC_IP:3001
 *   3. Run:  npm start   (sends data every 10 seconds)
 *   Or:     node raspberry.js --once   (send one reading and exit)
 *
 * Replace the simulated reading below with real sensor/GPIO/camera logic.
 */

require('dotenv').config();

const API_URL = (process.env.API_URL || 'https://automatic-garbage-sorting-system-production.up.railway.app').replace(/\/$/, '');
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '10000', 10) || 10000; // 10 seconds
const DEVICE_ID = process.env.DEVICE_ID || 'raspberry-pi-1';

const CATEGORIES = ['Biodegradable', 'Non-Biodegradable', 'Recycle', 'Unsorted'];

function getSimulatedReading() {
  return {
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    processing_time: Math.round(1 + Math.random() * 5),
    device_id: DEVICE_ID,
    // bin_id: optional – use a real bin UUID from your Supabase bins table if you have one
  };
}

async function sendReading(body) {
  const url = `${API_URL}/api/device/sensor`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log('[OK]', new Date().toISOString(), body.category, '→', data.id || 'saved');
      return true;
    }
    console.error('[FAIL]', res.status, data.message || data.error || res.statusText);
    return false;
  } catch (err) {
    console.error('[ERROR]', err.message);
    return false;
  }
}

async function runOnce() {
  const reading = getSimulatedReading();
  await sendReading(reading);
}

async function runLoop() {
  console.log('Raspberry Pi sensor client');
  console.log('API_URL:', API_URL);
  console.log('Sending every', INTERVAL_MS / 1000, 'seconds. Ctrl+C to stop.\n');

  for (;;) {
    await runOnce();
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

const isOnce = process.argv.includes('--once');
if (isOnce) {
  runOnce().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
} else {
  runLoop().catch((e) => { console.error(e); process.exit(1); });
}
