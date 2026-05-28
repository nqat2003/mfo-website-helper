// patch-pp.js
// --------------------------------------------------------------------------
// Patches existing data/cards.json to fill attack_point_cost from the
// "priority" field in skillcard.html (对应 "优先度").
// Preserves all existing Vietnamese translations.
//
// Usage:  node patch-pp.js
// --------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, 'skillcard.html');
const TARGET = path.join(__dirname, 'data', 'cards.json');

function extractDataJson(html) {
  const startMarker = 'const DATA = ';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`Cannot find "${startMarker}" in ${SOURCE}`);

  const jsonStart = startIdx + startMarker.length;
  const levelsIdx = html.indexOf('const LEVELS', jsonStart);
  if (levelsIdx === -1) throw new Error(`Cannot find "const LEVELS" after DATA in ${SOURCE}`);

  let endIdx = levelsIdx;
  while (endIdx > jsonStart && /[;\s]/.test(html[endIdx - 1])) {
    endIdx--;
  }

  const jsonText = html.substring(jsonStart, endIdx);
  return JSON.parse(jsonText);
}

function main() {
  console.log('Reading raw data from', SOURCE, '...');
  const html = fs.readFileSync(SOURCE, 'utf-8');
  const raw = extractDataJson(html);

  // Build lookup by Chinese name (the key in raw.cards matches name_cn)
  const rawByName = raw.cards || {};

  console.log('Reading existing cards from', TARGET, '...');
  const data = JSON.parse(fs.readFileSync(TARGET, 'utf-8'));
  const cards = data.cards;

  let fixed = 0;
  let notFound = 0;

  for (const card of cards) {
    const rawCard = rawByName[card.name_cn];
    if (!rawCard) {
      notFound++;
      continue;
    }

    const priority = parseInt(rawCard.priority || '0');
    if (card.attack_point_cost !== priority) {
      card.attack_point_cost = priority;
      fixed++;
    }
  }

  fs.writeFileSync(TARGET, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`Done!  Processed: ${cards.length}`);
  console.log(`Fixed (changed): ${fixed}`);
  console.log(`Missing in raw:    ${notFound}`);
  console.log(`Saved to: ${TARGET}`);
}

main();
