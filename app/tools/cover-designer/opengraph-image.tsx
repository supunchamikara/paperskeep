import { ImageResponse } from "next/og";

export const alt = "Cover Designer — free online book cover maker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card for /tools/cover-designer. */
export default function CoverDesignerOgImage() {
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
            FREE TOOL
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "960px",
            }}
          >
            Cover Designer
          </div>
          {/* Satori needs a single text child unless display is set explicitly. */}
          <div style={{ fontSize: "30px", color: "#93A2B7", maxWidth: "960px" }}>
            Upload an image, set it in professional cover type, export a PNG or JPG
          </div>
        </div>

        <div style={{ display: "flex", height: "8px", width: "160px", background: "#2C8C87", borderRadius: "999px" }} />
      </div>
    ),
    { ...size }
  );
}
