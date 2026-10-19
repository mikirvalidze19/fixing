import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { searchProducts, type ProductSearchResult } from '../../data/search';
import { formatGel, minPrice, productImageSrc } from '../../utils/product';
import styles from './SearchPanel.module.css';

const MAX_RESULTS = 8;
const RESULTS_ID = 'site-search-results';

const EMPTY_RESULTS: ProductSearchResult[] = [];

export default function SearchPanel({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const trimmed = deferredQuery.trim();
  const results = trimmed ? searchProducts(trimmed, MAX_RESULTS) : EMPTY_RESULTS;
  const pending = query !== deferredQuery;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const openResult = (result: ProductSearchResult) => {
    onClose();
    navigate(`/product/${result.product.id}`);
  };

  const titleFor = (result: ProductSearchResult) =>
    i18n.language === 'ka' && result.product.titleKa
      ? result.product.titleKa
      : result.product.titleEn;

  const categoryFor = (result: ProductSearchResult) =>
    result.categorySlug
      ? t(`categories.${result.categorySlug}.label`, {
          defaultValue: result.categoryLabel ?? result.categorySlug,
        })
      : '';

  return (
    <div id="site-search-panel" className={styles.panel} role="search" aria-label={t('search.title')}>
      <form
        className={styles.inner}
        onSubmit={(event) => {
          event.preventDefault();
          const first = searchProducts(query, MAX_RESULTS)[0];
          if (first) openResult(first);
        }}
      >
        <div className={styles.field}>
          <Search
            className={styles.fieldIcon}
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            aria-controls={results.length > 0 ? RESULTS_ID : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className={styles.clear}
              aria-label={t('search.clear')}
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <X size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>

        {trimmed === '' ? (
          <p className={styles.hint}>{t('search.hint')}</p>
        ) : results.length === 0 ? (
          <p className={styles.hint} role="status">
            {t('search.noResults', { query: trimmed })}
          </p>
        ) : (
          <>
            <p className={styles.status} aria-live="polite" aria-busy={pending}>
              <span>{t('search.results', { count: results.length })}</span>
              <span className={styles.kbd}>{t('search.openFirst')}</span>
            </p>
            <ul id={RESULTS_ID} className={styles.results} aria-label={t('search.title')}>
              {results.map((result) => {
                const image = productImageSrc(result.product.id);
                return (
                  <li key={result.product.id}>
                    <Link
                      to={`/product/${result.product.id}`}
                      className={styles.result}
                      aria-label={`${result.product.series} — ${titleFor(result)}`}
                      onClick={onClose}
                    >
                      <span className={styles.thumb}>
                        {image ? (
                          <img src={image} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.thumbGhost} aria-hidden="true">
                            {result.product.series}
                          </span>
                        )}
                      </span>
                      <span className={styles.resultText}>
                        <span className={styles.series}>{result.product.series}</span>
                        <span className={styles.name}>{titleFor(result)}</span>
                        {result.categorySlug && (
                          <span className={styles.category}>{categoryFor(result)}</span>
                        )}
                      </span>
                      <span className={styles.price}>
                        <small>{t('productCard.from')}</small>
                        {formatGel(minPrice(result.product))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </form>
    </div>
  );
}
