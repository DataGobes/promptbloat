import type { Issue } from "@/lib/detectors/types";
import { IssueCard } from "./issue-card";

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-gray-400 text-sm italic">No issues found. Your prompt is clean.</div>
    );
  }

  return (
    <div>
      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
        Issues Found ({issues.length})
      </div>
      {issues.map((issue, i) => (
        <IssueCard key={i} issue={issue} />
      ))}
    </div>
  );
}
