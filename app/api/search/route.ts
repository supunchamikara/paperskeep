import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts";

// Lightweight search index (published posts) for the client-side search dialog.
export const revalidate = 300;

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
  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
