import type { Metadata } from "next";
import Link from "next/link";
import { getStats } from "../actions";
import { getEvStats } from "@/lib/ev-stats";

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

/** Tile variant that carries a qualifier under the number. */
function DataTile({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: number;
  note?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-token transition-theme">
      <div className="font-heading text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
        {label}
      </div>
      <div
        className={`mt-2 font-heading text-[32px] font-extrabold leading-none tracking-[-0.02em] ${
          tone === "warn" && value > 0 ? "text-accent" : "text-text"
        }`}
      >
        {nf.format(value)}
      </div>
      {note && (
        <div className="mt-1.5 font-body text-[12.5px] leading-snug text-muted">
          {note}
        </div>
      )}
    </div>
  );
}

export default async function StatsPage() {
  const [{ totalViews, articleViews, pagesTracked, pages }, ev] = await Promise.all([
    getStats(),
    getEvStats(),
  ]);
  const maxViews = Math.max(1, ...pages.map((p) => p.views));
  const maxDistrict = Math.max(1, ...ev.districts.map((d) => d.count));

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

      {/* ── EV map dataset ───────────────────────────────────────────── */}
      <div className="mt-12 mb-8">
        <h2 className="font-heading text-[24px] font-extrabold tracking-[-0.02em] text-text">
          EV map dataset
        </h2>
        <p className="mt-1 font-body text-[15px] text-muted">
          Coverage and quality of{" "}
          <Link href="/ev-map" target="_blank" className="text-accent hover:underline">
            /ev-map
          </Link>
          {ev.lastVerified && <> — last verified {ev.lastVerified}.</>}
        </p>
      </div>

      {ev.total === 0 ? (
        <p className="rounded-card border border-border bg-surface px-6 py-10 text-center font-body text-[15px] text-muted shadow-token">
          No stations in the table yet. Run{" "}
          <code className="font-heading text-[13px] text-text">npm run db:seed:ev</code>{" "}
          to import the CSV.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DataTile label="Stations" value={ev.total} note={`${ev.operators.length} operator networks`} />
            <DataTile
              label="On the map"
              value={ev.mappable}
              note={`${Math.round((ev.mappable / ev.total) * 100)}% of the table`}
            />
            <DataTile
              label="Approximate pins"
              value={ev.approximate}
              tone="warn"
              note={
                ev.precisionUnavailable
                  ? "Unknown — geo_precision column missing"
                  : "Geocoded to street/area only"
              }
            />
            <DataTile
              label="No coordinates"
              value={ev.missingCoords}
              tone="warn"
              note="Awaiting geocoding — not drawn"
            />
          </div>

          {ev.precisionUnavailable && (
            <p className="mt-4 rounded-card border border-border bg-pill px-4 py-3 font-body text-[13.5px] leading-snug text-muted">
              <strong className="font-heading font-semibold text-text">
                Precision is not being recorded.
              </strong>{" "}
              The <code className="font-heading text-[12.5px]">ev_stations</code>{" "}
              table has no{" "}
              <code className="font-heading text-[12.5px]">geo_precision</code>{" "}
              column, so approximate pins are indistinguishable from exact ones
              on the map. Run the{" "}
              <code className="font-heading text-[12.5px]">alter table</code> in{" "}
              <code className="font-heading text-[12.5px]">
                supabase/ev_stations.sql
              </code>
              , then re-seed.
            </p>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Coverage by district */}
            <section className="overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme">
              <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
                <h3 className="font-heading text-[16px] font-bold text-text">
                  Coverage by district
                </h3>
                <span className="font-body text-[12.5px] text-muted">
                  {ev.districts.length} districts · {ev.provinces} provinces
                </span>
              </div>
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {ev.districts.map((d) => (
                  <li key={d.name} className="flex items-center gap-4 px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-heading text-[14px] font-semibold text-text">
                        {d.name}
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-pill">
                        <div
                          className="h-full rounded-pill bg-accent"
                          style={{ width: `${(d.count / maxDistrict) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-heading text-[14px] font-bold tabular-nums text-text">
                      {nf.format(d.count)}
                    </span>
                    {d.mappable < d.count && (
                      <span
                        className="font-body text-[12px] tabular-nums text-muted"
                        title={`${d.count - d.mappable} without coordinates`}
                      >
                        −{d.count - d.mappable}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Operator networks */}
            <section className="overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-heading text-[16px] font-bold text-text">
                  Operator networks
                </h3>
              </div>
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {ev.operators.map((o) => (
                  <li
                    key={o.name}
                    className="flex items-center justify-between gap-4 px-6 py-3"
                  >
                    <span className="truncate font-heading text-[14px] font-semibold text-text">
                      {o.name}
                    </span>
                    <span className="font-heading text-[14px] font-bold tabular-nums text-text">
                      {nf.format(o.count)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-6 font-body text-[13px] text-muted">
            A district row shows its total; the grey number is how many of those
            stations have no coordinates yet.
          </p>
        </>
      )}
    </div>
  );
}
