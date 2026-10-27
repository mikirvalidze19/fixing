/* One-time migrations for the generic variant-table architecture
 * (docs/TABLE-ARCHITECTURE.md):
 *
 *   1. content/headers/*.json  → content/table-columns/*.json
 *      Each column stops being a mirror of a fixed Variant field: the
 *      `slot` field is dropped and replaced by a display `type`
 *      (text/number) and an optional feature `role` (sku/price/diameter/
 *      length). Existing table-columns files are never overwritten.
 *
 *   2. content/products/*.json → the current table shape:
 *      `columns: [key, …]` + per-variant `values` — a single multiline
 *      string with ONE line per picked column. A blank printed cell is an
 *      empty (or dash-only) line; missing trailing lines count as blank.
 *      WHY text-not-list: Pages CMS strips null/"" items out of every
 *      ARRAY on load and save (lib/schema.ts sanitizeObject), which
 *      misaligned rows — multiline strings survive the round trip.
 *
 * Handles every historical shape, idempotently (run again → no changes):
 *   a) named-field rows (sku/diameterMm/…) + `variantColumns` → columns+values
 *   b) positional `cells` arrays → `values` text (dash → empty line)
 *   c) `values` rows stay as-is; an absent `columns` pick is added.
 *
 * Run from the repo root:  node scripts/migrate-table-columns.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HEADERS_DIR = 'content/headers';
const COLUMNS_DIR = 'content/table-columns';
const PRODUCTS_DIR = 'content/products';

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const writeJson = (p, data) => {
  const file = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

/* Legacy slot ↔ standard column-key map (the old hard-coded field names).
 * Only used to translate legacy data into the new shape. */
const LEGACY = [
  ['sku', 'sku', 'text', 'sku'],
  ['diametermm', 'diameterMm', 'number', 'diameter'],
  ['lengthmm', 'lengthMm', 'number', 'length'],
  ['unitsperbox', 'unitsPerBox', 'number', null],
  ['pricegel', 'priceGel', 'number', 'price'],
  ['note', 'note', 'text', null],
];
const STANDARD_KEYS = LEGACY.map(([key]) => key);
const slotOfKey = new Map(LEGACY.map(([key, slot]) => [key, slot]));
const SLOT_TYPE = new Map(LEGACY.map(([, slot, type]) => [slot, type]));
const SLOT_ROLE = new Map(LEGACY.map(([, slot, , role]) => [slot, role]));

/* --- 0. Blank-cell conventions ------------------------------------------- */

/* Blank anywhere in any shape: empty, whitespace-only or a dash-only
 * string (the dash was an earlier storage convention, still tolerated on
 * read — see scripts history; the CMS cannot round-trip empty array
 * items, which is why blank values live in multiline text now). */
const DASH = /^[-–—]*$/;
const isBlank = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && (value.trim() === '' || DASH.test(value.trim())));

/* One positional row → the `values` text: one line per column, empty line
 * = blank cell. Trailing blanks are inferable (the app pads short rows to
 * the column count), so they are trimmed off. */
function rowValues(cells) {
  const lines = (cells ?? []).map((value) => (isBlank(value) ? '' : String(value)));
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

/* --- 1. Column library -------------------------------------------------- */

/* Read the old headers library. Returns defs keyed by header key plus a
 * slot → key map for translating legacy product rows. */
function readHeaderDefs() {
  if (!fs.existsSync(path.join(ROOT, HEADERS_DIR))) return new Map();
  const defs = new Map();
  for (const name of fs.readdirSync(path.join(ROOT, HEADERS_DIR))) {
    if (!name.endsWith('.json')) continue;
    const def = readJson(`${HEADERS_DIR}/${name}`);
    if (!def?.key) continue;
    defs.set(def.key, { ...def, slot: def.slot ?? slotOfKey.get(def.key) ?? def.key });
  }
  return defs;
}

function ensureColumnFiles(headerDefs) {
  let seeded = 0;
  fs.mkdirSync(path.join(ROOT, COLUMNS_DIR), { recursive: true });

  for (const [key, def] of headerDefs) {
    const file = `${COLUMNS_DIR}/${key}.json`;
    if (fs.existsSync(path.join(ROOT, file))) continue; // keep editor edits
    const type = def.type ?? SLOT_TYPE.get(def.slot) ?? 'text';
    const role = def.role ?? SLOT_ROLE.get(def.slot) ?? null;
    writeJson(file, { key, label: def.label ?? key, labelKa: def.labelKa ?? null, type, role });
    seeded += 1;
  }

  /* Self-healing: the standard set always exists, even on a fresh checkout
   * without the headers library. */
  for (const [key, , type, role] of LEGACY) {
    const file = `${COLUMNS_DIR}/${key}.json`;
    if (fs.existsSync(path.join(ROOT, file))) continue;
    writeJson(file, { key, label: key, labelKa: null, type, role });
    seeded += 1;
  }
  return seeded;
}

/* --- 2. Products --------------------------------------------------------- */

function columnKeysFor(raw, headerDefs, warnings, id) {
  const entries = raw.variantColumns ?? null;
  const keys = [];
  const push = (key) => {
    if (typeof key === 'string' && key && !keys.includes(key)) keys.push(key);
  };
  if (entries?.length) {
    for (const entry of entries) {
      if (typeof entry === 'string') push(entry);
      else if (entry && typeof entry === 'object' && entry.key) {
        push(entry.key);
        /* Inline column objects: persist their text as library files. */
        if (!headerDefs.has(entry.key) && entry.label) {
          headerDefs.set(entry.key, { key: entry.key, label: entry.label, labelKa: entry.labelKa ?? null, slot: entry.slot ?? entry.key });
        }
      }
    }
  }
  for (const key of keys) {
    if (!headerDefs.has(key)) {
      warnings.push(`Product ${id}: column "${key}" not found in the headers library — column skipped`);
    }
  }
  const known = keys.filter((key) => headerDefs.has(key));
  if (entries?.length && known.length === 0) {
    warnings.push(`Product ${id}: variantColumns unusable — falling back to the standard six`);
    return [...STANDARD_KEYS];
  }
  /* The migration needs every column to map to a legacy slot; keys outside
   * the standard set never exist in legacy files, so only standard-set keys
   * can carry values here. Non-standard keys (if an editor has once picked a
   * custom column) would come out null — keep them but warn. */
  const usable = known.filter(
    (key) => LEGACY.some(([legacyKey]) => legacyKey === key) || slotOfKey.has(key),
  );
  for (const key of known) {
    if (!usable.includes(key)) {
      warnings.push(`Product ${id}: legacy columns cannot be converted for "${key}" (no slot) — column kept, values empty`);
    }
  }
  return known.length > 0 ? known : [...STANDARD_KEYS];
}

/* Shape (a) — legacy named-field rows → columns + `values` text. */
function migrateProduct(raw, headerDefs, warnings) {
  const variants = raw.variants ?? [];
  const id = raw.id ?? '(no id)';
  const keys = columnKeysFor(raw, headerDefs, warnings, id);

  const rows = variants.map((variant) =>
    keys.map((key) => {
      const slot = headerDefs.get(key)?.slot ?? slotOfKey.get(key) ?? key;
      const value = variant[slot];
      return value === undefined ? null : value;
    }),
  );

  const out = { ...raw };
  delete out.variantColumns;
  out.columns = keys;
  out.variants = rows.map((cells) => ({ values: rowValues(cells) }));
  return { out };
}

/* Shape (b) — positional `cells` arrays → `values` text. */
function valuesProduct(raw) {
  let changed = false;
  const variants = (raw.variants ?? []).map((variant) => {
    if (!Array.isArray(variant.cells)) return variant;
    const out = { ...variant };
    delete out.cells;
    out.values = rowValues(variant.cells);
    changed = true;
    return out;
  });
  if (!changed) return null;
  return { out: { ...raw, variants } };
}

/* --- Run ----------------------------------------------------------------- */

const warnings = [];
const headerDefs = readHeaderDefs();
const seededColumns = ensureColumnFiles(headerDefs);

let converted = 0; // shape (a): legacy named fields
let reshaped = 0; // shape (b) → values, or an explicit columns pick added
let unchanged = 0;

if (fs.existsSync(path.join(ROOT, PRODUCTS_DIR))) {
  for (const name of fs.readdirSync(path.join(ROOT, PRODUCTS_DIR))) {
    if (!name.endsWith('.json')) continue;
    const file = `${PRODUCTS_DIR}/${name}`;
    const raw = readJson(file);
    const variants = raw.variants ?? [];
    const hasNamedRows = variants.length > 0 && !variants.every(
      (v) => Array.isArray(v.cells) || typeof v.values === 'string',
    );
    const hasCellsRows = variants.some((v) => Array.isArray(v.cells));

    let result = null;
    if (hasNamedRows) {
      /* Mixed named/cells files are not expected — cells rows would be
       * dropped here; migrate them with a dedicated run if that ever
       * shows up in the data. */
      result = migrateProduct(raw, headerDefs, warnings);
      converted += 1;
    } else if (!Array.isArray(raw.columns)) {
      /* Make the column pick explicit: the standard six for legacy-with-
       * variants files, none for products without a table. */
      result = {
        out: { ...raw, columns: variants.length > 0 ? [...STANDARD_KEYS] : [] },
      };
      reshaped += 1;
    } else if (hasCellsRows) {
      result = valuesProduct(raw);
      reshaped += 1;
    }

    if (!result) { unchanged += 1; continue; }
    writeJson(file, result.out);
  }
}

console.log(`Columns library seeded/kept: ${seededColumns} new → ${COLUMNS_DIR}/`);
console.log(`Products: ${converted} legacy converted, ${reshaped} reshaped to values text, ${unchanged} unchanged`);
for (const w of warnings) console.warn(`WARNING: ${w}`);
