const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BINS_FILE = path.join(DATA_DIR, 'collector-bins.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readBinsFromFile() {
  ensureDataDir();
  if (!fs.existsSync(BINS_FILE)) return null;
  try {
    const raw = fs.readFileSync(BINS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map((b) => ({ ...b })) : null;
  } catch {
    return null;
  }
}

function writeBinsToFile(bins) {
  if (!Array.isArray(bins)) return;
  ensureDataDir();
  try {
    fs.writeFileSync(BINS_FILE, JSON.stringify(bins, null, 2), 'utf8');
  } catch (err) {
    console.error('collectorBinStore: failed to write', err.message);
  }
}

let binsState = readBinsFromFile();

function setBinsState(bins) {
  binsState = Array.isArray(bins) ? bins.map((b) => ({ ...b })) : null;
  if (binsState) writeBinsToFile(binsState);
}

function getBinsState() {
  return binsState ? binsState.map((b) => ({ ...b })) : null;
}

module.exports = { setBinsState, getBinsState };
