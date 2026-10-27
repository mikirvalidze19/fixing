/* The single adapter between the UI and the product catalog (PRD §8).
 * Reads the editor-managed catalog under `content/` (Pages CMS), merges
 * the shared libraries (badges / spec icons / standards) into the
 * products, resolves every image reference to a build-time URL, and
 * keeps the legacy seed JSON as a fallback so the site never breaks.
 *
 * Consumers import: products, categories, categoryProducts,
 * productCategoryIndex, badges, specIcons, standardDefs, youtubeId. */

import legacySource from '../../tecfi-georgia-planning/data/products.json';
import legacyCategoryProducts from './category-products.json';
import legacyCategories from './product-categories.json';
import type {
  Application,
  BadgeDef,
  CertRow,
  DocumentRow,
  FeatureRow,
  Product,
  ProductCategory,
  SpecIconDef,
  StandardDef,
  StandardRow,
  SymbolRow,
  TableHeaderDef,
  Variant,
  VariantColumn,
} from '../models/catalog';
import { libraryImageUrl } from './images';

export type { Application, Product, Variant } from '../models/catalog';

/* --- Editor-managed content ------------------------------------------- */

const productFiles = import.meta.glob<any>(
  '../../content/products/*.json',
  { eager: true, import: 'default' },
);

const badgeFiles = import.meta.glob<any>(
  '../../content/badges/*.json',
  { eager: true, import: 'default' },
);

const iconFiles = import.meta.glob<any>(
  '../../content/icons/*.json',
  { eager: true, import: 'default' },
);

const standardFiles = import.meta.glob<any>(
  '../../content/standards/*.json',
  { eager: true, import: 'default' },
);

const headerFiles = import.meta.glob<any>(
  '../../content/headers/*.json',
  { eager: true, import: 'default' },
);

function fileKey(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.json$/, '');
}

/* --- Legacy categories ------------------------------------------------- */

export const categories = legacyCategories as Array<{
  id: number;
  slug: string;
  label: string;
  icon: string;
  description: string;
}>;

/* --- Shared libraries --------------------------------------------------- */

function indexByKey<T extends { key: string }>(
  files: Record<string, unknown>,
  fallback?: Partial<T>,
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [path, raw] of Object.entries(files)) {
    const entry = raw as Partial<T>;
    const key = (entry.key as string) || fileKey(path);
    out[key] = { key, ...(fallback as object), ...(entry as object) } as T;
  }
  return out;
}

export const badges = indexByKey<BadgeDef>(badgeFiles);
export const specIcons = indexByKey<SpecIconDef>(iconFiles);
export const standardDefs = indexByKey<StandardDef>(standardFiles);
export const tableHeaders = indexByKey<TableHeaderDef>(headerFiles);

/* --- Legacy seed fallback (only used while content/ is empty) ---------- */

type LegacyRaw = {
  id: string;
  groupNumber?: number;
  series: string;
  titleKa?: string;
  titleEn?: string;
  variants: Variant[];
};

function legacyFallbackProducts(): Product[] {
  const raw = (legacySource as { products?: LegacyRaw[] }).products ?? [];
  return raw.map((p) => ({
    id: p.id,
    series: p.series,
    titleKa: p.titleKa ?? '',
    titleEn: p.titleEn ?? p.series,
    groupNumber: p.groupNumber,
    variants: (p.variants ?? []).map((v) => ({ ...v, note: v.note ?? null })),
  }));
}

/* --- YouTube ----------------------------------------------------------- */

/* Accepts a full YouTube URL (watch / youtu.be / embed / shorts) or a bare
 * video id. Returns the video id, or null when nothing usable was given. */
export function youtubeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  if (/^[\w-]{6,20}$/.test(raw)) return raw; // bare ID
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').split(/[?#]/)[0] || null;
    }
    const v = url.searchParams.get('v');
    if (v) return v;
    const embed = url.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/);
    if (embed) return embed[1];
  } catch {
    /* not a URL — treat as unusable */
  }
  return null;
}

/* --- Product normalization ---------------------------------------------- */

type RawProduct = {
  id: string;
  groupNumber?: number;
  series: string;
  titleKa?: string;
  titleEn?: string;
  category?: string | null;
  youtube?: string | null;
  image?: string | null;
  descriptionEn?: string | null;
  descriptionKa?: string | null;
  certifications?: (string | { key?: string })[] | null;
  specs?: (Partial<SymbolRow> & { icon?: string })[] | null;
  standards?: (Partial<StandardRow> & { standard?: string })[] | null;
  documents?: (Partial<DocumentRow> & { name?: string; size?: string })[] | null;
  features?: (Partial<FeatureRow> & { label?: string | null; value?: string })[] | null;
  /* Ordered header keys from the shared Table headers library, or the
   * legacy inline-object format. */
  variantColumns?: (string | (Partial<VariantColumn> & { key?: string }))[] | null;
  variants: Variant[];
};

function normalizeSpecs(raw: RawProduct): SymbolRow[] {
  return (raw.specs ?? []).map((row) => {
    const ref = row.icon ?? '';
    const def = specIcons[ref];
    return {
      icon: libraryImageUrl(def?.image ?? ref, 'symbols'),
      label: row.label ?? def?.label ?? '',
      labelKa: row.labelKa ?? def?.labelKa ?? null,
      value: row.value ?? null,
    };
  });
}

function normalizeCerts(raw: RawProduct): CertRow[] {
  return (raw.certifications ?? []).flatMap((entry) => {
    const key = typeof entry === 'string' ? entry : entry?.key ?? '';
    if (!key) return [];
    const def = badges[key];
    if (!def) {
      /* Unknown badge reference — render nothing rather than crash. */
      return [];
    }
    return [
      {
        icon: libraryImageUrl(def.image, 'symbols'),
        label: def.label ?? '',
        labelKa: def.labelKa ?? null,
        value: def.value ?? null,
        certKey: null,
      },
    ];
  });
}

function normalizeStandards(raw: RawProduct): StandardRow[] {
  return (raw.standards ?? []).flatMap((row) => {
    const def = standardDefs[row.standard ?? ''];
    if (!def) return [];
    return [
      {
        icon: libraryImageUrl(def.tab, 'standards'),
        label: row.label || def.label || '',
        labelKa: row.labelKa ?? def.labelKa ?? null,
        value: row.value ?? null,
        badge: def.badge ? libraryImageUrl(def.badge, 'standards') : null,
      },
    ];
  });
}

function normalizeDocuments(raw: RawProduct): DocumentRow[] {
  return (raw.documents ?? []).map((doc) => ({
    label: doc.label ?? [doc.name, doc.size ? `(${doc.size})` : null].filter(Boolean).join(' | '),
    url: doc.url ?? '#',
  }));
}

function normalizeFeatures(raw: RawProduct): FeatureRow[] {
  return (raw.features ?? []).map((f) => ({
    label: f.label || null,
    value: f.value ?? '',
  }));
}

/* Legacy JSON keeps numbers where the PDF had them; the CMS stores plain
 * strings. Both pass through untouched — the UI renders either. */
function normalizeVariants(variants: Variant[]): Variant[] {
  return variants.map((v) => ({
    text1: null,
    text2: null,
    text3: null,
    ...v,
    note: v.note ?? null,
  }));
}

/* Custom price-table columns. Editors pick ordered entries from the shared
 * "Table headers" library (`content/headers/`). Accepts the reference
 * format (bare keys) plus the older inline-object format for safety.
 * Unknown or duplicate keys are ignored; slot defaults to the key. */
function normalizeColumns(raw: RawProduct): VariantColumn[] {
  const seen = new Set<string>();
  const out: VariantColumn[] = [];
  for (const entry of raw.variantColumns ?? []) {
    let col: VariantColumn | null = null;
    if (typeof entry === 'string') {
      const def = tableHeaders[entry];
      if (!def) {
        console.warn(`[catalog] Unknown table header "${entry}" on product ${raw.id} — column skipped`);
        continue;
      }
      if (seen.has(def.key)) continue;
      seen.add(def.key);
      col = {
        key: def.key,
        slot: def.slot || def.key,
        label: def.label || def.key,
        labelKa: def.labelKa ?? null,
      };
    } else if (entry && typeof entry === 'object' && entry.key) {
      if (seen.has(entry.key)) continue;
      seen.add(entry.key);
      col = {
        key: entry.key,
        slot: entry.slot || entry.key,
        label: entry.label || entry.key,
        labelKa: entry.labelKa ?? null,
      };
    }
    if (col) out.push(col);
  }
  return out;
}

function normalizeProduct(raw: RawProduct): Product {
  const certs = normalizeCerts(raw);
  return {
    id: raw.id,
    series: raw.series,
    titleKa: raw.titleKa ?? '',
    titleEn: raw.titleEn ?? raw.series,
    variants: normalizeVariants(raw.variants ?? []),
    groupNumber: raw.groupNumber,
    category: raw.category ?? null,
    youtube: youtubeId(raw.youtube),
    image: raw.image ?? null,
    descriptionEn: raw.descriptionEn ?? null,
    descriptionKa: raw.descriptionKa ?? null,
    variantColumns: normalizeColumns(raw),
    specs: normalizeSpecs(raw),
    certs,
    standards: normalizeStandards(raw),
    documents: normalizeDocuments(raw),
    features: normalizeFeatures(raw),
  };
}

function orderKey(p: Product): string {
  const group = p.groupNumber ?? Number.MAX_SAFE_INTEGER;
  return `${String(group).padStart(6, '0')}-${p.series}-${p.id}`;
}

/* --- Public API --------------------------------------------------------- */

const contentProducts: Product[] = Object.entries(productFiles)
  .map(([, raw]) => normalizeProduct(raw as RawProduct))
  .filter((p) => Boolean(p.id))
  .sort((a, b) => orderKey(a).localeCompare(orderKey(b)));

export const products: Product[] =
  contentProducts.length > 0 ? contentProducts : legacyFallbackProducts();

export const getProduct = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const featuredProducts = ['hxe01', 'aje', 'zze', 'chemical-anchors']
  .map((id) => getProduct(id))
  .filter((p): p is Product => Boolean(p));

/* Category membership: the legacy map seeds the original order; products
 * carrying a `category` field (CMS-managed) append themselves once. */
export const categoryProducts: Record<string, string[]> = Object.fromEntries(
  Object.entries(legacyCategoryProducts as Record<string, string[]>).map(
    ([slug, ids]) => [slug, [...ids]],
  ),
);

for (const p of products) {
  if (!p.category) continue;
  const list = (categoryProducts[p.category] ??= []);
  if (!list.includes(p.id)) list.push(p.id);
}

/* First-category-wins index (product id → category slug). */
export const productCategoryIndex = new Map<string, string>();
for (const [slug, ids] of Object.entries(categoryProducts)) {
  for (const id of ids) {
    if (!productCategoryIndex.has(id)) productCategoryIndex.set(id, slug);
  }
}

export const productCategory = (id: string): ProductCategory => {
  const slug = productCategoryIndex.get(id);
  return slug ? categories.find((c) => c.slug === slug) : undefined;
};

/* Applications currently live outside the CMS; re-exported for stability. */
export const applications = (
  legacySource as unknown as { applications?: Application[] }
).applications ?? [];
