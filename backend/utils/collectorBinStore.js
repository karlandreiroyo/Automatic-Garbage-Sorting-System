/**
 * Store for collector bin state (fill levels). Kept in memory and persisted to DB
 * so it survives refresh, logout, tab close, and backend restart.
 */
const supabase = require('./supabase');

let binsState = null;
let loadPromise = null;

function setBinsState(bins) {
  binsState = Array.isArray(bins) ? bins.map((b) => ({ ...b })) : null;
}

function getBinsState() {
  return binsState ? binsState.map((b) => ({ ...b })) : null;
}

/**
 * Load state from DB into memory. Safe to call multiple times; only loads once until state is cleared.
 * @returns {Promise<void>}
 */
async function loadFromDb() {
  if (binsState !== null) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('agss_bin_state')
        .select('bins')
        .eq('id', 1)
        .maybeSingle();
      if (!error && data?.bins && Array.isArray(data.bins) && data.bins.length > 0) {
        binsState = data.bins.map((b) => ({ ...b }));
      }
    } catch (e) {
      // Table may not exist or Supabase not configured; keep in-memory only
    }
  })();
  return loadPromise;
}

/**
 * Persist current in-memory state to DB.
 * @returns {Promise<void>}
 */
async function saveToDb() {
  const state = getBinsState();
  if (!state) return;
  try {
    await supabase
      .from('agss_bin_state')
      .upsert(
        { id: 1, bins: state, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
  } catch (e) {
    // Table may not exist or Supabase not configured
  }
}

module.exports = { getBinsState, setBinsState, loadFromDb, saveToDb };
