import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";

const TITLE = "Tools — Free Browser-Based Tools";
const DESCRIPTION =
  "Free, browser-based tools from Paperskeep. Nothing to install, nothing uploaded — everything runs on your own machine.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "free online tools",
    "browser tools",
    "EPUB creator",
    "self-publishing tools",
    "no upload tools",
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/tools`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: siteConfig.twitterHandle,
  },
  robots: { index: true, follow: true },
};

const tools = [
  {
    href: "/tools/epub-studio",
    name: "EPUB Studio",
    tagline: "KDP-optimized EPUB creator",
    description:
      "Write or paste your novel in a light markup, watch a live Kindle-style preview, set metadata, styling and a cover, then export a valid EPUB 3 file. Runs entirely in your browser.",
  },
];

function buildJsonLd() {
  const base = siteConfig.url;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: `${base}/tools`,
      isPartOf: { "@id": `${base}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "SoftwareApplication",
            name: tool.name,
            description: tool.description,
            url: `${base}${tool.href}`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any — runs in a web browser",
            isAccessibleForFree: true,
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
      ],
    },
  ];
}

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-prose px-5 py-16 sm:px-8">
      <JsonLd data={buildJsonLd()} />
      <span className="inline-block rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">
        Tools
      </span>

      <h1 className="mb-4 mt-5 text-balance font-heading text-[38px] font-extrabold leading-[1.12] tracking-[-0.02em] text-text">
        Small tools, built for the work.
      </h1>

      <p className="mb-10 text-[18px] leading-[1.7] text-muted">{DESCRIPTION}</p>

      <ul className="grid gap-5">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block rounded-card border border-border bg-surface p-6 shadow-token transition-theme hover-lift"
            >
              <span className="font-heading text-[11.5px] font-semibold uppercase tracking-[0.07em] text-accent">
                {tool.tagline}
              </span>
              <h2 className="mb-2 mt-2 font-heading text-[24px] font-bold tracking-[-0.01em] text-text">
                {tool.name}
              </h2>
              <p className="text-[16px] leading-[1.65] text-muted">
                {tool.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
