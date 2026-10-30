/* Hero slider content — the single adapter between the CMS entry
 * ("Home slider", content/slider.json) and components/Slider.
 *
 * A CMS slide is one of the two block types stored in content/slider.json:
 *   { type: 'image', image, foreground?, variant?, titleEn/Ka, textEn/Ka,
 *     buttonTextEn/Ka (→ ctaEn/Ka), link, altEn/Ka }
 *   { type: 'video', videoFile? | videoUrl?, poster?, …same texts }
 * The pre-CMS seed src/data/slider.json (monolingual rows with
 * `background` / `video.src`) stays as the emergency fallback for checkouts
 * or builds where the CMS file is missing or has no usable slides. */

import legacyData from '../data/slider.json';
import type { Slide } from '../models/slider';
import { sliderImageUrl, sliderVideoUrl } from './images';

type RawVideo = {
  videoFile?: unknown;
  videoUrl?: unknown;
  poster?: unknown;
  /* pre-CMS rows carry a nested video block */
  video?: { src?: unknown; poster?: unknown } | null;
};

type RawSlide = Partial<{
  type: unknown;
  id: unknown;
  title: unknown;
  titleEn: unknown;
  titleKa: unknown;
  text: unknown;
  textEn: unknown;
  textKa: unknown;
  cta: unknown;
  ctaEn: unknown;
  ctaKa: unknown;
  buttonText: unknown;
  buttonTextEn: unknown;
  buttonTextKa: unknown;
  link: unknown;
  to: unknown;
  variant: unknown;
  eyebrow: unknown;
  alt: unknown;
  altEn: unknown;
  altKa: unknown;
  image: unknown;
  background: unknown;
  foreground: unknown;
}> & RawVideo;

type RawEntry = { autoplayMs?: unknown; slides?: RawSlide[] };

type LegacyEntry = { autoplayMs?: number; slides?: RawSlide[] };

const FALLBACK_LINK = '/products';

/* Empty strings / null / whitespace → '' (the CMS never stores empty
 * object props, so undefined and '' mean the same). */
const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

function typeOf(raw: RawSlide): Slide['type'] {
  const type = str(raw.type);
  if (!type) {
    /* No usable type (pre-CMS row): a video block means a video slide. */
    return raw.video || str(raw.videoUrl) || str(raw.videoFile)
      ? 'video'
      : 'image';
  }
  return type === 'video' ? 'video' : 'image';
}

function normalizeSlide(raw: RawSlide, index: number): Slide | null {
  const type = typeOf(raw);

  let video: Slide['video'] | undefined;
  if (type === 'video') {
    /* A video slide without any source would render an empty box — drop
     * it with a console warning (an editor fixing the data re-adds it). */
    const src =
      sliderVideoUrl(str(raw.videoUrl)) ||
      sliderVideoUrl(str(raw.videoFile)) ||
      sliderVideoUrl(str(raw.video?.src));
    if (!src) {
      console.warn(
        `[slider] slide ${index + 1}: video type but no file/URL — skipped`,
      );
      return null;
    }
    const poster =
      sliderImageUrl(str(raw.poster)) ||
      sliderImageUrl(str(raw.video?.poster)) ||
      '';
    video = { src, poster: poster || undefined };
  }

  const image = sliderImageUrl(str(raw.image) || str(raw.background));
  const foreground = sliderImageUrl(str(raw.foreground));

  return {
    id: str(raw.id) || `slide-${index + 1}`,
    type,
    titleEn: str(raw.titleEn) || str(raw.title),
    titleKa: str(raw.titleKa),
    textEn: str(raw.textEn) || str(raw.text),
    textKa: str(raw.textKa),
    ctaEn: str(raw.buttonTextEn) || str(raw.ctaEn) || str(raw.cta) || str(raw.buttonText),
    ctaKa: str(raw.buttonTextKa) || str(raw.ctaKa),
    to: str(raw.link) || str(raw.to) || FALLBACK_LINK,
    variant: str(raw.variant) || undefined,
    altEn: str(raw.altEn) || str(raw.alt) || undefined,
    altKa: str(raw.altKa) || undefined,
    image: image || undefined,
    foreground: foreground || undefined,
    ...(type === 'video' ? { video } : {}),
  };
}

function normalizeList(slides: RawSlide[] | undefined): Slide[] {
  return (slides ?? [])
    .map((raw, index) => normalizeSlide(raw, index))
    .filter((slide): slide is Slide => slide !== null);
}

/* --- CMS entry ------------------------------------------------------------ */

const cmsEntries = import.meta.glob<RawEntry>(
  '../../content/slider.json',
  { eager: true, import: 'default' },
);
const cms = Object.values(cmsEntries)[0];

const cmsSlides = normalizeList(cms?.slides);

/* If the CMS entry exists it is authoritative — even with zero slides
 * (the editor intentionally emptied the list). The legacy seed is only
 * the emergency fallback for a checkout where the CMS file is missing. */
export const sliderSlides: Slide[] = cms
  ? cmsSlides
  : normalizeList((legacyData as LegacyEntry).slides);

/* Rotation speed: the CMS number wins, then the legacy seed, then 6000. */
export const sliderAutoplayMs = (() => {
  const cmsValue = typeof cms?.autoplayMs === 'number' ? cms.autoplayMs : 0;
  if (cmsValue > 0) return cmsValue;
  const legacyValue = (legacyData as LegacyEntry).autoplayMs ?? 0;
  return legacyValue > 0 ? legacyValue : 6000;
})();
