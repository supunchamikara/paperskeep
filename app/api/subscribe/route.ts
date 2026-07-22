import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter/contact subscribe endpoint — persists to Supabase.
 *
 * Inserts into the `subscribers` table (see supabase/schema.sql). Duplicate
 * emails are treated as success so re-subscribing is idempotent. The optional
 * `message`/`name` fields (from the contact form) are stored alongside.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, name, message } = (body ?? {}) as {
    email?: unknown;
    name?: unknown;
    message?: unknown;
  };

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("subscribers").insert({
    email: email.toLowerCase(),
    name: typeof name === "string" ? name : null,
    message: typeof message === "string" ? message : null,
  });

  // 23505 = unique_violation → already subscribed; treat as success.
  if (error && error.code !== "23505") {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Could not save your subscription. Please try again." },
      { status: 500 }
    );
  }

  const alreadySubscribed = error?.code === "23505";

  return NextResponse.json(
    {
      message: alreadySubscribed
        ? "You're already on the list — thanks!"
        : "You're subscribed! Check your inbox to confirm.",
    },
    { status: 200 }
  );
}
