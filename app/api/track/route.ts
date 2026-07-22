import { NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";

/**
 * Records a single page view. Called by the client <Analytics /> beacon on
 * every public navigation. Inserts with the anon key (RLS allows anon INSERT
 * but not SELECT, so the raw view log stays private to admins).
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
  const visitorId =
    typeof b.visitorId === "string" ? b.visitorId.slice(0, 64) : null;
  const referrer =
    typeof b.referrer === "string" && b.referrer
      ? b.referrer.slice(0, 300)
      : null;

  try {
    const supabase = createPublicClient();
    const { error } = await supabase.from("page_views").insert({
      path,
      slug,
      visitor_id: visitorId,
      referrer,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    // Non-fatal: never let analytics break navigation or the build.
    console.error("track:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
