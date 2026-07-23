import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

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
    `- [About](${base}/about): About ${siteConfig.name}.`,
    `- [Contact](${base}/contact): Get in touch.`,
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
