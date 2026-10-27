/* One-time migration to the generic variant-table architecture
 * (docs/TABLE-ARCHITECTURE.md):
 *
 *   1. content/headers/*.json  → content/table-columns/*.json
 *      Each column stops being a mirror of a fixed Variant field: the
 *      `slot` field is dropped and replaced by a display `type`
 *      (text/number) and an optional feature `role` (sku/price/diameter/
 *      length). Existing table-columns files are never overwritten.
 *
 *   2. content/products/*.json → generic table shape
 *      `variantColumns` (+ the old named fields sku/diameterMm/…) become
 *      `columns: [key, …]` + `variants: [{ cells: [value, …] }]`,
 *      positionally aligned with the columns. Raw values keep their type.
 *
 * Idempotent: products whose variants are already cells-rows are skipped.
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

/* --- 0. Blank-cell convention ------------------------------------------- */

/* A blank printed cell is stored as a literal dash "-". WHY: Pages CMS
 * strips null/"" values out of every array (lib/schema.ts sanitizeObject)
 * when it loads a file into the editor AND when it saves it — an empty
 * cell would shift all following values and misalign the row. Dashes are
 * ordinary (non-empty) strings, so the round trip keeps every cell in
 * place; the site itself treats dashes (and stray spaces) as blank. */
const DASH = /^[-–—]*$/;

function dashifyCell(value) {
  if (typeof value === 'string') {
    return DASH.test(value.trim()) ? '-' : value;
  }
  return value ?? '-';
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

function migrateProduct(raw, headerDefs, warnings) {
  const variants = raw.variants ?? [];
  const id = raw.id ?? '(no id)';
  const keys = columnKeysFor(raw, headerDefs, warnings, id);

  const cells = variants.map((variant) =>
    keys.map((key) => {
      const slot = headerDefs.get(key)?.slot ?? slotOfKey.get(key) ?? key;
      return dashifyCell(variant[slot]);
    }),
  );

  const out = { ...raw };
  delete out.variantColumns;
  /* Preserve field order semantics: columns mirror the original
   * variantColumns position (after description) when present. */
  out.columns = keys;
  out.variants = cells.map((row) => ({ cells: row }));
  return { out };
}

/* Blank cells → dashes for products already in the generic shape (the
 * first migration run happened before the dash convention existed). */
function dashifyProduct(raw) {
  let changed = false;
  const variants = (raw.variants ?? []).map((variant) => {
    if (!Array.isArray(variant.cells)) return variant;
    const cells = variant.cells.map(dashifyCell);
    if (cells.some((cell, i) => cell !== variant.cells[i])) changed = true;
    return { ...variant, cells };
  });
  if (!changed) return null;
  return { out: { ...raw, variants } };
}

/* --- Run ----------------------------------------------------------------- */

const warnings = [];
const headerDefs = readHeaderDefs();
const seededColumns = ensureColumnFiles(headerDefs);

let converted = 0;
let dashified = 0;
let unchanged = 0;
if (fs.existsSync(path.join(ROOT, PRODUCTS_DIR))) {
  for (const name of fs.readdirSync(path.join(ROOT, PRODUCTS_DIR))) {
    if (!name.endsWith('.json')) continue;
    const file = `${PRODUCTS_DIR}/${name}`;
    const raw = readJson(file);
    const variants = raw.variants ?? [];
    const isGeneric = variants.length > 0 && variants.every((v) => Array.isArray(v.cells));

    const result = isGeneric
      ? dashifyProduct(raw)
      : variants.length > 0 || !Array.isArray(raw.columns)
        ? migrateProduct(raw, headerDefs, warnings)
        : null;

    if (!result) { unchanged += 1; continue; }
    writeJson(file, result.out);
    if (isGeneric) dashified += 1; else converted += 1;
  }
}

console.log(`Columns library seeded/kept: ${seededColumns} new → ${COLUMNS_DIR}/`);
console.log(`Products converted: ${converted}, blank cells dashified: ${dashified}, unchanged: ${unchanged}`);
for (const w of warnings) console.warn(`WARNING: ${w}`);
