import type { PromptSection } from "@/lib/detectors/types";

interface TokenHeatmapProps {
  sections: PromptSection[];
  totalTokens: number;
}

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  instruction: { bg: "bg-green-900/40", text: "text-green-400" },
  context: { bg: "bg-red-900/40", text: "text-[#ff6b35]" },
  example: { bg: "bg-yellow-900/40", text: "text-yellow-400" },
  formatting: { bg: "bg-orange-900/30", text: "text-gray-400" },
  other: { bg: "bg-gray-800", text: "text-gray-500" },
};

export function TokenHeatmap({ sections, totalTokens }: TokenHeatmapProps) {
  if (totalTokens === 0 || sections.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Token Distribution</div>
      <div className="flex h-8 rounded overflow-hidden text-xs">
        {sections.map((section, i) => {
          const pct = section.tokenCount / totalTokens;
          if (pct < 0.03) return null;
          const colors = SECTION_COLORS[section.type] ?? SECTION_COLORS.other;
          return (
            <div
              key={i}
              className={`${colors.bg} ${colors.text} flex items-center justify-center`}
              style={{ flex: pct }}
            >
              {pct > 0.08 && `${section.type} ${Math.round(pct * 100)}%`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
