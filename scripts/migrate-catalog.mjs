/* One-time migration: legacy catalog (single products.json + 4 sidecar
 * files) → editor-managed content (one JSON per product + shared
 * libraries for badges / spec icons / standards).
 *
 * Run from the repo root:  node scripts/migrate-catalog.mjs
 * Safe to re-run — it overwrites content/** from the legacy sources. */

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
    .replace(/\.[a-z0-9]+$/, '') // trailing extension
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* --- Inputs (legacy sources) ------------------------------------------- */

const source = readJson('tecfi-georgia-planning/data/products.json');
const categoryProducts = readJson('src/data/category-products.json');
const symbols = readJson('src/data/product-symbols.json').symbols;
const extra = readJson('src/data/product-extra.json');
const documents = readJson('src/data/product-docs.json');
const features = readJson('src/data/product-features.json');
const locales = {
  en: readJson('src/locales/en.json'),
  ka: readJson('src/locales/ka.json'),
};

const products = source.products;
const videosByProduct = extra.videos ?? {};
const standardsByProduct = extra.standards ?? {};

/* --- Shared libraries --------------------------------------------------- */

const isCertIcon = (name) => name.startsWith('Logo_simbolo_');
const certI18n = (name) /* filename → i18n cert line */ =>
  name.includes('FUOCO') ? 'certFire'
  : name.includes('SISMICO') ? 'certSeismic'
  : name.includes('ETA') ? 'certEta'
  : 'certDefault';

const badgeDefs = new Map(); // key → def
const iconDefs = new Map(); // key → def
const standardDefs = new Map(); // key → def

function badgeKey(name, rowLabel) {
  const key = slug(name);
  if (!badgeDefs.has(key)) {
    badgeDefs.set(key, {
      key,
      label: locales.en.productPage?.[certI18n(name)] ?? '',
      labelKa: locales.ka.productPage?.[certI18n(name)] ?? null,
      /* the retainer line shown under the badge on legacy pages */
      value: rowLabel ?? null,
      image: name, // legacy asset file name in src/assets/symbols/
    });
  }
  return key;
}

function iconKey(name, fallbackLabel) {
  const key = slug(name);
  const def = iconDefs.get(key);
  if (!def) {
    iconDefs.set(key, { key, label: fallbackLabel ?? '', image: name });
  }
  return key;
}

function standardKey(tab, badge, label, value) {
  const heading = label || value || '';
  let key = slug(`${heading} ${badge || tab}`);
  const def = standardDefs.get(key);
  if (!def) {
    standardDefs.set(key, {
      key,
      label: heading,
      labelKa: null, // legacy standards show the same string in both languages
      tab,
      badge: badge ?? null,
    });
  } else if (def.tab !== tab || def.badge !== badge) {
    // same heading on different artwork — disambiguate
    key = slug(`${heading} ${tab} ${badge}`);
    if (!standardDefs.has(key)) {
      standardDefs.set(key, { key, label: heading, labelKa: null, tab, badge: badge ?? null });
    }
  }
  return key;
}

/* --- Per-product content files ------------------------------------------ */

const warnings = [];
const seenCertValues = new Map(); // badge filename → labels used (consistency check)

for (const p of products) {
  const rows = symbols[p.id] ?? [];
  const certKeys = [];
  const specRows = [];
  for (const row of rows) {
    if (isCertIcon(row.icon)) {
      const key = badgeKey(row.icon, row.label);
      if (!certKeys.includes(key)) certKeys.push(key);
      const labels = seenCertValues.get(row.icon) ?? new Set();
      labels.add(row.label ?? '');
      seenCertValues.set(row.icon, labels);
    } else {
      specRows.push({
        icon: iconKey(row.icon, row.label),
        label: row.label ?? '',
        value: row.value ?? null,
      });
    }
  }

  const standardRows = (standardsByProduct[p.id] ?? []).map((s) => ({
    standard: standardKey(s.icon, s.badge, s.label, s.value),
    // preserve the legacy label/value split exactly (empty = hide label line)
    label: s.label ?? '',
    value: s.value ?? null,
  }));

  const category = Object.entries(categoryProducts).find(([, ids]) =>
    ids.includes(p.id),
  )?.[0];

  writeJson(`content/products/${p.id}.json`, {
    id: p.id,
    series: p.series,
    titleEn: p.titleEn,
    titleKa: p.titleKa,
    category: category ?? null,
    youtube: videosByProduct[p.id] ?? null,
    image: null, // legacy photo in src/assets/products/{id}.webp
    descriptionEn: null,
    descriptionKa: null,
    groupNumber: p.groupNumber,
    certifications: certKeys,
    specs: specRows,
    standards: standardRows,
    documents: documents[p.id] ?? [],
    features: features[p.id] ?? [],
    variants: p.variants,
  });
}

/* Warn on inconsistent labels for the same badge artwork (the def uses the
 * first-seen value; the legacy value line would have differed per product). */
for (const [name, labels] of seenCertValues) {
  if (labels.size > 1) {
    warnings.push(`Badge ${name} carries several labels across products: ${[...labels].join(' | ')}`);
  }
}

for (const def of badgeDefs.values()) writeJson(`content/badges/${def.key}.json`, def);
for (const def of iconDefs.values()) writeJson(`content/icons/${def.key}.json`, def);
for (const def of standardDefs.values()) writeJson(`content/standards/${def.key}.json`, def);

/* --- Report -------------------------------------------------------------- */

console.log(`Products written: ${products.length} → content/products/`);
console.log(`Badges (certifications): ${badgeDefs.size} → content/badges/`);
console.log(`Spec icons: ${iconDefs.size} → content/icons/`);
console.log(`Standards defs: ${standardDefs.size} → content/standards/`);
for (const w of warnings) console.warn(`WARNING: ${w}`);
