import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded default social-share image (used for pages without their own cover).
export default function OpengraphImage() {
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
        {/* Brand row */}
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

        {/* Tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "60px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
            }}
          >
            Thoughtful writing for people who build.
          </div>
          <div style={{ fontSize: "28px", color: "#93A2B7" }}>
            Technology · Business · Lifestyle · Culture · and more
          </div>
        </div>

        {/* Accent bar */}
        <div style={{ display: "flex", height: "8px", width: "160px", background: "#2C8C87", borderRadius: "999px" }} />
      </div>
    ),
    { ...size }
  );
}
