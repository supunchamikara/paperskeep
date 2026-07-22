import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme (default). Dark overrides live under the `.dark` selector
        // via CSS variables in globals.css so color transitions stay smooth.
        bg: "var(--bg)",
        surface: "var(--surface)",
        navy: "var(--navy)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        border: "var(--border)",
        pill: "var(--pill)",
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        body: ["var(--font-lora)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "8px",
        block: "10px",
        hero: "10px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.05)",
        lift: "0 14px 34px rgba(16,24,40,.12)",
        "soft-dark": "0 1px 3px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.35)",
      },
      maxWidth: {
        // Full-width site: the main container spans the whole viewport
        // (padding provides the gutters). Long-form article text keeps a
        // readable measure via `prose`.
        container: "100%",
        prose: "820px",
      },
      transitionProperty: {
        theme: "background-color, border-color, color, fill, stroke",
      },
    },
  },
  plugins: [],
};

export default config;
