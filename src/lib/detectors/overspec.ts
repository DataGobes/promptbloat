import { countTokens } from "@/lib/tokenizer";
import type { DetectorResult, Issue } from "./types";

// Keywords that indicate formatting-related rules
const FORMAT_KEYWORDS = [
  "bullet",
  "bold",
  "italic",
  "header",
  "code block",
  "table",
  "blockquote",
  "indent",
  "horizontal rule",
  "sentence case",
  "all caps",
  "numbered list",
  "ordered list",
  "unordered list",
  "font",
  "color",
  "alignment",
  "spacing",
  "margin",
  "padding",
  "underline",
  "strikethrough",
  "hyperlink",
  "image",
  "caption",
  "footnote",
  "endnote",
  "heading",
];

// Verbs/operators that introduce a formatting rule
const RULE_OPERATORS = [
  /\buse\b/i,
  /\bformat\b/i,
  /\bstyle\b/i,
  /\balways\b/i,
  /\bnever\b/i,
  /\bapply\b/i,
  /\bensure\b/i,
  /\bmake sure\b/i,
];

function isFormattingRuleLine(line: string): boolean {
  const lower = line.toLowerCase();
  const hasFormatKeyword = FORMAT_KEYWORDS.some((kw) => lower.includes(kw));
  const hasRuleOperator = RULE_OPERATORS.some((re) => re.test(line));
  return hasFormatKeyword && hasRuleOperator;
}

export function detectOverspec(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  const formattingRuleLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isFormattingRuleLine(lines[i])) {
      formattingRuleLines.push(i + 1);
    }
  }

  const count = formattingRuleLines.length;
  if (count < 6) return { issues };

  const severity = count >= 10 ? "CRITICAL" : "WARNING";
  const allRuleText = formattingRuleLines
    .map((ln) => lines[ln - 1])
    .join("\n");
  const wasted = countTokens(allRuleText);

  issues.push({
    detector: "overspec",
    severity,
    tokensWasted: wasted,
    message: `Over-specified formatting: ${count} formatting rules detected. Models don't need micro-managed formatting instructions.`,
    lineStart: formattingRuleLines[0],
    lineEnd: formattingRuleLines[formattingRuleLines.length - 1],
  });

  return { issues };
}
