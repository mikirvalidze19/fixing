/* Feature models: service cards (components/ServiceCard).
 * Prop types for the card primitives. */

import type { ReactNode } from 'react';

export type ServiceCardProps = {
  children: ReactNode;
  /** Unique view-transition identity, e.g. "download". */
  name: string;
};

export type ServiceCardTitleProps = {
  children: ReactNode;
};

export type ServiceCardIconProps = {
  children: ReactNode;
  label: string;
};

export type ServiceCardLinkOverlayProps = {
  href: string;
  label: string;
};
