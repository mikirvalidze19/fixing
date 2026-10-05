/* Feature models: product pages and cards.
 * Shared by pages/Product.tsx and components/ProductCard. */

import type { Product, ProductCategory } from './catalog';


export type ProductSymbol = {
  icon: string;
  label: string;
};

export type ProductStandard = {
  icon: string;
  label: string;
  value: string;
  badge: string;
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
  videoId: string | undefined;
  hasPrice: boolean;
  diameters: number[];
  lengths: number[];
  packs: number[];
  priceRange: string | null;
  sizeUnit: string;
  aboutText: string;
};
