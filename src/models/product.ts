/* Feature models: product pages and cards.
 * Shared by pages/Product.tsx and components/ProductCard. Row/data types
 * live in models/catalog — this module holds the assembled view-model. */

import type {
  Application,
  CertRow,
  DocumentRow,
  FeatureRow,
  Product,
  ProductCategory,
  StandardRow,
  SymbolRow,
  VariantColumn,
} from './catalog';

/* One "facts" strip row (under the title): a numeric table column and its
 * distinct values across the product's variants. The component renders the
 * column label (localized) and the sorted values. */
export type ValueFact = {
  col: VariantColumn;
  values: number[];
};

/* View-model assembled by useProductData for the Product page. */
export type ProductData = {
  product: Product;
  title: string;
  category: ProductCategory;
  categoryLabel: string;
  /* Application usage pages the editor tagged this product with
   * (resolved Application objects, catalog-ID order). */
  applications: Application[];
  related: Product[];
  specs: SymbolRow[];
  certs: CertRow[];
  standards: StandardRow[];
  documents: DocumentRow[];
  features: FeatureRow[];
  /* The variant table — fully generic, editors pick its columns per
   * product from the shared Table columns library. False for table-less
   * products (no column pick picked or no variant rows at all). */
  columns: VariantColumn[];
  hasTable: boolean;
  facts: ValueFact[];
  videoId: string | undefined;
  hasPrice: boolean;
  priceRange: string | null;
  sizeUnit: string;
  aboutText: string;
};
