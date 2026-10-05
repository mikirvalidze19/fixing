import type { CSSProperties } from 'react';
import type {
  ServiceCardIconProps,
  ServiceCardLinkOverlayProps,
  ServiceCardProps,
  ServiceCardTitleProps,
} from '../../models/service-card';
import styles from './ServiceCard.module.css';

/* Service card primitives — plain named exports, no namespace tricks.
 * Mirrors tecfi.it `single_service_support_box`: title on top, icon
 * below, whole card clickable via an overlay anchor (tecfi `s_serv_link`
 * pattern) — the card itself is the button. */

export function ServiceCard({ children, name }: ServiceCardProps) {
  return (
    <article
      className={styles.card}
      style={{ '--vt-name': `service-${name}` } as CSSProperties}
    >
      {children}
    </article>
  );
}

export function ServiceCardTitle({ children }: ServiceCardTitleProps) {
  return <h3 className={styles.title}>{children}</h3>;
}

export function ServiceCardIcon({ children, label }: ServiceCardIconProps) {
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
}: ServiceCardLinkOverlayProps) {
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
