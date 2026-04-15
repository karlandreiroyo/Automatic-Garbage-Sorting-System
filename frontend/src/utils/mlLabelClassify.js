/**
 * Map raw ML / YOLO class names (e.g. "HAIR CLIP", "plastic_bottle") to backend
 * /api/hardware/sort values: Recycle | Non-Bio | Biodegradable | Unsorted
 *
 * Keep in sync with backend/utils/mlLabelClassify.js
 */

const VALID = ['Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted'];

/** @param {string} raw */
export function classifyMlLabelToWasteType(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return 'Unsorted';

  const upper = s.toUpperCase();
  const spaced = s.toLowerCase().replace(/\s+/g, ' ').trim();
  const compact = s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // --- Biodegradable first (avoid "apple" device etc.; use food/organic cues) ---
  const bioPhrases = [
    'FOOD WASTE',
    'FOOD SCRAPS',
    'ORGANIC',
    'COMPOST',
    'BANANA PEEL',
    'FRUIT PEEL',
    'VEGETABLE PEEL',
    'LEAVES',
    'GRASS',
    'EGG SHELL',
    'COFFEE GROUND',
    'TEA BAG',
    'RICE',
    'BREAD',
    'MEAT',
    'FISH BONE',
    'CHICKEN BONE',
    'NAPKIN',
    'TISSUE PAPER',
    'PAPER TOWEL',
    'WOOD STICK',
    'TOOTH',
  ];
  const bioWords = [
    'food',
    'fruit',
    'vegetable',
    'banana',
    'apple',
    'orange',
    'mango',
    'leaf',
    'leaves',
    'grass',
    'compost',
    'organic',
    'eggshell',
    'eggshells',
    'bread',
    'rice',
    'meat',
    'bone',
    'peel',
    'stale',
    'rotten',
  ];
  if (bioPhrases.some((p) => upper.includes(p))) return 'Biodegradable';
  if (bioWords.some((w) => spaced.includes(w) || compact.includes(w.replace(/\s/g, '')))) {
    if (!upper.includes('PLASTIC') && !upper.includes('METAL') && !upper.includes('BATTERY')) {
      return 'Biodegradable';
    }
  }

  // --- Recyclables (bottles, metals, paper, clean cardboard) ---
  const recyclePhrases = [
    'PLASTIC BOTTLE',
    'WATER BOTTLE',
    'PET BOTTLE',
    'SODA CAN',
    'METAL CAN',
    'ALUMINUM CAN',
    'TIN CAN',
    'GLASS BOTTLE',
    'GLASS JAR',
    'BEER BOTTLE',
    'WINE BOTTLE',
    'PAPER CUP',
    'CARDBOARD BOX',
    'NEWSPAPER',
    'MAGAZINE',
    'OFFICE PAPER',
    'ALUMINUM FOIL',
    'STEEL',
    'TETRA PAK',
    'CARTON',
    'BOTTLE CAP',
    'CAN TAB',
  ];
  const recycleTokens = [
    'plasticbottle',
    'waterbottle',
    'bottle',
    'petbottle',
    'glass',
    'metalcan',
    'aluminum',
    'steelcan',
    'tin',
    'paper',
    'cardboard',
    'newspaper',
    'magazine',
    'carton',
    'tetra',
    'recycl',
    'can',
  ];
  if (recyclePhrases.some((p) => upper.includes(p))) return 'Recycle';
  if (recycleTokens.some((t) => compact.includes(t))) {
    if (compact.includes('plasticbag') || upper.includes('PLASTIC BAG')) return 'Recycle';
    if (compact.includes('plastic') && (compact.includes('bottle') || compact.includes('cup') || compact.includes('container'))) {
      return 'Recycle';
    }
    if (compact.includes('bottle') || compact.includes('glass') || compact.includes('metal') || compact.includes('paper')) {
      return 'Recycle';
    }
  }

  // --- Non-biodegradable / residual ---
  const nonBioPhrases = [
    'HAIR CLIP',
    'HAIRCLIP',
    'HAIR PIN',
    'BOBBY PIN',
    'DIAPER',
    'STYROFOAM',
    'POLYSTYRENE',
    'FOAM CUP',
    'RUBBER',
    'SILICONE',
    'LEATHER',
    'CERAMIC',
    'PORCELAIN',
    'CIGARETTE',
    'TOOTHBRUSH',
    'CD',
    'DVD',
    'BATTERY',
    'PLASTIC TOY',
    'PLASTIC FORK',
    'PLASTIC SPOON',
    'PLASTIC STRAW',
    'DISPOSABLE',
    'SYNTHETIC',
    'TAPE',
    'GLUE STICK',
    'FABRIC SCRAP',
    'NYLON',
    'PVC',
  ];
  const nonBioTokens = ['hairclip', 'diaper', 'styrofoam', 'straw', 'toothbrush', 'battery', 'cd', 'dvd', 'foam'];
  if (nonBioPhrases.some((p) => upper.includes(p))) return 'Non-Bio';
  if (nonBioTokens.some((t) => compact.includes(t))) return 'Non-Bio';
  if (upper.includes('PLASTIC') && !upper.includes('BOTTLE') && !upper.includes('CUP') && !upper.includes('CONTAINER')) {
    return 'Non-Bio';
  }

  // --- Legacy / generic labels from older maps ---
  const legacy = {
    recycle: 'Recycle',
    recyclable: 'Recycle',
    'recyclable waste': 'Recycle',
    recyclables: 'Recycle',
    'non-bio': 'Non-Bio',
    nonbio: 'Non-Bio',
    'non biodegradable': 'Non-Bio',
    'non-biodegradable': 'Non-Bio',
    'non biodegradable waste': 'Non-Bio',
    biodegradable: 'Biodegradable',
    'biodegradable waste': 'Biodegradable',
    bio: 'Biodegradable',
    unsorted: 'Unsorted',
    unknown: 'Unsorted',
    other: 'Unsorted',
  };
  const fromLegacy = legacy[spaced] || legacy[compact];
  if (fromLegacy && VALID.includes(fromLegacy)) return fromLegacy;

  return 'Unsorted';
}
