import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import type { Product } from '../../models/catalog';
import type { ProductSymbol } from '../../models/product';
import symbolsData from '../../data/product-symbols.json';
import styles from './ProductCard.module.css';

const symbolMap = symbolsData.symbols as Record<string, ProductSymbol[]>;

const symbolUrls = import.meta.glob(
  '../../assets/symbols/*.{png,webp,svg}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const productImages = import.meta.glob(
  '../../assets/products/*.webp',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

export function productImageSrc(id: string): string {
  const entry = Object.entries(productImages).find(([path]) =>
    path.endsWith(`/${id}.webp`),
  );
  return entry ? entry[1] : '';
}

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
  const { t, i18n } = useTranslation();
  const title = i18n.language === 'ka' && product.titleKa ? product.titleKa : product.titleEn;
  const [expanded, setExpanded] = useState(false);
  const symbols = symbolMap[product.id] ?? [];
  const clippable = title.length > CLAMP_CHARS;
  const imageSrc = productImageSrc(product.id);

  return (
    <article className={styles.card}>
      <Link
        to={`/product/${product.id}`}
        className={styles.cardLink}
        aria-label={`${product.series} — ${title}. ${t('productCard.viewDetails')}`}
      />

      <div className={styles.image}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${product.series} — ${title}`}
            loading="lazy"
          />
        ) : (
          <span className={styles.ghost} aria-hidden="true">
            {product.series}
          </span>
        )}
      </div>

      <div className={styles.details}>
        <h4 className={styles.code}>{product.series}</h4>
        <p className={`${styles.desc} ${expanded ? styles.descOpen : ''}`}>
          {title}
        </p>
        {clippable && (
          <button
            type="button"
            className={`${styles.toggle} ${expanded ? styles.toggleOpen : ''}`}
            aria-expanded={expanded}
            aria-label={expanded ? t('productCard.showLess') : t('productCard.showFull')}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}

        <div className={styles.symbols} aria-label={t('productCard.symbols')}>
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
        <span className={styles.from}>{t('productCard.from')}</span>
        <strong className={styles.amount}>{formatGel(minPrice(product))}</strong>
        <span className={styles.variants}>
          {product.variants.length}{' '}
          {product.variants.length === 1 ? t('productCard.variant') : t('productCard.variants')}
        </span>
      </div>
    </article>
  );
}
