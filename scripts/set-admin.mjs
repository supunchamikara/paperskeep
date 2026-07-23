/**
 * Create or update the admin user (email + password) WITHOUT importing posts.
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD + Supabase service-role key from env.
 *
 *   node --env-file=.env.local scripts/set-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email || !password) {
  console.error("✗ Missing ADMIN_EMAIL or ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (!error) {
  console.log(`✓ Created admin user: ${data.user.email}`);
  process.exit(0);
}

if (/already been registered|already exists/i.test(error.message)) {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list?.users?.find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
  );
  if (!existing) {
    console.error(`✗ ${email} reported as existing but not found.`);
    process.exit(1);
  }
  const { error: updErr } = await supabase.auth.admin.updateUserById(
    existing.id,
    { password, email_confirm: true }
  );
  if (updErr) throw updErr;
  console.log(`✓ Updated password for existing admin: ${email}`);
  process.exit(0);
}

console.error("✗ Failed:", error.message);
process.exit(1);
