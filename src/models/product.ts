/* Feature models: product pages and cards.
 * Shared by pages/Product.tsx and components/ProductCard. Row/data types
 * live in models/catalog — this module holds the assembled view-model. */

import type {
  CertRow,
  DocumentRow,
  FeatureRow,
  Product,
  ProductCategory,
  StandardRow,
  SymbolRow,
  VariantColumn,
} from './catalog';

/* View-model assembled by useProductData for the Product page. */
export type ProductData = {
  product: Product;
  title: string;
  category: ProductCategory;
  categoryLabel: string;
  related: Product[];
  specs: SymbolRow[];
  certs: CertRow[];
  standards: StandardRow[];
  documents: DocumentRow[];
  features: FeatureRow[];
  columns: VariantColumn[];
  videoId: string | undefined;
  hasPrice: boolean;
  diameters: number[];
  lengths: number[];
  packs: number[];
  priceRange: string | null;
  sizeUnit: string;
  aboutText: string;
};
