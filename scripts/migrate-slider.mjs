/* One-time migration of the hero slider to the Pages CMS
 * (docs/EDITOR-GUIDE.md — "Home slider"):
 *
 *   1. src/assets/slider/* → content/images/slider/*
 *      (the artwork moves into the CMS media folders, like the product
 *      and library artwork before).
 *
 *   2. src/data/slider.json + the per-slide text overrides in
 *      src/locales/{en,ka}.json ("slider.slides.<id>") → content/slider.json
 *      in the CMS block shape:
 *
 *        { "autoplayMs": 6000,
 *          "slides": [
 *            { "type": "image", "image": "/content/images/slider/…",
 *              "titleEn|titleKa", "textEn|textKa", "buttonTextEn|buttonTextKa",
 *              "link", "variant", "alt…" },
 *            { "type": "video", "videoUrl": "https://…", "poster": "https://…", … }
 *          ] }
 *
 * src/data/slider.json stays as an emergency fallback for an empty CMS
 * file. Idempotent: artwork already moved stays put; an existing
 * content/slider.json (editor-managed) is never overwritten.
 *
 * Run from the repo root:  node scripts/migrate-slider.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FROM_IMG = 'src/assets/slider';
const TO_IMG = 'content/images/slider';
const LEGACY_DATA = 'src/data/slider.json';
const CMS_FILE = 'content/slider.json';

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const writeJson = (p, data) => {
  const file = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

/* --- 1. Artwork ----------------------------------------------------------- */

let moved = 0;
if (fs.existsSync(path.join(ROOT, FROM_IMG))) {
  fs.mkdirSync(path.join(ROOT, TO_IMG), { recursive: true });
  for (const name of fs.readdirSync(path.join(ROOT, FROM_IMG))) {
    const from = path.join(ROOT, `${FROM_IMG}/${name}`);
    const to = path.join(ROOT, `${TO_IMG}/${name}`);
    if (fs.existsSync(to)) continue; // keep editor re-uploads
    fs.renameSync(from, to);
    moved += 1;
  }
  if (fs.readdirSync(path.join(ROOT, FROM_IMG)).length === 0) {
    fs.rmdirSync(path.join(ROOT, FROM_IMG));
  }
}

/* --- 2. Slide data --------------------------------------------------------- */

const localesEn = readJson('src/locales/en.json');
const localesKa = readJson('src/locales/ka.json');
const legacy = readJson(LEGACY_DATA);

/* The locale overrides (slider.slides.<id>) carry the same texts as the
 * seed — the Georgian values are folded in so the CMS entry reproduces
 * exactly what the site showed before. */
const override = (locale, id, key) => locale?.slider?.slides?.[id]?.[key] ?? null;

function foldSlide(raw, index) {
  const id = raw.id ?? `slide-${index + 1}`;
  const base = {
    titleEn: override(localesEn, id, 'title') ?? raw.title ?? null,
    titleKa: override(localesKa, id, 'title'),
    textEn: override(localesEn, id, 'text') ?? raw.text ?? null,
    textKa: override(localesKa, id, 'text'),
    buttonTextEn: override(localesEn, id, 'cta') ?? raw.cta ?? null,
    buttonTextKa: override(localesKa, id, 'cta'),
    link: raw.to ?? null,
    altEn: raw.alt ?? null,
  };
  if (raw.video) {
    return {
      type: 'video',
      /* Legacy video sources are external (the Tecfi storage clip). */
      videoUrl: raw.video.src ?? null,
      poster: raw.video.poster ?? null,
      ...base,
    };
  }
  return {
    type: 'image',
    image: raw.background ? `/${TO_IMG}/${raw.background}` : null,
    foreground: raw.foreground ? `/${TO_IMG}/${raw.foreground}` : null,
    variant: raw.variant ?? null,
    eyebrow: raw.eyebrow ?? null,
    ...base,
  };
}

const cmsEntry = {
  autoplayMs: typeof legacy.autoplayMs === 'number' ? legacy.autoplayMs : 6000,
  slides: (legacy.slides ?? []).map(foldSlide),
};

/* --- 3. Run ---------------------------------------------------------------- */

let wrote = false;
if (fs.existsSync(path.join(ROOT, CMS_FILE))) {
  console.log(`${CMS_FILE} already exists — kept the editor's version (wrote nothing).`);
} else {
  writeJson(CMS_FILE, cmsEntry);
  wrote = true;
}

console.log(`Artwork moved: ${moved} → ${TO_IMG}/`);
console.log(wrote ? `CMS entry created: ${CMS_FILE}` : `${CMS_FILE} kept untouched`);
