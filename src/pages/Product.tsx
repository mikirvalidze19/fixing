import { Link, useParams } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import categories from '../data/product-categories.json';
import categoryProducts from '../data/category-products.json';
import companyData from '../data/data.json';
import { products, type Product } from '../data/catalog';
import ProductCard, {
  formatGel,
  minPrice,
  productImageSrc,
} from '../components/ProductCard/ProductCard';
import Placeholder from './Placeholder';
import styles from './Product.module.css';

const productMap = categoryProducts as Record<string, string[]>;
const { company } = companyData;

function findCategory(productId: string) {
  return categories.find((c) => (productMap[c.slug] ?? []).includes(productId));
}

const cell = (value: number | string | null) => value ?? '—';

export default function Product() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  if (!product) return <Placeholder title="Product not found" />;

  const category = findCategory(product.id);
  const related = category
    ? (productMap[category.slug] ?? [])
        .filter((pid) => pid !== product.id)
        .map((pid) => products.find((p) => p.id === pid))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 3)
    : [];

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">|</span>
        {category ? (
          <>
            <Link to={`/products/${category.slug}`}>{category.label}</Link>
            <span aria-hidden="true">|</span>
          </>
        ) : null}
        <span aria-current="page">{product.series}</span>
      </nav>

      <p className={styles.eyebrow}>{product.series}</p>
      <h1 className={styles.title}>{product.titleEn}</h1>
      <p className={styles.subtitle}>{product.titleKa}</p>

      <div className={styles.hero}>
        <div className={styles.image}>
          {productImageSrc(product.id) ? (
            <img
              src={productImageSrc(product.id)}
              alt={`${product.series} — ${product.titleEn}`}
            />
          ) : (
            <span className={styles.ghost} aria-hidden="true">
              {product.series}
            </span>
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Starting from</span>
            <strong className={styles.metaPrice}>
              {formatGel(minPrice(product))}
            </strong>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Variants</span>
            <span className={styles.metaValue}>
              {product.variants.length}{' '}
              {product.variants.length === 1 ? 'size' : 'sizes'}
            </span>
          </div>
          <div className={styles.actions}>
            <a
              className={styles.primaryBtn}
              href={`mailto:${company.email}?subject=Enquiry%20${encodeURIComponent(product.series)}`}
            >
              <Mail size={16} strokeWidth={2.2} aria-hidden="true" />
              Request price
            </a>
            <a
              className={styles.ghostBtn}
              href={`tel:${company.phones[0].replace(/[^+\d]/g, '')}`}
            >
              <Phone size={16} strokeWidth={2.2} aria-hidden="true" />
              Technical help
            </a>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Available variants</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Ø (mm)</th>
              <th scope="col">Length (mm)</th>
              <th scope="col">Units / box</th>
              <th scope="col">Price</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <tr key={v.sku}>
                <td data-label="SKU" className={styles.sku}>
                  {v.sku}
                </td>
                <td data-label="Ø (mm)">{cell(v.diameterMm)}</td>
                <td data-label="Length (mm)">{cell(v.lengthMm)}</td>
                <td data-label="Units / box">{v.unitsPerBox}</td>
                <td data-label="Price" className={styles.price}>
                  {formatGel(v.priceGel)}
                </td>
                <td data-label="Note">{cell(v.note)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className={styles.sectionTitle}>
            Related products
          </h2>
          <ul className={styles.grid}>
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
