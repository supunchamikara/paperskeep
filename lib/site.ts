/**
 * Central site configuration — used for SEO metadata, RSS, sitemap,
 * the header/footer, and the author sidebar.
 */
export const siteConfig = {
  name: "Paperskeep",
  title: "Paperskeep — Thoughtful writing on tech, business & culture",
  description:
    "Paperskeep is a modern publication covering the systems, tools, and people building a more thoughtful internet. Long-form writing on technology, business, lifestyle, and culture.",
  // Prefer the deployment URL when available; falls back to localhost in dev.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  locale: "en_US",
  twitterHandle: "@paperskeep",
  nav: [
    { label: "Home", href: "/" },
    { label: "Articles", href: "/articles" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  // Single source of truth for categories. Add or remove one here and it
  // updates the filter pills, the admin post form, and server validation.
  categories: [
    "Technology",
    "Business",
    "Lifestyle",
    "Culture",
    "Science",
    "Finance",
    "Design",
    "Opinion",
    "Ikigai",
    "Quotes",
    "Fashion",
    "Hair Styles",
  ] as const,
  // The publication is the byline — articles are credited to Paperskeep itself.
  author: {
    name: "Paperskeep",
    role: "Editorial Team",
    bio: "Paperskeep is a small, independent publication about the systems, tools, and people building a more thoughtful internet.",
  },
  social: [
    { label: "Paperskeep on X", href: "https://x.com/paperskeep", short: "X" },
    {
      label: "Paperskeep on LinkedIn",
      href: "https://linkedin.com/company/paperskeep",
      short: "in",
    },
    {
      label: "Paperskeep on Facebook",
      href: "https://facebook.com/paperskeep",
      short: "f",
    },
  ],
};

export type SiteConfig = typeof siteConfig;
export type Category = (typeof siteConfig.categories)[number];
