import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import WebSocket from "ws";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env.bridge") });

const BACKEND_URL = String(process.env.BACKEND_URL || "").trim().replace(/\/+$/, "");
const ARDUINO_PORT = String(process.env.ARDUINO_PORT || "").trim();
const ARDUINO_BAUD = Number(process.env.ARDUINO_BAUD || 9600);
const WS_RECONNECT_MS = 3000;
const POLL_URL = `${BACKEND_URL}/api/hardware/pending-sort`;

if (!BACKEND_URL || !ARDUINO_PORT || !ARDUINO_BAUD) {
  console.error("❌ Missing required bridge config in .env.bridge");
  console.error("   Required: BACKEND_URL, ARDUINO_PORT, ARDUINO_BAUD");
  process.exit(1);
}
if (BACKEND_URL.includes("ws-server")) {
  console.error("❌ BACKEND_URL points to ws-server. Use your backend API Railway URL instead.");
  console.error("   Example: https://brave-adaptation-production.up.railway.app");
  process.exit(1);
}

const wsUrl = BACKEND_URL.replace(/^http/i, "ws") + "/bridge";
let ws = null;
let wsReconnectTimer = null;
let isWsOpen = false;

let serial = null;
let parser = null;
let pollTimer = null;

function connectSerial() {
  console.log(`🔌 Opening Arduino serial on ${ARDUINO_PORT} @ ${ARDUINO_BAUD}...`);
  serial = new SerialPort({ path: ARDUINO_PORT, baudRate: ARDUINO_BAUD }, (err) => {
    if (err) {
      console.error(`❌ Serial open error: ${err.message}`);
    }
  });
  console.log('[BRIDGE] serial port open:', Boolean(serial?.isOpen));

  parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

  serial.on("open", () => {
    console.log(`✅ Arduino serial connected (${ARDUINO_PORT})`);
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        void pollPendingSort();
      }, 1000);
    }
  });

  serial.on("close", () => {
    console.warn("⚠️ Arduino serial disconnected");
  });

  serial.on("error", (err) => {
    console.error(`❌ Serial error: ${err.message}`);
  });

  parser.on("data", (line) => {
    const data = String(line).trim();
    if (!data) return;
    console.log(`📤 Arduino -> Bridge: ${data}`);
    if (ws && isWsOpen) {
      ws.send(JSON.stringify({ source: "arduino", data }));
    }
  });
}

async function pollPendingSort() {
  try {
    console.log('[BRIDGE-POLL] checking for commands...');
    const res = await fetch(POLL_URL);
    const text = await res.text();
    console.log('[BRIDGE-POLL] response status:', res.status, 'body:', text);
    if (!res.ok) return;
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    const command = String(data?.command || '').trim();
    if (!command) return;
    if (!serial || !serial.isOpen) {
      console.warn(`⚠️ Bridge poll got command but serial is not open: ${command}`);
      return;
    }
    const line = `${command}\n`;
    console.log('[BRIDGE] writing to serial:', command);
    serial.write(line, (err) => {
      if (err) console.error(`❌ Serial write error (poll): ${err.message}`);
      else console.log(`✅ Serial write success (poll): ${JSON.stringify(line)}`);
    });
  } catch (err) {
    console.warn('[BRIDGE-POLL] error:', err?.message || err);
  }
}

function scheduleWsReconnect() {
  if (wsReconnectTimer) return;
  wsReconnectTimer = setTimeout(() => {
    wsReconnectTimer = null;
    connectWebSocket();
  }, WS_RECONNECT_MS);
}

function connectWebSocket() {
  console.log(`🌐 Connecting bridge to: ${wsUrl}`);
  ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    isWsOpen = true;
    console.log("✅ Bridge connected to Railway WebSocket");
  });

  ws.on("message", (raw) => {
    try {
      console.log(`📨 Bridge received WS message: ${String(raw)}`);
      const msg = JSON.parse(String(raw));
      if (msg?.target === "arduino") {
        const command = String(msg.data || "").trim();
        if (!command) return;
        if (!serial || !serial.isOpen) {
          console.warn(`⚠️ Bridge received command but serial is not open: ${command}`);
          return;
        }
        const line = `${command}\n`;
        console.log(`📥 Bridge -> Arduino: ${command}`);
        console.log('[BRIDGE] writing to serial:', command);
        serial.write(line, (err) => {
          if (err) console.error(`❌ Serial write error: ${err.message}`);
          else console.log(`✅ Serial write success: ${JSON.stringify(line)}`);
        });
      }
    } catch (err) {
      console.error(`❌ WS message parse error: ${err.message}`);
    }
  });

  ws.on("error", (err) => {
    console.error(`❌ WebSocket error: ${err.message}`);
  });

  ws.on("close", () => {
    isWsOpen = false;
    console.warn("⚠️ WebSocket disconnected. Reconnecting...");
    scheduleWsReconnect();
  });
}

console.log("🚀 Starting local Arduino bridge");
console.log('[BRIDGE] polling URL:', POLL_URL);
connectSerial();
connectWebSocket();
