import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import categories from '../data/product-categories.json';
import categoryProducts from '../data/category-products.json';
import { products, type Product } from '../data/catalog';
import ProductCard from '../components/ProductCard/ProductCard';
import Placeholder from './Placeholder';
import styles from './Category.module.css';

const PREVIEW_CHARS = 180;

const productMap = categoryProducts as Record<string, string[]>;

export default function Category() {
  const { slug } = useParams();
  const [expanded, setExpanded] = useState(false);
  const category = categories.find((c) => c.slug === slug);

  if (!category) return <Placeholder title="Category not found" />;

  const items = (productMap[category.slug] ?? [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const long = category.description.length > PREVIEW_CHARS;
  const text = expanded || !long
    ? category.description
    : `${category.description.slice(0, PREVIEW_CHARS)}…`;

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{category.label}</span>
      </nav>

      <h1 className={styles.title}>{category.label}</h1>
      <p className={styles.desc}>
        {text}{' '}
        {long && (
          <button
            type="button"
            className={styles.more}
            onClick={() => setExpanded((v) => !v)}
          >
            [{expanded ? 'show less' : 'show more'}]
          </button>
        )}
      </p>

      {items.length > 0 ? (
        <>
          <p className={styles.count}>
            {items.length} {items.length === 1 ? 'product' : 'products'}
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
          No products in this category yet — check back soon.
        </p>
      )}
    </div>
  );
}
