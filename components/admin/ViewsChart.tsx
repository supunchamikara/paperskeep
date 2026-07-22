"use client";

import { useState } from "react";

export interface DailyView {
  day: string; // ISO date
  views: number;
}

/**
 * Single-series daily-views bar chart. One measure, one hue (brand accent) —
 * no legend needed (the title names the series). Bars have 4px rounded tops,
 * a 2px gap, a recessive baseline, and a per-bar hover tooltip. An accessible
 * data table is provided below for non-visual / keyboard users.
 */
export default function ViewsChart({ data }: { data: DailyView[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.views));

  const fmt = (iso: string, long = false) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(long ? { weekday: "short" } : {}),
      timeZone: "UTC",
    });

  return (
    <figure className="m-0">
      <div className="relative flex h-[200px] items-end gap-[2px]">
        {/* recessive baseline */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />

        {data.map((d, i) => {
          const h = (d.views / max) * 100;
          const active = hover === i;
          return (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* bar */}
              <div
                className="w-full rounded-t-[4px] bg-accent transition-[height,opacity] duration-200"
                style={{
                  height: `max(${h}%, ${d.views > 0 ? "3px" : "0px"})`,
                  opacity: hover === null || active ? 1 : 0.55,
                }}
                aria-hidden="true"
              />

              {/* tooltip */}
              {active && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-center shadow-token">
                  <div className="font-heading text-[13px] font-bold text-text">
                    {d.views.toLocaleString()} view{d.views === 1 ? "" : "s"}
                  </div>
                  <div className="font-heading text-[11px] text-muted">
                    {fmt(d.day, true)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* x-axis: label the first, middle and last day to stay uncluttered */}
      <div className="mt-2 flex justify-between font-heading text-[11px] text-muted">
        <span>{data.length > 0 && fmt(data[0].day)}</span>
        <span>
          {data.length > 2 && fmt(data[Math.floor(data.length / 2)].day)}
        </span>
        <span>{data.length > 1 && fmt(data[data.length - 1].day)}</span>
      </div>

      {/* Accessible fallback table */}
      <figcaption className="sr-only">
        Daily page views for the last {data.length} days.
      </figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th>Date</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{fmt(d.day, true)}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
