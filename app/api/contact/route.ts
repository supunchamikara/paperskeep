import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact form endpoint — stores a message in `contact_messages`.
 * Readable by admins at /admin/subscribers. No email is sent.
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
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Please enter a message." },
      { status: 400 }
    );
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("contact_messages").insert({
    email: email.toLowerCase(),
    name: typeof name === "string" && name.trim() ? name.trim() : null,
    message: message.trim().slice(0, 5000),
  });

  if (error) {
    console.error("contact insert:", error.message);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Thanks — we'll be in touch soon." },
    { status: 200 }
  );
}
