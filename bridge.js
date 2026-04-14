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

if (!BACKEND_URL || !ARDUINO_PORT || !ARDUINO_BAUD) {
  console.error("❌ Missing required bridge config in .env.bridge");
  console.error("   Required: BACKEND_URL, ARDUINO_PORT, ARDUINO_BAUD");
  process.exit(1);
}

const wsUrl = BACKEND_URL.replace(/^http/i, "ws") + "/bridge";
let ws = null;
let wsReconnectTimer = null;
let isWsOpen = false;

let serial = null;
let parser = null;

function connectSerial() {
  console.log(`🔌 Opening Arduino serial on ${ARDUINO_PORT} @ ${ARDUINO_BAUD}...`);
  serial = new SerialPort({ path: ARDUINO_PORT, baudRate: ARDUINO_BAUD }, (err) => {
    if (err) {
      console.error(`❌ Serial open error: ${err.message}`);
    }
  });

  parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

  serial.on("open", () => {
    console.log(`✅ Arduino serial connected (${ARDUINO_PORT})`);
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
        serial.write(line, (err) => {
          if (err) console.error(`❌ Serial write error: ${err.message}`);
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
connectSerial();
connectWebSocket();
