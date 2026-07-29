import type { Metadata } from "next";
import EvMapClient from "@/components/ev/EvMapClient";
import StationDirectory from "@/components/ev/StationDirectory";
import JsonLd from "@/components/JsonLd";
import type { EvStation } from "@/lib/ev";
import { hasCoords } from "@/lib/ev";
import { siteConfig } from "@/lib/site";
import { createPublicClient } from "@/utils/supabase/public";

const TITLE = "EV Charging Stations in Sri Lanka — Interactive Map";
const DESCRIPTION =
  "Find EV charging stations across Sri Lanka on an interactive map. Search Colombo, Kandy, Galle and every district by operator, connector type and charging speed, with directions to each site.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "EV charging Sri Lanka",
    "electric vehicle charging stations",
    "EV charging map Colombo",
    "CCS2 charger Sri Lanka",
    "CHAdeMO Sri Lanka",
    "DC fast charging",
    "chargeNET",
    "car charging near me Sri Lanka",
  ],
  alternates: { canonical: "/ev-map" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/ev-map`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: siteConfig.twitterHandle,
  },
  robots: { index: true, follow: true },
};

// Station data changes only when a new import phase lands, so an hourly
// revalidate keeps the page static and cheap.
export const revalidate = 3600;

async function getStations(): Promise<EvStation[]> {
  const supabase = createPublicClient();

  // TODO(scale): switch to a viewport-bounds query when the table grows — fetch
  // on the map's `moveend` with `.gte("latitude", south).lte("latitude", north)`
  // (and the same for longitude) rather than pulling every row. At this size
  // one fetch is far cheaper than per-pan round trips.
  //
  // Rows without coordinates are kept: they can't be drawn, but they belong in
  // the directory below so the page still lists every known station.
  const { data, error } = await supabase
    .from("ev_stations")
    .select("*")
    .eq("status", "active")
    .order("station_id");

  if (error) {
    console.error("Failed to load EV stations:", error.message);
    return [];
  }
  return (data ?? []) as EvStation[];
}

/**
 * schema.org markup for the mappable stations. `EVChargingStation` is a real
 * schema.org type, so each entry can carry its own coordinates rather than the
 * page being one opaque blob to a crawler.
 */
function buildJsonLd(stations: EvStation[]) {
  const located = stations.filter(hasCoords);
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: TITLE,
      description: DESCRIPTION,
      numberOfItems: located.length,
      itemListElement: located.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "EVChargingStation",
          name: s.station_name,
          ...(s.operator_network && { brand: s.operator_network }),
          address: {
            "@type": "PostalAddress",
            ...(s.address && { streetAddress: s.address }),
            ...(s.district && { addressRegion: s.district }),
            addressCountry: "LK",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: s.latitude,
            longitude: s.longitude,
          },
          ...(s.connector_types && {
            amenityFeature: {
              "@type": "LocationFeatureSpecification",
              name: "Connector types",
              value: s.connector_types,
            },
          }),
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "EV Map",
          item: `${siteConfig.url}/ev-map`,
        },
      ],
    },
  ];
}

export default async function EvMapPage() {
  const stations = await getStations();

  return (
    <>
      <JsonLd data={buildJsonLd(stations)} />

      {/* The map is client-only; this heading is what a crawler reads first. */}
      <h1 className="sr-only">{TITLE}</h1>

      {/* 72px is the unscrolled header height (see components/Header.tsx). The
          vh class is the fallback; browsers that understand dvh take the inline
          value and stay correct under mobile browser chrome. */}
      <div
        className="w-full [height:calc(100vh-72px)]"
        style={{ height: "calc(100dvh - 72px)" }}
      >
        <EvMapClient stations={stations.filter(hasCoords)} />
      </div>

      <StationDirectory stations={stations} />
    </>
  );
}
