import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PromptBloat — Your prompts are fat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ff6b35",
            marginBottom: 16,
          }}
        >
          PromptBloat
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#9ca3af",
            marginBottom: 48,
          }}
        >
          your prompts are fat
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            color: "#e5e7eb",
            fontSize: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 32px",
              background: "#111111",
              borderRadius: 12,
              border: "1px solid #222222",
            }}
          >
            <span style={{ color: "#ff6b35", fontSize: 40, fontWeight: 700 }}>
              A–F
            </span>
            <span style={{ color: "#9ca3af", fontSize: 16, marginTop: 8 }}>
              Bloat Grade
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 32px",
              background: "#111111",
              borderRadius: 12,
              border: "1px solid #222222",
            }}
          >
            <span style={{ color: "#ff6b35", fontSize: 40, fontWeight: 700 }}>
              $$$
            </span>
            <span style={{ color: "#9ca3af", fontSize: 16, marginTop: 8 }}>
              Cost Impact
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 32px",
              background: "#111111",
              borderRadius: 12,
              border: "1px solid #222222",
            }}
          >
            <span style={{ color: "#ff6b35", fontSize: 40, fontWeight: 700 }}>
              100%
            </span>
            <span style={{ color: "#9ca3af", fontSize: 16, marginTop: 8 }}>
              Client-Side
            </span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#6b7280",
          }}
        >
          promptbloat.com — Free LLM prompt efficiency analyzer
        </div>
      </div>
    ),
    { ...size }
  );
}
