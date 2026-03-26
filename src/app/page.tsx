"use client";

import { useState } from "react";
import { PromptInput } from "@/components/prompt-input";
import { ResultsPanel } from "@/components/results-panel";
import { DeepAnalysis } from "@/components/deep-analysis";
import type { AnalysisResult } from "@/lib/detectors/types";
import { analyzePrompt } from "@/lib/analyzer";
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
    setIsLoading(true);
    setDeepResult(null);
    setIsDeepLoading(false);

    // Run heuristic analysis synchronously (client-side) — shows instantly
    const analysis = analyzePrompt(prompt);
    setResult(analysis);
    setIsLoading(false);

    // Deep analysis runs async in background after heuristic results are shown
    if (deep) {
      setIsDeepLoading(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (!data.error) {
          setDeepResult(data as DeepResult);
        }
      } catch {
        // deep analysis failed silently
      }
      setIsDeepLoading(false);
    }
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-4 md:px-8 py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <span className="text-2xl font-extrabold text-[#ff6b35]">PromptBloat</span>
          <span className="text-sm text-gray-600 ml-2">your prompts are fat</span>
        </div>
        <div className="text-xs text-gray-600">
          100% client-side. Your prompts never leave your browser.
        </div>
      </div>

      {/* Input */}
      <PromptInput onAnalyze={handleAnalyze} isLoading={isLoading} />

      {/* Results */}
      {result && result.totalTokens > 0 && <ResultsPanel result={result} />}

      {/* Deep Analysis */}
      {isDeepLoading && (
        <div className="p-8 border-t border-[#222]">
          <div className="text-xs text-gray-500 uppercase tracking-wide animate-pulse">
            Running deep analysis with MiniMax...
          </div>
        </div>
      )}
      {deepResult && <DeepAnalysis {...deepResult} />}

      {/* Footer */}
      <div className="px-4 md:px-8 py-6 mt-8 border-t border-[#222] flex justify-between items-center text-xs text-gray-600">
        <span>
          Built by{" "}
          <a href="https://github.com/DataGobes" target="_blank" rel="noopener noreferrer" className="text-[#ff6b35] hover:underline">
            @DataGobes
          </a>
        </span>
        <a href="https://github.com/DataGobes/promptbloat" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 transition-colors">
          <GitHubIcon className="w-5 h-5" />
        </a>
      </div>
    </main>
  );
}
