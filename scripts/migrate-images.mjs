/* One-time migration of library artwork to the CMS (Pages CMS) media
 * folders, matching how product photos already work (e.g.
 * "/content/images/products/acm01.webp" — see .pages.yml media section):
 *
 *   1. src/assets/standards/*  → content/images/standards/*
 *   2. src/assets/symbols/*    → content/images/badges/*   (Logo_simbolo_*)
 *                              → content/images/icons/*    (spec icons)
 *   3. content/{badges,icons,standards}/*.json reference values that are
 *      only "file.ext" are rewritten to "/content/images/<group>/<file>".
 *
 * The CMS image picker only previews/uploads files inside the media
 * folders, so editors could not manage the old src/assets copies.
 * Idempotent: already-correct paths are left untouched.
 *
 * Run from the repo root:  node scripts/migrate-images.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SYMBOLS_DIR = 'src/assets/symbols';
const STANDARDS_DIR = 'src/assets/standards';
const TARGETS = {
  badges: 'content/images/badges',
  icons: 'content/images/icons',
  standards: 'content/images/standards',
};

const move = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(path.join(ROOT, from), path.join(ROOT, to));
};

/* Move the artwork files; returns a map fileName → group for step 3. */
const fileNameToGroup = new Map();
let moved = 0;

if (fs.existsSync(path.join(ROOT, STANDARDS_DIR))) {
  for (const name of fs.readdirSync(path.join(ROOT, STANDARDS_DIR))) {
    move(`${STANDARDS_DIR}/${name}`, `${TARGETS.standards}/${name}`);
    fileNameToGroup.set(name, 'standards');
    moved += 1;
  }
}
if (fs.existsSync(path.join(ROOT, SYMBOLS_DIR))) {
  for (const name of fs.readdirSync(path.join(ROOT, SYMBOLS_DIR))) {
    const group = name.startsWith('Logo_simbolo') ? 'badges' : 'icons';
    move(`${SYMBOLS_DIR}/${name}`, `${TARGETS[group]}/${name}`);
    fileNameToGroup.set(name, group);
    moved += 1;
  }
}
/* Remove the now-empty legacy folders. */
for (const dir of [SYMBOLS_DIR, STANDARDS_DIR]) {
  const full = path.join(ROOT, dir);
  if (fs.existsSync(full) && fs.readdirSync(full).length === 0) fs.rmdirSync(full);
}

/* Rewrite bare file references in the library JSONs. */
let updated = 0;
const warn = [];

function updjson(dirPath, fields) {
  if (!fs.existsSync(path.join(ROOT, dirPath))) return;
  for (const name of fs.readdirSync(path.join(ROOT, dirPath))) {
    if (!name.endsWith('.json')) continue;
    const file = `${dirPath}/${name}`;
    const def = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    let defChanged = false;
    for (const field of fields) {
      const value = def[field];
      if (typeof value !== 'string' || value.includes('/')) continue;
      const group = fileNameToGroup.get(value);
      if (!group) {
        warn.push(`${file}: ${field} "${value}" — file not found in the moved artwork`);
        continue;
      }
      def[field] = `/content/images/${group}/${value}`;
      defChanged = true;
    }
    if (defChanged) {
      fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(def, null, 2)}\n`);
      updated += 1;
    }
  }
}

updjson('content/badges', ['image']);
updjson('content/icons', ['image']);
updjson('content/standards', ['tab', 'badge']);

console.log(`Images moved: ${moved} → content/images/{badges,icons,standards}/`);
console.log(`Library JSONs updated: ${updated}`);
for (const w of warn) console.warn(`WARNING: ${w}`);
