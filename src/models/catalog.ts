/* Domain models: product catalog.
 * Pure types — no runtime. Data sources (data/catalog.ts) and every
 * consumer import from here.
 *
 * Products are stored as one JSON file per product under `content/products/`
 * (managed by editors through Pages CMS). The content is normalized once in
 * `src/data/catalog.ts` — icon/badge references and file paths are resolved
 * to build-time URLs there, so pages render plain rows. */

/* One normalized variant-table column. Columns are defined ONCE in the
 * shared "Table columns" library (content/table-columns/, managed like
 * badges) and every product picks its own subset, in display order.
 *
 * A column carries no legacy "slot" mapping — its identity IS its `key`.
 * `type` drives value handling (number parsing / sorting); `role` is an
 * optional feature tag consumed outside the table (search, price strip). */
export type ColumnType = 'text' | 'number';
export type ColumnRole = 'sku' | 'price' | 'diameter' | 'length';

export type VariantColumn = {
  key: string;
  label: string;
  labelKa?: string | null;
  type: ColumnType;
  role?: ColumnRole | null;
};

/* A variant row: positional `cells` aligned 1:1 with the product's
 * `columns` (`cells[i]` is the value of `columns[i]`, `null` when the
 * printed cell is blank). Number columns are already parsed here. */
export type Variant = {
  cells: Array<number | string | null>;
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
  /* The columns this product's "Available variants" table uses, resolved
   * against the shared library in display order — always present after
   * normalization (never `undefined`). */
  columns: VariantColumn[];
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
  /* Application slugs (CMS "Applications" library — see data/applications).
   * The product side is the single source of truth; an application's page
   * lists every product tagged with it (applications may mix categories). */
  applications?: string[];
};

/* An application (usage page, e.g. "Roofing", "Solar panels") — CMS-managed
 * under content/applications. Products of an application are NOT stored
 * here: data/applications derives them from the products' `applications`
 * tags, so one side stays editable (applications may mix categories). */
export type Application = {
  slug: string;
  labelEn: string;
  labelKa: string;
  descriptionEn: string;
  descriptionKa: string;
  image: string;
  /* Display position (1 = first). Missing → alphabetical after numbered. */
  order?: number;
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

/* Variant-table column definition (shared library, content/table-columns/).
 * `type`/`role` are optional in the file and always resolved by the
 * normalizer. */
export type ColumnDef = {
  key: string;
  label: string;
  labelKa?: string | null;
  type?: ColumnType | null;
  role?: ColumnRole | null;
};
