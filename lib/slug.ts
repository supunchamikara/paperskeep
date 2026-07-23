/**
 * Turns a category or tag label into a URL slug and back-matches it.
 * "Hair Styles" -> "hair-styles", "Web Platform" -> "web-platform".
 */
export function slugifyTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
