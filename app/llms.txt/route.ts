import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { COVER_STYLES } from "@/app/tools/cover-designer/coverStyles";

/**
 * /llms.txt — a concise, machine-readable map of the site for AI assistants
 * and LLM crawlers (an emerging convention, like robots.txt for LLMs).
 * Lists the publication summary and links to every article.
 */
export async function GET() {
  const posts = await getAllPosts();
  const base = siteConfig.url;

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Categories: ${siteConfig.categories.join(", ")}.`,
    "",
    "## Articles",
    ...posts.map(
      (p) =>
        `- [${p.title}](${base}/articles/${p.slug}): ${p.excerpt} (${p.category}, ${p.formattedDate})`
    ),
    "",
    "## Pages",
    `- [Home](${base}/): Featured and recent articles.`,
    `- [Articles](${base}/articles): All articles, filterable by category and tag.`,
    `- [EV Map](${base}/ev-map): Interactive map and full directory of electric-vehicle charging stations across Sri Lanka, by district, operator and connector type.`,
    `- [Tools](${base}/tools): Free, browser-based tools. Nothing to install, nothing uploaded.`,
    `- [About](${base}/about): About ${siteConfig.name}.`,
    `- [Contact](${base}/contact): Get in touch.`,
    "",
    "## Tools",
    `- [EPUB Studio](${base}/tools/epub-studio): Free KDP-optimized EPUB 3 creator. Write or paste novel chapters in a light markup, preview them in a Kindle-style reader, set metadata, typography, chapter-title styling and a cover, then export an ebook ready for Kindle Direct Publishing. Runs entirely client-side — no account, no upload, no storage.`,
    `- [EPUB Studio Guide](${base}/tools/epub-studio/guide): How to use EPUB Studio — the formatting markup reference, chapter and typography options, KDP cover sizes, a five-step walkthrough and FAQs.`,
    `- [Cover Designer](${base}/tools/cover-designer): Free book cover maker. Upload, drop or paste an image, then set the title, subtitle, series line and author in professional cover typography — ${COVER_STYLES.length} genre style presets covering literary, thriller, fantasy, romance, true crime, author-brand bestseller, graphic-novel and children's layouts, serif, display, vector, sans, script and typewriter typefaces, weight, tracking, letter case, colour, drop shadows, outlines, bands and hairline rules — on Kindle, print, audiobook or custom trim sizes, and export a full-resolution PNG or JPG. The design autosaves in the browser and is restored on reload, with a reset-to-default button. Runs entirely client-side — no account, no upload, nothing leaves the device.`,
    "",
    "## Feeds",
    `- RSS: ${base}/rss.xml`,
    `- Sitemap: ${base}/sitemap.xml`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
