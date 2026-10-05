import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applications, products } from '../data/catalog';
import type { Product } from '../models/catalog';
import ProductCard from '../components/ProductCard/ProductCard';
import Placeholder from './Placeholder';
import styles from './Applications.module.css';

export default function Application() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const app = applications.find((a) => a.slug === slug);

  if (!app) return <Placeholder title={t('application.notFound')} />;

  const items = app.products
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        <Link to="/applications">{t('nav.applications')}</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{app.label}</span>
      </nav>

      <h1 className={styles.title}>{app.label}</h1>
      <p className={styles.desc}>{app.description}</p>

      {items.length > 0 ? (
        <>
          <p className={styles.count}>
            {items.length} {items.length === 1 ? t('categoryPage.product') : t('categoryPage.products')}
          </p>
          <ul className={styles.productGrid}>
            {items.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.empty}>
          {t('application.empty')}
        </p>
      )}
    </div>
  );
}
