import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { categories, categoryProducts, products } from '../data/catalog';
import type { Product } from '../models/catalog';
import ProductCard from '../components/ProductCard/ProductCard';
import Placeholder from './Placeholder';
import styles from './Category.module.css';

const PREVIEW_CHARS = 180;

const productMap = categoryProducts as Record<string, string[]>;

export default function Category() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [expanded, setExpanded] = useState(false);
  const category = categories.find((c) => c.slug === slug);

  if (!category) return <Placeholder title={t('categoryPage.notFound')} />;

  const label = t(`categories.${category.slug}.label`, { defaultValue: category.label });
  const description = t(`categories.${category.slug}.description`, { defaultValue: category.description });

  const items = (productMap[category.slug] ?? [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const long = description.length > PREVIEW_CHARS;
  const text = expanded || !long
    ? description
    : `${description.slice(0, PREVIEW_CHARS)}…`;

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{label}</span>
      </nav>

      <h1 className={styles.title}>{label}</h1>
      <p className={styles.desc}>
        {text}{' '}
        {long && (
          <button
            type="button"
            className={styles.more}
            onClick={() => setExpanded((v) => !v)}
          >
            [{expanded ? t('categoryPage.showLess') : t('categoryPage.showMore')}]
          </button>
        )}
      </p>

      {items.length > 0 ? (
        <>
          <p className={styles.count}>
            {items.length} {items.length === 1 ? t('categoryPage.product') : t('categoryPage.products')}
          </p>
          <ul className={styles.grid}>
            {items.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.empty}>
          {t('categoryPage.empty')}
        </p>
      )}
    </div>
  );
}
