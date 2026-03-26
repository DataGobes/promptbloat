import type { Issue } from "@/lib/detectors/types";

interface IssueCardProps {
  issue: Issue;
}

const SEVERITY_STYLES = {
  CRITICAL: { border: "border-red-900/50", bg: "bg-red-950/30", badge: "text-red-400" },
  WARNING: { border: "border-yellow-900/50", bg: "bg-yellow-950/20", badge: "text-yellow-400" },
  INFO: { border: "border-blue-900/50", bg: "bg-blue-950/20", badge: "text-blue-400" },
} as const;

export function IssueCard({ issue }: IssueCardProps) {
  const styles = SEVERITY_STYLES[issue.severity];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-md p-3 mb-2`}>
      <div className="flex justify-between items-start">
        <div>
          <span className={`${styles.badge} font-semibold text-xs`}>{issue.severity}</span>
          <span className="text-gray-200 ml-2 text-sm">{issue.detector.replace(/-/g, " ")}</span>
        </div>
        <span className="text-[#ff6b35] text-xs">~{issue.tokensWasted} tokens wasted</span>
      </div>
      <div className="text-gray-400 text-sm mt-1">{issue.message}</div>
    </div>
  );
}
