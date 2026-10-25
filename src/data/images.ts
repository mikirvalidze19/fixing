/* Media resolution.
 * Maps any image reference — a CMS-uploaded repo path (e.g.
 * "/content/images/products/hxe01.webp") or a legacy asset file name
 * (e.g. "Logo_simbolo_FUOCO.png") — to a build-time URL.
 *
 * CMS uploads live under content/images/**, legacy artwork stays in
 * src/assets/**. Both sets are indexed once at module load. */

const contentProductImages = import.meta.glob<string>(
  '../../content/images/products/*',
  { eager: true, query: '?url', import: 'default' },
);

const contentBadgeImages = import.meta.glob<string>(
  '../../content/images/badges/*',
  { eager: true, query: '?url', import: 'default' },
);

const contentIconImages = import.meta.glob<string>(
  '../../content/images/icons/*',
  { eager: true, query: '?url', import: 'default' },
);

const contentStandardImages = import.meta.glob<string>(
  '../../content/images/standards/*',
  { eager: true, query: '?url', import: 'default' },
);

const legacyProductImages = import.meta.glob<string>(
  '../assets/products/*.webp',
  { eager: true, query: '?url', import: 'default' },
);

const legacySymbolImages = import.meta.glob<string>(
  '../assets/symbols/*.{png,webp,svg}',
  { eager: true, query: '?url', import: 'default' },
);

const legacyStandardImages = import.meta.glob<string>(
  '../assets/standards/*.{png,webp,svg}',
  { eager: true, query: '?url', import: 'default' },
);

/* Match by path suffix so stored values may be absolute ("/content/…"),
 * relative ("content/images/…") or a bare file name. */
function findBySuffix(urls: Record<string, string>, hint: string): string {
  if (!hint) return '';
  let suffix = hint.split(/[?#]/)[0].replace(/\\/g, '/');
  suffix = suffix.replace(/^\.\//, '').replace(/^\//, '');
  if (suffix.startsWith('content/')) suffix = suffix.slice('content/'.length);
  if (suffix.startsWith('images/')) suffix = suffix.slice('images/'.length);
  for (const path of Object.keys(urls)) {
    if (path.endsWith(`/${suffix}`)) return urls[path];
  }
  return '';
}

/* Product photo: the CMS-stored path wins, legacy `{id}.webp` is the
 * fallback for catalogue items that have not been re-uploaded. */
export function productImageUrl(id: string, stored?: string | null): string {
  if (stored) {
    const hit = findBySuffix(contentProductImages, stored);
    if (hit) return hit;
  }
  if (id) {
    const legacy = findBySuffix(legacyProductImages, `${id}.webp`);
    if (legacy) return legacy;
  }
  return '';
}

/* Symbol/badge/spec-icon artwork: any of
 *  - a content path ("/content/images/{badges|icons|standards}/…"),
 *  - a library key present in the shared libraries,
 *  - a legacy file name in src/assets/symbols or src/assets/standards. */
type LibraryKind = 'symbols' | 'standards';

export function libraryImageUrl(
  ref: string,
  kind: LibraryKind = 'symbols',
): string {
  if (!ref) return '';
  const hasPath = ref.includes('/');
  if (hasPath) {
    const hit =
      findBySuffix(contentBadgeImages, ref) ||
      findBySuffix(contentIconImages, ref) ||
      findBySuffix(contentStandardImages, ref);
    if (hit) return hit;
  }
  const legacy = kind === 'symbols' ? legacySymbolImages : legacyStandardImages;
  return findBySuffix(legacy, ref);
}
