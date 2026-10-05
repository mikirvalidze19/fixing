import siteData from './site.json';
import type { NavLink } from '../models/navigation';

/**
 * Single source of truth for AI context.
 * Every UI string / route lives in `site.json`.
 * Import { siteInfo, getWebsiteContext } anywhere AI needs website knowledge.
 */

export const siteInfo = {
  siteName: siteData.meta.siteName as string,
  tagline: siteData.meta.tagline as string,
  description: siteData.meta.description as string,
  sourceReference: siteData.meta.sourceReference as string,
  header: siteData.header as {
    logo: { src: string; alt: string; link: string; width: number };
    topBar: NavLink[];
    languages: { current: string; options: { code: string; label: string; to: string }[] };
    mainNav: NavLink[];
  },
  footer: siteData.footer,
};

export function getWebsiteContext(): string {
  const h = siteInfo.header;
  const lines = [
    `Site: ${siteInfo.siteName} — ${siteInfo.tagline}`,
    `Description: ${siteInfo.description}`,
    `Reference (dealer clone with permission): ${siteInfo.sourceReference}`,
    `Top bar: ${h.topBar.map((l) => `${l.label}(${l.to})`).join(', ')}`,
    `Languages: current=${h.languages.current}, options=${h.languages.options
      .map((o) => `${o.label}[${o.code}]`)
      .join(', ')}`,
    `Main nav: ${h.mainNav
      .map((l) =>
        l.children
          ? `${l.label}(${l.to}) > [${l.children.map((c) => `${c.label}(${c.to})`).join(', ')}]`
          : `${l.label}(${l.to})`,
      )
      .join(' | ')}`,
    `Footer: ${siteInfo.footer.copyright}, ${siteInfo.footer.vat}`,
  ];
  return lines.join('\n');
}

export default siteInfo;
