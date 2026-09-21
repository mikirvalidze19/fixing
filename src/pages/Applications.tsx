import { Link } from 'react-router-dom';
import { applications } from '../data/catalog';
import styles from './Applications.module.css';

export default function Applications() {
  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">Applications</span>
      </nav>

      <h1 className={styles.title}>Applications</h1>

      <ul className={styles.grid}>
        {applications.map((app) => (
          <li key={app.slug} className={styles.card}>
            <Link to={`/applications/${app.slug}`} className={styles.link}>
              <span className={styles.thumb}>
                <img src={app.image} alt="" loading="lazy" />
              </span>
              <span className={styles.label}>{app.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
