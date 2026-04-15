import { WebSocketServer, WebSocket } from "ws";

const rawPort = process.env.PORT;
const parsed = rawPort != null && rawPort !== "" ? Number(rawPort) : NaN;
const PORT = Number.isFinite(parsed) && parsed > 0 ? parsed : 3001;
const FILL_INCREMENT = 10;
const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
  console.log(`WebSocket server listening on port ${PORT} (Railway sets PORT; local default 3001)`);
});

wss.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`WebSocket server already in use on port ${PORT}`);
    process.exit(0);
  }
  console.error("WebSocket server error:", err?.message || err);
});

const binData = {
  bin_bio: {
    bin_label: "Biodegradable",
    fill_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
    last_alerted_level: 0,
  },
  bin_nonbio: {
    bin_label: "Non-Biodegradable",
    fill_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
    last_alerted_level: 0,
  },
  bin_recycle: {
    bin_label: "Recyclable",
    fill_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
    last_alerted_level: 0,
  },
  bin_unsorted: {
    bin_label: "Unsorted",
    fill_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
    last_alerted_level: 0,
  },
};

function toNearestTen(v) {
  return Math.round(v / 10) * 10;
}

function broadcast(payload) {
  const out = JSON.stringify(payload);
  // Fan-out to every connected client (all browsers + desktop); not limited to the sender.
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(out);
    }
  }
}

/** Map YOLO / desktop human-readable bin labels to ws-server bin_id keys. */
function resolveBinIdFromMessage(msg) {
  if (!msg || typeof msg !== "object") return null;
  if (typeof msg.bin_id === "string" && binData[msg.bin_id]) return msg.bin_id;
  const raw = String(msg.bin_type || msg.target_bin || msg.sort_bin || msg.bin || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("non") && (raw.includes("bio") || raw.includes("biodegrad"))) return "bin_nonbio";
  if (raw.includes("bio") || raw.includes("biodegrad") || raw === "bio") return "bin_bio";
  if (raw.includes("recycl")) return "bin_recycle";
  if (raw.includes("unsort")) return "bin_unsorted";
  return null;
}

/** Normalize incoming JSON so handleDetection always receives a valid bin_id when possible. */
function coerceDetectionMessage(msg) {
  if (!msg || typeof msg !== "object") return msg;
  const resolved = resolveBinIdFromMessage(msg);
  if (resolved) {
    return { ...msg, bin_id: resolved, type: msg.type || "detection" };
  }
  return msg;
}

function isDetectionPayload(msg) {
  if (!msg || typeof msg !== "object") return false;
  if (msg.type === "reset_bin") return false;
  if (msg.type === "detection" || msg.type === "mlDetection" || msg.type === "ml_detection") return true;
  if (!msg.type && (msg.bin_id || msg.bin_type || msg.target_bin || msg.category != null)) return true;
  return false;
}

function handleDetection(msg) {
  const id = typeof msg.bin_id === "string" && binData[msg.bin_id] ? msg.bin_id : "bin_unsorted";
  const target = binData[id];
  let alert = null;

  target.last_category = msg.category ?? null;
  target.last_confidence = msg.confidence == null ? null : Number(msg.confidence);
  target.last_detected_at = msg.timestamp || new Date().toISOString();
  target.detection_count += 1;

  if (target.fill_level < 100) {
    const updated = Math.min(100, target.fill_level + FILL_INCREMENT);
    target.fill_level = toNearestTen(updated);
  }

  if (target.fill_level >= 80 && target.last_alerted_level < 80) {
    target.last_alerted_level = 80;
    alert = { bin_id: id, bin_label: target.bin_label, fill_level: 80, type: "warning" };
  }
  if (target.fill_level >= 100 && target.last_alerted_level < 100) {
    target.last_alerted_level = 100;
    alert = { bin_id: id, bin_label: target.bin_label, fill_level: 100, type: "critical" };
  }

  return alert;
}

wss.on("connection", (ws) => {
  console.log("[WS] Browser connected");
  ws.send(JSON.stringify({ type: "init", data: binData, alert: null }));

  ws.on("error", (err) => {
    console.error("[WS] Client socket error:", err?.message || err);
  });

  ws.on("close", () => {
    console.log("[WS] Client disconnected");
  });

  ws.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      console.log("[WS-SERVER] Received message:", parsed);
      if (!parsed || typeof parsed !== "object") return;
      const msg = coerceDetectionMessage(parsed);
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "reset_bin" && msg.bin_id && binData[msg.bin_id]) {
        binData[msg.bin_id].fill_level = 0;
        binData[msg.bin_id].last_alerted_level = 0;
        console.log(`[WS-SERVER] Broadcasting fill_level: ${msg.bin_id} = ${binData[msg.bin_id].fill_level}%`);
        broadcast({ type: "update", data: binData, alert: null });
        return;
      }
      if (!isDetectionPayload(msg)) {
        console.log("[WS-SERVER] Message not recognized as detection payload:", msg);
        return;
      }

      const mappedId = typeof msg.bin_id === "string" && binData[msg.bin_id] ? msg.bin_id : "bin_unsorted";
      const before = binData[mappedId].fill_level;
      console.log(`[WS-SERVER] Processing detection: ${mappedId} -> ${msg.category ?? "Unknown"}`);
      const alert = handleDetection(msg);
      console.log(
        `[WS-SERVER] Broadcasting fill_level: ${mappedId} = ${binData[mappedId].fill_level}% (from ${before}%, detections=${binData[mappedId].detection_count})`
      );
      broadcast({ type: "update", data: binData, alert });
    } catch (_) {
      console.log("[WS-SERVER] Error processing message:", _);
    }
  });
});
