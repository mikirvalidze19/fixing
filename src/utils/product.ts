/* Shared product helpers (pure functions + asset lookup).
 * Lives in its own module so component files only export components
 * (Fast Refresh compatible). Consumed by ProductCard and Product page. */

import type { Product } from '../models/catalog';
import { productImageUrl } from '../data/images';

export function productImageSrc(product: Product): string {
  return productImageUrl(product.id, product.image);
}

export function minPrice(product: Product): number {
  const prices = product.variants.map((v) => v.priceGel);
  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

export function formatGel(value: number): string {
  return `₾${value.toFixed(2)}`;
}

/* Picks the language-appropriate label for a normalized content row
 * (spec symbols, certifications, standards). */
export function pickLabel(
  row: { label: string; labelKa?: string | null },
  language: string,
): string {
  return language === 'ka' && row.labelKa ? row.labelKa : row.label;
}
