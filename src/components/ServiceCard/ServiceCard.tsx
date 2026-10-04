import type { CSSProperties, ReactNode } from 'react';
import styles from './ServiceCard.module.css';

/* Service card primitives — plain named exports, no namespace tricks.
 * Mirrors tecfi.it `single_service_support_box`: title on top, icon
 * below, whole card clickable via an overlay anchor (tecfi `s_serv_link`
 * pattern) — the card itself is the button. */

export function ServiceCard({
  children,
  name,
}: {
  children: ReactNode;
  /** Unique view-transition identity, e.g. "download". */
  name: string;
}) {
  return (
    <article
      className={styles.card}
      style={{ '--vt-name': `service-${name}` } as CSSProperties}
    >
      {children}
    </article>
  );
}

export function ServiceCardTitle({ children }: { children: ReactNode }) {
  return <h3 className={styles.title}>{children}</h3>;
}

export function ServiceCardIcon({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className={styles.icon} role="img" aria-label={label}>
      {children}
    </div>
  );
}

/* Overlay anchor — navigates to the tecfi.it page in a new tab. */
export function ServiceCardLinkOverlay({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.overlay}
      aria-label={label}
    />
  );
}
