/* Feature models: hero slider (components/Slider). Content is managed in
 * the Pages CMS ("Home slider" → content/slider.json, see
 * docs/EDITOR-GUIDE.md): every slide is an image slide (photo background
 * and/or overlay art behind the shared texts) or a video slide
 * (autoplaying muted video behind the same overlay). Texts are stored per
 * language like the products; src/data/slider.json remains an emergency
 * fallback when the CMS file is missing. */

export type SlideType = 'image' | 'video';

export type Slide = {
  /* Synthetic id (slide-1, slide-2, …) — used only as the React key; a
   * slide identifies itself by its texts, editors never type ids. */
  id: string;
  type: SlideType;
  titleEn: string;
  titleKa: string;
  textEn: string;
  textKa: string;
  /* CTA button caption per language. The site shows the button ONLY when
   * the caption for the current language is non-empty — no text → no
   * button (the editors' rule from the CMS). */
  ctaEn: string;
  ctaKa: string;
  /* Button target page; the CMS default is the catalog (/products). */
  to: string;
  /* Optional styling accent — maps to a CSS-module class (Slider.module.css). */
  variant?: string;
  /* Screen-reader media description; falls back to the slide title. */
  altEn?: string;
  altKa?: string;
  /* image slides — resolved build-time asset URLs. */
  image?: string;
  foreground?: string;
  /* video slides */
  video?: { src: string; poster?: string };
};

export type VideoSlideMediaProps = {
  src: string;
  poster?: string;
  active: boolean;
  label: string;
  tabbable: boolean;
  onPlayingChange: (playing: boolean) => void;
  onEnded: () => void;
};
