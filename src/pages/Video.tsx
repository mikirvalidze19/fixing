import { Link } from 'react-router-dom';
import videos from '../data/videos.json';
import styles from './Video.module.css';

export default function Video() {
  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">|</span>
        <Link to="/services-and-support">Services and support</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">Video</span>
      </nav>

      <h1 className={styles.title}>Video</h1>

      <ul className={styles.grid}>
        {videos.map((video) => (
          <li key={video.src} className={styles.card}>
            <div className={styles.player}>
              <video
                controls
                controlsList="nodownload"
                preload="none"
                poster={video.poster}
              >
                <source src={video.src} type="video/mp4" />
              </video>
            </div>
            <h2 className={styles.cardTitle}>{video.title}</h2>
          </li>
        ))}
      </ul>
    </div>
  );
}
