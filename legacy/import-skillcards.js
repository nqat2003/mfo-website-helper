// import-skillcards.js
// --------------------------------------------------------------------------
// Reads skillcard.html, extracts the Chinese card DATA JSON, maps each card
// to the project's card schema, and writes data/cards.json.
//
// Usage:  node import-skillcards.js
//
// Before running, you can tweak the CONFIG section below.
// --------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

// ========================= CONFIG =========================
const CONFIG = {
  // Source HTML file that holds the huge DATA variable
  sourceFile: path.join(__dirname, 'skillcard.html'),

  // Where to write the result (will backup existing file automatically)
  outputFile: path.join(__dirname, 'data', 'cards.json'),

  // If your existing cards already use low IDs (e.g. 670), shift imported
  // skillcard indices by this amount to avoid collisions.
  idOffset: 0,

  // Which level's resolved values should be used to fill [P1], [P2] …
  // in the Chinese description.  Skillcard has 0, 1, 16, 33, 36.
  resolveLevel: '1',
};
// ==========================================================

/**
 * Grab the raw JSON text that sits between:
 *   const DATA = { ... };
 *   const LEVELS = [0, 1, 16, 33, 36];
 *
 * We do NOT read the whole DOM – just a substring extraction.
 * Works with both \n and \r\n line endings.
 */
function extractDataJson(html) {
  const startMarker = 'const DATA = ';

  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`Cannot find "${startMarker}" in ${CONFIG.sourceFile}`);

  const jsonStart = startIdx + startMarker.length;

  // Find the next occurrence of "const LEVELS" after the DATA start.
  const levelsIdx = html.indexOf('const LEVELS', jsonStart);
  if (levelsIdx === -1) throw new Error(`Cannot find "const LEVELS" after DATA in ${CONFIG.sourceFile}`);

  // Walk backwards from that point to locate the ';' that terminates the DATA assignment.
  let endIdx = levelsIdx;
  while (endIdx > jsonStart && /[;\s]/.test(html[endIdx - 1])) {
    endIdx--;
  }

  const jsonText = html.substring(jsonStart, endIdx);
  return JSON.parse(jsonText);
}

/**
 * Replace [P1], [P2] … in the description with the numeric values taken from
 * the chosen level.  If a bracket still contains non-math text (e.g. a formula
 * with get_base_value), we leave the inner expression as plain text.
 */
function resolveDescription(rawDesc, levelValues) {
  const values = levelValues[CONFIG.resolveLevel]
              || levelValues['0']
              || {};

  return rawDesc.replace(/\[([^\]]+)\]/g, (_match, expr) => {
    let calc = expr;

    // Substitute P1 → 68, P2 → 5, etc.
    Object.entries(values).forEach(([k, v]) => {
      calc = calc.split(k).join(String(v));
    });

    // If it is now a pure arithmetic expression, evaluate it.
    try {
      if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(calc)) {
        return String(Math.floor(eval(calc)));
      }
    } catch (_e) { /* ignore – leave as plain text */ }

    return calc;          // e.g. leftover formula text
  });
}

/**
 * Convert one skillcard entry into the project's card object.
 */
function mapCard(key, src) {
  // ---- pet_range → plain string ----
  const petUsable = (src.pet_range || [])
    .map(item => item.text)
    .join(', ');

  // ---- side_effects: keep strings but turn numeric ones into numbers ----
  const sideEffects = {};
  if (src.side_effects && typeof src.side_effects === 'object') {
    for (const [k, v] of Object.entries(src.side_effects)) {
      const n = parseFloat(v);
      sideEffects[k] = isNaN(n) ? v : n;
    }
  }

  // ---- cost ----
  // Skillcard viewer shows  cost / 2  on the card (see statCost line).
  // Our viewer shows the raw stored value, so we pre-divide to keep the
  // same visible number.
  const rawCost = parseFloat(src.cost || '0');
  const mappedCost = rawCost > 0 ? rawCost / 2 : 0;

  // ---- cooldown ----
  // Skillcard viewer subtracts 1 for display when > 0.
  // We store the raw integer; adjust here if you prefer the displayed value.
  const rawCd = parseInt(src.cooldown || '0');
  const mappedCd = rawCd > 0 ? rawCd - 1 : 0;   // skillcard viewer subtracts 1

  return {
    id: (src.index || 0) + CONFIG.idOffset,

    // Names
    name_cn: src.name || key,
    name_vn: '',
    card_number: '',

    rarity: src.rarity || 'E',

    // Short description (auto-built from pet_range)
    description: petUsable ? `适用: ${petUsable}` : '',
    description_vn: '',

    pet_usable: petUsable,
    pet_usable_vn: '',

    // Numeric stats
    cost: mappedCost,
    sp_cost: parseInt(src.sp_cost || '0'),
    attack_point_cost: parseInt(src.priority || '0'),
    min_level: parseInt(src.min_level || '0'),
    cooldown: mappedCd,
    warmup: parseInt(src.warmup || '0'),
    refinement: 0,

    // Categorical fields (not present in skillcard – left empty)
    attack_attribute: '',
    attack_attribute_vn: '',
    attack_domain: '',
    attack_domain_vn: '',
    attack_range: '',
    attack_range_vn: '',
    cast_method: '',
    cast_method_vn: '',

    // Effects
    phantom_side_effect: 0,
    map_effect: 0,
    side_effects: sideEffects,

    // Full skill description (Chinese) – placeholders resolved
    skill_effect: resolveDescription(src.description || '', src.level_values || {}),
    skill_effect_vn: '',

    image: '',
  };
}

function main() {
  console.log('Reading', CONFIG.sourceFile, '…');
  const html = fs.readFileSync(CONFIG.sourceFile, 'utf-8');

  console.log('Extracting DATA JSON …');
  const data = extractDataJson(html);

  const cards = [];
  for (const [key, src] of Object.entries(data.cards || {})) {
    cards.push(mapCard(key, src));
  }

  // Sort by ID for deterministic output
  cards.sort((a, b) => a.id - b.id);

  console.log(`Mapped ${cards.length} cards.`);

  // Backup existing output file if present
  if (fs.existsSync(CONFIG.outputFile)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = CONFIG.outputFile + '.backup-' + stamp;
    fs.copyFileSync(CONFIG.outputFile, backup);
    console.log('Existing file backed up to:', backup);
  }

  fs.writeFileSync(CONFIG.outputFile, JSON.stringify({ cards }, null, 2), 'utf-8');
  console.log('Done!  Written to:', CONFIG.outputFile);
}

main();
