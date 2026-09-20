import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import statsData from '../../data/stats.json';
import styles from './Stats.module.css';

const DURATION_MS = 1600;

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
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
  }, [value]);

  return (
    <span ref={ref} className={styles.value}>
      {display.toLocaleString('en-US')}
    </span>
  );
}

export default function Stats() {
  return (
    <section className={styles.band} aria-labelledby="stats-title">
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.wrap}>
        <h3 id="stats-title" className={styles.title}>
          {statsData.title}
        </h3>
        <dl className={styles.grid}>
          {statsData.stats.map((stat) => (
            <div key={stat.id} className={styles.item}>
              <dd className={styles.number}>
                <Counter value={stat.value} />
              </dd>
              <dt className={styles.label}>{stat.label}</dt>
            </div>
          ))}
        </dl>
        <Link to={statsData.to} className={styles.cta}>
          {statsData.cta}
        </Link>
      </div>
    </section>
  );
}
