import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import videos from '../data/videos.json';
import styles from './Video.module.css';

function getYouTubeId(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').split(/[?#]/)[0];
    }
    const v = parsed.searchParams.get('v');
    if (v) return v;
    const embedMatch = parsed.pathname.match(/\/embed\/([\w-]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    // fall through
  }
  return url;
}

export default function Video() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        <Link to="/services-and-support">{t('nav.services')}</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{t('videoPage.title')}</span>
      </nav>

      <h1 className={styles.title}>{t('videoPage.title')}</h1>

      <ul className={styles.grid}>
        {videos.map((video) => (
          <li key={video.youtube} className={styles.card}>
            <div className={styles.player}>
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(video.youtube)}?rel=0`}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <h2 className={styles.cardTitle}>{video.title}</h2>
          </li>
        ))}
      </ul>
    </div>
  );
}
