"use client";

import dynamic from "next/dynamic";
import type { EvStation } from "@/lib/ev";

/**
 * Leaflet touches `window` at import time, so the map must never be rendered on
 * the server. `ssr: false` is only allowed inside a Client Component, which is
 * why this thin wrapper exists between the server page and <EvMap>.
 */
const EvMap = dynamic(() => import("./EvMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-pill">
      <p className="font-heading text-[14px] text-muted">Loading map…</p>
    </div>
  ),
});

export default function EvMapClient({ stations }: { stations: EvStation[] }) {
  return <EvMap stations={stations} />;
}
