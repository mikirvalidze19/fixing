import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { Product } from '../../data/catalog';
import symbolsData from '../../data/product-symbols.json';
import styles from './ProductCard.module.css';

type Symbol = { icon: string; label: string };
const symbolMap = symbolsData.symbols as Record<string, Symbol[]>;

const symbolUrls = import.meta.glob(
  '../../assets/symbols/*.{png,webp,svg}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

function symbolSrc(file: string): string {
  const entry = Object.entries(symbolUrls).find(([path]) => path.endsWith(`/${file}`));
  return entry ? entry[1] : '';
}

export function minPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.priceGel));
}

export function formatGel(value: number): string {
  return `₾${value.toFixed(2)}`;
}

/* Long descriptions get the tecfi-style expand chevron. */
const CLAMP_CHARS = 60;

/* Shared product card — mirrors tecfi single_gamma_card flow top→bottom:
   1) image, 2) series code, 3) short description (+ expand chevron),
   4) symbol icons, 5) price strip. The whole card is one anchor to the
   product details page (overlay link, tecfi sgc_link_global pattern);
   the chevron sits above the overlay so it stays clickable.
   Equal height via flex + clamped text. */
export default function ProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const symbols = symbolMap[product.id] ?? [];
  const clippable = product.titleEn.length > CLAMP_CHARS;

  return (
    <article className={styles.card}>
      <Link
        to={`/product/${product.id}`}
        className={styles.cardLink}
        aria-label={`${product.series} — ${product.titleEn}. View product details.`}
      />

      <div className={styles.image}>
        <span className={styles.ghost} aria-hidden="true">
          {product.series}
        </span>
      </div>

      <div className={styles.details}>
        <h4 className={styles.code}>{product.series}</h4>
        <p className={`${styles.desc} ${expanded ? styles.descOpen : ''}`}>
          {product.titleEn}
        </p>
        {clippable && (
          <button
            type="button"
            className={`${styles.toggle} ${expanded ? styles.toggleOpen : ''}`}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show less' : 'Show full description'}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}

        <div className={styles.symbols} aria-label="Product symbols">
          {symbols.map((symbol) => (
            <img
              key={symbol.icon}
              src={symbolSrc(symbol.icon)}
              alt={symbol.label}
              title={symbol.label}
              loading="lazy"
            />
          ))}
        </div>
      </div>

      <div className={styles.priceBar}>
        <span className={styles.from}>from</span>
        <strong className={styles.amount}>{formatGel(minPrice(product))}</strong>
        <span className={styles.variants}>
          {product.variants.length}{' '}
          {product.variants.length === 1 ? 'variant' : 'variants'}
        </span>
      </div>
    </article>
  );
}
