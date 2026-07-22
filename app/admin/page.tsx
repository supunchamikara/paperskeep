import type { Metadata } from "next";
import Link from "next/link";
import { getAdminPosts } from "./actions";
import PostRowActions from "@/components/admin/PostRowActions";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

export default async function AdminDashboard() {
  const posts = await getAdminPosts();
  const published = posts.filter((p) => p.published).length;

  return (
    <div className="mx-auto max-w-container px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[30px] font-extrabold tracking-[-0.02em] text-text">
            Posts
          </h1>
          <p className="mt-1 font-body text-[15px] text-muted">
            {posts.length} total · {published} published ·{" "}
            {posts.length - published} draft
            {posts.length - published === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-[6px] bg-accent px-5 py-2.5 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-accent-strong"
        >
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-block border border-border bg-surface p-12 text-center shadow-token">
          <p className="mb-4 font-body text-[16px] text-muted">
            No posts yet. Run <code className="rounded bg-pill px-1.5 py-0.5">npm run db:seed</code>{" "}
            to import the samples, or create your first post.
          </p>
          <Link
            href="/admin/new"
            className="inline-block rounded-[6px] bg-navy px-6 py-3 font-heading text-[14px] font-semibold text-white"
          >
            Create a post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-block border border-border bg-surface shadow-token">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border font-heading text-[12px] uppercase tracking-[0.04em] text-muted">
                  <th className="px-5 py-3.5 font-semibold">Title</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-[15px] font-semibold text-text">
                          {post.title}
                        </span>
                        {post.featured && (
                          <span className="rounded-pill bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 font-heading text-[10px] font-bold uppercase text-accent">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-body text-[12.5px] text-muted">
                        /articles/{post.slug}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-heading text-[13px] text-muted">
                      {post.category}
                    </td>
                    <td className="px-5 py-4 font-heading text-[13px] text-muted">
                      {formatDate(post.date)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-heading text-[12.5px] font-semibold ${
                          post.published ? "text-accent" : "text-muted"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            post.published ? "bg-accent" : "bg-muted"
                          }`}
                        />
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <PostRowActions
                          id={post.id}
                          slug={post.slug}
                          title={post.title}
                          published={post.published}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
