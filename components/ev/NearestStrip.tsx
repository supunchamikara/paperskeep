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
      <p className="mb-1.5 px-1 font-heading text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[11px]">
        Nearest other stations
      </p>
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {stations.map((s) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="flex h-full w-[168px] flex-col items-start gap-0.5 rounded-card border border-border bg-surface px-3 py-2.5 text-left shadow-token transition-colors hover:border-accent sm:w-[220px] sm:gap-1 sm:px-3.5 sm:py-3"
            >
              <span className="font-heading text-[13px] font-semibold leading-tight text-text line-clamp-1 sm:text-[14px] sm:line-clamp-2">
                {s.station_name}
              </span>
              <span className="font-heading text-[12.5px] font-semibold text-accent">
                {formatKm(s.distanceKm)}
              </span>
              {s.connector_types && (
                <span className="hidden text-[12px] leading-snug text-muted line-clamp-1 sm:block">
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
