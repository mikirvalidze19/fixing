/* Bulk price updater — turns the CMS "Price updater" form
 * (content/price-update.json) into rewritten price cells in
 * content/products/*.json.
 *
 * How it works
 * ------------
 * The form carries: percent (number, >= 0), direction (increase/decrease),
 * allProducts (boolean) and products (list of product ids). Setting
 * percent to 0 (the neutral state) is a safe no-op.
 *
 * For every chosen product the price column is located via its `columns`
 * pick: the first column whose library entry (content/table-columns/*.json)
 * has role "price" ("pricegel" as the fallback key). Then every variant
 * row is rewritten: the numeric price cell becomes
 *     price × (1 ± percent/100)   (rounded to 2 decimals, blanks kept)
 * Cells that are empty, dashed or non-numeric are left exactly as they
 * were — same rule the site uses (src/data/catalog.ts toCell).
 *
 * Self-reset: after applying, the form is written back to its neutral
 * state (percent 0, picks cleared), so saving/resaving the same form
 * cannot apply the same change twice. The run summary is the FIRST line
 * printed, e.g. "+10% applied to 3 products (7 price cells)" — the GitHub
 * workflow uses it as the commit message.
 *
 * Run locally from the repo root:  npm run price:apply
 * (in production it runs automatically on every price-update.json push —
 * .github/workflows/price-update.yml).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FORM = 'content/price-update.json';
const PRODUCTS_DIR = 'content/products';
const COLUMNS_DIR = 'content/table-columns';

const NEUTRAL_FORM = {
  percent: 0,
  direction: 'increase',
  allProducts: false,
  products: [],
  note: '',
};

const readJson = (p) =>
  JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

/* --- Parse the form ------------------------------------------------------- */

let form;
try {
  form = readJson(path.join(ROOT, FORM));
} catch {
  console.log('No price-update form found — nothing to do.');
  process.exit(0);
}

/* The CMS number field stores a real number, but accept strings with
 * comma decimals ("2,5") for safety. */
const percent = Number(
  String(form.percent ?? 0).replace(',', '.'),
);
if (!Number.isFinite(percent) || percent <= 0) {
  console.log('percent is 0 or unset — nothing to do (form left untouched).');
  process.exit(0);
}
if (percent < 0 || percent > 90) {
  console.error(`percent ${percent} is outside 0–90 — refusing to run.`);
  process.exit(1);
}

const direction = form.direction === 'decrease' ? 'decrease' : 'increase';
const factor = direction === 'decrease' ? 1 - percent / 100 : 1 + percent / 100;
const sign = direction === 'decrease' ? '-' : '+';

/* --- Which products -------------------------------------------------------- */

const allProductIds = fs
  .readdirSync(path.join(ROOT, PRODUCTS_DIR))
  .filter((name) => name.endsWith('.json'))
  .map((name) => path.basename(name, '.json'));

/* Reference fields store plain strings (value "{id}"), but tolerate
 * objects carrying an id just in case. */
const picked = (form.products ?? [])
  .map((item) => (typeof item === 'string' ? item : item?.id))
  .filter(Boolean);

const all = form.allProducts === true;
const targets = all ? [...allProductIds] : [...new Set(picked)];

const missing = targets.filter((id) => !allProductIds.includes(id));
for (const id of missing) {
  console.warn(`warning: product "${id}" not found — skipped.`);
}
const ids = targets.filter((id) => allProductIds.includes(id));

if (ids.length === 0) {
  console.log('No products selected — nothing to do (form left untouched).');
  process.exit(0);
}

/* --- Price column lookup ----------------------------------------------------- */

/* Keys whose table-columns library entry has role "price". */
const priceKeys = new Set();
try {
  for (const name of fs.readdirSync(path.join(ROOT, COLUMNS_DIR))) {
    if (!name.endsWith('.json')) continue;
    const def = readJson(path.join(ROOT, COLUMNS_DIR, name));
    if (def?.role === 'price' && def.key) priceKeys.add(def.key);
  }
} catch {
  /* library missing — fall through to the standard key */
}
priceKeys.add('pricegel'); // the standard price column key

/* --- Apply ------------------------------------------------------------------- */

const fmt = (value) => {
  /* Round to 2 decimals; toString drops trailing zeros (27.50 → 27.5). */
  return String(Math.round(value * 100) / 100);
};

/* Plain / en / em dash cells count as blank — same rule as the site. */
const BLANK_DASH = /^[-–—]+$/;

const isNumeric = (trimmed) => /^[-–—+]?\d+([.,]\d+)?$/.test(trimmed);

let productCount = 0;
let cellCount = 0;

for (const id of ids) {
  const file = path.join(ROOT, PRODUCTS_DIR, `${id}.json`);
  const product = readJson(file);
  const columns = Array.isArray(product.columns) ? product.columns : [];

  const priceIndex = columns.findIndex((key) => priceKeys.has(key));
  if (priceIndex === -1) {
    console.warn(`warning: ${id}: no price column in its table — skipped.`);
    continue;
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const applied = [];
  const skipped = [];

  for (const row of variants) {
    const raw = typeof row?.values === 'string' ? row.values : null;
    if (raw === null) continue; // no table row content — leave as is
    const cells = raw.split('\n');
    const current = (cells[priceIndex] ?? '').trim();
    if (!current || BLANK_DASH.test(current) || !isNumeric(current)) {
      if (current) skipped.push(current);
      continue; // blank / dashed / text cell — not a price
    }
    const value = Number(current.replace(',', '.'));
    const next = fmt(Math.max(0.01, Math.round(value * factor * 100) / 100));
    if (next === current) continue; // unchanged after rounding
    cells[priceIndex] = next;
    row.values = cells.join('\n');
    applied.push(`${current} → ${next}`);
  }

  if (applied.length === 0) {
    console.warn(
      `warning: ${id}: no numeric price cells changed` +
        (skipped.length ? ` (${skipped.length} non-numeric cell(s) left as is)` : '') +
        '.',
    );
    continue;
  }

  fs.writeFileSync(file, `${JSON.stringify(product, null, 2)}\n`);
  productCount += 1;
  cellCount += applied.length;
  console.log(`${id}: ${applied.length} price cell(s) — ${applied.join(', ')}`);
}

/* --- Self-reset the form ------------------------------------------------------ */

const reset = { ...NEUTRAL_FORM, ...(form.note ? { note: form.note } : {}) };
const resetJson = `${JSON.stringify(reset, null, 2)}\n`;
if (resetJson !== `${JSON.stringify(form, null, 2)}\n`) {
  fs.writeFileSync(path.join(ROOT, FORM), resetJson);
}

/* --- Summary (first line = commit message) ------------------------------------- */

if (cellCount === 0) {
  console.log(`${sign}${percent}% — no numeric price cells found to update.`);
  process.exit(0);
}
console.log(
  `${sign}${percent}% applied to ${productCount} product(s) (${cellCount} price cell(s)).`,
);
