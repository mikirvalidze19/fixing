/* Feature models: hero slider (components/Slider).
 * A slide is image-based by default; adding a `video` block turns it
 * into an autoplaying background-video slide — no code changes needed. */

export type SlideVideo = {
  src: string;
  poster?: string;
};

export type Slide = {
  id: string;
  title: string;
  text: string;
  cta: string;
  to: string;
  background?: string;
  foreground?: string;
  variant?: string;
  alt?: string;
  video?: SlideVideo;
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
