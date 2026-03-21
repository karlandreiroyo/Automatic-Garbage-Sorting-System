/**
 * Optional standalone ML WebSocket (port 3001).
 * Prefer running the backend (`backend/server.js`) — it attaches the same ML WS on the API port
 * so local + deployed frontends can use getWsUrl() from API_BASE without a second process.
 *
 * Use this only if you need WS without the full Express API on the same machine.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { startStandaloneMlRealtimePort } = require("./backend/utils/mlRealtimeWs.js");

const port = Number(process.env.ML_WS_PORT || process.env.PORT || 3001);
startStandaloneMlRealtimePort(port);
