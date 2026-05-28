// translate-cards.js
// --------------------------------------------------------------------------
// Auto-translates empty Vietnamese fields (name_vn, pet_usable_vn,
// skill_effect_vn) from their Chinese counterparts using Google Translate
// free endpoint (client=gtx).  No API key needed.
//
// Translates up to 3 fields per card in a single request by joining them
// with a unique delimiter " |#|#|#| " and splitting the result.
//
// Usage:  node translate-cards.js          # translate all missing cards
//         node translate-cards.js 10       # translate only first 10 cards
// --------------------------------------------------------------------------

const fs = require('fs');
const https = require('https');

const INPUT = './data/cards.json';
const DELAY_MS = 250;          // polite delay between requests
const DELIMITER = ' |#|#|#| ';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Translate a single string via Google Translate free endpoint.
 */
function translateOne(text, from = 'zh-CN', to = 'vi') {
  return new Promise((resolve, reject) => {
    if (!text || !text.trim()) return resolve('');

    const qs = `client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
    const url = `https://translate.googleapis.com/translate_a/single?${qs}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let result = '';
          if (Array.isArray(json[0])) {
            for (const item of json[0]) {
              if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) {
                result += item.map(sub => sub[0]).join('');
              } else if (Array.isArray(item)) {
                result += item[0];
              } else {
                result += String(item);
              }
            }
          }
          resolve(result);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message} | body: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function translateWithRetry(text, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await translateOne(text);
    } catch (err) {
      if (attempt < retries - 1) {
        console.warn(`  Retry ${attempt + 1}/${retries} after: ${err.message}`);
        await sleep(1000 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  const cards = data.cards;

  const limitArg = process.argv[2];
  const limit = limitArg ? parseInt(limitArg) : cards.length;
  const total = Math.min(cards.length, limit);

  let translated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < total; i++) {
    const card = cards[i];

    const texts = [];
    const fields = [];

    if (!card.name_vn && card.name_cn) {
      texts.push(card.name_cn);
      fields.push('name_vn');
    }
    if (!card.pet_usable_vn && card.pet_usable) {
      texts.push(card.pet_usable);
      fields.push('pet_usable_vn');
    }
    if (!card.skill_effect_vn && card.skill_effect) {
      texts.push(card.skill_effect);
      fields.push('skill_effect_vn');
    }

    if (fields.length === 0) {
      skipped++;
      continue;
    }

    // Join fields with delimiter so we can translate them in one request
    const combined = texts.join(DELIMITER);

    try {
      const result = await translateWithRetry(combined);
      const parts = result.split(DELIMITER);

      if (parts.length !== texts.length) {
        console.warn(`[${i + 1}/${total}] Split mismatch for "${card.name_cn}": expected ${texts.length} parts, got ${parts.length}`);
        // Fallback: assign whatever we got to the first missing fields
        for (let j = 0; j < Math.min(parts.length, fields.length); j++) {
          card[fields[j]] = parts[j].trim();
        }
      } else {
        fields.forEach((field, idx) => {
          card[field] = parts[idx].trim();
        });
      }

      translated++;

      if ((i + 1) % 50 === 0 || i === total - 1) {
        console.log(`[${i + 1}/${total}] ... translated so far: ${translated}`);
      }
    } catch (err) {
      errors++;
      console.error(`[${i + 1}/${total}] ERROR for ${card.name_cn}: ${err.message}`);
    }

    if (i < total - 1) {
      await sleep(DELAY_MS);
    }

    // Checkpoint every 100 cards
    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(INPUT, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`  -> Checkpoint saved (${i + 1} cards)`);
    }
  }

  // Final save
  fs.writeFileSync(INPUT, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n========================================`);
  console.log(`Done!  Total processed : ${total}`);
  console.log(`Translated this run  : ${translated}`);
  console.log(`Skipped (already VN) : ${skipped}`);
  console.log(`Errors               : ${errors}`);
  console.log(`Saved to             : ${INPUT}`);
  console.log(`========================================`);
}

main().catch(console.error);
