/* The /video card grid (one YouTube player per card) — the adapter
 * between the CMS "Video gallery" collection (content/videos/*.json)
 * and the UI.
 *
 * Every card consequential field is here: YouTube link and bilingual
 * title (Georgian falls back to English). The pre-CMS seed
 * src/data/videos.json stays as the emergency fallback when no CMS
 * file exists (same pattern as the slider / categories / stats
 * adapters). Its unused `src`/`poster` download fields were dropped —
 * the page shows YouTube embeds, not file players. */

import legacyVideos from './videos.json';

export type VideoRow = {
  slug: string;
  titleEn: string;
  titleKa: string;
  youtube: string;
  order?: number;
};

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/* --- CMS collection -------------------------------------------------------- */

const cmsFiles = import.meta.glob<Record<string, unknown>>(
  '../../content/videos/*.json',
  { eager: true, import: 'default' },
);

function normalize(raw: Record<string, unknown>): VideoRow | null {
  const slug = str(raw.id) || str(raw.slug);
  const youtube = str(raw.youtube);
  if (!youtube) return null;
  return {
    slug,
    youtube,
    titleEn: str(raw.titleEn) || str(raw.title) || slug,
    titleKa: str(raw.titleKa) || str(raw.titleEn) || str(raw.title),
    order:
      typeof raw.order === 'number' ? raw.order : undefined,
  };
}

const cmsVideos = Object.values(cmsFiles)
  .map((raw) => normalize(raw as Record<string, unknown>))
  .filter((v): v is VideoRow => v !== null);

const sortVideos = (list: VideoRow[]) =>
  [...list].sort(
    (a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) ||
      a.titleEn.localeCompare(b.titleEn) ||
      a.slug.localeCompare(b.slug),
  );

/* Legacy rows keep their document order. */
const legacyRows: VideoRow[] = (legacyVideos as Array<{
  title: string;
  youtube: string;
}>).map((raw, index) => ({
  slug: `video-${index + 1}`,
  titleEn: raw.title,
  titleKa: '',
  youtube: raw.youtube,
  order: undefined,
}));

export const videos: VideoRow[] =
  cmsVideos.length > 0 ? sortVideos(cmsVideos) : legacyRows;

/* Bilingual title — Georgian falls back to English (as elsewhere). */
export const videoTitle = (video: VideoRow, ka: boolean): string =>
  (ka && video.titleKa) || video.titleEn;
