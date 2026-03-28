"use client";

import { useState } from "react";
import { PromptInput } from "@/components/prompt-input";
import { ResultsPanel } from "@/components/results-panel";
import { DeepAnalysis } from "@/components/deep-analysis";
import type { AnalysisResult, Issue } from "@/lib/detectors/types";
import { analyzePrompt } from "@/lib/analyzer";
import { countTokens } from "@/lib/tokenizer";
import { calculateCosts } from "@/lib/cost-calculator";
import { GitHubIcon } from "@/components/icons";

interface DeepResult {
  suggestions: {
    title: string;
    before: string;
    after: string;
    tokensSaved: number;
    explanation: string;
  }[];
  totalTokensSaveable: number;
  summary: string;
}

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [deepResult, setDeepResult] = useState<DeepResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepLoading, setIsDeepLoading] = useState(false);

  async function handleAnalyze(prompt: string, deep: boolean) {
    setResult(null);
    setDeepResult(null);

    if (!deep) {
      setIsLoading(true);
      const analysis = analyzePrompt(prompt);
      setResult(analysis);
      setIsLoading(false);
      return;
    }

    // Deep mode: LLM drives the entire analysis
    setIsDeepLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error || !res.ok) {
        throw new Error(data.error || "API request failed");
      }
      const totalTokens = countTokens(prompt);
      setResult({
        totalTokens,
        bloatScore: data.bloatScore,
        letterGrade: data.letterGrade,
        headline: data.headline,
        issues: data.issues as Issue[],
        sections: [],
        costs: calculateCosts(totalTokens),
      });
      setDeepResult(data as DeepResult);
    } catch {
      // Deep analysis failed — fall back to heuristic
      const analysis = analyzePrompt(prompt);
      setResult(analysis);
    }
    setIsDeepLoading(false);
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-4 md:px-8 py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <span className="text-2xl font-extrabold text-[#ff6b35]">PromptBloat</span>
          <span className="text-sm text-gray-400 ml-2">your prompts are fat</span>
        </div>
        <div className="text-xs text-gray-400">
          Client-side by default. Deep analysis sends your prompt to MiniMax.
        </div>
      </div>

      {/* Input */}
      <PromptInput onAnalyze={handleAnalyze} isLoading={isLoading || isDeepLoading} />

      {/* Loading */}
      {isDeepLoading && !result && (
        <div className="p-8 border-t border-[#222]">
          <div className="text-xs text-gray-400 uppercase tracking-wide animate-pulse">
            Running deep analysis with MiniMax...
          </div>
        </div>
      )}

      {/* Results */}
      {result && result.totalTokens > 0 && <ResultsPanel result={result} />}

      {/* Deep Analysis Suggestions */}
      {deepResult && <DeepAnalysis {...deepResult} />}

      {/* Footer */}
      <div className="px-4 md:px-8 py-6 mt-8 border-t border-[#222] flex justify-between items-center text-xs text-gray-400">
        <span>
          Built by{" "}
          <a href="https://github.com/DataGobes" target="_blank" rel="noopener noreferrer" className="text-[#ff6b35] hover:underline">
            @DataGobes
          </a>
        </span>
        <a href="https://github.com/DataGobes/promptbloat" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300 transition-colors">
          <GitHubIcon className="w-5 h-5" />
        </a>
      </div>
    </main>
  );
}
