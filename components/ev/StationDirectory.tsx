import type { EvStation } from "@/lib/ev";
import { directionsUrl, hasCoords } from "@/lib/ev";

/**
 * Server-rendered directory of every station, grouped by district.
 *
 * The map itself is `ssr: false`, so without this the page is an empty <div>
 * to a crawler. This is the page's actual indexable content — real headings,
 * real addresses, real links — not hidden keyword text.
 */
export default function StationDirectory({ stations }: { stations: EvStation[] }) {
  const byDistrict = new Map<string, EvStation[]>();
  for (const s of stations) {
    const key = s.district?.trim() || "Other";
    byDistrict.set(key, [...(byDistrict.get(key) ?? []), s]);
  }

  const districts = [...byDistrict.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );
  const operators = new Set(
    stations.map((s) => s.operator_network).filter(Boolean)
  );

  return (
    <section
      id="station-directory"
      aria-labelledby="directory-heading"
      className="mx-auto max-w-container px-5 py-14 sm:px-8 lg:px-12"
    >
      <h2
        id="directory-heading"
        className="font-heading text-[28px] font-extrabold tracking-[-0.02em] text-text"
      >
        EV charging stations in Sri Lanka
      </h2>
      <p className="mt-2 max-w-prose font-body text-[16px] leading-relaxed text-muted">
        {stations.length} charging points across {districts.length} districts,
        from {operators.size} operator networks. Every entry links straight to
        directions. Stations marked <em>approximate</em> are geocoded to the
        street or area — check the address before travelling.
      </p>

      <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
        {districts.map(([district, list]) => (
          <div key={district}>
            <h3 className="border-b border-border pb-2 font-heading text-[15px] font-bold uppercase tracking-[0.06em] text-text">
              {district}{" "}
              <span className="font-normal normal-case tracking-normal text-muted">
                ({list.length})
              </span>
            </h3>
            <ul className="mt-3 space-y-3.5">
              {list
                .sort((a, b) => a.station_name.localeCompare(b.station_name))
                .map((s) => {
                  const href = directionsUrl(s);
                  return (
                    <li key={s.id}>
                      <p className="font-heading text-[14.5px] font-semibold leading-snug text-text">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent"
                          >
                            {s.station_name}
                          </a>
                        ) : (
                          s.station_name
                        )}
                      </p>
                      {s.address && (
                        <p className="mt-0.5 font-body text-[13.5px] leading-snug text-muted">
                          {s.address}
                        </p>
                      )}
                      <p className="mt-0.5 font-body text-[12.5px] leading-snug text-muted">
                        {[
                          s.operator_network,
                          s.connector_types,
                          s.charger_level,
                          !hasCoords(s)
                            ? "location pending"
                            : s.geo_precision === "approximate"
                              ? "approximate location"
                              : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
