/**
 * The cover document.
 *
 * Every geometric value is stored as a *fraction* of the canvas rather than in
 * pixels: the same document then renders identically into the small on-screen
 * preview and into a 3000px export, and switching trim size re-lays-out the
 * cover instead of stranding the text off-canvas.
 */

export type LayerRole = "title" | "subtitle" | "author" | "series" | "custom";

export type TextAlign = "left" | "center" | "right";

export type TextTransform = "none" | "uppercase" | "lowercase";

/** Hairline rules above/below the text — a staple of literary covers. */
export type RulePlacement = "none" | "above" | "below" | "both";

export type TextLayer = {
  id: string;
  role: LayerRole;
  /** Shown in the layer list; falls back to the role when blank. */
  name: string;
  text: string;
  visible: boolean;

  fontId: string;
  weight: number;
  italic: boolean;

  /** Cap height driver: font size as a percentage of canvas width. */
  size: number;
  /** Line box as a multiple of the font size. */
  lineHeight: number;
  /** Tracking in em. Display type needs air; scripts need none. */
  letterSpacing: number;
  transform: TextTransform;
  align: TextAlign;

  color: string;
  opacity: number;

  /** Anchor, as fractions of canvas width/height. x follows `align`. */
  x: number;
  y: number;
  /** Wrapping box width, as a fraction of canvas width. */
  width: number;
  /** Degrees, clockwise, about the block's centre. */
  rotation: number;

  /** Outline, as a percentage of the font size so it scales with the type. */
  strokeWidth: number;
  strokeColor: string;

  shadowEnabled: boolean;
  /** Blur and offsets are percentages of the font size. */
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowColor: string;
  shadowOpacity: number;

  /** Solid band behind the text — the reliable way to hold contrast. */
  bandEnabled: boolean;
  bandColor: string;
  bandOpacity: number;
  /** Padding as a percentage of the font size. */
  bandPadX: number;
  bandPadY: number;

  rules: RulePlacement;
  /** Rule thickness (% of font size), length (fraction of the block) and gap. */
  ruleThickness: number;
  ruleLength: number;
  ruleGap: number;
};

export type ImageFit = "cover" | "contain" | "stretch";

export type CoverImage = {
  src: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
};

/** Legibility wash between the photo and the type. */
export type ScrimStyle =
  | "none"
  | "solid"
  | "bottom"
  | "top"
  | "both"
  | "vignette";

export type CoverDoc = {
  width: number;
  height: number;
  /** Id of the trim preset, or "custom". */
  presetId: string;

  background: string;

  image: CoverImage | null;
  fit: ImageFit;
  /** Zoom multiplier on top of the fit, and pan as fractions of the canvas. */
  zoom: number;
  offsetX: number;
  offsetY: number;
  /** Post-effects on the photo only, never on the type. */
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;

  scrim: ScrimStyle;
  scrimColor: string;
  scrimOpacity: number;

  layers: TextLayer[];
};

export type CanvasPreset = {
  id: string;
  label: string;
  hint: string;
  width: number;
  height: number;
};

/**
 * Sizes that matter to someone publishing a book. KDP wants a 1.6 ratio ebook
 * cover at least 1600px on the short edge; ACX wants a 3000px square.
 */
export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: "kdp-ebook",
    label: "Kindle eBook",
    hint: "1600 × 2560 · 1.6 ratio",
    width: 1600,
    height: 2560,
  },
  {
    id: "kdp-ebook-hi",
    label: "Kindle HQ",
    hint: "2500 × 4000 · 1.6 ratio",
    width: 2500,
    height: 4000,
  },
  {
    id: "print-6x9",
    label: "Print 6 × 9",
    hint: "1800 × 2700 · 300 dpi",
    width: 1800,
    height: 2700,
  },
  {
    id: "print-5x8",
    label: "Print 5 × 8",
    hint: "1500 × 2400 · 300 dpi",
    width: 1500,
    height: 2400,
  },
  {
    id: "audiobook",
    label: "Audiobook",
    hint: "3000 × 3000 · ACX square",
    width: 3000,
    height: 3000,
  },
  {
    id: "wattpad",
    label: "Wattpad",
    hint: "512 × 800 · web serial",
    width: 512,
    height: 800,
  },
];

let layerSeq = 0;

/** Role defaults, applied when a layer is created. */
const ROLE_DEFAULTS: Record<LayerRole, Partial<TextLayer>> = {
  title: { size: 11, y: 0.2, letterSpacing: 0.02, weight: 700 },
  subtitle: { size: 4.4, y: 0.38, letterSpacing: 0.06, weight: 400 },
  author: { size: 4.8, y: 0.85, letterSpacing: 0.1, weight: 600 },
  series: { size: 3.4, y: 0.09, letterSpacing: 0.16, weight: 600 },
  custom: { size: 4.5, y: 0.6, letterSpacing: 0.02, weight: 400 },
};

export function createLayer(
  role: LayerRole,
  text: string,
  patch: Partial<TextLayer> = {}
): TextLayer {
  layerSeq += 1;
  return {
    id: `layer-${Date.now().toString(36)}-${layerSeq}`,
    role,
    name: "",
    text,
    visible: true,

    fontId: "playfair",
    weight: 700,
    italic: false,

    size: 8,
    lineHeight: 1.15,
    letterSpacing: 0.02,
    transform: "none",
    align: "center",

    color: "#FFFFFF",
    opacity: 1,

    x: 0.5,
    y: 0.5,
    width: 0.82,
    rotation: 0,

    strokeWidth: 0,
    strokeColor: "#000000",

    shadowEnabled: false,
    shadowBlur: 18,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.55,

    bandEnabled: false,
    bandColor: "#000000",
    bandOpacity: 0.75,
    bandPadX: 40,
    bandPadY: 24,

    rules: "none",
    ruleThickness: 4,
    ruleLength: 0.5,
    ruleGap: 40,

    ...ROLE_DEFAULTS[role],
    ...patch,
  };
}

export const ROLE_LABELS: Record<LayerRole, string> = {
  title: "Title",
  subtitle: "Subtitle",
  author: "Author",
  series: "Series",
  custom: "Text",
};

/** A cover that already looks composed the moment the tool opens. */
export function createDefaultDoc(): CoverDoc {
  const preset = CANVAS_PRESETS[0];
  return {
    width: preset.width,
    height: preset.height,
    presetId: preset.id,
    background: "#101828",

    image: null,
    fit: "cover",
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,

    scrim: "bottom",
    scrimColor: "#000000",
    scrimOpacity: 0.45,

    layers: [
      createLayer("series", "A NOVEL", {
        fontId: "montserrat",
        weight: 600,
        size: 2.6,
        y: 0.1,
        letterSpacing: 0.3,
        transform: "uppercase",
        color: "#E8D9B5",
      }),
      createLayer("title", "The Lantern\nKeeper", {
        fontId: "playfair",
        weight: 700,
        size: 13,
        y: 0.17,
        lineHeight: 1.05,
        letterSpacing: 0.01,
      }),
      createLayer("subtitle", "Some lights are meant to be guarded", {
        fontId: "cormorant",
        weight: 400,
        italic: true,
        size: 4,
        y: 0.44,
        letterSpacing: 0.04,
        color: "#E8D9B5",
      }),
      createLayer("author", "Elena Marsh", {
        fontId: "montserrat",
        weight: 600,
        size: 4.4,
        y: 0.86,
        letterSpacing: 0.22,
        transform: "uppercase",
      }),
    ],
  };
}
