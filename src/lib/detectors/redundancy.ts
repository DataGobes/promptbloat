import { countTokens } from "@/lib/tokenizer";
import type { DetectorResult, Issue } from "./types";

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

export function detectRedundancy(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  // Detect near-duplicate lines using Jaccard similarity
  const reportedPairs = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const lineA = lines[i].trim();
    if (!lineA || lineA.split(/\s+/).length < 3) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const lineB = lines[j].trim();
      if (!lineB || lineB.split(/\s+/).length < 3) continue;
      const pairKey = `${i}-${j}`;
      if (reportedPairs.has(pairKey)) continue;
      const similarity = jaccardSimilarity(lineA, lineB);
      if (similarity > 0.5) {
        reportedPairs.add(pairKey);
        const wasted = countTokens(lineB);
        issues.push({
          detector: "redundancy",
          severity: "WARNING",
          tokensWasted: wasted,
          message: `Near-duplicate lines detected (similarity: ${(similarity * 100).toFixed(0)}%). Line ${i + 1} and line ${j + 1} convey similar information.`,
          lineStart: i + 1,
          lineEnd: j + 1,
        });
      }
    }
  }

  // Detect repeated 2-word phrases appearing 3+ times
  const words = prompt.toLowerCase().replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);
  const phraseCounts = new Map<string, number>();

  // 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
  }
  // 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
  }

  for (const [phrase, count] of phraseCounts) {
    if (count >= 3) {
      const wasted = countTokens(phrase) * (count - 1);
      issues.push({
        detector: "redundancy",
        severity: "WARNING",
        tokensWasted: wasted,
        message: `Phrase "${phrase}" appears ${count} times. Consider consolidating.`,
        lineStart: 1,
        lineEnd: lines.length,
      });
    }
  }

  return { issues };
}
