/**
 * A primary navigation entry. Items with `children` render as a dropdown in
 * the header — the parent link still navigates to its own landing page.
 */
export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description: string }[];
};

const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "EV Map", href: "/ev-map" },
  {
    label: "Tools",
    href: "/tools",
    // Add new tools here and they appear in the dropdown and the /tools index.
    children: [
      {
        label: "EPUB Studio",
        href: "/tools/epub-studio",
        description: "KDP-optimized EPUB creator",
      },
      {
        label: "Cover Designer",
        href: "/tools/cover-designer",
        description: "Book cover maker — PNG & JPG",
      },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * Central site configuration — used for SEO metadata, RSS, sitemap,
 * the header/footer, and the author sidebar.
 */
export const siteConfig = {
  name: "Paperskeep",
  // Kept under ~60 / ~160 characters: past that, Google truncates the title
  // and rewrites the description itself.
  title: "Paperskeep — Thoughtful writing on tech, business & living well",
  description:
    "Paperskeep is an independent publication covering technology, business and culture alongside style, beauty, health and living well — plus free browser-based tools.",
  // Prefer the deployment URL when available; falls back to localhost in dev.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  locale: "en_US",
  twitterHandle: "@paperskeep",
  nav,
  // Single source of truth for categories. Add or remove one here and it
  // updates the filter pills, the admin post form, server validation, the
  // category pages and the sitemap. Grouped by desk so a line can be dropped
  // without hunting. A category with no published posts is still selectable in
  // the editor, but its page is noindexed and kept out of the sitemap until it
  // has something in it.
  categories: [
    // Core desks
    "Technology",
    "AI",
    "Business",
    "Finance",
    "Marketing",
    "Science",
    "Design",
    "Culture",
    "Opinion",
    // Life
    "Lifestyle",
    "Health",
    "Fitness",
    "Food",
    "Travel",
    "Home",
    "Relationships",
    "Parenting",
    // Work and self
    "Career",
    "Productivity",
    "Books",
    "Ikigai",
    "Quotes",
    // Style and beauty
    "Fashion",
    "Beauty",
    "Skincare",
    "Makeup",
    "Hair Styles",
    "Nail Art",
    "Weddings",
  ] as const,
  // The publication is the byline — articles are credited to Paperskeep itself.
  author: {
    name: "Paperskeep",
    role: "Editorial Team",
    bio: "Paperskeep is a small, independent publication about technology, business and culture — and about style, health and living well.",
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
      href: "https://www.facebook.com/profile.php?id=61592541441863",
      short: "f",
    },
  ],
};

export type SiteConfig = typeof siteConfig;
export type Category = (typeof siteConfig.categories)[number];
