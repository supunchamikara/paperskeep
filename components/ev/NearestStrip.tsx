"use client";

import type { NearbyStation } from "@/lib/ev";
import { formatKm } from "@/lib/ev";

/**
 * Horizontally scrollable strip of the stations closest to the selected one.
 * Clicking a card selects it, which re-runs the search from the new origin.
 */
export default function NearestStrip({
  stations,
  onSelect,
  className = "",
}: {
  stations: NearbyStation[];
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (!stations.length) return null;

  return (
    <div className={className}>
      <p className="mb-2 px-1 font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Nearest other stations
      </p>
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {stations.map((s) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="flex h-full w-[220px] flex-col items-start gap-1 rounded-card border border-border bg-surface px-3.5 py-3 text-left shadow-token transition-colors hover:border-accent"
            >
              <span className="font-heading text-[14px] font-semibold leading-tight text-text line-clamp-2">
                {s.station_name}
              </span>
              <span className="font-heading text-[12.5px] font-semibold text-accent">
                {formatKm(s.distanceKm)}
              </span>
              {s.connector_types && (
                <span className="text-[12px] leading-snug text-muted line-clamp-1">
                  {s.connector_types}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
