import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Cookie-less anon client for PUBLIC reads (published posts) from Server
 * Components, the sitemap, and the RSS feed. Because it carries no auth
 * cookies it stays cacheable and RLS restricts it to published rows.
 */
export const createPublicClient = () =>
  createClient(supabaseUrl!, supabaseKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
