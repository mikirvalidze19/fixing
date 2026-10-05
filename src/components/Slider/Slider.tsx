import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import sliderData from '../../data/slider.json';
import type { Slide, VideoSlideMediaProps } from '../../models/slider';
import styles from './Slider.module.css';

const AUTOPLAY_MS = sliderData.autoplayMs ?? 6000;
const SWIPE_PX = 40;

const sliderImages = import.meta.glob(
  '../../assets/slider/*.{png,webp,jpg,jpeg}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const productImages = import.meta.glob(
  '../../assets/products/*.{png,webp,jpg,jpeg}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

function sliderImageSrc(file?: string): string {
  if (!file) return '';
  const all = { ...productImages, ...sliderImages };
  const entry = Object.entries(all).find(([path]) =>
    path.endsWith(`/${file}`),
  );
  return entry ? entry[1] : '';
}

/* Background video for a video slide — full-bleed behind the same
 * title/text/cta overlay image slides use. Autoplays muted (browser
 * requirement) when its slide is active, pauses + rewinds when it
 * leaves. Reduced-motion users get native controls instead. */
function VideoSlideMedia({
  src,
  poster,
  active,
  label,
  tabbable,
  onPlayingChange,
  onEnded,
}: VideoSlideMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* play on entry, pause + rewind on exit */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;
    if (active) {
      video.muted = true;
      video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [active, reducedMotion]);

  /* track fullscreen so the button icon reflects state */
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => undefined);
      return;
    }
    /* iOS Safari fallback */
    const legacy = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    legacy.webkitEnterFullscreen?.();
  };

  return (
    <>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        controls={reducedMotion}
        aria-label={label}
        tabIndex={-1}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        onEnded={onEnded}
      />
      {reducedMotion ? null : (
        <button
          type="button"
          className={styles.fullscreenBtn}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          aria-pressed={isFullscreen}
          tabIndex={tabbable ? 0 : -1}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      )}
    </>
  );
}

export default function Slider() {
  const { t } = useTranslation();
  const slides = sliderData.slides as Slide[];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const slideTitle = (slide: Slide) =>
    t(`slider.slides.${slide.id}.title`, { defaultValue: slide.title });
  const slideText = (slide: Slide) =>
    t(`slider.slides.${slide.id}.text`, { defaultValue: slide.text });
  const slideCta = (slide: Slide) =>
    t(`slider.slides.${slide.id}.cta`, { defaultValue: slide.cta });

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  const handleSlideEnd = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const handleVideoPlaying = useCallback((playing: boolean) => {
    setVideoPlaying(playing);
  }, []);

  /* autoplay — pauses on hover / focus / touch, and while a slide
   * video is playing. Clock resets on every slide change. */
  useEffect(() => {
    if (paused || videoPlaying || count < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, videoPlaying, count, index]);

  /* keyboard arrows */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  };

  return (
    <section
      className={styles.slider}
      aria-roledescription="carousel"
      aria-label={t('slider.featured')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={styles.track}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > SWIPE_PX) go(index - 1);
          else if (dx < -SWIPE_PX) go(index + 1);
          touchX.current = null;
          setPaused(false);
        }}
      >
        {slides.map((slide, i) => (
          <article
            key={slide.id}
            className={`${styles.slide} ${styles[`theme${i % 5}`]} ${slide.background ? styles.hasImage : ''} ${slide.video ? styles.videoSlide : ''} ${slide.variant === 'chemical' ? styles.chemical : ''} ${slide.variant === 'heavy' ? styles.heavy : ''} ${slide.variant === 'fasteners' ? styles.fasteners : ''}`}
            aria-roledescription="slide"
            aria-label={t('slider.live', { current: i + 1, total: count, title: slideTitle(slide) })}
            aria-hidden={i !== index}
            inert={! (i === index)}
          >
            {slide.video ? (
              <VideoSlideMedia
                src={slide.video.src}
                poster={slide.video.poster}
                active={i === index}
                label={slide.alt ?? slideTitle(slide)}
                tabbable={i === index}
                onPlayingChange={handleVideoPlaying}
                onEnded={handleSlideEnd}
              />
            ) : slide.background ? (
              <img
                className={`${styles.bg} ${slide.variant === 'chemical' ? styles.chemBg : ''} ${slide.variant === 'heavy' ? styles.heavyBg : ''} ${slide.variant === 'fasteners' ? styles.fastenersBg : ''}`}
                src={sliderImageSrc(slide.background)}
                alt=""
                aria-hidden="true"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ) : null}
            <span className={styles.scrim} aria-hidden="true" />
            <div className={styles.inner}>
              <h2 className={styles.title}>{slideTitle(slide)}</h2>
              <p className={styles.text}>{slideText(slide)}</p>
              <Link to={slide.to} className={styles.cta} tabIndex={i === index ? 0 : -1}>
                {slideCta(slide)}
              </Link>
            </div>
            {slide.foreground ? (
              <img
                className={`${styles.foreground} ${slide.variant === 'fasteners' ? styles.fastenersFg : ''}`}
                src={sliderImageSrc(slide.foreground)}
                alt={slide.alt ?? slideTitle(slide)}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ) : null}
          </article>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label={t('slider.featured')}>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={t('slider.goTo', { n: i + 1, title: slideTitle(slide) })}
            className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <div className={styles.arrows}>
        <button
          type="button"
          className={styles.arrow}
          aria-label={t('slider.prev')}
          onClick={() => go(index - 1)}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className={styles.arrow}
          aria-label={t('slider.next')}
          onClick={() => go(index + 1)}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <p className={styles.visuallyHidden} aria-live="polite">
        {t('slider.live', { current: index + 1, total: count, title: slideTitle(slides[index]) })}
      </p>
    </section>
  );
}
