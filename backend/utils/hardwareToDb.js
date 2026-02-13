/**
 * Hardware → Database bridge
 * Inserts waste_items when Arduino detects waste (BIO, NON_BIO, RECYCABLE, UNSORTED)
 */
const supabase = require('./supabase');

const HARDWARE_TO_CATEGORY = {
  BIO: 'Biodegradable',
  NON_BIO: 'Non Biodegradable',
  RECYCABLE: 'Recyclable',
  UNSORTED: 'Unsorted',
};

let binsCache = [];
let lastBinsFetch = 0;
const CACHE_MS = 30000; // 30s

async function getBinsForCategory(category) {
  const now = Date.now();
  if (now - lastBinsFetch > CACHE_MS || binsCache.length === 0) {
    const { data, error } = await supabase
      .from('bins')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('id', { ascending: true });
    if (!error && data?.length) {
      binsCache = data;
      lastBinsFetch = now;
    }
  }
  // Map category to bin: by name or by order (Bin 1=Bio, 2=Non-Bio, 3=Recyclable, 4=Unsorted)
  const nameMap = { Biodegradable: ['bio', 'biodegradable'], 'Non Biodegradable': ['non', 'non-bio', 'nonbio'], Recyclable: ['recycl'], Unsorted: ['unsort'] };
  const keys = nameMap[category] || [];
  for (const b of binsCache) {
    const n = String(b.name || '').toLowerCase();
    if (keys.some(k => n.includes(k))) return b.id;
  }
  const orderMap = { Biodegradable: 0, 'Non Biodegradable': 1, Recyclable: 2, Unsorted: 3 };
  const idx = orderMap[category];
  if (idx != null && binsCache[idx]) return binsCache[idx].id;
  return binsCache[0]?.id;
}

/**
 * Called when Arduino detects waste. Inserts into waste_items.
 * @param {string} hardwareType - BIO | NON_BIO | RECYCABLE | UNSORTED
 * @param {number|null} weightG - weight in grams
 */
async function handleArduinoDetection(hardwareType, weightG = null) {
  const category = HARDWARE_TO_CATEGORY[hardwareType];
  if (!category) return;

  try {
    const binId = await getBinsForCategory(category);
    if (!binId) {
      console.log('[hardwareToDb] No active bin for category:', category);
      return;
    }

    const row = {
      bin_id: binId,
      category,
      weight: weightG != null ? Number(weightG) : null,
      processing_time: null,
      created_at: new Date().toISOString(),
      first_name: '',
      middle_name: '',
      last_name: '',
    };

    const { data, error } = await supabase.from('waste_items').insert(row).select('id').single();
    if (error) {
      console.error('[hardwareToDb] waste_items insert error:', error.message);
      return;
    }
    console.log('[hardwareToDb] Inserted waste_item:', { id: data?.id, category, bin_id: binId });
  } catch (err) {
    console.error('[hardwareToDb] Error:', err.message);
  }
}

module.exports = { handleArduinoDetection, HARDWARE_TO_CATEGORY };
