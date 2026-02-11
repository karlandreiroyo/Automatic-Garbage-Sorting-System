const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(DATA_DIR, 'collection-log.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLog() {
  ensureDataDir();
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  ensureDataDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Get full collection history (newest first).
 * @returns {Array<{ id, bin_category, bin_name, collector_id, collector_name, drained_at, status }>}
 */
function getCollectionLog() {
  const entries = readLog();
  return [...entries].sort((a, b) => new Date(b.drained_at) - new Date(a.drained_at));
}

/**
 * Append one or more collection log entries (e.g. when bins are drained).
 * @param {Array<{ bin_category, bin_name, collector_id, collector_name }>} entries
 * @returns {Array<{ id, bin_category, bin_name, collector_id, collector_name, drained_at, status }>} added entries
 */
function addCollectionLogEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const existing = readLog();
  const now = new Date().toISOString();
  const ts = Date.now();
  const added = entries.map((e, i) => ({
    id: `cl-${ts}-${i}-${Math.random().toString(36).slice(2, 9)}`,
    bin_category: e.bin_category || 'Unsorted',
    bin_name: e.bin_name || e.bin_category || 'Unsorted',
    collector_id: e.collector_id ?? null,
    collector_name: e.collector_name || '',
    drained_at: now,
    status: 'Completed',
  }));
  writeLog([...existing, ...added]);
  return added;
}

module.exports = { getCollectionLog, addCollectionLogEntries, readLog };
