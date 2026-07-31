import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts";

// Lightweight search index (published posts + tools/pages) for the
// client-side search dialog.
export const revalidate = 300;

/**
 * Non-article destinations worth surfacing in search. They carry an explicit
 * `href` because, unlike posts, they don't live under /articles/. Keywords go
 * in `tags` so the existing scorer picks them up without special-casing.
 */
const staticEntries = [
  {
    slug: "tools-epub-studio",
    href: "/tools/epub-studio",
    title: "EPUB Studio — KDP-Optimized EPUB Creator",
    excerpt:
      "Write or paste your novel, style it, add a cover, and export a KDP-ready EPUB 3 file. Runs entirely in your browser.",
    category: "Tool",
    tags: [
      "epub",
      "epub studio",
      "kdp",
      "kindle",
      "kindle direct publishing",
      "ebook",
      "ebook formatting",
      "self-publishing",
      "novel",
      "cover",
    ],
    date: "",
    readingTime: "Free tool",
  },
  {
    slug: "tools",
    href: "/tools",
    title: "Tools — Free Browser-Based Tools",
    excerpt:
      "Free, browser-based tools from Paperskeep. Nothing to install, nothing uploaded.",
    category: "Tool",
    tags: ["tools", "free tools", "browser tools", "utilities"],
    date: "",
    readingTime: "Index",
  },
  {
    slug: "ev-map",
    href: "/ev-map",
    title: "EV Charging Stations in Sri Lanka — Interactive Map",
    excerpt:
      "Find EV charging stations across Sri Lanka by district, operator, connector type and charging speed.",
    category: "Map",
    tags: [
      "ev",
      "ev map",
      "charging",
      "electric vehicle",
      "sri lanka",
      "chargenet",
      "ccs2",
    ],
    date: "",
    readingTime: "Interactive",
  },
];

export async function GET() {
  const posts = await getAllPosts();
  const index = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    tags: p.tags,
    date: p.formattedDate,
    readingTime: p.readingTime,
  }));

  // Tools first: they are few, and an exact-name query should not be buried
  // under articles that merely mention the word.
  return NextResponse.json([...staticEntries, ...index], {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
