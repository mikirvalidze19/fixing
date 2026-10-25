/* Domain models: product catalog.
 * Pure types — no runtime. Data sources (data/catalog.ts) and every
 * consumer import from here.
 *
 * Products are stored as one JSON file per product under `content/products/`
 * (managed by editors through Pages CMS). The content is normalized once in
 * `src/data/catalog.ts` — icon/badge references and file paths are resolved
 * to build-time URLs there, so pages render plain rows. */

export type Variant = {
  sku: string;
  diameterMm: number | string | null;
  lengthMm: number | string | null;
  unitsPerBox: number;
  priceGel: number;
  note: string | null;
};

/* A spec-symbol row (small icon + label + optional value under the title).
 * `icon` and `badge` fields hold resolved URLs after normalization. */
export type SymbolRow = {
  icon: string;
  label: string;
  labelKa?: string | null;
  value?: string | null;
};

/* Certification badge row (`certKey` marks legacy rows so the label keeps
 * coming from the i18n dictionary exactly as before). */
export type CertRow = {
  icon: string;
  label: string;
  labelKa?: string | null;
  value?: string | null;
  certKey?: 'FUOCO' | 'SISMICO' | 'ETA' | string | null;
};

/* A standards/certificates row in the right-side box of the product page. */
export type StandardRow = {
  icon: string;
  label: string;
  labelKa?: string | null;
  value?: string | null;
  badge?: string | null;
};

export type DocumentRow = {
  label: string;
  url: string;
};

export type FeatureRow = {
  label: string | null;
  value: string;
};

export type Product = {
  id: string;
  series: string;
  titleKa: string;
  titleEn: string;
  variants: Variant[];
  /* Editor-managed extras (all optional; empty on the legacy seed) */
  groupNumber?: number;
  category?: string | null;
  youtube?: string | null;
  image?: string | null;
  descriptionEn?: string | null;
  descriptionKa?: string | null;
  specs?: SymbolRow[];
  certs?: CertRow[];
  standards?: StandardRow[];
  documents?: DocumentRow[];
  features?: FeatureRow[];
};

export type Application = {
  slug: string;
  label: string;
  description: string;
  image: string;
  products: string[];
};

/* A product category row (product-categories.json). The `| undefined`
 * preserves find-first semantics: a product may belong to no category. */
export type ProductCategory =
  | {
      id: number;
      slug: string;
      label: string;
      icon: string;
      description: string;
    }
  | undefined;

/* --- Shared libraries (managed by editors through Pages CMS) ------------ */

/* Certification badge (e.g. fire resistance, ETA/CE seals). Uploaded to
 * `content/images/badges/`, referenced from products by `key`. */
export type BadgeDef = {
  key: string;
  label: string;
  labelKa?: string | null;
  value?: string | null;
  image: string;
};

/* Specification icon (hex key, rpm drive, pre-drilling…). Uploaded to
 * `content/images/icons/`, referenced from product `specs` rows by `key`. */
export type SpecIconDef = {
  key: string;
  label: string;
  labelKa?: string | null;
  image: string;
};

/* Standards-box definition (certificate tab + badge artwork). Uploaded to
 * `content/images/standards/`, referenced from product `standards` rows. */
export type StandardDef = {
  key: string;
  label: string;
  labelKa?: string | null;
  tab: string;
  badge?: string | null;
};
