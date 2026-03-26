import type { AnalysisResult } from "@/lib/detectors/types";
import { ScoreCard } from "./score-card";
import { TokenHeatmap } from "./token-heatmap";
import { IssueList } from "./issue-list";
import { ShareBar } from "./share-bar";

interface ResultsPanelProps {
  result: AnalysisResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <ScoreCard result={result} />
        <div>
          <TokenHeatmap sections={result.sections} totalTokens={result.totalTokens} />
          <IssueList issues={result.issues} />
        </div>
      </div>
      <ShareBar result={result} />
    </div>
  );
}
