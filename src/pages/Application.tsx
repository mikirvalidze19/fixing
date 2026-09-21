import { Link, useParams } from 'react-router-dom';
import { applications, products, type Product } from '../data/catalog';
import ProductCard from '../components/ProductCard/ProductCard';
import Placeholder from './Placeholder';
import styles from './Applications.module.css';

export default function Application() {
  const { slug } = useParams();
  const app = applications.find((a) => a.slug === slug);

  if (!app) return <Placeholder title="Application not found" />;

  const items = app.products
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">|</span>
        <Link to="/applications">Applications</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{app.label}</span>
      </nav>

      <h1 className={styles.title}>{app.label}</h1>
      <p className={styles.desc}>{app.description}</p>

      {items.length > 0 ? (
        <>
          <p className={styles.count}>
            {items.length} {items.length === 1 ? 'product' : 'products'}
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
          No products in this application yet — check back soon.
        </p>
      )}
    </div>
  );
}
