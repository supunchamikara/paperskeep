/**
 * Seed script — run once after applying supabase/schema.sql.
 *
 *   1. Creates the admin user (email confirmed) so you can sign in at /admin.
 *   2. Imports every content/posts/*.mdx file into the `posts` table.
 *
 * Requires the SERVICE ROLE key (bypasses RLS). Never expose it to the client.
 *
 * Usage (Node 20+):
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Env vars read:
 *   NEXT_PUBLIC_SUPABASE_URL       (already in .env.local)
 *   SUPABASE_SERVICE_ROLE_KEY      (add this — Dashboard → Settings → API)
 *   ADMIN_EMAIL     (optional, default admin@meridian.blog)
 *   ADMIN_PASSWORD  (optional, default Meridian!Admin2026)
 */
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@meridian.blog";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Meridian!Admin2026";

if (!url || !serviceKey) {
  console.error(
    "\n✗ Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY are set in .env.local, then run:\n" +
      "    node --env-file=.env.local scripts/seed.mjs\n"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    if (/already been registered|already exists/i.test(error.message)) {
      // Update the existing admin's password to match ADMIN_PASSWORD, so you
      // can rotate credentials by editing .env.local and re-running the seed.
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find(
        (u) => (u.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase()
      );
      if (existing) {
        const { error: updErr } = await supabase.auth.admin.updateUserById(
          existing.id,
          { password: ADMIN_PASSWORD, email_confirm: true }
        );
        if (updErr) throw updErr;
        console.log(`✓ Updated password for existing admin: ${ADMIN_EMAIL}`);
        return;
      }
      console.log(`• Admin user ${ADMIN_EMAIL} already exists — skipping.`);
      return;
    }
    throw error;
  }
  console.log(`✓ Created admin user: ${data.user.email}`);
}

async function importPosts() {
  const dir = path.join(process.cwd(), "content", "posts");
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".mdx"));
  } catch {
    console.log("• No content/posts directory — skipping post import.");
    return;
  }

  const rows = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), "utf8");
    const { data: fm, content } = matter(raw);
    rows.push({
      slug: file.replace(/\.mdx$/, ""),
      title: fm.title ?? "Untitled",
      excerpt: fm.excerpt ?? "",
      category: fm.category ?? "Technology",
      content: content.trim(),
      cover_image: fm.coverImage ?? "",
      tags: fm.tags ?? [],
      author: fm.author ?? null,
      featured: fm.featured ?? false,
      published: true,
      date: fm.date ?? new Date().toISOString().slice(0, 10),
    });
  }

  if (rows.length === 0) {
    console.log("• No .mdx posts found to import.");
    return;
  }

  const { error } = await supabase
    .from("posts")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ Imported/updated ${rows.length} posts.`);
}

async function main() {
  console.log("→ Seeding Paperskeep…\n");
  await createAdmin();
  await importPosts();
  console.log(
    `\n✓ Done.\n\n  Admin login → /admin/login\n  Email:    ${ADMIN_EMAIL}\n  Password: ${ADMIN_PASSWORD}\n`
  );
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
