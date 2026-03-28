import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PromptBloat Score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function gradeColor(grade: string): string {
  if (grade === "A" || grade === "A+") return "#4ade80";
  if (grade === "B") return "#facc15";
  return "#ff6b35";
}

export default async function OGImage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = await params;
  const [grade = "?", score = "0", tokens = "0", issues = "0"] = data.split("-");
  const color = gradeColor(grade);
  const formattedTokens = Number(tokens).toLocaleString();

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
        <div style={{ display: "flex", fontSize: 36, color: "#ff6b35", fontWeight: 900 }}>
          PromptBloat
        </div>
        <div style={{ display: "flex", fontSize: 18, color: "#9ca3af", marginBottom: 40 }}>
          your prompts are fat
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `4px solid ${color}`,
            background: "#111111",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 96, fontWeight: 900, color }}>
            {grade}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#e5e7eb", marginBottom: 32 }}>
          {`Bloat Score: ${score}/100`}
        </div>
        <div style={{ display: "flex", gap: 48, fontSize: 20, color: "#9ca3af" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ color: "#e5e7eb", fontSize: 28, fontWeight: 700 }}>
              {formattedTokens}
            </span>
            <span>tokens</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ color: "#e5e7eb", fontSize: 28, fontWeight: 700 }}>
              {issues}
            </span>
            <span>issues found</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#6b7280",
          }}
        >
          promptbloat.com — How bloated is yours?
        </div>
      </div>
    ),
    { ...size }
  );
}
