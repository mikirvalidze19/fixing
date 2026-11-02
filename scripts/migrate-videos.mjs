/* One-time migration of the /video card grid to the Pages CMS
 * (docs/EDITOR-GUIDE.md — "Video gallery"):
 *
 *   src/data/videos.json (8 cards) → content/videos/<slug>.json
 *   (card order, YouTube link, EN/Ka title). The legacy seed stays as
 *   the adapter's fallback.
 *
 *   The card slugs come from the YouTube video ID (e.g.
 *   da2m-kupvio.json) — unique, stable, and safe for the filename
 *   pattern. No locale subtree exists for the videos (their titles
 *   were hardcoded in the JSON, never in the locales), so step two of
 *   the other migrations is not needed here.
 *
 * Idempotent: existing content/videos files (editor data) are never
 * overwritten. Run:  npm run migrate:videos
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEED = 'src/data/videos.json';
const OUT_DIR = 'content/videos';

const readJson = (p) =>
  JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const str = (value) =>
  typeof value === 'string' ? value.trim() : '';

/* The 11-char video ID from a youtu.be/watch/embed URL, lowercased to
 * satisfy the slug pattern. Unusual URLs fall back to an index slug. */
function slugFromYoutube(url, index) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').split(/[?#]/)[0];
      if (id) return id.toLowerCase();
    }
    const v = parsed.searchParams.get('v');
    if (v) return v.toLowerCase();
    const embedMatch = parsed.pathname.match(/\/embed\/([\w-]+)/);
    if (embedMatch) return embedMatch[1].toLowerCase();
  } catch {
    // fall through
  }
  return `video-${index + 1}`;
}

fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });

const seed = readJson(path.join(ROOT, SEED));

let filesWritten = 0;
seed.forEach((row, index) => {
  const youtube = str(row.youtube);
  if (!youtube) return;
  const slug = slugFromYoutube(youtube, index);
  const file = path.join(ROOT, OUT_DIR, `${slug}.json`);
  if (fs.existsSync(file)) {
    console.log(`${OUT_DIR}/${slug}.json already exists — kept the editor's version.`);
    return;
  }
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        id: slug,
        order: index + 1,
        youtube,
        titleEn: str(row.title) || slug,
        titleKa: null,
      },
      null,
      2,
    ) + '\n',
  );
  filesWritten += 1;
});

console.log(`CMS files written: ${filesWritten} → ${OUT_DIR}/`);
