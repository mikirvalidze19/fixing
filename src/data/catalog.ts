/* The single adapter between the UI and the product catalog (PRD §8).
 * Reads the editor-managed catalog under `content/` (Pages CMS), merges
 * the shared libraries (badges / spec icons / standards / table columns)
 * into the products, resolves every image reference to a build-time URL,
 * and keeps the legacy seed JSON as a fallback so the site never breaks.
 *
 * Products carry a generic variant table (docs/TABLE-ARCHITECTURE.md):
 * `columns` picks entries of the "Table columns" library and every variant
 * row keeps its values in one multiline `values` text — ONE line per
 * column, with an empty line marking a blank cell (missing trailing lines
 * are blank too). Pre-2026 files (named fields + `variantColumns` slots)
 * and the earlier positional `cells` arrays are converted here.
 *
 * Consumers import: products, categories, categoryProducts,
 * productCategoryIndex, badges, specIcons, standardDefs, youtubeId. */

import legacySource from '../../tecfi-georgia-planning/data/products.json';
import legacyCategoryProducts from './category-products.json';
import legacyCategories from './product-categories.json';
import type {
  BadgeDef,
  CertRow,
  ColumnDef,
  ColumnRole,
  ColumnType,
  DocumentRow,
  FeatureRow,
  Product,
  ProductCategory,
  SpecIconDef,
  StandardDef,
  StandardRow,
  SymbolRow,
  Variant,
  VariantColumn,
} from '../models/catalog';
import { libraryImageUrl } from './images';

export type { Application, Product, Variant, VariantColumn } from '../models/catalog';

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

const columnFiles = import.meta.glob<any>(
  '../../content/table-columns/*.json',
  { eager: true, import: 'default' },
);

/* Pre-2026 header library (content/headers/) — only present in checkouts
 * that have not run scripts/migrate-table-columns.mjs yet. Always empty
 * after the migration. */
const legacyHeaderFiles = import.meta.glob<any>(
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

/* --- Table columns library ---------------------------------------------- */

/* Legacy slot names are only a translation aid for pre-2026 data. */
const LEGACY_SLOT_TYPE: Record<string, ColumnType> = {
  diameterMm: 'number',
  lengthMm: 'number',
  unitsPerBox: 'number',
  priceGel: 'number',
};
const LEGACY_SLOT_ROLE: Record<string, ColumnRole> = {
  sku: 'sku',
  priceGel: 'price',
  diameterMm: 'diameter',
  lengthMm: 'length',
};
/* Standard table (used when a product defines no columns — the emergency
 * legacy seed), keyed like the library entries. */
const STANDARD_COLUMN_KEYS = [
  'sku',
  'diametermm',
  'lengthmm',
  'unitsperbox',
  'pricegel',
  'note',
] as const;
const LEGACY_KEY_TO_SLOT: Record<string, string> = {
  sku: 'sku',
  diametermm: 'diameterMm',
  lengthmm: 'lengthMm',
  unitsperbox: 'unitsPerBox',
  pricegel: 'priceGel',
  note: 'note',
  text1: 'text1',
  text2: 'text2',
  text3: 'text3',
};
/* Labels for the standard set when even the library is missing (legacy
 * fallback only; Georgian labels then come from the EN default). */
const STANDARD_FALLBACK_LABELS: Record<string, string> = {
  sku: 'SKU',
  diametermm: 'Ø (mm)',
  lengthmm: 'Length (mm)',
  unitsperbox: 'Units / box',
  pricegel: 'Price',
  note: 'Note',
};

export const columnDefs = indexByKey<ColumnDef>(columnFiles);
for (const [path, raw] of Object.entries(legacyHeaderFiles)) {
  const entry = raw as Partial<ColumnDef> & { slot?: string };
  const key = (entry.key as string) || fileKey(path);
  if (columnDefs[key]) continue; // table-columns wins
  columnDefs[key] = {
    ...entry,
    key,
    label: entry.label ?? key,
    labelKa: entry.labelKa ?? null,
    type: entry.type ?? (entry.slot ? LEGACY_SLOT_TYPE[entry.slot] ?? 'text' : 'text'),
    role: entry.role ?? (entry.slot ? LEGACY_SLOT_ROLE[entry.slot] ?? null : null),
  };
}

/* --- Legacy seed fallback (only used while content/ is empty) ---------- */

type LegacyRaw = {
  id: string;
  groupNumber?: number;
  series: string;
  titleKa?: string;
  titleEn?: string;
  variants: LegacyVariant[];
};

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
  /* Generic table: ordered library keys. */
  columns?: (string | (Partial<VariantColumn> & { key?: string }))[] | null;
  /* Pre-2026 shape (reference keys or inline objects). */
  variantColumns?: (string | (Partial<VariantColumn> & { key?: string }))[] | null;
  /* `values` rows (generic) or legacy named-field/`cells` rows. */
  variants?: Variant[] | LegacyVariant[];
  /* Application tags (CMS "Applications" library, value = slug). */
  applications?: unknown[] | null;
};

/* Non-current row shapes, still parsed so old checkouts and the
 * emergency seed keep rendering: positional `cells` arrays (the first CMS
 * flow) and pre-2026 named fields. Neither is written anymore —
 * scripts/migrate-table-columns.mjs converts files to `values` text. */
type LegacyVariant = Partial<{
  sku: string;
  diameterMm: number | string | null;
  lengthMm: number | string | null;
  unitsPerBox: number | null;
  priceGel: number | null;
  note: string | null;
  text1: string | null;
  text2: string | null;
  text3: string | null;
}> & { cells?: unknown[]; values?: string | null };

function normalizeSpecs(raw: RawProduct): SymbolRow[] {
  return (raw.specs ?? []).map((row) => {
    const ref = row.icon ?? '';
    const def = specIcons[ref];
    return {
      icon: libraryImageUrl(def?.image ?? ref, 'icons'),
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
        icon: libraryImageUrl(def.image, 'badges'),
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

/* Blank cells: an empty, whitespace-only or dash-only value all mean
 * "blank" (the dash was the earlier storage convention; the current one —
 * docs/TABLE-ARCHITECTURE.md — keeps row values in a multiline `values`
 * text where an empty line is the blank cell). Numeric-looking strings in
 * number columns become numbers so typed columns behave like numbers. */
const BLANK = /^[-–—]*$/; // plain / en / em dash, trimmed

function toCell(value: unknown, type: ColumnType | null | undefined): number | string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value as number | string;
  const trimmed = value.trim();
  if (trimmed === '' || BLANK.test(trimmed)) return null;
  if (type === 'number' && /^-?\d+([.,]\d+)?$/.test(trimmed)) {
    return Number(trimmed.replace(',', '.'));
  }
  return trimmed;
}

/* The product's pick in display order. Reads the generic `columns` field,
 * then the legacy `variantColumns` (reference keys/objects), and finally —
 * only when the product defines neither but has variants, i.e. the
 * emergency legacy seed — the standard six. Unknown keys are dropped with
 * a warning; duplicates keep the first occurrence. */
function resolveColumns(raw: RawProduct): VariantColumn[] {
  let picked: (string | (Partial<VariantColumn> & { key?: string }))[] | null = null;
  /* An explicit `columns` key always wins — even empty, meaning the editor
   * intentionally turned the table off. Absent field = pre-2026 data. */
  if (Array.isArray(raw.columns)) picked = raw.columns;
  else if (Array.isArray(raw.variantColumns) && raw.variantColumns.length > 0) {
    picked = raw.variantColumns;
  }

  if (!picked) {
    if (!raw.variants?.length) return [];
    return STANDARD_COLUMN_KEYS.map((key) => ({
      key,
      label: columnDefs[key]?.label ?? STANDARD_FALLBACK_LABELS[key] ?? key,
      labelKa: columnDefs[key]?.labelKa ?? null,
      type: columnDefs[key]?.type ?? LEGACY_SLOT_TYPE[LEGACY_KEY_TO_SLOT[key]] ?? 'text',
      role: columnDefs[key]?.role ?? LEGACY_SLOT_ROLE[LEGACY_KEY_TO_SLOT[key]] ?? null,
    }));
  }

  const seen = new Set<string>();
  const out: VariantColumn[] = [];
  for (const entry of picked) {
    const key = typeof entry === 'string' ? entry : (entry?.key as string | undefined);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const def = typeof entry === 'string' ? columnDefs[key] : null;
    if (!def) {
      console.warn(`[catalog] Unknown table column "${key}" on product ${raw.id} — column skipped`);
      continue;
    }
    /* `slot` only exists on legacy header defs — it names the old
     * named-field row that the value came from. */
    const slotKey = (def as ColumnDef & { slot?: string }).slot
      ?? LEGACY_KEY_TO_SLOT[key]
      ?? key;
    out.push({
      key: def.key,
      label: def.label ?? key,
      labelKa: def.labelKa ?? null,
      type: def.type ?? LEGACY_SLOT_TYPE[slotKey] ?? 'text',
      role: def.role ?? LEGACY_SLOT_ROLE[slotKey] ?? null,
    });
  }
  return out;
}

/* Legacy slot of a column (for reading pre-2026 named-field rows: the
 * value lived in `variant.diameterMm`, `variant.text1`, …). */
function legacySlot(column: VariantColumn): string {
  const def = columnDefs[column.key] as (ColumnDef & { slot?: string }) | undefined;
  return def?.slot ?? LEGACY_KEY_TO_SLOT[column.key] ?? column.key;
}

/* Normalizes one variant to positional cells aligned with the columns.
 * `values` rows (CMS flow) are one line per column: an empty or dash-only
 * line is a blank cell, and missing trailing lines are blank too — the
 * editor may stop typing early. Legacy `cells` arrays map by index;
 * pre-2026 named-field rows look up the old slot of each column. Rows are
 * always pad/trimmed to the column count so the table stays grid-aligned
 * whatever editors typed. */
function normalizeVariant(
  source: Variant | LegacyVariant,
  columns: VariantColumn[],
): Variant {
  const row = source as LegacyVariant;
  const cells = typeof row.values === 'string'
    ? row.values.split(/\r?\n/)
    : Array.isArray(row.cells)
      ? row.cells ?? []
      : columns.map((column) => {
          const value = (source as Record<string, unknown>)[legacySlot(column)];
          return value === undefined ? null : value;
        });
  return {
    cells: columns.map((column, index) => toCell(cells[index], column.type)),
  };
}

function normalizeProduct(raw: RawProduct): Product {
  const certs = normalizeCerts(raw);
  const columns = resolveColumns(raw);
  return {
    id: raw.id,
    series: raw.series,
    titleKa: raw.titleKa ?? '',
    titleEn: raw.titleEn ?? raw.series,
    variants: (raw.variants ?? []).map((v) => normalizeVariant(v, columns)),
    columns,
    groupNumber: raw.groupNumber,
    category: raw.category ?? null,
    youtube: youtubeId(raw.youtube),
    image: raw.image ?? null,
    descriptionEn: raw.descriptionEn ?? null,
    descriptionKa: raw.descriptionKa ?? null,
    specs: normalizeSpecs(raw),
    certs,
    standards: normalizeStandards(raw),
    documents: normalizeDocuments(raw),
    features: normalizeFeatures(raw),
    /* Application tags: strings straight into the "Applications" library
     * (Reference field stores the `{id}` values). Unknown slugs are fine —
     * the adapter drops them when it derives membership. */
    applications:
      Array.isArray(raw.applications)
        ? raw.applications.filter((a): a is string => typeof a === 'string' && !!a.trim())
        : [],
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

/* Applications moved to their own adapter (data/applications.ts) — they
 * are CMS-managed under content/applications and derive their product
 * lists from the products' `applications` tags. */

/* Emergency fallback from the legacy seed JSON — never expected to run
 * (the site ships with content/products committed); here only so the site
 * survives an empty content folder during setup. */
function legacyFallbackProducts(): Product[] {
  const raw = (legacySource as { products?: LegacyRaw[] }).products ?? [];
  return raw.map((p) => normalizeProduct(p as unknown as RawProduct));
}
