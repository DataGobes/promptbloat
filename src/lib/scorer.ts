import type { Issue } from "@/lib/detectors/types";

export function computeBloatScore(totalTokens: number, issues: Issue[]): number {
  if (totalTokens === 0 && issues.length === 0) return 0;
  if (totalTokens === 0) return 100;

  const totalWasted = issues.reduce((sum, i) => sum + i.tokensWasted, 0);
  const wasteRatio = totalWasted / totalTokens;

  const severityPenalty = issues.reduce((sum, i) => {
    if (i.severity === "CRITICAL") return sum + 10;
    if (i.severity === "WARNING") return sum + 5;
    return sum + 2;
  }, 0);

  const raw = wasteRatio * 70 + Math.min(severityPenalty, 30);
  return Math.min(100, Math.round(raw));
}

const GRADE_THRESHOLDS: [number, string][] = [
  [10, "A+"],
  [20, "A"],
  [35, "B"],
  [55, "C"],
  [75, "D"],
  [Infinity, "F"],
];

export function getLetterGrade(score: number): string {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score <= threshold) return grade;
  }
  return "F";
}

const HEADLINES: Record<string, string> = {
  "A+": "Surgically precise. Are you a compiler?",
  A: "Clean. Suspiciously clean.",
  B: "Not bad. Room to trim.",
  C: "Average. Which means bloated.",
  D: "This prompt needs an intervention.",
  F: "This prompt is a cry for help.",
};

export function getHeadline(grade: string): string {
  return HEADLINES[grade] ?? HEADLINES["F"];
}
