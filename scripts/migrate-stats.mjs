/* One-time migration of the home-page numbers band to the Pages CMS
 * (docs/EDITOR-GUIDE.md — "Home page numbers (stats band)"):
 *
 *   1. src/data/stats.json → content/stats.json — the single CMS file
 *      the site reads (the legacy seed stays as the adapter's
 *      fallback).
 *
 *   2. The `stats` text overrides in src/locales/{en,ka}.json are
 *      removed — the site reads the bilingual texts from the CMS file
 *      now (the Ka entries used to be English duplicates).
 *
 * Idempotent: an existing content/stats.json (editor data) is never
 * overwritten; the locale subtree deletion is safe to repeat.
 * Run:  npm run migrate:stats
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEED = 'src/data/stats.json';
const OUT = 'content/stats.json';

const readJson = (p) =>
  JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const str = (value) =>
  typeof value === 'string' ? value.trim() : '';

/* --- 1. The CMS file --------------------------------------------------------- */

fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true });

if (fs.existsSync(path.join(ROOT, OUT))) {
  console.log(`${OUT} already exists — kept the editor's version.`);
} else {
  const legacy = readJson(path.join(ROOT, SEED));
  fs.writeFileSync(
    path.join(ROOT, OUT),
    JSON.stringify(
      {
        titleEn: str(legacy.title),
        titleKa: null,
        ctaEn: str(legacy.cta),
        ctaKa: null,
        ctaLink: str(legacy.to) || '/contacts',
        items: (legacy.stats ?? []).map((stat) => ({
          value: stat.value,
          labelEn: str(stat.label),
          labelKa: null,
        })),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Wrote ${OUT} (from the legacy seed; Ka texts are ready to fill).`);
}

/* --- 2. Remove the now-unused locale overrides -------------------------------- */

let localesCleaned = 0;
for (const localeFile of ['src/locales/en.json', 'src/locales/ka.json']) {
  const target = path.join(ROOT, localeFile);
  if (!fs.existsSync(target)) continue;
  const json = readJson(target);
  if ('stats' in json) {
    delete json.stats;
    fs.writeFileSync(target, `${JSON.stringify(json, null, 2)}\n`);
    localesCleaned += 1;
  }
}

console.log(`locale override subtrees removed: ${localesCleaned}`);
