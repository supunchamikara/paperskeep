import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page (no user): render bare so it doesn't show the admin toolbar.
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg">
      {/* Admin toolbar */}
      <div className="border-b border-border bg-surface transition-theme">
        <div className="mx-auto flex max-w-container flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 sm:px-8 lg:px-12">
          <Link
            href="/admin"
            className="font-heading text-[15px] font-bold text-text"
          >
            Paperskeep <span className="text-accent">Admin</span>
          </Link>
          <nav className="flex items-center gap-5 font-heading text-[14px] font-medium">
            <Link href="/admin" className="text-muted hover:text-accent">
              Dashboard
            </Link>
            <Link href="/admin/stats" className="text-muted hover:text-accent">
              Statistics
            </Link>
            <Link href="/admin/new" className="text-muted hover:text-accent">
              New Post
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-muted hover:text-accent"
            >
              View site ↗
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden font-heading text-[13px] text-muted sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-[6px] border border-border px-4 py-2 font-heading text-[13px] font-semibold text-text transition-theme hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
