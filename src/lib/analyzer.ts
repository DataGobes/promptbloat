import type { AnalysisResult, Issue, PromptSection } from "@/lib/detectors/types";
import { countTokens } from "@/lib/tokenizer";
import { computeBloatScore, getLetterGrade, getHeadline } from "@/lib/scorer";
import { calculateCosts } from "@/lib/cost-calculator";
import { detectRedundancy } from "@/lib/detectors/redundancy";
import { detectFiller } from "@/lib/detectors/filler";
import { detectOverspec } from "@/lib/detectors/overspec";
import { detectContextStuffing } from "@/lib/detectors/context-stuffing";
import { detectFewshotBloat } from "@/lib/detectors/fewshot-bloat";
import { detectTokenHeavy } from "@/lib/detectors/token-heavy";

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;

export function analyzePrompt(prompt: string): AnalysisResult {
  if (!prompt.trim()) {
    return {
      totalTokens: 0,
      bloatScore: 0,
      letterGrade: "A+",
      headline: getHeadline("A+"),
      issues: [],
      sections: [],
      costs: calculateCosts(0),
    };
  }

  const totalTokens = countTokens(prompt);

  const allResults = [
    detectRedundancy(prompt),
    detectFiller(prompt),
    detectOverspec(prompt),
    detectContextStuffing(prompt),
    detectFewshotBloat(prompt),
    detectTokenHeavy(prompt),
  ];

  const issues: Issue[] = allResults
    .flatMap((r) => r.issues)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const bloatScore = computeBloatScore(totalTokens, issues);
  const letterGrade = getLetterGrade(bloatScore);
  const headline = getHeadline(letterGrade);
  const costs = calculateCosts(totalTokens);

  const sections = classifySections(prompt);

  return { totalTokens, bloatScore, letterGrade, headline, issues, sections, costs };
}

function classifySections(prompt: string): PromptSection[] {
  const lines = prompt.split("\n");
  const sections: PromptSection[] = [];

  let currentType: PromptSection["type"] = "instruction";
  let currentLines: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    let newType: PromptSection["type"] | null = null;

    if (/^(context|background|reference|data|document|here is|below is|given the)/.test(line)) {
      newType = "context";
    } else if (/^(example|input:|output:|user:|assistant:)/.test(line)) {
      newType = "example";
    } else if (/^(format|style|rules?:|[-*]\s+(use|always|never|format))/.test(line)) {
      newType = "formatting";
    }

    if (newType && newType !== currentType && currentLines.length > 0) {
      const content = currentLines.join("\n");
      sections.push({
        type: currentType,
        content,
        tokenCount: countTokens(content),
        lineStart: startLine + 1,
        lineEnd: i,
      });
      currentLines = [];
      startLine = i;
      currentType = newType;
    }

    currentLines.push(lines[i]);
  }

  if (currentLines.length > 0) {
    const content = currentLines.join("\n");
    sections.push({
      type: currentType,
      content,
      tokenCount: countTokens(content),
      lineStart: startLine + 1,
      lineEnd: lines.length,
    });
  }

  return sections;
}
