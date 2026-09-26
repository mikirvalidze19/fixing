import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import styles from './ScrollProgress.module.css';

const SIZE = 52;
const STROKE = 4;
const RADIUS = (SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BOTTOM_THRESHOLD_PX = 8;
const SCROLLABLE_THRESHOLD_PX = 4;

export default function ScrollProgress() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [atBottom, setAtBottom] = useState(false);
  const raf = useRef<number | null>(null);

  const update = useCallback(() => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    setVisible(scrollable > SCROLLABLE_THRESHOLD_PX);
    setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    setAtBottom(window.innerHeight + window.scrollY >= doc.scrollHeight - BOTTOM_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    const onScrollOrResize = () => {
      if (raf.current) return;
      raf.current = window.requestAnimationFrame(() => {
        raf.current = null;
        update();
      });
    };
    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (raf.current) window.cancelAnimationFrame(raf.current);
    };
  }, [update]);

  const onClick = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: atBottom ? 0 : document.documentElement.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      className={visible ? `${styles.btn} ${styles.show}` : styles.btn}
      onClick={onClick}
      aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
      title={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg
        className={styles.ring}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        <circle
          className={styles.track}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
        />
        <circle
          className={styles.bar}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <span className={styles.icon} aria-hidden="true">
        {atBottom ? (
          <ArrowUp size={20} strokeWidth={2.4} />
        ) : (
          <ArrowDown size={20} strokeWidth={2.4} />
        )}
      </span>
    </button>
  );
}
