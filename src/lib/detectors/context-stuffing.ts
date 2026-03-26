import { countTokens } from "@/lib/tokenizer";
import type { DetectorResult, Issue } from "./types";

// Markers that indicate the start of a context block
const CONTEXT_START_PATTERNS = [
  /^(context|background|reference|document|documents|source|sources|data|knowledge base)\s*:/i,
  /^```/,
  /^<context>/i,
  /^<background>/i,
  /^<documents?>/i,
];

const CONTEXT_END_PATTERNS = [
  /^```/,
  /^<\/context>/i,
  /^<\/background>/i,
  /^<\/documents?>/i,
];

export function detectContextStuffing(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");
  const totalTokens = countTokens(prompt);

  if (totalTokens < 200) return { issues };

  // Identify context blocks
  let contextTokens = 0;
  let inBlock = false;
  let blockStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!inBlock) {
      const isContextStart = CONTEXT_START_PATTERNS.some((p) => p.test(line));
      if (isContextStart) {
        inBlock = true;
        blockStartLine = i;
        contextTokens += countTokens(lines[i]);
        continue;
      }
    } else {
      // Check if block ends
      const isEnd = CONTEXT_END_PATTERNS.some((p) => p.test(line));
      contextTokens += countTokens(lines[i]);
      if (isEnd) {
        inBlock = false;
      }
    }
  }

  // If a block was opened but never closed, count everything after start
  // (already counted above since we keep counting while inBlock)

  if (contextTokens === 0) return { issues };

  const ratio = contextTokens / totalTokens;

  if (ratio <= 0.7) return { issues };

  const severity = ratio > 0.85 ? "CRITICAL" : "WARNING";
  const wasted = Math.round(contextTokens * 0.3); // rough estimate of reducible overhead

  issues.push({
    detector: "context-stuffing",
    severity,
    tokensWasted: wasted,
    message: `Context stuffing detected: ${(ratio * 100).toFixed(0)}% of the prompt is context/background material (${contextTokens} of ${totalTokens} tokens). Consider summarizing or chunking context.`,
    lineStart: 1,
    lineEnd: lines.length,
  });

  return { issues };
}
