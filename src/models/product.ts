/* Feature models: product pages and cards.
 * Shared by pages/Product.tsx and components/ProductCard. */

import type { Product, ProductCategory } from './catalog';


export type ProductSymbol = {
  icon: string;
  label: string;
  value?: string | null;
};

export type ProductStandard = {
  icon: string;
  label: string;
  value: string;
  badge: string;
};

export type ProductDocument = {
  label: string;
  url: string;
};

export type ProductFeature = {
  label: string | null;
  value: string;
};

/* View-model assembled by useProductData for the Product page. */
export type ProductData = {
  product: Product;
  title: string;
  category: ProductCategory;
  categoryLabel: string;
  related: Product[];
  specs: ProductSymbol[];
  certs: ProductSymbol[];
  standards: ProductStandard[];
  documents: ProductDocument[];
  features: ProductFeature[];
  videoId: string | undefined;
  hasPrice: boolean;
  diameters: number[];
  lengths: number[];
  packs: number[];
  priceRange: string | null;
  sizeUnit: string;
  aboutText: string;
};
