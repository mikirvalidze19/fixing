import source from "../../tecfi-georgia-planning/data/products.json";

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
export const products = source.products as Product[];
export type Application = {
  slug: string;
  label: string;
  description: string;
  image: string;
  products: string[];
};
export const applications = (
  source as unknown as { applications?: Application[] }
).applications ?? [];
export const featuredProducts = ["hxe01", "aje", "zze", "chemical-anchors"]
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is Product => Boolean(product));
