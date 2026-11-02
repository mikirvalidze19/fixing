import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsContent } from '../../data/stats';
import styles from './Stats.module.css';

const DURATION_MS = 1600;

function Counter({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  /* Reduced-motion target is known before first paint — initialize
   * directly instead of syncing it in an effect. */
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, reducedMotion]);

  return (
    <span ref={ref} className={styles.value}>
      {display.toLocaleString(locale === 'ka' ? 'ka-GE' : 'en-US')}
    </span>
  );
}

export default function Stats() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'ka' ? 'ka' : 'en';
  const ka = locale === 'ka';
  /* All texts are CMS content (Georgian falls back to English); an
   * empty button text hides it. Index keys: rows have no identity
   * slug — reordering keeps the DOM consistent through React. */
  const { titleEn, titleKa, ctaEn, ctaKa, ctaLink, items } = statsContent;
  const title = (ka && titleKa) || titleEn;
  const ctaText = (ka && ctaKa) || ctaEn;
  return (
    <section className={styles.band} aria-labelledby="stats-title">
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.wrap}>
        {title && (
          <h3 id="stats-title" className={styles.title}>
            {title}
          </h3>
        )}
        <dl className={styles.grid}>
          {items.map((stat, index) => (
            <div key={index} className={styles.item}>
              <dd className={styles.number}>
                <Counter value={stat.value} locale={locale} />
              </dd>
              <dt className={styles.label}>
                {(ka && stat.labelKa) || stat.labelEn}
              </dt>
            </div>
          ))}
        </dl>
        {ctaText && (
          <Link to={ctaLink} className={styles.cta}>
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
