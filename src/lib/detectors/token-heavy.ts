import { countTokens } from "@/lib/tokenizer";
import type { DetectorResult, Issue } from "./types";

// Match XML/HTML tags: opening, closing, and self-closing
const XML_TAG_REGEX = /<\/?[a-zA-Z][a-zA-Z0-9\-_]*(\s[^>]*)?\/?>/g;

export function detectTokenHeavy(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  // Count XML/HTML tags
  const tagMatches = [...prompt.matchAll(XML_TAG_REGEX)];
  const tagCount = tagMatches.length;

  if (tagCount >= 8) {
    const tagText = tagMatches.map((m) => m[0]).join("");
    const wasted = countTokens(tagText);

    issues.push({
      detector: "token-heavy",
      severity: tagCount >= 15 ? "CRITICAL" : "WARNING",
      tokensWasted: wasted,
      message: `Heavy XML/HTML markup: ${tagCount} tags detected. Verbose XML structure adds significant token overhead vs. plain prose or markdown.`,
      lineStart: 1,
      lineEnd: lines.length,
    });
  }

  // Detect JSON structure overhead: count structural characters
  const jsonStructureChars = (prompt.match(/[{}\[\],"]/g) ?? []).length;
  // Rough heuristic: if >30% of chars are JSON structural, flag it
  const totalChars = prompt.length;
  if (totalChars > 100 && jsonStructureChars / totalChars > 0.3 && tagCount < 8) {
    issues.push({
      detector: "token-heavy",
      severity: "WARNING",
      tokensWasted: Math.round(jsonStructureChars * 0.5),
      message: `JSON structure overhead: structural characters ({, }, [, ], ", ,) make up ${((jsonStructureChars / totalChars) * 100).toFixed(0)}% of the prompt. Consider plain prose.`,
      lineStart: 1,
      lineEnd: lines.length,
    });
  }

  return { issues };
}
