/* One-time migration of the catalog categories to the Pages CMS
 * (docs/EDITOR-GUIDE.md — "Catalog categories"):
 *
 *   1. src/data/product-categories.json (15 rows) →
 *      content/categories/<slug>.json (id, menu order, EN/Ka texts,
 *      icon path). The legacy seed stays as the adapter's fallback.
 *
 *   2. Menu icons → content/images/categories/<file> — the bundled
 *      src/assets/categories/*.webp move into the CMS media folder
 *      (editors can re-upload from the CMS afterwards).
 *
 *   3. The `categories` text overrides in src/locales/{en,ka}.json are
 *      removed — the site reads bilingual texts from the CMS rows now
 *      (like slider.slides was removed before).
 *
 * Idempotent: existing content/categories files (editor data) are never
 * overwritten; artwork already moved stays put; the locale subtree
 * deletion is safe to repeat. Run:  npm run migrate:categories
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEED = 'src/data/product-categories.json';
const FROM_IMG = 'src/assets/categories';
const TO_IMG = 'content/images/categories';
const CATS_DIR = 'content/categories';

const readJson = (p) =>
  JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const seed = readJson(path.join(ROOT, SEED));

/* --- 1 + 2. CMS files + artwork ------------------------------------------- */

fs.mkdirSync(path.join(ROOT, CATS_DIR), { recursive: true });

let filesWritten = 0;
let iconsMoved = 0;
let iconsLinked = 0;

for (let i = 0; i < seed.length; i += 1) {
  const row = seed[i];
  const slug = String(row.slug ?? '').trim();
  if (!slug) continue;

  const file = path.join(ROOT, CATS_DIR, `${slug}.json`);
  if (fs.existsSync(file)) {
    console.log(`${CATS_DIR}/${slug}.json already exists — kept the editor's version.`);
  } else {
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          id: slug,
          order: i + 1,
          labelEn: row.label ?? slug,
          labelKa: null,
          descriptionEn: row.description ?? null,
          descriptionKa: null,
          icon: null,
        },
        null,
        2,
      ) + '\n',
    );
    filesWritten += 1;
  }

  /* Icons: move the bundled asset (never overwrite existing ones). */
  const bareName = String(row.icon ?? '').trim();
  if (bareName && fs.existsSync(path.join(ROOT, FROM_IMG, bareName))) {
    const to = path.join(ROOT, TO_IMG, bareName);
    if (!fs.existsSync(to)) {
      fs.mkdirSync(path.join(ROOT, TO_IMG), { recursive: true });
      fs.renameSync(path.join(ROOT, FROM_IMG, bareName), to);
      iconsMoved += 1;
    }
    if (fs.existsSync(to)) {
      const json = readJson(file);
      if (!json.icon) {
        json.icon = `/${TO_IMG}/${bareName}`;
        fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
        iconsLinked += 1;
      }
    }
  }
}

/* tidy: drop the legacy folder if nothing is left in it */
if (
  fs.existsSync(path.join(ROOT, FROM_IMG)) &&
  fs.readdirSync(path.join(ROOT, FROM_IMG)).length === 0
) {
  fs.rmdirSync(path.join(ROOT, FROM_IMG));
}

/* --- 3. Remove the now-unused locale overrides ----------------------------- */

let localesCleaned = 0;
for (const localeFile of ['src/locales/en.json', 'src/locales/ka.json']) {
  const target = path.join(ROOT, localeFile);
  if (!fs.existsSync(target)) continue;
  const json = readJson(target);
  if ('categories' in json) {
    delete json.categories;
    fs.writeFileSync(target, `${JSON.stringify(json, null, 2)}\n`);
    localesCleaned += 1;
  }
}

/* --- Summary ---------------------------------------------------------------- */

console.log(`CMS files written: ${filesWritten} → ${CATS_DIR}/`);
console.log(`icons: ${iconsMoved} moved, ${iconsLinked} linked → ${TO_IMG}/`);
console.log(`locale override subtrees removed: ${localesCleaned}`);
