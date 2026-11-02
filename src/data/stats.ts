/* The home-page numbers band (counting 8304 / 3047 / 2540 / 65 below
 * the featured products) — the adapter between the CMS "Home page
 * numbers (stats band)" file (content/stats.json) and the UI.
 *
 * One editable CMS file: bilingual headline, optional button
 * (empty text = no button) and one row per counter (number + EN/Ka
 * label; rows reorderable by drag).
 *
 * The pre-CMS seed src/data/stats.json stays as the emergency fallback
 * when the CMS file does not exist yet (same pattern as the slider /
 * categories / applications adapters). */

import legacyStats from './stats.json';

export type StatItem = {
  value: number;
  labelEn: string;
  labelKa: string;
};

export type StatsContent = {
  titleEn: string;
  titleKa: string;
  ctaEn: string;
  ctaKa: string;
  ctaLink: string;
  items: StatItem[];
};

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const num = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value);

/* --- CMS file --------------------------------------------------------------- */

const cmsFiles = import.meta.glob<Record<string, unknown>>(
  '../../content/stats.json',
  { eager: true, import: 'default' },
);

function normalize(raw: Record<string, unknown>): StatsContent {
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  return {
    titleEn: str(raw.titleEn) || str(raw.title),
    titleKa: str(raw.titleKa),
    ctaEn: str(raw.ctaEn) || str(raw.cta),
    ctaKa: str(raw.ctaKa),
    ctaLink: str((raw.ctaLink as string) || raw.to) || '/contacts',
    items: rawItems
      .map((item): StatItem | null => {
        const row = item as Record<string, unknown>;
        const value = num(row.value);
        const label = str(row.labelEn) || str(row.label);
        if (!Number.isFinite(value) || !label) return null;
        return { value, labelEn: label, labelKa: str(row.labelKa) };
      })
      .filter((item): item is StatItem => item !== null),
  };
}

const [cmsRaw] = Object.values(cmsFiles);

/* Legacy seed shape: { title, cta, to, stats: [{ id, value, label }] }. */
const legacyContent: StatsContent = {
  titleEn: str(legacyStats.title),
  titleKa: '',
  ctaEn: str(legacyStats.cta),
  ctaKa: '',
  ctaLink: str((legacyStats as { to?: string }).to) || '/contacts',
  items: (legacyStats.stats ?? []).map((stat) => ({
    value: num(stat.value),
    labelEn: str(stat.label),
    labelKa: '',
  })),
};

export const statsContent: StatsContent = cmsRaw
  ? normalize(cmsRaw)
  : legacyContent;
