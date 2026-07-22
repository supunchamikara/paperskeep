export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Slugify matching rehype-slug / github-slugger for the headings we use, so
 * the TOC anchors line up with the ids MDXContent injects on <h2>/<h3>.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Pull an "On this page" table of contents from raw Markdown/MDX by scanning
 * for `##` and `###` headings (ignoring anything inside fenced code blocks).
 */
export function extractToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  let inCode = false;

  for (const raw of content.split("\n")) {
    const line = raw.trimEnd();
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, "").trim();
    items.push({ level, text, id: slugify(text) });
  }

  return items;
}
