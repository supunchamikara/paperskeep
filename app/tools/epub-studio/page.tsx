import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import EpubStudioGuide from "@/components/tools/EpubStudioGuide";
import {
  EPUB_STUDIO_NAME,
  faqs,
  features,
  steps,
} from "@/components/tools/epubStudioContent";
import { siteConfig } from "@/lib/site";
import EpubStudio from "./EpubStudio";

const TITLE = "EPUB Studio — KDP-Optimized EPUB Creator";
const DESCRIPTION =
  "Free browser-based EPUB 3 creator for Kindle Direct Publishing. Write or paste your novel, style the chapters, add a cover, and export a KDP-ready ebook. Nothing is uploaded — it all runs on your machine.";

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
 * Structured data. Everything here is derived from the copy rendered by
 * <EpubStudioGuide />, so the markup and the visible page always agree —
 * Google penalises FAQ and HowTo schema that isn't on the page.
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
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to create an EPUB for Kindle Direct Publishing",
      description:
        "Turn a manuscript into a KDP-ready EPUB 3 file using EPUB Studio, entirely in the browser.",
      totalTime: "PT20M",
      tool: { "@type": "HowToTool", name: EPUB_STUDIO_NAME },
      step: steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.body,
        url: `${URL}#step-${i + 1}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
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
      <EpubStudioGuide />
    </>
  );
}
