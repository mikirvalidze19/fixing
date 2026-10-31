import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applicationProducts, applications } from '../data/applications';
import type { Product } from '../models/catalog';
import ProductCard from '../components/ProductCard/ProductCard';
import Placeholder from './Placeholder';
import styles from './Applications.module.css';

export default function Application() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const app = applications.find((a) => a.slug === slug);
  const ka = i18n.language === 'ka';

  if (!app) return <Placeholder title={t('application.notFound')} />;

  const label = ka && app.labelKa ? app.labelKa : app.labelEn;
  const description = ka && app.descriptionKa ? app.descriptionKa : app.descriptionEn;
  /* Membership is derived: every product whose CMS "Applications" pick
   * contains this application. */
  const items: Product[] = applicationProducts(app.slug);

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        <Link to="/applications">{t('nav.applications')}</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{label}</span>
      </nav>

      <h1 className={styles.title}>{label}</h1>
      <p className={styles.desc}>{description}</p>

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
