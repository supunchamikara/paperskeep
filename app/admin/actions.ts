"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { PostRow } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export interface ActionResult {
  error?: string;
}

const CATEGORIES: readonly string[] = siteConfig.categories;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse + validate the shared post form. */
function parseForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const category = String(formData.get("category") ?? "Technology").trim();
  const content = String(formData.get("content") ?? "");
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const featured = formData.get("featured") === "on";
  const published = formData.get("published") === "on";

  if (!title) return { error: "Title is required." as const };
  if (!slug) slug = slugify(title);
  if (!CATEGORIES.includes(category))
    return { error: "Invalid category." as const };

  return {
    values: {
      title,
      slug: slugify(slug),
      excerpt,
      category,
      content,
      cover_image: coverImage,
      author: author || null,
      date: date || new Date().toISOString().slice(0, 10),
      tags,
      featured,
      published,
    },
  };
}

/** Revalidate every public surface that lists or shows posts. */
function revalidatePublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  if (slug) revalidatePath(`/articles/${slug}`);
  revalidatePath("/admin");
}

export async function createPost(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("posts").insert(parsed.values);

  if (error) {
    if (error.code === "23505")
      return { error: "A post with that slug already exists." };
    return { error: error.message };
  }

  revalidatePublic(parsed.values.slug);
  redirect("/admin");
}

export async function updatePost(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("posts")
    .update(parsed.values)
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "A post with that slug already exists." };
    return { error: error.message };
  }

  revalidatePublic(parsed.values.slug);
  redirect("/admin");
}

export async function deletePost(id: string) {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("posts").delete().eq("id", id);
  revalidatePublic((data as { slug?: string } | null)?.slug);
}

/** Quick publish/unpublish toggle from the dashboard. */
export async function togglePublish(id: string, published: boolean) {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("posts")
    .update({ published })
    .eq("id", id)
    .select("slug")
    .maybeSingle();
  revalidatePublic((data as { slug?: string } | null)?.slug);
}

export async function signOut() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export interface AdminPostsPage {
  posts: PostRow[];
  total: number;
  publishedTotal: number;
}

/**
 * Admin-only, paginated fetch of posts (drafts included), newest first.
 * Returns the requested page plus total + published counts for the header.
 */
export async function getAdminPosts(
  page = 1,
  perPage = 15
): Promise<AdminPostsPage> {
  const supabase = createClient(await cookies());
  const from = Math.max(0, (page - 1) * perPage);
  const to = from + perPage - 1;

  const [pageRes, publishedRes] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
  ]);

  if (pageRes.error) return { posts: [], total: 0, publishedTotal: 0 };
  return {
    posts: (pageRes.data as PostRow[]) ?? [],
    total: pageRes.count ?? 0,
    publishedTotal: publishedRes.count ?? 0,
  };
}

export async function getAdminPost(id: string): Promise<PostRow | null> {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PostRow) ?? null;
}

// ---- Analytics / statistics ------------------------------------------

export interface PageStat {
  path: string;
  views: number;
  isPost: boolean;
  title: string | null;
  slug: string | null;
}

export interface Stats {
  totalViews: number;
  articleViews: number;
  pagesTracked: number;
  pages: PageStat[];
}

/**
 * Reads the per-page view counters (public.page_stats), joined to post titles.
 * One row per page — ordered most-viewed first.
 */
export async function getStats(): Promise<Stats> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("page_stats")
    .select("path, views, post_id, posts(title, slug)")
    .order("views", { ascending: false });

  if (error || !data) {
    return { totalViews: 0, articleViews: 0, pagesTracked: 0, pages: [] };
  }

  const pages: PageStat[] = data.map((row) => {
    // The embedded post is a to-one relation; normalize array/object shapes.
    const rel = (row as { posts?: unknown }).posts;
    const post = (Array.isArray(rel) ? rel[0] : rel) as
      | { title?: string; slug?: string }
      | null
      | undefined;
    return {
      path: row.path as string,
      views: Number(row.views) || 0,
      isPost: Boolean((row as { post_id?: string }).post_id),
      title: post?.title ?? null,
      slug: post?.slug ?? null,
    };
  });

  return {
    totalViews: pages.reduce((sum, p) => sum + p.views, 0),
    articleViews: pages.filter((p) => p.isPost).reduce((s, p) => s + p.views, 0),
    pagesTracked: pages.length,
    pages,
  };
}

// ---- Subscribers & contact messages ----------------------------------

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string | null;
  email: string;
  message: string;
  created_at: string;
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Subscriber[];
}

export async function getMessages(): Promise<ContactMessage[]> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ContactMessage[];
}

export async function deleteSubscriber(id: string) {
  const supabase = createClient(await cookies());
  await supabase.from("subscribers").delete().eq("id", id);
  revalidatePath("/admin/subscribers");
}

export async function deleteMessage(id: string) {
  const supabase = createClient(await cookies());
  await supabase.from("contact_messages").delete().eq("id", id);
  revalidatePath("/admin/subscribers");
}
