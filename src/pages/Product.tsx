import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ChevronDown, Mail, Phone } from 'lucide-react';
import categories from '../data/product-categories.json';
import categoryProducts from '../data/category-products.json';
import companyData from '../data/data.json';
import symbolsData from '../data/product-symbols.json';
import extraData from '../data/product-extra.json';
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

type Symbol = { icon: string; label: string };
const symbolMap = (symbolsData as { symbols: Record<string, Symbol[]> }).symbols;

type Standard = { icon: string; label: string; value: string; badge: string };
const extra = extraData as {
  videos: Record<string, string>;
  standards: Record<string, Standard[]>;
};

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

function findCategory(productId: string) {
  return categories.find((c) => (productMap[c.slug] ?? []).includes(productId));
}

const cell = (value: number | string | null) => value ?? '—';

export default function Product() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [openSku, setOpenSku] = useState<string | null>(null);
  const product = products.find((p) => p.id === id);

  useEffect(() => {
    setOpenSku(null);
  }, [id]);

  if (!product) return <Placeholder title={t('productPage.notFound')} />;

  const title = i18n.language === 'ka' && product.titleKa ? product.titleKa : product.titleEn;
  const category = findCategory(product.id);
  const categoryLabel = category
    ? t(`categories.${category.slug}.label`, { defaultValue: category.label })
    : '';
  const related = category
    ? (productMap[category.slug] ?? [])
        .filter((pid) => pid !== product.id)
        .map((pid) => products.find((p) => p.id === pid))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 3)
    : [];

  const symbols = symbolMap[product.id] ?? [];
  const specs = symbols.filter((s) => !isCert(s.icon));
  const certs = symbols.filter((s) => isCert(s.icon));
  const videoId = extra.videos[product.id];
  const standards = extra.standards[product.id] ?? [];
  const hasPrice = product.variants.some(
    (v) => typeof v.priceGel === 'number' && v.priceGel > 0,
  );

  const uniqNums = (values: (number | string | null)[]) =>
    [...new Set(values.filter((v): v is number => typeof v === 'number'))].sort(
      (a, b) => a - b,
    );
  const diameters = uniqNums(product.variants.map((v) => v.diameterMm));
  const lengths = uniqNums(product.variants.map((v) => v.lengthMm));
  const packs = uniqNums(product.variants.map((v) => v.unitsPerBox));
  const prices = product.variants
    .map((v) => v.priceGel)
    .filter((v): v is number => typeof v === 'number');
  const priceRange =
    prices.length > 0
      ? `${formatGel(Math.min(...prices))} – ${formatGel(Math.max(...prices))}`
      : null;
  const rangeText = (vals: number[], unit: string) =>
    vals.length === 0
      ? null
      : vals.length === 1
        ? `${vals[0]} ${unit}`
        : `${vals[0]}–${vals[vals.length - 1]} ${unit}`;
  const unit = product.variants.length === 1 ? t('productPage.size') : t('productPage.sizes');
  let aboutText = t('productPage.aboutOffers', {
    series: product.series,
    count: product.variants.length,
    unit,
  });
  if (category) aboutText += t('productPage.aboutIn', { category: categoryLabel });
  const diaRange = rangeText(diameters, 'mm Ø');
  if (diaRange) aboutText += t('productPage.aboutDiameters', { range: diaRange });
  const lenRange = rangeText(lengths, 'mm');
  if (lenRange) aboutText += t('productPage.aboutLengths', { range: lenRange });
  if (priceRange) aboutText += t('productPage.aboutPrices', { range: priceRange });
  aboutText += '.';

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        {category ? (
          <>
            <Link to={`/products/${category.slug}`}>{categoryLabel}</Link>
            <span aria-hidden="true">|</span>
          </>
        ) : null}
        <span aria-current="page">{product.series}</span>
      </nav>

      <div className={styles.hero}>
        <div className={styles.image}>
          {productImageSrc(product.id) ? (
            <img
              src={productImageSrc(product.id)}
              alt={`${product.series} — ${title}`}
            />
          ) : (
            <span className={styles.ghost} aria-hidden="true">
              {product.series}
            </span>
          )}
        </div>

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
              {unit}
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

        <div className={styles.info}>
          <h1 className={styles.name}>{product.series}</h1>
          <p className={styles.desc}>{title}</p>
          <p className={styles.about}>{aboutText}</p>

          {specs.length > 0 && (
            <ul className={styles.specs} aria-label={t('productPage.technicalData')}>
              {specs.map((spec) => (
                <li key={spec.icon} className={styles.spec}>
                  <img src={symbolSrc(spec.icon)} alt="" aria-hidden="true" />
                  <span>{spec.label}</span>
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
                    <p className={styles.stdLabel}>{item.label}</p>
                    <p className={styles.stdValue}>{item.value}</p>
                    {item.badge && (
                      <img
                        className={styles.stdBadge}
                        src={standardSrc(item.badge)}
                        alt={`${item.label} ${item.value}`}
                        loading="lazy"
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
      </div>

      <h2 className={styles.sectionTitle}>{t('productPage.availableVariants')}</h2>
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

      {videoId && (
        <section className={styles.videoSection} aria-label={t('productPage.video')}>
          <div className={styles.video}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={`${product.series} — ${t('videoPage.title')}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {related.length > 0 && (
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
      )}
    </div>
  );
}
