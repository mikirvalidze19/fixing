import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ChevronDown, ExternalLink, FileText, Mail, Phone } from 'lucide-react';
import categories from '../data/product-categories.json';
import categoryProducts from '../data/category-products.json';
import companyData from '../data/data.json';
import symbolsData from '../data/product-symbols.json';
import extraData from '../data/product-extra.json';
import documentsData from '../data/product-docs.json';
import featuresData from '../data/product-features.json';
import { products } from '../data/catalog';
import type { Product, ProductCategory } from '../models/catalog';
import type {
  ProductData,
  ProductDocument,
  ProductFeature,
  ProductStandard,
  ProductSymbol,
} from '../models/product';
import ProductCard from '../components/ProductCard/ProductCard';
import { formatGel, minPrice, productImageSrc } from '../utils/product';
import Placeholder from './Placeholder';
import styles from './Product.module.css';

const productMap = categoryProducts as Record<string, string[]>;
const { company } = companyData;

const symbolMap = (symbolsData as { symbols: Record<string, ProductSymbol[]> }).symbols;

const extra = extraData as {
  videos: Record<string, string>;
  standards: Record<string, ProductStandard[]>;
};

const documentMap = documentsData as Record<string, ProductDocument[]>;
const featureMap = featuresData as Record<string, ProductFeature[]>;

const symbolUrls = import.meta.glob(
  '../assets/symbols/*.{png,webp,svg}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const standardUrls = import.meta.glob(
  '../assets/standards/*.{png,webp,svg}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

function assetSrc(
  urls: Record<string, string>,
  file: string,
): string {
  const entry = Object.entries(urls).find(([path]) =>
    path.endsWith(`/${file}`),
  );
  return entry ? entry[1] : '';
}

const symbolSrc = (file: string) => assetSrc(symbolUrls, file);
const standardSrc = (file: string) => assetSrc(standardUrls, file);

const isCert = (file: string) => file.startsWith('Logo_simbolo_');

const certLabel = (t: TFunction, file: string) =>
  file.includes('FUOCO')
    ? t('productPage.certFire')
    : file.includes('SISMICO')
      ? t('productPage.certSeismic')
      : file.includes('ETA')
        ? t('productPage.certEta')
        : t('productPage.certDefault');

/* Reverse index: product id → its category, built once at module level
 * so per-render lookups are O(1) instead of scanning every category
 * list. The `has` guard preserves first-match order. */
const productCategoryIndex = new Map<string, (typeof categories)[number]>();
for (const entry of categories) {
  for (const id of productMap[entry.slug] ?? []) {
    if (!productCategoryIndex.has(id)) {
      productCategoryIndex.set(id, entry);
    }
  }
}

function findCategory(productId: string) {
  return productCategoryIndex.get(productId);
}

const cell = (value: number | string | null) => value ?? '—';

/* Pure derivation helpers (ordinary functions — no JSX, no hooks). */

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
  const category = findCategory(product.id);
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
  const symbols = symbolMap[product.id] ?? [];
  return {
    product,
    title: selectTitle(i18n.language, product),
    category,
    categoryLabel,
    related: findRelated(product.id, category),
    specs: symbols.filter((s) => !isCert(s.icon)),
    certs: symbols.filter((s) => isCert(s.icon)),
    standards: extra.standards[product.id] ?? [],
    documents: documentMap[product.id] ?? [],
    features: featureMap[product.id] ?? [],
    videoId: extra.videos[product.id],
    hasPrice: product.variants.some(
      (v) => typeof v.priceGel === 'number' && v.priceGel > 0,
    ),
    diameters,
    lengths,
    packs,
    priceRange,
    sizeUnit,
    aboutText: buildAboutText(t, {
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
          productId={data.product.id}
          series={data.product.series}
          title={data.title}
        />
        <ProductMeta
          product={data.product}
          sizeUnit={data.sizeUnit}
          hasPrice={data.hasPrice}
        />
        <ProductInfo data={data} />
        <ProductStandards standards={data.standards} certs={data.certs} />
      </div>

      <ProductFeatures features={data.features} />
      <h2 className={styles.sectionTitle}>{t('productPage.availableVariants')}</h2>
      <VariantTable product={data.product} />
      {/* key remount resets the open card on navigation — no reset effect */}
      <VariantCards key={data.product.id} product={data.product} />
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
  productId,
  series,
  title,
}: {
  productId: string;
  series: string;
  title: string;
}) {
  const src = productImageSrc(productId);
  return (
    <div className={styles.image}>
      {src ? (
        <img src={src} alt={`${series} — ${title}`} />
      ) : (
        <span className={styles.ghost} aria-hidden="true">
          {series}
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
          {specs.map((spec) => (
            <li key={spec.icon} className={styles.spec}>
              <img
                src={symbolSrc(spec.icon)}
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

function ProductStandards({
  standards,
  certs,
}: {
  standards: ProductStandard[];
  certs: ProductSymbol[];
}) {
  const { t } = useTranslation();
  return (
    <aside className={styles.side}>
      {standards.length > 0 ? (
        <ul className={styles.standards} aria-label={t('productPage.standards')}>
          {standards.map((item) => (
            <li key={`${item.label}-${item.value}`} className={styles.standard}>
              <img
                className={styles.stdIcon}
                src={standardSrc(item.icon)}
                alt=""
                aria-hidden="true"
              />
              <div>
                {item.label ? (
                  <p className={styles.stdLabel}>{item.label}</p>
                ) : null}
                {item.value ? (
                  <p className={styles.stdValue}>{item.value}</p>
                ) : null}
                {item.badge && (
                  <img
                    className={styles.stdBadge}
                    src={standardSrc(item.badge)}
                    alt={[item.label, item.value].filter(Boolean).join(' ')}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        certs.length > 0 && (
          <ul className={styles.standards} aria-label={t('productPage.standards')}>
            {certs.map((cert) => (
              <li key={cert.icon} className={styles.standard}>
                <img
                  className={styles.stdIcon}
                  src={symbolSrc(cert.icon)}
                  alt=""
                  aria-hidden="true"
                />
                <div>
                  <p className={styles.stdLabel}>{certLabel(t, cert.icon)}</p>
                  <p className={styles.stdValue}>{cert.label}</p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </aside>
  );
}

function VariantTable({ product }: { product: Product }) {
  const { t } = useTranslation();
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t('productPage.colSku')}</th>
            <th scope="col">{t('productPage.colDiameter')}</th>
            <th scope="col">{t('productPage.colLength')}</th>
            <th scope="col">{t('productPage.colUnits')}</th>
            <th scope="col">{t('productPage.colPrice')}</th>
            <th scope="col">{t('productPage.colNote')}</th>
          </tr>
        </thead>
        <tbody>
          {product.variants.map((v) => (
            <tr key={v.sku}>
              <td data-label={t('productPage.colSku')} className={styles.sku}>
                {v.sku}
              </td>
              <td data-label={t('productPage.colDiameter')}>{cell(v.diameterMm)}</td>
              <td data-label={t('productPage.colLength')}>{cell(v.lengthMm)}</td>
              <td data-label={t('productPage.colUnits')}>{v.unitsPerBox}</td>
              <td data-label={t('productPage.colPrice')} className={styles.price}>
                {formatGel(v.priceGel)}
              </td>
              <td data-label={t('productPage.colNote')}>{cell(v.note)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VariantCards({ product }: { product: Product }) {
  const { t } = useTranslation();
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
                  <div className={styles.detail}>
                    <dt>{t('productPage.colDiameter')}</dt>
                    <dd>{cell(v.diameterMm)}</dd>
                  </div>
                  <div className={styles.detail}>
                    <dt>{t('productPage.colLength')}</dt>
                    <dd>{cell(v.lengthMm)}</dd>
                  </div>
                  <div className={styles.detail}>
                    <dt>{t('productPage.colUnits')}</dt>
                    <dd>{v.unitsPerBox}</dd>
                  </div>
                  <div className={styles.detail}>
                    <dt>{t('productPage.colPrice')}</dt>
                    <dd className={styles.price}>{formatGel(v.priceGel)}</dd>
                  </div>
                  <div className={styles.detail}>
                    <dt>{t('productPage.colNote')}</dt>
                    <dd>{cell(v.note)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProductFeatures({ features }: { features: ProductFeature[] }) {
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

function ProductDocuments({ documents }: { documents: ProductDocument[] }) {
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
