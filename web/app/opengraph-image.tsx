import { ImageResponse } from "next/og";

// Route segment config for the generated social card.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Editorial Noir social card: bone ground, ink serif headline, lime signal
// bars, mono stat strip. All type is system fonts (no font files in OG env).
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#EDE9E0",
        color: "#0C0C0B",
        padding: "72px 80px",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#8B867B",
          }}
        >
          InsightFlow
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              width: 22,
              height: 44,
              backgroundColor: "#0C0C0B",
              marginRight: 10,
            }}
          />
          <div
            style={{
              width: 22,
              height: 66,
              backgroundColor: "#0C0C0B",
              marginRight: 10,
            }}
          />
          <div style={{ width: 22, height: 92, backgroundColor: "#D4FF3A" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 84, lineHeight: 1.02, letterSpacing: -2 }}>
          Hear what your customers
        </div>
        <div
          style={{ fontSize: 84, lineHeight: 1.02, letterSpacing: -2, fontStyle: "italic" }}
        >
          are really saying.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderTop: "2px solid #0C0C0B",
          paddingTop: 28,
          fontFamily: "monospace",
          fontSize: 28,
          color: "#0C0C0B",
        }}
      >
        <span style={{ marginRight: 48 }}>7,000 reports</span>
        <span style={{ marginRight: 48 }}>320 unique texts</span>
        <span style={{ marginRight: 48 }}>10 named themes</span>
        <span
          style={{
            marginLeft: "auto",
            backgroundColor: "#0C0C0B",
            color: "#D4FF3A",
            padding: "8px 20px",
          }}
        >
          +205% data quality
        </span>
      </div>
    </div>,
    { ...size },
  );
}
