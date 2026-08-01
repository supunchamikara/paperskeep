import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";
import CoverDesigner from "./CoverDesigner";
import { COVER_STYLES } from "./coverStyles";
import { COVER_FONTS } from "./fonts";

const TITLE = "Cover Designer — Free Online Book Cover Maker";
const DESCRIPTION =
  "Free browser-based book cover designer. Upload an image, set your title and author in professional cover typography, then export a print- or Kindle-ready PNG or JPG. Nothing is uploaded.";

const URL = `${siteConfig.url}/tools/cover-designer`;

const FEATURES = [
  "Upload, drop or paste any image as the cover art",
  `${COVER_STYLES.length} professional cover type styles by genre`,
  `${COVER_FONTS.length} book-cover typefaces — serif, display, vector, sans, script and typewriter`,
  "Drop shadows, outlines, bands and hairline rules",
  "Drag-to-place text with centre snapping",
  "Kindle, print, audiobook and custom trim sizes",
  "Export a high-resolution PNG or JPG",
  "Autosaves in the browser — image included — so a reload never loses the design",
  "Runs entirely in the browser — no upload, no account",
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "book cover designer",
    "free book cover maker",
    "online cover creator",
    "add text to image",
    "KDP cover size",
    "kindle cover maker",
    "ebook cover design",
    "audiobook cover 3000x3000",
    "book cover fonts",
    "book cover typography",
    "self-publishing tools",
    "export cover as PNG",
  ],
  alternates: { canonical: "/tools/cover-designer" },
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

function buildJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${URL}#app`,
      name: "Cover Designer",
      alternateName: "Paperskeep Cover Designer",
      url: URL,
      applicationCategory: "DesignApplication",
      applicationSubCategory: "Book cover design",
      operatingSystem: "Any — runs in a web browser",
      browserRequirements: "Requires a modern browser with JavaScript enabled",
      description: DESCRIPTION,
      isAccessibleForFree: true,
      featureList: FEATURES,
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
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Tools",
          item: `${siteConfig.url}/tools`,
        },
        { "@type": "ListItem", position: 3, name: "Cover Designer", item: URL },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to design a book cover in the browser",
      description:
        "Upload an image, add your title and author, pick a genre-appropriate type style and export a finished cover.",
      totalTime: "PT10M",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Choose a cover size",
          text: "Pick the Kindle, print, audiobook or Wattpad preset — or enter your own pixel dimensions.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Add your image",
          text: "Upload, drop or paste an image. Frame it with the fill, zoom and position controls, then set a legibility wash so the type stays readable.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Write the text",
          text: "Edit the title, subtitle, series line and author, or add layers of your own.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Apply a cover style",
          text: `Choose one of ${COVER_STYLES.length} professional type styles — from Literary Classic to Thriller, Epic Fantasy or Authority — then fine-tune the face, tracking, colour and effects.`,
        },
        {
          "@type": "HowToStep",
          position: 5,
          name: "Export",
          text: "Download the finished cover as a full-resolution PNG or JPG.",
        },
      ],
    },
  ];
}

export default function CoverDesignerPage() {
  return (
    <>
      <JsonLd data={buildJsonLd()} />

      {/* The workspace is client-only chrome with no readable text; this is
          the page's single h1 and what a crawler reads first. */}
      <h1 className="sr-only">{TITLE}</h1>

      <CoverDesigner />
    </>
  );
}
