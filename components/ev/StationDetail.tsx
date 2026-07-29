"use client";

import type { EvStation } from "@/lib/ev";
import { directionsUrl, isExact } from "@/lib/ev";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-[14.5px] leading-snug text-text">{value}</dd>
    </div>
  );
}

/**
 * Contents of the sliding detail pane. Layout-agnostic on purpose — the same
 * markup is used for the desktop left pane and the mobile bottom sheet.
 */
export default function StationDetail({
  station,
  onClose,
}: {
  station: EvStation;
  onClose: () => void;
}) {
  const directions = directionsUrl(station);
  const isActive = (station.status ?? "").toLowerCase() === "active";

  return (
    // flex-1 rather than h-full: inside the mobile sheet this sits next to the
    // nearest-stations strip, and h-full would claim the whole sheet and push
    // the strip out past the clip.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[17.5px] font-bold leading-tight text-text sm:text-[19px]">
            {station.station_name}
          </h2>
          {station.operator_network && (
            <p className="mt-0.5 text-[13.5px] text-muted">{station.operator_network}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close station details"
          className="-mr-1 shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-pill hover:text-text"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4">
        <span
          className={`pill px-2.5 py-1 text-[11px] uppercase tracking-[0.06em] ${
            isActive
              ? "bg-accent/12 text-accent"
              : "bg-pill text-muted"
          }`}
        >
          {station.status ?? "unknown"}
        </span>

        {!isExact(station) && (
          <p className="mt-3 flex gap-2 rounded-card border border-border bg-pill px-3 py-2.5 text-[12.5px] leading-snug text-muted">
            <span aria-hidden="true">⚠</span>
            <span>
              <strong className="font-heading font-semibold text-text">
                Approximate location.
              </strong>{" "}
              This pin is geocoded to the street or area, not the exact
              forecourt — check the address before you set off.
            </span>
          </p>
        )}

        <dl className="mt-4 space-y-3.5">
          <Field label="Address" value={station.address} />
          <Field
            label="Location"
            value={
              [station.district, station.province].filter(Boolean).join(", ") || null
            }
          />
          <Field label="Connectors" value={station.connector_types} />
          <Field label="Charger level" value={station.charger_level} />
          <Field label="Power" value={station.power_kw} />
          <Field label="Access" value={station.access} />
        </dl>
      </div>

      {directions && (
        <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5 sm:py-4">
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-[7px] bg-accent px-4 py-2.5 font-heading text-[14px] font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Get directions
          </a>
        </div>
      )}
    </div>
  );
}
