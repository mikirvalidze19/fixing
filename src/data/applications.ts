/* Applications ("where products are used": Roofing, Solar panels, HVAC…)
 * — the adapter between the CMS "Applications" collection
 * (content/applications/*.json) and the UI.
 *
 * Applications DEPEND on products: they carry no product list of their
 * own. Membership is derived from the products' `applications` tags
 * (Products → "Applications" multi-pick in the CMS), so one side is
 * editable and an application may mix products of any category.
 *
 * The pre-CMS seed tecfi-georgia-planning/data/products.json stays as the
 * emergency fallback when no CMS file exists (its legacy `products` lists
 * then seed the membership, exactly like the slider fallback works). */

import legacySource from '../../tecfi-georgia-planning/data/products.json';
import type { Application, Product } from '../models/catalog';
import { products } from './catalog';
import { applicationImageUrl } from './images';

type RawApplication = Partial<{
  id: unknown;
  slug: unknown;
  order: unknown;
  label: unknown;
  labelEn: unknown;
  labelKa: unknown;
  description: unknown;
  descriptionEn: unknown;
  descriptionKa: unknown;
  image: unknown;
}> & {
  /* Only on the legacy seed rows. */
  products?: unknown[];
};

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const slugOf = (raw: RawApplication): string =>
  str(raw.slug) || str(raw.id);

/* Legacy seed rows (EN-only). */
const legacyApplications: RawApplication[] =
  (legacySource as { applications?: RawApplication[] }).applications ?? [];
const legacyBySlug = new Map(
  legacyApplications.map((a) => [slugOf(a), a] as const),
);

/* --- CMS collection ------------------------------------------------------- */

const cmsFiles = import.meta.glob<RawApplication>(
  '../../content/applications/*.json',
  { eager: true, import: 'default' },
);

function normalizeCms(raw: RawApplication): Application | null {
  const slug = slugOf(raw);
  if (!slug) return null;
  const legacy = legacyBySlug.get(slug) as RawApplication | undefined;
  const order = typeof raw.order === 'number' ? raw.order : 0;
  return {
    slug,
    /* Legacy EN strings keep sites renderable when an editor only just
     * created the file; Ka falls back to En like the slider texts. */
    labelEn: str(raw.labelEn) || str(raw.label) || str(legacy?.label) || slug,
    labelKa: str(raw.labelKa) || str(raw.labelEn) || str(raw.label),
    descriptionEn:
      str(raw.descriptionEn) || str(raw.description) || str(legacy?.description),
    descriptionKa: str(raw.descriptionKa) || str(raw.descriptionEn),
    image: applicationImageUrl(str(raw.image) || str(legacy?.image)),
    order: order || undefined,
  };
}

/* Seed-less matches (a checkout without the planning file) still fine. */
const cmsApplications = Object.values(cmsFiles)
  .map(normalizeCms)
  .filter((a): a is Application => a !== null);

const sortApplications = (list: Application[]) =>
  [...list].sort((a, b) =>
    (a.order ?? Infinity) - (b.order ?? Infinity) ||
    a.labelEn.localeCompare(b.labelEn) ||
    a.slug.localeCompare(b.slug),
  );

export const applications: Application[] = sortApplications(
  cmsApplications.length > 0 ? cmsApplications : sortLegacy(),
);

/* Legacy-era fallback: same bilingual shape, EN where Ka is missing. */
function sortLegacy(): Application[] {
  return sortApplications(
    legacyApplications
      .filter((a) => slugOf(a))
      .map((a) => ({
        slug: slugOf(a),
        labelEn: str(a.labelEn) || str(a.label) || slugOf(a),
        labelKa: str(a.labelKa),
        descriptionEn: str(a.descriptionEn) || str(a.description),
        descriptionKa: str(a.descriptionKa),
        image: applicationImageUrl(str(a.image)),
        order: typeof a.order === 'number' ? a.order : undefined,
      })),
  );
}

/* --- Membership ----------------------------------------------------------- */

/* slug → products with that tag, catalog order (groupNumber → series). */
function buildMembership(list: Application[], fromLegacy: boolean) {
  const map = new Map<string, Product[]>();
  for (const app of list) map.set(app.slug, []);
  if (fromLegacy) {
    /* Emergency seed: use the legacy product id lists. */
    for (const app of legacyApplications) {
      const slug = slugOf(app);
      if (!map.has(slug)) continue;
      map.set(slug, (app.products ?? []).map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)));
    }
    return map;
  }
  for (const p of products) {
    for (const slug of p.applications ?? []) {
      const list2 = map.get(slug);
      if (list2) list2.push(p);
    }
  }
  return map;
}

const membership = buildMembership(applications, cmsApplications.length === 0);

export const applicationProducts = (slug: string): Product[] =>
  membership.get(slug) ?? [];
