import { ImageResponse } from "next/og";

export const alt = "EPUB Studio Guide — how to format your book for Kindle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card for the guide. Nested routes do not inherit the parent segment's
 * opengraph-image, so without this the page would share with no image at all.
 */
export default function EpubStudioGuideOgImage() {
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

          <div
            style={{
              display: "flex",
              marginLeft: "16px",
              padding: "8px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(56,178,166,0.45)",
              background: "rgba(56,178,166,0.12)",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#38B2A6",
            }}
          >
            GUIDE
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
              maxWidth: "960px",
            }}
          >
            How to format your book for Kindle
          </div>
          {/* Satori needs a single text child unless display is set explicitly. */}
          <div style={{ fontSize: "28px", color: "#93A2B7", maxWidth: "960px" }}>
            Markup reference · typography · KDP cover sizes · 5-step walkthrough
          </div>
        </div>

        <div style={{ display: "flex", height: "8px", width: "160px", background: "#2C8C87", borderRadius: "999px" }} />
      </div>
    ),
    { ...size }
  );
}
