/**
 * The Cover Designer's type library.
 *
 * Fonts are self-hosted through next/font so the canvas can draw with them
 * offline and the export is byte-identical to the preview. Each family exposes
 * a `family` string — next/font's hashed stack — which doubles as the CSS
 * font-family for the UI and the family part of `ctx.font` for the canvas.
 *
 * Weights are deliberately few: a cover uses one or two per family, and every
 * extra weight is another file the visitor downloads before the tool is usable.
 *
 * `preload: false` on every family is deliberate. A library this size would
 * otherwise put ~30 render-blocking <link rel=preload> tags in the head of the
 * tool page, competing with the JS that has to boot before anything is usable.
 * The faces are fetched on first use instead, and `ensureFontsLoaded` awaits
 * each one before the canvas paints, so nothing is ever drawn in a fallback.
 */
import {
  Abril_Fatface,
  Alfa_Slab_One,
  Anton,
  Baloo_2,
  Bangers,
  Bebas_Neue,
  Caveat,
  Cinzel,
  Cormorant_Garamond,
  EB_Garamond,
  Fredoka,
  Great_Vibes,
  Josefin_Sans,
  Libre_Baskerville,
  Lora,
  Luckiest_Guy,
  Montserrat,
  Orbitron,
  Oswald,
  Pacifico,
  Parisienne,
  Permanent_Marker,
  Playfair_Display,
  Raleway,
  Righteous,
  Space_Mono,
  Special_Elite,
} from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  preload: false,
});

const abril = Abril_Fatface({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  display: "swap",
  preload: false,
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
  preload: false,
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["200", "400", "700"],
  display: "swap",
  preload: false,
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
  preload: false,
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

/* Vector display faces — the flat, drawn letterforms that sit on illustrated
   covers: graphic novels, children's picture books, comics, LitRPG. */

const righteous = Righteous({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
  preload: false,
});

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const bangers = Bangers({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const alfaSlab = Alfa_Slab_One({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
});

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
  preload: false,
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export type FontCategory =
  | "Serif"
  | "Display"
  | "Vector"
  | "Sans"
  | "Script"
  | "Typewriter";

export type CoverFont = {
  id: string;
  label: string;
  category: FontCategory;
  /** Hashed font stack from next/font — valid in CSS and in `ctx.font`. */
  family: string;
  weights: number[];
  /** Only families loaded with an italic file offer the italic toggle. */
  italic: boolean;
  /** What the face is for, shown under the picker. */
  note: string;
};

export const COVER_FONTS: CoverFont[] = [
  {
    id: "playfair",
    label: "Playfair Display",
    category: "Serif",
    family: playfair.style.fontFamily,
    weights: [400, 700, 900],
    italic: true,
    note: "High-contrast display serif — literary and upmarket fiction.",
  },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    category: "Serif",
    family: cormorant.style.fontFamily,
    weights: [300, 400, 600, 700],
    italic: true,
    note: "Delicate old-style serif — poetry, literary, historical.",
  },
  {
    id: "baskerville",
    label: "Libre Baskerville",
    category: "Serif",
    family: baskerville.style.fontFamily,
    weights: [400, 700],
    italic: false,
    note: "Sturdy transitional serif — memoir and narrative nonfiction.",
  },
  {
    id: "garamond",
    label: "EB Garamond",
    category: "Serif",
    family: garamond.style.fontFamily,
    weights: [400, 500, 600],
    italic: false,
    note: "Classic book face — historical fiction and the classics.",
  },
  {
    id: "lora",
    label: "Lora",
    category: "Serif",
    family: lora.style.fontFamily,
    weights: [400, 600, 700],
    italic: true,
    note: "Warm contemporary serif — book club and women's fiction.",
  },
  {
    id: "cinzel",
    label: "Cinzel",
    category: "Display",
    family: cinzel.style.fontFamily,
    weights: [400, 700, 900],
    italic: false,
    note: "Roman inscriptional caps — fantasy, epic, mythology.",
  },
  {
    id: "abril",
    label: "Abril Fatface",
    category: "Display",
    family: abril.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Fat didone — vintage, pulp and bold nonfiction.",
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    category: "Display",
    family: bebas.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Tall condensed caps — thriller and suspense posters.",
  },
  {
    id: "anton",
    label: "Anton",
    category: "Display",
    family: anton.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Heavyweight impact sans — horror, action, true crime.",
  },
  {
    id: "righteous",
    label: "Righteous",
    category: "Vector",
    family: righteous.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Deco vector display — retro-futurist, jazz age, stylised illustration.",
  },
  {
    id: "orbitron",
    label: "Orbitron",
    category: "Vector",
    family: orbitron.style.fontFamily,
    weights: [500, 700, 900],
    italic: false,
    note: "Squared techno caps — LitRPG, cyberpunk, space opera.",
  },
  {
    id: "luckiest-guy",
    label: "Luckiest Guy",
    category: "Vector",
    family: luckiestGuy.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Chunky cartoon caps — children's, humour, adventure.",
  },
  {
    id: "bangers",
    label: "Bangers",
    category: "Vector",
    family: bangers.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Comic-book lettering — graphic novels, action, all-ages.",
  },
  {
    id: "alfa-slab",
    label: "Alfa Slab One",
    category: "Vector",
    family: alfaSlab.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Heavy poster slab — bold nonfiction, humour, sports.",
  },
  {
    id: "fredoka",
    label: "Fredoka",
    category: "Vector",
    family: fredoka.style.fontFamily,
    weights: [400, 600, 700],
    italic: false,
    note: "Soft rounded geometric — middle grade, wellbeing, family.",
  },
  {
    id: "baloo",
    label: "Baloo 2",
    category: "Vector",
    family: baloo.style.fontFamily,
    weights: [400, 700, 800],
    italic: false,
    note: "Fat rounded display — picture books and early readers.",
  },
  {
    id: "oswald",
    label: "Oswald",
    category: "Sans",
    family: oswald.style.fontFamily,
    weights: [300, 500, 700],
    italic: false,
    note: "Condensed gothic — thrillers and journalistic nonfiction.",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    category: "Sans",
    family: montserrat.style.fontFamily,
    weights: [400, 600, 800],
    italic: false,
    note: "Geometric workhorse — business, self-help, YA.",
  },
  {
    id: "raleway",
    label: "Raleway",
    category: "Sans",
    family: raleway.style.fontFamily,
    weights: [200, 400, 700],
    italic: false,
    note: "Elegant sans with a thin cut — minimal, modern covers.",
  },
  {
    id: "josefin",
    label: "Josefin Sans",
    category: "Sans",
    family: josefin.style.fontFamily,
    weights: [300, 400, 600],
    italic: false,
    note: "Art-deco geometric — cozy mystery, lifestyle, romance.",
  },
  {
    id: "great-vibes",
    label: "Great Vibes",
    category: "Script",
    family: greatVibes.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Formal calligraphic script — romance and wedding themes.",
  },
  {
    id: "parisienne",
    label: "Parisienne",
    category: "Script",
    family: parisienne.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Light handwritten script — contemporary romance, memoir.",
  },
  {
    id: "pacifico",
    label: "Pacifico",
    category: "Script",
    family: pacifico.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Retro brush script — feel-good, food, travel, children's series.",
  },
  {
    id: "caveat",
    label: "Caveat",
    category: "Script",
    family: caveat.style.fontFamily,
    weights: [400, 700],
    italic: false,
    note: "Natural handwriting — journals, middle grade, personal essays.",
  },
  {
    id: "permanent-marker",
    label: "Permanent Marker",
    category: "Script",
    family: permanentMarker.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Thick marker hand — YA contemporary, humour, zines.",
  },
  {
    id: "special-elite",
    label: "Special Elite",
    category: "Typewriter",
    family: specialElite.style.fontFamily,
    weights: [400],
    italic: false,
    note: "Distressed typewriter — noir, horror, dystopia.",
  },
  {
    id: "space-mono",
    label: "Space Mono",
    category: "Typewriter",
    family: spaceMono.style.fontFamily,
    weights: [400, 700],
    italic: false,
    note: "Technical monospace — sci-fi, tech and speculative.",
  },
];

const byId = new Map(COVER_FONTS.map((f) => [f.id, f]));

/** Falls back to the first family so an unknown id can never break a render. */
export function getFont(id: string): CoverFont {
  return byId.get(id) ?? COVER_FONTS[0];
}

/** Groups for the picker, in the order a cover designer thinks about them. */
export const FONT_CATEGORIES: FontCategory[] = [
  "Serif",
  "Display",
  "Vector",
  "Sans",
  "Script",
  "Typewriter",
];
