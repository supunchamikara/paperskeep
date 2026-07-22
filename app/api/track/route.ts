import { NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";

/**
 * Records a single page view by incrementing that page's counter
 * (public.increment_page_view). Called by the client <Analytics /> beacon on
 * every public navigation. One row per page — no per-view bulk records.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const path = typeof b.path === "string" ? b.path.slice(0, 300) : null;
  if (!path) return NextResponse.json({ ok: false }, { status: 400 });

  const slug = typeof b.slug === "string" ? b.slug.slice(0, 200) : null;

  try {
    const supabase = createPublicClient();
    const { error } = await supabase.rpc("increment_page_view", {
      p_path: path,
      p_slug: slug,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    // Non-fatal: analytics must never break navigation or the build.
    console.error("track:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
