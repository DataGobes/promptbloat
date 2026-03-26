import { countTokens } from "@/lib/tokenizer";
import type { DetectorResult, Issue } from "./types";

interface FillerPattern {
  regex: RegExp;
  label: string;
  message: string;
}

const FILLER_PATTERNS: FillerPattern[] = [
  // Politeness
  {
    regex: /\bplease\b/gi,
    label: "politeness",
    message: 'Unnecessary politeness: "please" adds tokens without adding meaning.',
  },
  {
    regex: /\bcould you\b/gi,
    label: "politeness",
    message: '"Could you" is a polite hedge — models don\'t need to be asked nicely.',
  },
  {
    regex: /\bmake sure (to|that)\b/gi,
    label: "politeness",
    message: '"Make sure to/that" is a filler preamble — just state the requirement.',
  },
  {
    regex: /\bensure that\b/gi,
    label: "politeness",
    message: '"Ensure that" is a verbose way to state a requirement.',
  },
  // Hedging
  {
    regex: /\bmaybe\b/gi,
    label: "hedging",
    message: '"Maybe" introduces ambiguity. Use a direct instruction instead.',
  },
  {
    regex: /\bsomewhat\b/gi,
    label: "hedging",
    message: '"Somewhat" is vague hedging language.',
  },
  {
    regex: /\bsome kind of\b/gi,
    label: "hedging",
    message: '"Some kind of" is vague — be specific.',
  },
  {
    regex: /\bit would be (great|nice|helpful|good)\b/gi,
    label: "hedging",
    message: '"It would be great/nice/helpful" is a hedge — state requirements directly.',
  },
  {
    regex: /\btry to\b/gi,
    label: "hedging",
    message: '"Try to" implies optional effort — use a direct imperative instead.',
  },
  {
    regex: /\bmight be\b/gi,
    label: "hedging",
    message: '"Might be" is ambiguous hedging language.',
  },
  // Preamble
  {
    regex: /\bplease note that\b/gi,
    label: "preamble",
    message: '"Please note that" is unnecessary preamble — state the point directly.',
  },
  {
    regex: /\bit is important (to|that)\b/gi,
    label: "preamble",
    message: '"It is important to/that" is a preamble filler — just state the rule.',
  },
  {
    regex: /\bremember to\b/gi,
    label: "preamble",
    message: '"Remember to" is a preamble filler — just issue the instruction.',
  },
  {
    regex: /\balways (make sure|remember|ensure|be sure)\b/gi,
    label: "preamble",
    message: "Preamble filler detected — state the instruction directly.",
  },
];

export function detectFiller(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  // Deduplicate by pattern label per line-range to avoid noise
  const seen = new Set<string>();

  for (const pattern of FILLER_PATTERNS) {
    const matches = [...prompt.matchAll(pattern.regex)];
    if (matches.length === 0) continue;

    for (const match of matches) {
      const matchIndex = match.index ?? 0;
      // Find which line this match is on
      const beforeMatch = prompt.slice(0, matchIndex);
      const lineNum = (beforeMatch.match(/\n/g) ?? []).length + 1;

      const dedupeKey = `${pattern.label}:${lineNum}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const matchedText = match[0];
      const wasted = countTokens(matchedText);

      // Find the line content for context
      const lineContent = lines[lineNum - 1] ?? "";
      const lineTokens = countTokens(lineContent);

      issues.push({
        detector: "filler",
        severity: "WARNING",
        tokensWasted: wasted,
        message: pattern.message,
        lineStart: lineNum,
        lineEnd: lineNum,
      });

      // Only report the first match per pattern per line to avoid duplicate issues
      break;
    }
  }

  return { issues };
}
