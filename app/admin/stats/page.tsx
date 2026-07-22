import type { Metadata } from "next";
import Link from "next/link";
import { getStats } from "../actions";
import ViewsChart from "@/components/admin/ViewsChart";

export const metadata: Metadata = {
  title: "Statistics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("en-US");

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-token transition-theme">
      <div className="font-heading text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
        {label}
      </div>
      <div className="mt-2 font-heading text-[32px] font-extrabold leading-none tracking-[-0.02em] text-text">
        {nf.format(value)}
      </div>
      {hint && <div className="mt-1.5 font-body text-[13px] text-muted">{hint}</div>}
    </div>
  );
}

export default async function StatsPage() {
  const { overview, daily, topPosts } = await getStats(14);
  const maxTop = Math.max(1, ...topPosts.map((p) => p.views));

  return (
    <div className="mx-auto max-w-container px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-heading text-[30px] font-extrabold tracking-[-0.02em] text-text">
          Statistics
        </h1>
        <p className="mt-1 font-body text-[15px] text-muted">
          Site traffic and post performance.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total views"
          value={overview.total_views}
          hint="All time"
        />
        <StatTile
          label="Unique visitors"
          value={overview.unique_visitors}
          hint="Distinct browsers"
        />
        <StatTile
          label="Views today"
          value={overview.views_today}
          hint={`${nf.format(overview.views_7d)} in last 7 days`}
        />
        <StatTile
          label="Article views"
          value={overview.post_views}
          hint={`${nf.format(overview.views_30d)} views in 30 days`}
        />
      </div>

      {/* Views over time */}
      <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-token transition-theme">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-[16px] font-bold text-text">
            Page views
          </h2>
          <span className="font-heading text-[12px] text-muted">
            Last 14 days
          </span>
        </div>
        <ViewsChart data={daily} />
      </section>

      {/* Top posts */}
      <section className="mt-8 rounded-card border border-border bg-surface shadow-token transition-theme">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-[16px] font-bold text-text">
            Top articles
          </h2>
        </div>

        {topPosts.length === 0 ? (
          <p className="px-6 py-10 text-center font-body text-[15px] text-muted">
            No article views recorded yet. Views appear here as visitors read
            your posts.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {topPosts.map((p, i) => (
              <li
                key={p.slug}
                className="flex items-center gap-4 px-6 py-3.5"
              >
                <span className="w-5 font-heading text-[14px] font-bold text-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/articles/${p.slug}`}
                    target="_blank"
                    className="block truncate font-heading text-[14.5px] font-semibold text-text hover:text-accent"
                  >
                    {p.title ?? p.slug}
                  </Link>
                  {/* magnitude bar (single hue) */}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-pill">
                    <div
                      className="h-full rounded-pill bg-accent"
                      style={{ width: `${(p.views / maxTop) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-heading text-[14px] font-bold tabular-nums text-text">
                  {nf.format(p.views)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 font-body text-[13px] text-muted">
        Views are recorded on the public site only (admin pages are excluded).
        Unique visitors are approximated per browser.
      </p>
    </div>
  );
}
