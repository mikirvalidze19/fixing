/* Shared product helpers (pure functions + asset lookup).
 * Lives in its own module so component files only export components
 * (Fast Refresh compatible). Consumed by ProductCard and Product page. */

import type { Product } from '../models/catalog';

const productImages = import.meta.glob(
  '../assets/products/*.webp',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

export function productImageSrc(id: string): string {
  const entry = Object.entries(productImages).find(([path]) =>
    path.endsWith(`/${id}.webp`),
  );
  return entry ? entry[1] : '';
}

export function minPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.priceGel));
}

export function formatGel(value: number): string {
  return `₾${value.toFixed(2)}`;
}
