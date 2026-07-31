import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  EPUB_STUDIO_NAME,
  features,
} from "@/components/tools/epubStudioContent";
import { siteConfig } from "@/lib/site";
import EpubStudio from "./EpubStudio";

const TITLE = "EPUB Studio — KDP-Optimized EPUB Creator";
const DESCRIPTION =
  "Free browser-based EPUB 3 creator for Kindle Direct Publishing. Write your novel, style it, add a cover and export a KDP-ready ebook. Nothing is uploaded.";

const URL = `${siteConfig.url}/tools/epub-studio`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "EPUB creator",
    "free EPUB maker",
    "KDP EPUB format",
    "Kindle Direct Publishing formatting",
    "EPUB 3 generator",
    "convert manuscript to EPUB",
    "ebook formatting tool",
    "novel to EPUB",
    "self-publishing tools",
    "ebook cover size KDP",
    "drop caps ebook",
    "online EPUB editor",
  ],
  alternates: { canonical: "/tools/epub-studio" },
  openGraph: {
    type: "website",
    url: URL,
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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
};

/**
 * Structured data for the tool itself. The HowTo and FAQPage blocks live on
 * /tools/epub-studio/guide alongside the copy they describe.
 */
function buildJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${URL}#app`,
      name: EPUB_STUDIO_NAME,
      alternateName: "Paperskeep EPUB Studio",
      url: URL,
      applicationCategory: "UtilitiesApplication",
      applicationSubCategory: "Ebook publishing",
      operatingSystem: "Any — runs in a web browser",
      browserRequirements: "Requires a modern browser with JavaScript enabled",
      description: DESCRIPTION,
      isAccessibleForFree: true,
      featureList: features.map((f) => f.title),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": `${siteConfig.url}/#organization` },
      inLanguage: "en",
      // Points crawlers at the documentation now that it has its own page.
      softwareHelp: { "@id": `${URL}/guide#article` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Tools",
          item: `${siteConfig.url}/tools`,
        },
        { "@type": "ListItem", position: 3, name: EPUB_STUDIO_NAME, item: URL },
      ],
    },
  ];
}

export default function EpubStudioPage() {
  return (
    <>
      <JsonLd data={buildJsonLd()} />

      {/* The workspace is client-only chrome with no readable text; this is
          the page's single h1 and what a crawler reads first. */}
      <h1 className="sr-only">{TITLE}</h1>

      <EpubStudio />
    </>
  );
}
