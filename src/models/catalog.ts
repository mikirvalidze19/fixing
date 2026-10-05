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
