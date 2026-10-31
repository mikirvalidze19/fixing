/* One-time migration of the Applications (usage pages) to the Pages CMS
 * (docs/EDITOR-GUIDE.md — "Applications"):
 *
 *   1. tecfi-georgia-planning/data/products.json `applications`
 *      → content/applications/<slug>.json  (id, order, EN/Ka labels,
 *      description, image path) — the 16 cards copied 1:1 from the
 *      dealer mapping / tecfi.it structure.
 *
 *   2. Card artwork → content/images/applications/<slug>.<ext> — the
 *      remote storage.onpage.it images are downloaded so editors can
 *      re-upload from the CMS later (a failed download keeps the
 *      external URL, which still renders via passthrough).
 *
 *   3. The application → products lists are MOVED to the product side:
 *      every product in an application's list gets that slug in its
 *      `applications` tag array (the direction the CMS uses — see
 *      src/data/applications.ts). This is what makes the migration
 *      lossless: afterwards the site derives membership from the tags.
 *
 * Idempotent: existing content/applications files (editor data) are
 * never overwritten; image downloads skip existing files; product tags
 * are merged (duplicates dropped). Run:  npm run migrate:applications
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LEGACY = 'tecfi-georgia-planning/data/products.json';
const APPS_DIR = 'content/applications';
const IMG_DIR = 'content/images/applications';

const readJson = (p) =>
  JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const legacy = readJson(path.join(ROOT, LEGACY));
const applications = legacy.applications ?? [];

/* --- 1 + 2. CMS files + artwork ------------------------------------------- */

fs.mkdirSync(path.join(ROOT, APPS_DIR), { recursive: true });
fs.mkdirSync(path.join(ROOT, IMG_DIR), { recursive: true });

async function downloadImage(url, file) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return false;
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return true;
}

let filesWritten = 0;
let imagesDownloaded = 0;
let imagesAlready = 0;
let imagesFailed = 0;

for (let i = 0; i < applications.length; i += 1) {
  const app = applications[i];
  const slug = String(app.slug ?? '').trim();
  if (!slug) continue;

  const file = path.join(ROOT, APPS_DIR, `${slug}.json`);
  if (fs.existsSync(file)) {
    console.log(`${APPS_DIR}/${slug}.json already exists — kept the editor's version.`);
  } else {
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          id: slug,
          order: i + 1,
          labelEn: app.label ?? slug,
          labelKa: null,
          descriptionEn: app.description ?? null,
          descriptionKa: null,
          image: null,
        },
        null,
        2,
      ) + '\n',
    );
    filesWritten += 1;
  }

  /* Artwork: only when the file still carries no usable image value. */
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (typeof json.image === 'string' && json.image) continue;

  const url = typeof app.image === 'string' ? app.image : '';
  if (!url) continue;

  let ext;
  try {
    ext = path.posix.extname(new URL(url).pathname) || '.webp';
  } catch {
    ext = '.webp';
  }
  const imgFile = path.join(ROOT, IMG_DIR, `${slug}${ext}`);
  const stored = `/${IMG_DIR}/${slug}${ext}`;

  if (fs.existsSync(imgFile)) {
    imagesAlready += 1;
    json.image = stored;
    fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
    continue;
  }
  try {
    if (await downloadImage(url, imgFile)) {
      imagesDownloaded += 1;
      json.image = stored;
    } else {
      imagesFailed += 1;
      json.image = url; // external URL keeps rendering via passthrough
    }
  } catch {
    imagesFailed += 1;
    json.image = url;
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

/* --- 3. Tag the products (application side → product side) ----------------- */

const productDir = path.join(ROOT, 'content/products');
const productIds = new Set(
  fs
    .readdirSync(productDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.basename(name, '.json')),
);

let productsTagged = 0;
const unknownProducts = new Set();

for (const app of applications) {
  const slug = String(app.slug ?? '').trim();
  for (const productId of app.products ?? []) {
    if (!productIds.has(productId)) {
      unknownProducts.add(`${productId} (from ${slug})`);
      continue;
    }
    const file = path.join(productDir, `${productId}.json`);
    const json = readJson(file);
    const tags = Array.isArray(json.applications) ? json.applications : [];
    if (!tags.includes(slug)) {
      tags.push(slug);
      json.applications = tags;
      fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
      productsTagged += 1;
    }
  }
}

/* --- Summary ---------------------------------------------------------------- */

console.log(`CMS files written: ${filesWritten} → ${APPS_DIR}/`);
console.log(
  `images: ${imagesDownloaded} downloaded, ${imagesAlready} already present, ${imagesFailed} failed`,
);
console.log(`product tags set: ${productsTagged}`);
if (unknownProducts.size) {
  console.log(`unknown product ids skipped: ${[...unknownProducts].join(', ')}`);
}
