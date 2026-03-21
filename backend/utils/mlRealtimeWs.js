/**
 * ML → Bin Monitoring realtime (same protocol as root ws-server.js).
 * Attach to the HTTP server so production uses wss:// on the same host as the API.
 */
const { WebSocketServer, WebSocket } = require('ws');

const FILL_INCREMENT = 10;

const state = {
  bin_1: {
    bin_id: 'bin_1',
    bin_label: 'Biodegradable',
    fill_level: 0,
    status: 'NORMAL',
    is_full: false,
    last_alerted_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
  },
  bin_2: {
    bin_id: 'bin_2',
    bin_label: 'Recyclable',
    fill_level: 0,
    status: 'NORMAL',
    is_full: false,
    last_alerted_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
  },
  bin_3: {
    bin_id: 'bin_3',
    bin_label: 'Non Biodegradable',
    fill_level: 0,
    status: 'NORMAL',
    is_full: false,
    last_alerted_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
  },
  bin_4: {
    bin_id: 'bin_4',
    bin_label: 'Unsorted',
    fill_level: 0,
    status: 'NORMAL',
    is_full: false,
    last_alerted_level: 0,
    detection_count: 0,
    last_category: null,
    last_confidence: null,
    last_detected_at: null,
  },
};

function snapshot() {
  return {
    bin_1: { ...state.bin_1 },
    bin_2: { ...state.bin_2 },
    bin_3: { ...state.bin_3 },
    bin_4: { ...state.bin_4 },
  };
}

/** @type {import('ws').WebSocketServer | null} */
let wssRef = null;

function broadcast(payload) {
  if (!wssRef) return;
  const message = JSON.stringify(payload);
  for (const client of wssRef.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function applyDetection(msg) {
  const key = typeof msg.bin_key === 'string' && state[msg.bin_key] ? msg.bin_key : 'bin_4';
  const target = state[key];
  const previousFill = Number(target.fill_level) || 0;
  let alert = null;

  target.detection_count += 1;
  target.last_category = msg.category ?? null;
  target.last_confidence = msg.confidence == null ? null : Number(msg.confidence);
  target.last_detected_at = msg.detected_at || new Date().toISOString();

  if (!target.is_full && previousFill < 100) {
    const nextFill = Math.min(100, previousFill + FILL_INCREMENT);
    target.fill_level = nextFill;

    if (nextFill >= 100) {
      target.is_full = true;
      target.status = 'FULL';
      if (target.last_alerted_level < 100) {
        target.last_alerted_level = 100;
        alert = {
          bin_id: target.bin_id,
          bin_label: target.bin_label,
          fill_level: 100,
          type: 'critical',
        };
      }
    } else if (previousFill < 80 && nextFill >= 80 && target.last_alerted_level < 80) {
      target.last_alerted_level = 80;
      alert = {
        bin_id: target.bin_id,
        bin_label: target.bin_label,
        fill_level: nextFill,
        type: 'warning',
      };
    }
  }

  return alert;
}

/**
 * @param {import('http').Server} httpServer
 * @returns {import('ws').WebSocketServer}
 */
function attachMlRealtimeWebSocket(httpServer) {
  wssRef = new WebSocketServer({ server: httpServer });

  wssRef.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'init', data: snapshot(), alert: null }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg || typeof msg !== 'object') return;
        if (!msg.bin_key || msg.source !== 'python-ml') return;
        const alert = applyDetection(msg);
        broadcast({ type: 'update', data: snapshot(), alert });
      } catch (_) {
        // ignore
      }
    });
  });

  return wssRef;
}

/**
 * Optional: standalone process (same as repo root ws-server.js) when backend is not running.
 * @param {number} port
 */
function startStandaloneMlRealtimePort(port = 3001) {
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(404);
    res.end();
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`ML WebSocket: port ${port} already in use (backend may already include ML WS).`);
      process.exit(0);
    }
    console.error('ML WebSocket server error:', err?.message || err);
  });

  attachMlRealtimeWebSocket(server);
  server.listen(port, '0.0.0.0', () => {
    console.log(`ML realtime WebSocket listening on port ${port} (standalone)`);
  });
}

module.exports = {
  attachMlRealtimeWebSocket,
  startStandaloneMlRealtimePort,
};
