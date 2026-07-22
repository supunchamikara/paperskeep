import readingTime from "reading-time";
import { createPublicClient } from "@/utils/supabase/public";

/**
 * Posts are stored in Supabase (table `public.posts`) and managed from the
 * /admin panel. This module provides PUBLIC reads (published posts only) for
 * the marketing site, sitemap, and RSS feed. Admin reads/writes live in
 * `app/admin/actions.ts` (they use the authenticated server client).
 */

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  cover_image: string;
  tags: string[];
  author: string | null;
  featured: boolean;
  published: boolean;
  date: string; // ISO date
  created_at: string;
  updated_at: string;
}

export interface PostMeta {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string;
  tags: string[];
  author?: string;
  featured: boolean;
  published: boolean;
  date: string;
  readingTime: string; // e.g. "8 min read"
  formattedDate: string; // e.g. "Jul 18, 2026"
}

export interface Post extends PostMeta {
  content: string; // raw MDX body
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

/** Map a raw DB row → the app's Post shape (with derived fields). */
export function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    content: row.content,
    coverImage: row.cover_image,
    tags: row.tags ?? [],
    author: row.author ?? undefined,
    featured: row.featured,
    published: row.published,
    date: row.date,
    readingTime: readingTime(row.content || "").text,
    formattedDate: formatDate(row.date),
  };
}

const stripContent = ({ content, ...meta }: Post): PostMeta => meta;

/** All published posts, newest first. Returns [] if Supabase isn't ready. */
export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getAllPosts:", error.message);
      return [];
    }
    return (data as PostRow[]).map(mapPost).map(stripContent);
  } catch (e) {
    // Missing env vars or an unreachable DB must never crash the build/render.
    console.error("getAllPosts:", (e as Error).message);
    return [];
  }
}

/** A single published post by slug, or null. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapPost(data as PostRow);
  } catch (e) {
    console.error("getPostBySlug:", (e as Error).message);
    return null;
  }
}

/** Slugs of published posts, for generateStaticParams. */
export async function getPostSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug")
      .eq("published", true);

    if (error || !data) return [];
    return data.map((r) => r.slug as string);
  } catch (e) {
    console.error("getPostSlugs:", (e as Error).message);
    return [];
  }
}

/** The featured post (falls back to the newest). */
export async function getFeaturedPost(): Promise<PostMeta | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.featured) ?? posts[0] ?? null;
}

/**
 * Up to `limit` featured posts for the home hero row. Uses posts flagged
 * `featured` first, then fills with the newest others so the row is complete.
 */
export async function getFeaturedPosts(limit = 2): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  const featured = posts.filter((p) => p.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  const fill = posts
    .filter((p) => !featured.some((f) => f.slug === p.slug))
    .slice(0, limit - featured.length);
  return [...featured, ...fill].slice(0, limit);
}

/**
 * Related posts: same category first, then fill with the newest others.
 * Excludes the current post. Returns up to `limit`.
 */
export async function getRelatedPosts(
  slug: string,
  limit = 3
): Promise<PostMeta[]> {
  const all = await getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return all.slice(0, limit);

  const sameCategory = all.filter(
    (p) => p.slug !== slug && p.category === current.category
  );
  const others = all.filter(
    (p) => p.slug !== slug && p.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** Unique tag list across all published posts, sorted alphabetically. */
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const set = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
