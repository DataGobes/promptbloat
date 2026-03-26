"use client";

import { useState } from "react";

interface PromptInputProps {
  onAnalyze: (prompt: string, deep: boolean) => void;
  isLoading: boolean;
}

export function PromptInput({ onAnalyze, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [deepMode, setDeepMode] = useState(false);

  return (
    <div className="p-8 border-b border-[#222]">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your prompt here...&#10;&#10;System prompts, user templates, full conversations — anything you send to an LLM."
        className="w-full min-h-[150px] bg-[#111] border border-[#333] rounded-lg p-4 text-gray-300 font-mono text-sm resize-y focus:outline-none focus:border-[#ff6b35] placeholder-gray-600"
      />
      <div className="flex gap-3 mt-3 items-center">
        <button
          onClick={() => onAnalyze(prompt, deepMode)}
          disabled={!prompt.trim() || isLoading}
          className="bg-[#ff6b35] text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-[#ff8555] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
        <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer">
          <div
            onClick={() => setDeepMode(!deepMode)}
            className={`w-8 h-[18px] rounded-full relative transition-colors cursor-pointer ${deepMode ? "bg-[#ff6b35]" : "bg-[#333]"}`}
          >
            <div
              className={`w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] transition-all ${deepMode ? "left-[14px]" : "left-[2px]"}`}
            />
          </div>
          Deep Analysis (uses MiniMax API)
        </label>
      </div>
    </div>
  );
}
