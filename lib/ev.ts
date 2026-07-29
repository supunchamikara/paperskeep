/**
 * EV charging-station types and geo helpers.
 *
 * Kept framework-free (no React, no Leaflet) so the distance maths can be
 * unit-tested on its own and reused server-side if we ever move the
 * nearest-station search into an API route.
 */

export type EvStation = {
  id: string;
  station_id: string;
  station_name: string;
  operator_network: string | null;
  district: string | null;
  province: string | null;
  address: string | null;
  charger_level: string | null;
  connector_types: string | null;
  power_kw: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_link: string | null;
  access: string | null;
  status: string | null;
  source: string | null;
  last_verified: string | null;
  added_phase: string | null;
  /**
   * How much to trust `latitude`/`longitude`:
   * `exact` — from the operator or a mapped OSM POI;
   * `approximate` — geocoded to the street/area, so the pin can be a few
   * hundred metres out. Surfaced in the UI so nobody navigates on a guess.
   */
  geo_precision: "exact" | "approximate" | null;
};

/** Coordinates good enough to navigate to. */
export const isExact = (station: EvStation) => station.geo_precision !== "approximate";

/** A station paired with its distance from whichever station is selected. */
export type NearbyStation = EvStation & { distanceKm: number };

/** A station we know we can plot — coordinates are non-null. */
export type LocatedStation = EvStation & { latitude: number; longitude: number };

/** Colombo — the map's default view. */
export const COLOMBO: [number, number] = [6.9271, 79.8612];
export const DEFAULT_ZOOM = 12;
/** Zoom used when flying to a selected station. */
export const FOCUS_ZOOM = 15;

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres between two [lat, lng] points. */
export function haversineKm(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** True when a station has usable coordinates (rows may await geocoding). */
export function hasCoords(station: EvStation): station is LocatedStation {
  return (
    typeof station.latitude === "number" &&
    typeof station.longitude === "number" &&
    Number.isFinite(station.latitude) &&
    Number.isFinite(station.longitude)
  );
}

/**
 * The `n` stations closest to `selected`, nearest first, excluding `selected`
 * itself and anything without coordinates.
 *
 * TODO(scale): at thousands of rows replace this client-side scan with a
 * Supabase RPC backed by PostGIS — `order by geom <-> $point limit n`, or
 * `ST_DWithin` for a radius cap — and call it on selection instead.
 */
export function nearestStations(
  selected: EvStation,
  all: EvStation[],
  n = 5
): NearbyStation[] {
  if (!hasCoords(selected)) return [];
  const origin: [number, number] = [selected.latitude, selected.longitude];

  return all
    .filter((s) => s.id !== selected.id && hasCoords(s))
    .map((s) => ({
      ...s,
      distanceKm: haversineKm(origin, [s.latitude as number, s.longitude as number]),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, n);
}

/** Distance label used on the nearest-station cards, e.g. "2.4 km". */
export const formatKm = (km: number) => `${km.toFixed(1)} km`;

/** Prefer the curated maps link, else drop a pin on the coordinates. */
export function directionsUrl(station: EvStation): string | null {
  if (station.maps_link) return station.maps_link;
  if (hasCoords(station)) {
    return `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
  }
  return null;
}
