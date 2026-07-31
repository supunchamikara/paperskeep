import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import EpubStudioGuide from "@/components/tools/EpubStudioGuide";
import {
  EPUB_STUDIO_NAME,
  faqs,
  steps,
} from "@/components/tools/epubStudioContent";
import { siteConfig } from "@/lib/site";

const TITLE = "EPUB Studio Guide — Format Your Book for Kindle";
const DESCRIPTION =
  "How to use EPUB Studio: the formatting markup, chapter and typography options, KDP cover sizes, and a five-step walkthrough to a Kindle-ready EPUB.";

const URL = `${siteConfig.url}/tools/epub-studio/guide`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "how to format a book for Kindle",
    "KDP formatting guide",
    "EPUB formatting tutorial",
    "Kindle Direct Publishing guide",
    "ebook cover size KDP",
    "EPUB markup reference",
    "self-publishing guide",
  ],
  alternates: { canonical: "/tools/epub-studio/guide" },
  openGraph: {
    type: "article",
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
 * HowTo and FAQPage schema live here rather than on the tool page, because
 * both must describe content that is actually visible on the page carrying
 * them — Google discounts (and can penalise) markup that isn't.
 */
function buildJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": `${URL}#article`,
      headline: TITLE,
      description: DESCRIPTION,
      mainEntityOfPage: URL,
      inLanguage: "en",
      about: { "@id": `${siteConfig.url}/tools/epub-studio#app` },
      publisher: { "@id": `${siteConfig.url}/#organization` },
      proficiencyLevel: "Beginner",
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
        {
          "@type": "ListItem",
          position: 3,
          name: EPUB_STUDIO_NAME,
          item: `${siteConfig.url}/tools/epub-studio`,
        },
        { "@type": "ListItem", position: 4, name: "Guide", item: URL },
      ],
    },
  ];
}

export default function EpubStudioGuidePage() {
  return (
    <>
      <JsonLd data={buildJsonLd()} />
      <EpubStudioGuide />
    </>
  );
}
