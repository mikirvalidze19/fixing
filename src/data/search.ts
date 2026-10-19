import { products } from './catalog';
import categories from './product-categories.json';
import categoryProducts from './category-products.json';
import type { Product } from '../models/catalog';

export type ProductSearchResult = {
  product: Product;
  categorySlug: string | null;
  categoryLabel: string | null;
};

type IndexEntry = ProductSearchResult & {
  series: string;
  skus: string[];
  haystack: string;
};

const productMap = categoryProducts as Record<string, string[]>;
const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));

const categorySlugByProduct = new Map<string, string>();
for (const [slug, ids] of Object.entries(productMap)) {
  for (const id of ids) {
    if (!categorySlugByProduct.has(id)) categorySlugByProduct.set(id, slug);
  }
}

const index: IndexEntry[] = products.map((product) => {
  const categorySlug = categorySlugByProduct.get(product.id) ?? null;
  const category = categorySlug ? categoriesBySlug.get(categorySlug) : undefined;
  const skus = product.variants.map((variant) => variant.sku);
  return {
    product,
    categorySlug,
    categoryLabel: category?.label ?? null,
    series: product.series.toLowerCase(),
    skus: skus.map((sku) => sku.toLowerCase()),
    haystack: [
      product.id,
      product.series,
      product.titleEn,
      product.titleKa,
      ...skus,
      category?.label ?? '',
    ]
      .join(' ')
      .toLowerCase(),
  };
});

function scoreEntry(entry: IndexEntry, terms: string[]): number {
  let score = 0;
  for (const term of terms) {
    if (entry.series === term) {
      score += 100;
    } else if (entry.series.startsWith(term)) {
      score += 60;
    } else if (entry.series.includes(term)) {
      score += 40;
    } else if (entry.skus.some((sku) => sku.includes(term))) {
      score += 30;
    } else if (entry.haystack.includes(term)) {
      score += 10;
    } else {
      return -1;
    }
  }
  return score;
}

export function searchProducts(query: string, limit = 8): ProductSearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return index
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter((match) => match.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => ({
      product: entry.product,
      categorySlug: entry.categorySlug,
      categoryLabel: entry.categoryLabel,
    }));
}
