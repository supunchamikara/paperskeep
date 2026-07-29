"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import type { EvStation, LocatedStation } from "@/lib/ev";
import {
  COLOMBO,
  DEFAULT_ZOOM,
  FOCUS_ZOOM,
  hasCoords,
  isExact,
  nearestStations,
} from "@/lib/ev";
import StationDetail from "./StationDetail";
import NearestStrip from "./NearestStrip";

/**
 * Leaflet resolves its default marker images relative to the stylesheet, which
 * bundlers rewrite — the classic "broken marker icon" bug. Importing the images
 * hands webpack real hashed URLs (`.src` unwraps Next's static-image object).
 * We draw our own pins below, but this keeps any default marker — including the
 * cluster plugin's fallback — pointing at genuine assets.
 */
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

/**
 * Teal map pin matching the site accent; `selected` renders it larger + darker.
 * Approximate pins are drawn hollow so a glance at the map distinguishes "this
 * is the charger" from "the charger is somewhere around here".
 */
const pinIcon = (selected: boolean, exact: boolean) => {
  const size = selected ? 34 : 26;
  const fill = exact ? (selected ? "#216f6a" : "#2c8c87") : "#ffffff";
  const stroke = exact ? "#ffffff" : selected ? "#216f6a" : "#2c8c87";
  return L.divIcon({
    className: "ev-pin",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.8" aria-hidden="true">
      <path d="M12 22s7-6.4 7-12A7 7 0 0 0 5 10c0 5.6 7 12 7 12z"/>
      <circle cx="12" cy="10" r="2.6" fill="${exact ? "#ffffff" : stroke}" stroke="none"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

/** Imperative map moves live here — hooks into the parent <MapContainer>. */
function FlyToSelected({ station }: { station: LocatedStation | null }) {
  const map = useMap();

  useEffect(() => {
    if (!station) return;

    // Centring naively would tuck the marker under the detail pane, so nudge
    // the target centre away from whichever edge the pane occupies: left rail
    // on desktop, bottom sheet on mobile.
    const size = map.getSize();
    const desktop = size.x >= 768;
    const offsetX = desktop ? 180 : 0;
    const offsetY = desktop ? 0 : Math.round(size.y * 0.25);

    const point = map.project([station.latitude, station.longitude], FOCUS_ZOOM);
    const center = map.unproject(point.subtract([offsetX, -offsetY]), FOCUS_ZOOM);

    map.flyTo(center, FOCUS_ZOOM, { duration: 0.8 });
  }, [station, map]);

  // TODO(scale): once the table holds thousands of rows, listen for `moveend`
  // here and refetch only the stations inside `map.getBounds()` instead of
  // loading every row up-front (see the fetch in app/ev-map/page.tsx).
  return null;
}

export default function EvMap({ stations }: { stations: EvStation[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const located = useMemo(() => stations.filter(hasCoords), [stations]);
  const selected = useMemo(
    () => located.find((s) => s.id === selectedId) ?? null,
    [located, selectedId]
  );
  const nearest = useMemo(
    () => (selected ? nearestStations(selected, stations, 5) : []),
    [selected, stations]
  );

  // Escape closes the pane, matching the site's other overlays.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={COLOMBO}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/* Free OSM tiles — no API key. Attribution control stays visible per
            the OSM tile usage policy. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {located.map((station) => (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={pinIcon(station.id === selectedId, isExact(station))}
              title={station.station_name}
              eventHandlers={{ click: () => setSelectedId(station.id) }}
            />
          ))}
        </MarkerClusterGroup>

        <FlyToSelected station={selected} />
      </MapContainer>

      {/* Station count / empty state — the table is empty until the seed runs. */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 z-[1100] max-w-[calc(100%-1.25rem)] truncate rounded-pill border border-border bg-surface px-3 py-1 font-heading text-[11.5px] font-semibold text-text shadow-token sm:right-3 sm:top-3 sm:px-3.5 sm:py-1.5 sm:text-[12.5px]">
        {located.length
          ? `${located.length} charging ${located.length === 1 ? "station" : "stations"}`
          : "No stations loaded yet"}
      </div>

      {/* ── Detail pane. Left rail on desktop, bottom sheet on mobile.
             z-index clears Leaflet's control panes (max 1000). ── */}
      <aside
        aria-hidden={!selected}
        className={`absolute z-[1200] overflow-hidden bg-surface shadow-lift transition-transform duration-300 ease-out
          inset-x-0 bottom-0 h-[72%] max-h-[520px] rounded-t-block border-t border-border
          md:inset-y-0 md:right-auto md:left-0 md:h-auto md:max-h-none md:w-[360px] md:rounded-none md:border-r md:border-t-0
          ${
            selected
              ? "translate-y-0 md:translate-x-0"
              : "pointer-events-none translate-y-full md:translate-y-0 md:-translate-x-full"
          }`}
      >
        {selected && (
          // The sheet needs a *definite* height (h-[72%] above, not max-h) or
          // the flex-1 scroll area inside StationDetail has nothing to size
          // against and the pane silently overflows off-screen instead.
          <div className="flex h-full flex-col">
            <StationDetail station={selected} onClose={() => setSelectedId(null)} />
            {/* On mobile the sheet covers the bottom strip, so the nearest
                stations ride along inside it. */}
            <NearestStrip
              stations={nearest}
              onSelect={setSelectedId}
              className="shrink-0 border-t border-border px-4 py-2.5 md:hidden"
            />
          </div>
        )}
      </aside>

      {/* ── Nearest-station strip (desktop), offset past the detail pane. ── */}
      {selected && (
        <NearestStrip
          stations={nearest}
          onSelect={setSelectedId}
          className="pointer-events-auto absolute bottom-0 left-[360px] right-0 z-[1100] hidden bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-4 pt-5 md:block"
        />
      )}
    </div>
  );
}
