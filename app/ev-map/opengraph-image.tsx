import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import { createPublicClient } from "@/utils/supabase/public";

export const alt = "EV Charging Stations in Sri Lanka — Interactive Map";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card for /ev-map, with the live station count baked in. */
export default async function EvMapOgImage() {
  let count = 0;
  try {
    const supabase = createPublicClient();
    const { count: c } = await supabase
      .from("ev_stations")
      .select("station_id", { count: "exact", head: true })
      .eq("status", "active")
      .not("latitude", "is", null);
    count = c ?? 0;
  } catch {
    // A share image must never fail the build; fall back to no count.
  }

  const subtitle =
    (count > 0 ? `${count} charging points · ` : "") +
    "Colombo · Kandy · Galle · every district";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "#2C8C87",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            P
          </div>
          <div style={{ display: "flex", fontSize: "40px", fontWeight: 700, color: "#fff" }}>
            <span>Paper</span>
            <span style={{ color: "#38B2A6" }}>skeep</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "62px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "940px",
            }}
          >
            EV charging stations across Sri Lanka
          </div>
          {/* Satori needs a single text child unless display is set explicitly. */}
          <div style={{ fontSize: "28px", color: "#93A2B7" }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", height: "8px", width: "160px", background: "#2C8C87", borderRadius: "999px" }} />
      </div>
    ),
    { ...size }
  );
}
