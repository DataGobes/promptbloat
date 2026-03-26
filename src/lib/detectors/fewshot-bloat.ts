import { countTokens } from "@/lib/tokenizer";
import type { DetectorResult, Issue, Severity } from "./types";

// Patterns that indicate numbered examples or Q/A pairs
const EXAMPLE_PATTERNS = [
  /^example\s+\d+\s*:/i,      // "Example 1:", "Example 2:", etc.
  /^input\s*:/i,               // "Input:"
  /^user\s*:/i,                // "User:"
  /^human\s*:/i,               // "Human:"
  /^q\s*:/i,                   // "Q:"
  /^question\s*:/i,            // "Question:"
];

export function detectFewshotBloat(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  const exampleLineNumbers: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (EXAMPLE_PATTERNS.some((p) => p.test(trimmed))) {
      exampleLineNumbers.push(i + 1);
    }
  }

  const count = exampleLineNumbers.length;
  if (count < 4) return { issues };

  const severity: Severity = count >= 6 ? "WARNING" : "INFO";

  // Estimate tokens wasted (examples beyond 3 are likely bloat)
  const exampleText = exampleLineNumbers
    .slice(3)
    .map((ln) => lines[ln - 1])
    .join("\n");
  const wasted = countTokens(exampleText);

  issues.push({
    detector: "fewshot-bloat",
    severity,
    tokensWasted: wasted,
    message: `Few-shot bloat: ${count} examples detected. Research suggests 2-3 examples are sufficient; additional examples have diminishing returns.`,
    lineStart: exampleLineNumbers[0],
    lineEnd: exampleLineNumbers[exampleLineNumbers.length - 1],
  });

  return { issues };
}
