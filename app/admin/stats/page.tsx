import type { Metadata } from "next";
import Link from "next/link";
import { getStats } from "../actions";

export const metadata: Metadata = {
  title: "Statistics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("en-US");

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-token transition-theme">
      <div className="font-heading text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
        {label}
      </div>
      <div className="mt-2 font-heading text-[32px] font-extrabold leading-none tracking-[-0.02em] text-text">
        {nf.format(value)}
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const { totalViews, articleViews, pagesTracked, pages } = await getStats();
  const maxViews = Math.max(1, ...pages.map((p) => p.views));

  return (
    <div className="mx-auto max-w-container px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-heading text-[30px] font-extrabold tracking-[-0.02em] text-text">
          Statistics
        </h1>
        <p className="mt-1 font-body text-[15px] text-muted">
          One counter per page — updated on every visit.
        </p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Total views" value={totalViews} />
        <StatTile label="Article views" value={articleViews} />
        <StatTile label="Pages tracked" value={pagesTracked} />
      </div>

      {/* Per-page counters */}
      <section className="mt-8 overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-[16px] font-bold text-text">
            Views by page
          </h2>
        </div>

        {pages.length === 0 ? (
          <p className="px-6 py-10 text-center font-body text-[15px] text-muted">
            No views recorded yet. Counts appear here as visitors browse the
            site.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pages.map((p) => (
              <li key={p.path} className="flex items-center gap-4 px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {p.isPost && p.slug ? (
                      <Link
                        href={`/articles/${p.slug}`}
                        target="_blank"
                        className="truncate font-heading text-[14.5px] font-semibold text-text hover:text-accent"
                      >
                        {p.title ?? p.slug}
                      </Link>
                    ) : (
                      <span className="truncate font-heading text-[14.5px] font-semibold text-text">
                        {p.path === "/" ? "Home" : p.path}
                      </span>
                    )}
                    {p.isPost && (
                      <span className="rounded-pill bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 font-heading text-[10px] font-bold uppercase text-accent">
                        Post
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-body text-[12.5px] text-muted">
                    {p.path}
                  </div>
                  {/* magnitude bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-pill">
                    <div
                      className="h-full rounded-pill bg-accent"
                      style={{ width: `${(p.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-heading text-[15px] font-bold tabular-nums text-text">
                  {nf.format(p.views)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 font-body text-[13px] text-muted">
        Admin pages are not counted. A post&apos;s counter is removed
        automatically when the post is deleted.
      </p>
    </div>
  );
}
