import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applications } from '../data/applications';
import styles from './Applications.module.css';

export default function Applications() {
  const { t, i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{t('nav.applications')}</span>
      </nav>

      <h1 className={styles.title}>{t('applications.title', { defaultValue: 'Applications' })}</h1>

      <ul className={styles.grid}>
        {applications.map((app) => (
          <li key={app.slug} className={styles.card}>
            <Link to={`/applications/${app.slug}`} className={styles.link}>
              <span className={styles.thumb}>
                <img src={app.image} alt="" loading="lazy" />
              </span>
              <span className={styles.label}>{ka && app.labelKa ? app.labelKa : app.labelEn}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
