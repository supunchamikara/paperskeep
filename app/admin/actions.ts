"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { PostRow } from "@/lib/posts";

export interface ActionResult {
  error?: string;
}

const CATEGORIES = ["Technology", "Business", "Lifestyle", "Culture"];

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

/** Admin-only fetch of ALL posts (drafts included). */
export async function getAdminPosts(): Promise<PostRow[]> {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: false });
  if (error) return [];
  return data as PostRow[];
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

export interface StatsOverview {
  total_views: number;
  unique_visitors: number;
  post_views: number;
  views_today: number;
  views_7d: number;
  views_30d: number;
}

export interface DailyViewRow {
  day: string;
  views: number;
}

export interface TopPostRow {
  slug: string;
  title: string | null;
  views: number;
}

const EMPTY_OVERVIEW: StatsOverview = {
  total_views: 0,
  unique_visitors: 0,
  post_views: 0,
  views_today: 0,
  views_7d: 0,
  views_30d: 0,
};

export async function getStats(days = 14): Promise<{
  overview: StatsOverview;
  daily: DailyViewRow[];
  topPosts: TopPostRow[];
}> {
  const supabase = createClient(await cookies());

  const [overviewRes, dailyRes, topRes] = await Promise.all([
    supabase.rpc("stats_overview"),
    supabase.rpc("views_daily", { p_days: days }),
    supabase.rpc("top_posts", { p_limit: 8 }),
  ]);

  const overview =
    (overviewRes.data as StatsOverview[] | null)?.[0] ?? EMPTY_OVERVIEW;

  return {
    overview,
    daily: (dailyRes.data as DailyViewRow[] | null) ?? [],
    topPosts: (topRes.data as TopPostRow[] | null) ?? [],
  };
}
