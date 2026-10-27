/* Media resolution.
 * All editor-managed artwork lives in `content/images/**` exactly like the
 * CMS uploads it — a library def stores the repo path the CMS wrote (e.g.
 * "/content/images/badges/Logo_simbolo_ETA.png"), product photos can also
 * carry a CMS path. Each is resolved to a build-time URL here.
 *
 * Bare file names/themes from the pre-2026 files are still matched by
 * suffix (compatibility for old checkouts of content files). */

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

/* Legacy bundled product photos (one `<id>.webp` per product) — fallback
 * for catalogue items that have not been re-uploaded through the CMS. */
const legacyProductImages = import.meta.glob<string>(
  '../assets/products/*.webp',
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

/* Library artwork (badges / spec icons / standards). Primary lookup is the
 * artifact group folder; the other two folders act as a fallback so a
 * typo'd group still resolves. */
type LibraryKind = 'badges' | 'icons' | 'standards';

const LIBRARY_URLS: Record<LibraryKind, Record<string, string>> = {
  badges: contentBadgeImages,
  icons: contentIconImages,
  standards: contentStandardImages,
};
const LIBRARY_KINDS: LibraryKind[] = ['badges', 'icons', 'standards'];

export function libraryImageUrl(ref: string, kind: LibraryKind): string {
  const primary = findBySuffix(LIBRARY_URLS[kind], ref);
  if (primary) return primary;
  for (const other of LIBRARY_KINDS.filter((k) => k !== kind)) {
    const hit = findBySuffix(LIBRARY_URLS[other], ref);
    if (hit) return hit;
  }
  return '';
}
