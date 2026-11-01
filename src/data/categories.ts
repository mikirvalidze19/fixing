/* Catalog categories (the 15+ section pages: /products/<slug>, the
 * Products mega-menu, breadcrumbs, search badges) — the adapter between
 * the CMS "Catalog categories" collection (content/categories/*.json)
 * and the UI.
 *
 * Every editor consequential field is here: name/description EN+KA,
 * icon artwork and the display position. Products point at a category
 * through their `category` field (the slug), so renaming a category's
 * ID would orphan them — see the editor guide ("never rename").
 *
 * The pre-CMS seed src/data/product-categories.json stays as the
 * emergency fallback when no CMS file exists (same pattern as the
 * slider / applications adapters). */

import legacyCategories from './product-categories.json';
import type { CategoryRow, RawCategory } from '../models/catalog';
import { categoryImageUrl } from './images';

export type { CategoryRow } from '../models/catalog';

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/* --- CMS collection -------------------------------------------------------- */

const cmsFiles = import.meta.glob<Record<string, unknown>>(
  '../../content/categories/*.json',
  { eager: true, import: 'default' },
);

function normalize(raw: RawCategory, legacy?: RawCategory): CategoryRow | null {
  const slug = str(raw?.id) || str(raw?.slug);
  if (!slug) return null;
  return {
    slug,
    labelEn: str(raw?.labelEn) || str(raw?.label) || str(legacy?.label) || slug,
    labelKa: str(raw?.labelKa) || str(raw?.labelEn) || str(raw?.label),
    descriptionEn:
      str(raw?.descriptionEn) || str(raw?.description) || str(legacy?.description),
    descriptionKa: str(raw?.descriptionKa) || str(raw?.descriptionEn),
    icon: categoryImageUrl(str(raw?.icon) || str(legacy?.icon)),
    order:
      typeof raw?.order === 'number'
        ? raw.order
        : typeof legacy?.order === 'number'
          ? legacy.order
          : undefined,
  };
}

const cmsCategories = Object.values(cmsFiles)
  .map((raw) => normalize(raw as RawCategory))
  .filter((c): c is CategoryRow => c !== null);

const sortCategories = (list: CategoryRow[]) =>
  [...list].sort(
    (a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) ||
      a.labelEn.localeCompare(b.labelEn) ||
      a.slug.localeCompare(b.slug),
  );

/* Legacy rows keep their document order but are resolved through
 * categoryImageUrl (bundled assets — the CMS files may not exist yet). */
const legacyRows: CategoryRow[] = (legacyCategories as RawCategory[]).map(
  (raw): CategoryRow | null => {
    const row = normalize(raw);
    return row ? { ...row, order: undefined } : null;
  },
).filter((row): row is CategoryRow => row !== null);

export const categories: CategoryRow[] =
  cmsCategories.length > 0 ? sortCategories(cmsCategories) : legacyRows;

export const findCategory = (slug: string): CategoryRow | undefined =>
  categories.find((c) => c.slug === slug);

/* Bilingual texts — Georgian falls back to English (as elsewhere). */
export const categoryLabel = (category: CategoryRow, ka: boolean): string =>
  (ka && category.labelKa) || category.labelEn;

export const categoryDescription = (
  category: CategoryRow,
  ka: boolean,
): string =>
  (ka && category.descriptionKa) || category.descriptionEn;
