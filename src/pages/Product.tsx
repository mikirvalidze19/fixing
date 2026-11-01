import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ChevronDown, ExternalLink, FileText, Mail, Phone } from 'lucide-react';
import { company } from '../data/contact';
import {
  categoryProducts,
  productCategory,
  products,
} from '../data/catalog';
import type {
  Application,
  DocumentRow,
  FeatureRow,
  Product,
  ProductCategory,
  StandardRow,
  Variant,
  VariantColumn,
} from '../models/catalog';
import type { ProductData, ValueFact } from '../models/product';
import ProductCard from '../components/ProductCard/ProductCard';
import { formatGel, minPrice, pickLabel, productImageSrc } from '../utils/product';
import {
  columnNumbers,
  priceValues,
  roleColumn,
  variantText,
  variantTitle,
  variantValue,
} from '../utils/table';
import Placeholder from './Placeholder';
import styles from './Product.module.css';
import { applications } from '../data/applications';

const productMap = categoryProducts as Record<string, string[]>;

/* Pure derivation helpers (ordinary functions — no JSX, no hooks). */

/* Display text of one table cell. Price columns get the formatted ₾ value
 * (legacy style); everything else renders raw with an em dash when blank. */
function displayCell(product: Product, variant: Variant, col: VariantColumn): string {
  if (col.role === 'price') {
    const value = variantValue(product, variant, col);
    return typeof value === 'number' ? formatGel(value) : '—';
  }
  return variantText(product, variant, col);
}

function uniqNums(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

/* Facts strip: one row per picked numeric column (the price column has its
 * own range row). Values are the distinct numbers across all variants. */
function buildFacts(product: Product): ValueFact[] {
  return product.columns
    .filter((col) => col.type === 'number' && col.role !== 'price')
    .map((col) => ({ col, values: uniqNums(columnNumbers(product, col)) }))
    .filter(({ values }) => values.length > 0);
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

/* Auto description — the parts about diameter/length ranges only appear
 * when the product picked a column tagged with that role. Custom CMS
 * descriptions (descriptionEn/Ka) win over this text. */
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
    ? (i18n.language === 'ka' && category.labelKa) || category.labelEn
    : '';
  const prices = priceValues(product);
  const priceRange = priceRangeText(prices);
  const variantCount = product.variants.length;
  const sizeUnit =
    variantCount === 1 ? t('productPage.size') : t('productPage.sizes');
  /* Editor-written description wins; otherwise the auto-generated text. */
  const customAbout =
    i18n.language === 'ka' ? product.descriptionKa : product.descriptionEn;
  const diameterColumn = roleColumn(product, 'diameter');
  const lengthColumn = roleColumn(product, 'length');
  return {
    product,
    title: selectTitle(i18n.language, product),
    category,
    categoryLabel,
    applications:
      product.applications && product.applications.length > 0
        ? product.applications
            .map((slug) => applications.find((a) => a.slug === slug))
            .filter((a): a is Application => Boolean(a))
        : [],
    related: findRelated(product.id, category),
    specs: product.specs ?? [],
    certs: product.certs ?? [],
    standards: product.standards ?? [],
    documents: product.documents ?? [],
    features: product.features ?? [],
    columns: product.columns,
    facts: buildFacts(product),
    videoId: product.youtube ?? undefined,
    /* The variants section renders only when a column pick exists AND the
     * product actually has variant rows (table-less products). */
    hasTable: product.columns.length > 0 && variantCount > 0,
    hasPrice: prices.some((price) => price > 0),
    priceRange,
    sizeUnit,
    aboutText:
      (customAbout && customAbout.trim()) ||
      /* The auto text is built from the variants; without a table there
       * is nothing honest to auto-report. */
      (variantCount > 0
        ? buildAboutText(t, {
            series: product.series,
            count: variantCount,
            sizeUnit,
            category,
            categoryLabel,
            diameters: diameterColumn ? uniqNums(columnNumbers(product, diameterColumn)) : [],
            lengths: lengthColumn ? uniqNums(columnNumbers(product, lengthColumn)) : [],
            priceRange,
          })
        : ''),
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
      {data.hasTable && (
        <>
          <h2 className={styles.sectionTitle}>{t('productPage.availableVariants')}</h2>
          <VariantTable product={data.product} />
          {/* key remount resets the open card on navigation — no reset effect */}
          <VariantCards
            key={data.product.id}
            product={data.product}
          />
        </>
      )}
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
      {/* Rows are hidden for table-less products — no invented ₾0.00. */}
      {hasPrice && (
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t('productPage.startingFrom')}</span>
          <strong className={styles.metaPrice}>
            {formatGel(minPrice(product))}
          </strong>
        </div>
      )}
      {product.variants.length > 0 && (
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t('productPage.variants')}</span>
          <span className={styles.metaValue}>
            {product.variants.length}{' '}
            {sizeUnit}
          </span>
        </div>
      )}
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
  const { t, i18n } = useTranslation();
  const { product, title, aboutText, specs, category, categoryLabel } = data;
  const { facts, priceRange } = data;
  return (
    <div className={styles.info}>
      <h1 className={styles.name}>{product.series}</h1>
      <p className={styles.desc}>{title}</p>
      {aboutText ? <p className={styles.about}>{aboutText}</p> : null}

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
        {/* Application usage pages the product belongs to (CMS "Applications"
         * picks on the product). Empty → row not rendered. */}
        {data.applications.length > 0 && (
          <div className={styles.fact}>
            <dt>{t('productPage.applications')}</dt>
            <dd>
              {data.applications.map((app, i) => (
                <span key={app.slug}>
                  <Link to={`/applications/${app.slug}`}>
                    {(i18n.language === 'ka' && app.labelKa) || app.labelEn}
                  </Link>
                  {i < data.applications.length - 1 ? ', ' : ''}
                </span>
              ))}
            </dd>
          </div>
        )}
        {facts.map(({ col, values }) => (
          <div className={styles.fact} key={col.key}>
            <dt>{pickLabel(col, i18n.language)}</dt>
            <dd>{values.join(', ')}</dd>
          </div>
        ))}
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

/* The variant table is fully generic: columns come from the editor's pick
 * (shared "Table columns" library) and every row is one cell per column.
 * Only SKU/Price columns keep their legacy styling hooks. */
function VariantTable({ product }: { product: Product }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {product.columns.map((col) => (
              <th key={col.key} scope="col">
                {pickLabel(col, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Keys are positional, not SKU-based: SKU cells may be empty and
           * rows must stay unique regardless of editor input. */}
          {product.variants.map((variant, i) => (
            <tr key={`row-${i}`}>
              {product.columns.map((col) => (
                <td
                  key={col.key}
                  data-label={pickLabel(col, lang)}
                  className={
                    col.role === 'sku'
                      ? styles.sku
                      : col.role === 'price'
                        ? styles.price
                        : undefined
                  }
                >
                  {displayCell(product, variant, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Mobile accordion variant of the same table (same generic model). */
function VariantCards({ product }: { product: Product }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [openRow, setOpenRow] = useState<number | null>(null);
  return (
    <ul className={styles.cards} aria-label={t('productPage.availableVariants')}>
      {/* Row identity is the index: cells may be empty or duplicated, so
       * index keys keep the accordion stable. */}
      {product.variants.map((variant, i) => {
        const open = openRow === i;
        return (
          <li
            key={`row-${i}`}
            className={open ? `${styles.card} ${styles.open}` : styles.card}
          >
            <button
              type="button"
              className={styles.cardHead}
              aria-expanded={open}
              aria-controls={`variant-${i}`}
              onClick={() => setOpenRow((prev) => (prev === i ? null : i))}
            >
              <span className={styles.cardSku}>
                {variantTitle(product, variant)}
              </span>
              <ChevronDown
                className={styles.chevron}
                size={20}
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </button>
            <div
              className={styles.cardBody}
              id={`variant-${i}`}
              role="region"
              aria-hidden={!open}
            >
              <div className={styles.cardInner}>
                <dl className={styles.details}>
                  {product.columns.map((col) => (
                    <div key={col.key} className={styles.detail}>
                      <dt>{pickLabel(col, lang)}</dt>
                      <dd
                        className={
                          col.role === 'price' ? styles.price : undefined
                        }
                      >
                        {displayCell(product, variant, col)}
                      </dd>
                    </div>
                  ))}
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
