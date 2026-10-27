import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ChevronDown, ExternalLink, FileText, Mail, Phone } from 'lucide-react';
import companyData from '../data/data.json';
import {
  categoryProducts,
  productCategory,
  products,
} from '../data/catalog';
import type {
  DocumentRow,
  FeatureRow,
  Product,
  ProductCategory,
  StandardRow,
  Variant,
  VariantColumn,
} from '../models/catalog';
import type { ProductData } from '../models/product';
import ProductCard from '../components/ProductCard/ProductCard';
import { formatGel, minPrice, pickLabel, productImageSrc } from '../utils/product';
import Placeholder from './Placeholder';
import styles from './Product.module.css';

const { company } = companyData;

const productMap = categoryProducts as Record<string, string[]>;

/* Category lookup comes straight from the catalog adapter. */

const cell = (value: number | string | null | undefined) => value ?? '—';

/* Pure derivation helpers (ordinary functions — no JSX, no hooks). */

/* Standard "Available variants" columns — identical for every product that
 * has no custom `variantColumns` (localized as before). */
function defaultColumns(t: TFunction): VariantColumn[] {
  return [
    { key: 'sku', slot: 'sku', label: t('productPage.colSku') },
    { key: 'diameterMm', slot: 'diameterMm', label: t('productPage.colDiameter') },
    { key: 'lengthMm', slot: 'lengthMm', label: t('productPage.colLength') },
    { key: 'unitsPerBox', slot: 'unitsPerBox', label: t('productPage.colUnits') },
    { key: 'priceGel', slot: 'priceGel', label: t('productPage.colPrice') },
    { key: 'note', slot: 'note', label: t('productPage.colNote') },
  ];
}

/* Cell text for one variant + data slot. Standard slots keep their exact
 * legacy rendering (em dash when missing, formatted price). */
function cellFor(variant: Variant, slot: string): string {
  switch (slot) {
    case 'sku':
      return variant.sku;
    case 'priceGel':
      return typeof variant.priceGel === 'number'
        ? formatGel(variant.priceGel)
        : '—';
    case 'diameterMm':
      return String(cell(variant.diameterMm));
    case 'lengthMm':
      return String(cell(variant.lengthMm));
    case 'unitsPerBox':
      return String(cell(variant.unitsPerBox));
    case 'note':
      return String(cell(variant.note));
    default: {
      const value = (variant as unknown as Record<string, string | null>)[slot];
      return String(cell(value));
    }
  }
}

function uniqNums(values: (number | string | null)[]): number[] {
  return [...new Set(values.filter((v): v is number => typeof v === 'number'))].sort(
    (a, b) => a - b,
  );
}

function rangeText(vals: number[], unit: string): string | null {
  if (vals.length === 0) return null;
  if (vals.length === 1) return `${vals[0]} ${unit}`;
  return `${vals[0]}–${vals[vals.length - 1]} ${unit}`;
}

function priceRangeText(prices: number[]): string | null {
  if (prices.length === 0) return null;
  return `${formatGel(Math.min(...prices))} – ${formatGel(Math.max(...prices))}`;
}

function selectTitle(language: string, product: Product): string {
  return language === 'ka' && product.titleKa ? product.titleKa : product.titleEn;
}

function findRelated(productId: string, category: ProductCategory): Product[] {
  if (!category) return [];
  return (productMap[category.slug] ?? [])
    .filter((pid) => pid !== productId)
    .map((pid) => products.find((p) => p.id === pid))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 3);
}

function buildAboutText(
  t: TFunction,
  args: {
    series: string;
    count: number;
    sizeUnit: string;
    category: ProductCategory;
    categoryLabel: string;
    diameters: number[];
    lengths: number[];
    priceRange: string | null;
  },
): string {
  let text = t('productPage.aboutOffers', {
    series: args.series,
    count: args.count,
    unit: args.sizeUnit,
  });
  if (args.category)
    text += t('productPage.aboutIn', { category: args.categoryLabel });
  const diaRange = rangeText(args.diameters, 'mm Ø');
  if (diaRange) text += t('productPage.aboutDiameters', { range: diaRange });
  const lenRange = rangeText(args.lengths, 'mm');
  if (lenRange) text += t('productPage.aboutLengths', { range: lenRange });
  if (args.priceRange)
    text += t('productPage.aboutPrices', { range: args.priceRange });
  return `${text}.`;
}

/* Cohesive data logic for the page. Straight-line composition over the
 * pure helpers above — no render branches live here. */
function useProductData(id: string | undefined): ProductData | null {
  const { t, i18n } = useTranslation();
  const product = products.find((p) => p.id === id);
  if (!product) return null;
  const category = productCategory(product.id);
  const categoryLabel = category
    ? t(`categories.${category.slug}.label`, { defaultValue: category.label })
    : '';
  const diameters = uniqNums(product.variants.map((v) => v.diameterMm));
  const lengths = uniqNums(product.variants.map((v) => v.lengthMm));
  const packs = uniqNums(product.variants.map((v) => v.unitsPerBox));
  const prices = product.variants
    .map((v) => v.priceGel)
    .filter((v): v is number => typeof v === 'number');
  const priceRange = priceRangeText(prices);
  const sizeUnit =
    product.variants.length === 1 ? t('productPage.size') : t('productPage.sizes');
  /* Editor-written description wins; otherwise the auto-generated text. */
  const customAbout =
    i18n.language === 'ka' ? product.descriptionKa : product.descriptionEn;
  return {
    product,
    title: selectTitle(i18n.language, product),
    category,
    categoryLabel,
    related: findRelated(product.id, category),
    specs: product.specs ?? [],
    certs: product.certs ?? [],
    standards: product.standards ?? [],
    documents: product.documents ?? [],
    features: product.features ?? [],
    columns:
      product.variantColumns && product.variantColumns.length > 0
        ? product.variantColumns
        : defaultColumns(t),
    videoId: product.youtube ?? undefined,
    hasPrice: product.variants.some(
      (v) => typeof v.priceGel === 'number' && v.priceGel > 0,
    ),
    diameters,
    lengths,
    packs,
    priceRange,
    sizeUnit,
    aboutText:
      (customAbout && customAbout.trim()) ||
      buildAboutText(t, {
        series: product.series,
        count: product.variants.length,
        sizeUnit,
        category,
        categoryLabel,
        diameters,
        lengths,
        priceRange,
      }),
  };
}

export default function Product() {
  const { t } = useTranslation();
  const { id } = useParams();
  const data = useProductData(id);

  if (!data) return <Placeholder title={t('productPage.notFound')} />;

  return (
    <div className={styles.page}>
      <ProductCrumbs
        category={data.category}
        categoryLabel={data.categoryLabel}
        series={data.product.series}
      />

      <div className={styles.hero}>
        <ProductHeroImage
          product={data.product}
          title={data.title}
        />
        <ProductMeta
          product={data.product}
          sizeUnit={data.sizeUnit}
          hasPrice={data.hasPrice}
        />
        <ProductInfo data={data} />
        <ProductStandards rows={[...data.standards, ...data.certs]} />
      </div>

      <ProductFeatures features={data.features} />
      <h2 className={styles.sectionTitle}>{t('productPage.availableVariants')}</h2>
      <VariantTable product={data.product} columns={data.columns} />
      {/* key remount resets the open card on navigation — no reset effect */}
      <VariantCards
        key={data.product.id}
        product={data.product}
        columns={data.columns}
      />
      <ProductDocuments documents={data.documents} />
      <ProductVideo videoId={data.videoId} series={data.product.series} />
      <RelatedProducts related={data.related} />
    </div>
  );
}

function ProductCrumbs({
  category,
  categoryLabel,
  series,
}: {
  category: ProductCategory;
  categoryLabel: string;
  series: string;
}) {
  const { t } = useTranslation();
  return (
    <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
      <Link to="/">{t('common.home')}</Link>
      <span aria-hidden="true">|</span>
      {category ? (
        <>
          <Link to={`/products/${category.slug}`}>{categoryLabel}</Link>
          <span aria-hidden="true">|</span>
        </>
      ) : null}
      <span aria-current="page">{series}</span>
    </nav>
  );
}

function ProductHeroImage({
  product,
  title,
}: {
  product: Product;
  title: string;
}) {
  const src = productImageSrc(product);
  return (
    <div className={styles.image}>
      {src ? (
        <img src={src} alt={`${product.series} — ${title}`} />
      ) : (
        <span className={styles.ghost} aria-hidden="true">
          {product.series}
        </span>
      )}
    </div>
  );
}

function ProductMeta({
  product,
  sizeUnit,
  hasPrice,
}: {
  product: Product;
  sizeUnit: string;
  hasPrice: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.meta}>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>{t('productPage.startingFrom')}</span>
        <strong className={styles.metaPrice}>
          {formatGel(minPrice(product))}
        </strong>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>{t('productPage.variants')}</span>
        <span className={styles.metaValue}>
          {product.variants.length}{' '}
          {sizeUnit}
        </span>
      </div>
      <div className={styles.actions}>
        {!hasPrice && (
          <a
            className={styles.primaryBtn}
            href={`mailto:${company.email}?subject=Enquiry%20${encodeURIComponent(product.series)}`}
          >
            <Mail size={16} strokeWidth={2.2} aria-hidden="true" />
            {t('productPage.requestPrice')}
          </a>
        )}
        <a
          className={styles.ghostBtn}
          href={`tel:${company.phones[0].replace(/[^+\d]/g, '')}`}
        >
          <Phone size={16} strokeWidth={2.2} aria-hidden="true" />
          {t('productPage.technicalHelp')}
        </a>
      </div>
    </div>
  );
}

function ProductInfo({ data }: { data: ProductData }) {
  const { t } = useTranslation();
  const { product, title, aboutText, specs, category, categoryLabel } = data;
  const { diameters, lengths, packs, priceRange } = data;
  return (
    <div className={styles.info}>
      <h1 className={styles.name}>{product.series}</h1>
      <p className={styles.desc}>{title}</p>
      <p className={styles.about}>{aboutText}</p>

      {specs.length > 0 && (
        <ul className={styles.specs} aria-label={t('productPage.technicalData')}>
          {specs.map((spec, index) => (
            <li
              key={`${spec.icon}-${index}`}
              className={styles.spec}
            >
              <img
                src={spec.icon}
                alt={spec.label}
                title={spec.label}
              />
              {spec.value ? <span>{spec.value}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <dl className={styles.facts}>
        {category && (
          <div className={styles.fact}>
            <dt>{t('productPage.category')}</dt>
            <dd>
              <Link to={`/products/${category.slug}`}>{categoryLabel}</Link>
            </dd>
          </div>
        )}
        {diameters.length > 0 && (
          <div className={styles.fact}>
            <dt>{t('productPage.diameters')}</dt>
            <dd>{diameters.map((d) => `${d} mm`).join(', ')}</dd>
          </div>
        )}
        {lengths.length > 0 && (
          <div className={styles.fact}>
            <dt>{t('productPage.lengths')}</dt>
            <dd>{lengths.map((l) => `${l} mm`).join(', ')}</dd>
          </div>
        )}
        {packs.length > 0 && (
          <div className={styles.fact}>
            <dt>{t('productPage.packSizes')}</dt>
            <dd>{packs.map((p) => `${p} pcs`).join(', ')}</dd>
          </div>
        )}
        {priceRange && (
          <div className={styles.fact}>
            <dt>{t('productPage.priceRange')}</dt>
            <dd>{priceRange}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* Standards & certifications box — normalized rows already carry resolved
 * image URLs and display labels; standards rows come first (as before). */
function ProductStandards({ rows }: { rows: StandardRow[] }) {
  const { t, i18n } = useTranslation();
  if (rows.length === 0) return null;
  const lang = i18n.language;
  return (
    <aside className={styles.side}>
      <ul className={styles.standards} aria-label={t('productPage.standards')}>
        {rows.map((item, index) => {
          const label = pickLabel(item, lang);
          return (
            <li key={`${index}-${label}`} className={styles.standard}>
              <img
                className={styles.stdIcon}
                src={item.icon}
                alt=""
                aria-hidden="true"
              />
              <div>
                {label ? <p className={styles.stdLabel}>{label}</p> : null}
                {item.value ? (
                  <p className={styles.stdValue}>{item.value}</p>
                ) : null}
                {item.badge && (
                  <img
                    className={styles.stdBadge}
                    src={item.badge}
                    alt={[label, item.value].filter(Boolean).join(' ')}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function VariantTable({
  product,
  columns,
}: {
  product: Product;
  columns: VariantColumn[];
}) {
  const { i18n } = useTranslation();
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {pickLabel(col, i18n.language)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {product.variants.map((v) => (
            <tr key={v.sku}>
              {columns.map((col) => {
                const value = cellFor(v, col.slot);
                return (
                  <td
                    key={col.key}
                    data-label={pickLabel(col, i18n.language)}
                    className={
                      col.slot === 'sku'
                        ? styles.sku
                        : col.slot === 'priceGel'
                          ? styles.price
                          : undefined
                    }
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VariantCards({
  product,
  columns,
}: {
  product: Product;
  columns: VariantColumn[];
}) {
  const { t, i18n } = useTranslation();
  const [openSku, setOpenSku] = useState<string | null>(null);
  return (
    <ul className={styles.cards} aria-label={t('productPage.availableVariants')}>
      {product.variants.map((v) => {
        const open = openSku === v.sku;
        return (
          <li
            key={v.sku}
            className={open ? `${styles.card} ${styles.open}` : styles.card}
          >
            <button
              type="button"
              className={styles.cardHead}
              aria-expanded={open}
              aria-controls={`variant-${v.sku}`}
              onClick={() => setOpenSku((prev) => (prev === v.sku ? null : v.sku))}
            >
              <span className={styles.cardSku}>{v.sku}</span>
              <ChevronDown
                className={styles.chevron}
                size={20}
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </button>
            <div
              className={styles.cardBody}
              id={`variant-${v.sku}`}
              role="region"
              aria-hidden={!open}
            >
              <div className={styles.cardInner}>
                <dl className={styles.details}>
                  {columns.map((col) => {
                    const value = cellFor(v, col.slot);
                    const label = pickLabel(col, i18n.language);
                    return (
                      <div
                        key={col.key}
                        className={styles.detail}
                      >
                        <dt>{label}</dt>
                        <dd className={col.slot === 'priceGel' ? styles.price : undefined}>
                          {value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProductFeatures({ features }: { features: FeatureRow[] }) {
  const { t } = useTranslation();
  if (features.length === 0) return null;
  return (
    <section
      className={styles.featuresSection}
      aria-labelledby="product-features-heading"
    >
      <h2 id="product-features-heading" className={styles.sectionTitle}>
        {t('productPage.technicalFeatures')}
      </h2>
      <ul className={styles.features}>
        {features.map((feature) => (
          <li
            key={`${feature.label ?? ''}-${feature.value}`}
            className={styles.feature}
          >
            {feature.label ? (
              <>
                <span className={styles.featureLabel}>{feature.label}:</span>{' '}
                <strong className={styles.featureValue}>{feature.value}</strong>
              </>
            ) : (
              <>
                <span className={styles.featureDot} aria-hidden="true">
                  •
                </span>
                <span className={styles.featureText}>{feature.value}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductDocuments({ documents }: { documents: DocumentRow[] }) {
  const { t } = useTranslation();
  if (documents.length === 0) return null;
  return (
    <section className={styles.docsSection} aria-labelledby="product-docs-heading">
      <h2 id="product-docs-heading" className={styles.sectionTitle}>
        {t('productPage.technicalDocumentation')}
      </h2>
      <ul className={styles.docs}>
        {documents.map((doc) => {
          const [name, size] = doc.label.split('|').map((part) => part.trim());
          return (
            <li key={doc.url}>
              <a
                className={styles.docLink}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.docIcon} aria-hidden="true">
                  <FileText size={18} strokeWidth={2.2} />
                </span>
                <span className={styles.docText}>
                  <span className={styles.docName}>{name}</span>
                  {size ? <span className={styles.docMeta}>{size}</span> : null}
                </span>
                <span className={styles.srOnly}>
                  {t('productPage.opensNewTab')}
                </span>
                <ExternalLink
                  className={styles.docArrow}
                  size={16}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProductVideo({
  videoId,
  series,
}: {
  videoId: string | undefined;
  series: string;
}) {
  const { t } = useTranslation();
  if (!videoId) return null;
  return (
    <section className={styles.videoSection} aria-label={t('productPage.video')}>
      <div className={styles.video}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${series} — ${t('videoPage.title')}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function RelatedProducts({ related }: { related: Product[] }) {
  const { t } = useTranslation();
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className={styles.sectionTitle}>
        {t('productPage.related')}
      </h2>
      <ul className={styles.grid}>
        {related.map((item) => (
          <li key={item.id}>
            <ProductCard product={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
