/* Generic variant-table access helpers (pure functions).
 *
 * The table is CMS-defined: a product picks columns from the shared
 * "Table columns" library (see docs/TABLE-ARCHITECTURE.md) and every
 * variant row stores one positional cell per chosen column. These helpers
 * are the only bridge between components and the positional data — no
 * page reads `variant.cells[i]` directly. */

import type {
  ColumnRole,
  Product,
  Variant,
  VariantColumn,
} from '../models/catalog';

/* Index of the column inside the product's pick (−1 when not picked). */
function columnIndex(
  product: Product,
  column: VariantColumn | string,
): number {
  const key = typeof column === 'string' ? column : column.key;
  return product.columns.findIndex((col) => col.key === key);
}

/* First picked column carrying the given role — the feature hooks of the
 * table (SKU for search, price strip, diameter/length descriptions). */
export function roleColumn(
  product: Product,
  role: ColumnRole,
): VariantColumn | null {
  return product.columns.find((col) => col.role === role) ?? null;
}

/* Raw cell value for the given column (number/string, or null). */
export function variantValue(
  product: Product,
  variant: Variant,
  column: VariantColumn | string,
): number | string | null {
  const index = columnIndex(product, column);
  return variant.cells[index] ?? null;
}

/* Numeric cell value, or null when the cell is missing/text. */
export function variantNumber(
  product: Product,
  variant: Variant,
  column: VariantColumn | string,
): number | null {
  const value = variantValue(product, variant, column);
  return typeof value === 'number' ? value : null;
}

/* Display string for a cell — em dash for missing values, matching the
 * legacy table style. Price columns are formatted by the caller. */
export function variantText(
  product: Product,
  variant: Variant,
  column: VariantColumn | string,
): string {
  const value = variantValue(product, variant, column);
  return value === null ? '—' : String(value);
}

/* All numeric values of one column, in row order (duplicates kept). */
export function columnNumbers(
  product: Product,
  column: VariantColumn | string,
): number[] {
  const index = columnIndex(product, column);
  if (index < 0) return [];
  return product.variants.flatMap((variant) => {
    const value = variant.cells[index];
    return typeof value === 'number' ? [value] : [];
  });
}

/* All values of the price-role column ([] when no price column or no
 * numbers — numeric zeros count, mirroring legacy behavior). */
export function priceValues(product: Product): number[] {
  const column = roleColumn(product, 'price');
  return column ? columnNumbers(product, column) : [];
}

/* Card/accordion headline for one variant: the SKU-role cell when present,
 * otherwise the first non-blank cell, else an em dash. */
export function variantTitle(product: Product, variant: Variant): string {
  const skuColumn = roleColumn(product, 'sku');
  if (skuColumn) {
    const text = variantText(product, variant, skuColumn);
    if (text !== '—') return text;
  }
  for (const column of product.columns) {
    const value = variantValue(product, variant, column);
    if (value !== null && String(value).trim() !== '') return String(value);
  }
  return '—';
}
