import { useTranslation } from 'react-i18next';
import { products, type Product } from '../../data/catalog';
import highlightedData from '../../data/highlighted.json';
import ProductCard from '../ProductCard/ProductCard';
import styles from './HighlightedProducts.module.css';

export default function HighlightedProducts() {
  const { t } = useTranslation();
  const items = highlightedData.items
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 6);

  return (
    <section className={styles.section} aria-labelledby="highlighted-title">
      <div className={styles.wrap}>
        <h2 id="highlighted-title" className={styles.title}>
          {t('highlighted.title', { defaultValue: highlightedData.title })}
        </h2>
        <p className={styles.subtitle}>{t('highlighted.subtitle', { defaultValue: highlightedData.subtitle })}</p>
        <ul className={styles.grid}>
          {items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
