import type { AnalysisResult } from "@/lib/detectors/types";

interface ScoreCardProps {
  result: AnalysisResult;
}

export function ScoreCard({ result }: ScoreCardProps) {
  const gradeColor =
    result.bloatScore <= 20 ? "text-green-400" :
    result.bloatScore <= 55 ? "text-yellow-400" :
    "text-[#ff6b35]";

  return (
    <div className="text-center">
      <div className={`text-7xl font-black ${gradeColor}`}>{result.letterGrade}</div>
      <div className="text-sm text-gray-500 mt-1">Bloat Score: {result.bloatScore}/100</div>
      <div className="text-sm text-[#ff6b35] mt-2 italic">&ldquo;{result.headline}&rdquo;</div>

      <div className="mt-4 text-left text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Tokens</span>
          <span className="text-gray-200">{result.totalTokens.toLocaleString()}</span>
        </div>
        {result.costs.map((cost) => (
          <div key={cost.model} className="flex justify-between">
            <span>{cost.model}</span>
            <span className="text-gray-200">${cost.costPerCall.toFixed(4)}/call</span>
          </div>
        ))}
        <div className="flex justify-between pt-1 border-t border-[#222]">
          <span>At 1K calls/day</span>
          <span className="text-red-400">
            ${result.costs[0].costPerMonth1K.toFixed(0)}/mo
          </span>
        </div>
      </div>
    </div>
  );
}
