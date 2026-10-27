/* Seeds the shared "Table headers" library (content/headers/) with the
 * standard columns, using the site's own locale strings. Write-if-missing:
 * headers added/edited later by editors are never overwritten.
 *
 * Run from the repo root:  node scripts/seed-table-headers.mjs */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const writeJson = (p, data) => {
  const file = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const en = readJson('src/locales/en.json');
const ka = readJson('src/locales/ka.json');

const standard = [
  ['sku', 'Sku'],
  ['diameterMm', 'Diameter'],
  ['lengthMm', 'Length'],
  ['unitsPerBox', 'Units'],
  ['priceGel', 'Price'],
  ['note', 'Note'],
];

let seeded = 0;
for (const [slot, suffix] of standard) {
  const file = `content/headers/${slug(slot)}.json`;
  if (fs.existsSync(path.join(ROOT, file))) continue; // keep editor edits
  writeJson(file, {
    key: slug(slot),
    label: en.productPage?.[`col${suffix}`] ?? '',
    labelKa: ka.productPage?.[`col${suffix}`] ?? null,
    slot,
  });
  seeded += 1;
}
console.log(`Table headers seeded: ${seeded} new → content/headers/`);
