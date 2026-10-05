/* Domain models: product catalog.
 * Pure types — no runtime. Data sources (data/catalog.ts) and every
 * consumer import from here. */

export type Variant = {
  sku: string;
  diameterMm: number | string | null;
  lengthMm: number | string | null;
  unitsPerBox: number;
  priceGel: number;
  note: string | null;
};

export type Product = {
  id: string;
  series: string;
  titleKa: string;
  titleEn: string;
  variants: Variant[];
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
