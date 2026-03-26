"use client";

import type { AnalysisResult } from "@/lib/detectors/types";
import { LinkedInIcon, XIcon } from "./icons";

interface ShareBarProps {
  result: AnalysisResult;
}

export function ShareBar({ result }: ShareBarProps) {
  const topIssue = result.issues[0];
  const stat = topIssue
    ? `${topIssue.message.split(".")[0]}.`
    : `${result.totalTokens} tokens analyzed.`;

  const shareText = `My system prompt scored a ${result.letterGrade} on PromptBloat. ${stat} How bloated is yours?`;
  const shareUrl = "https://www.promptbloat.com";

  function copyToClipboard() {
    const summary = [
      `PromptBloat Score: ${result.letterGrade} (${result.bloatScore}/100)`,
      `"${result.headline}"`,
      `Tokens: ${result.totalTokens.toLocaleString()}`,
      `Issues: ${result.issues.length}`,
      ...result.issues.map((i) => `  ${i.severity}: ${i.message}`),
      `\nAnalyzed at promptbloat.com`,
    ].join("\n");

    navigator.clipboard.writeText(summary);
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  }

  function shareOnX() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  }

  return (
    <div className="mx-8 mt-6 p-4 bg-[#111] rounded-md flex justify-between items-center">
      <div className="text-sm text-gray-500">Share your bloat score — if you dare</div>
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="bg-[#222] text-gray-200 px-4 py-1.5 rounded text-sm hover:bg-[#333] transition-colors"
        >
          Copy
        </button>
        <button
          onClick={shareOnLinkedIn}
          className="bg-[#0077b5] text-white px-3 py-1.5 rounded text-sm hover:bg-[#0088cc] transition-colors flex items-center gap-1.5"
        >
          <LinkedInIcon className="w-4 h-4" />
          LinkedIn
        </button>
        <button
          onClick={shareOnX}
          className="bg-white text-black px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5"
        >
          <XIcon className="w-3.5 h-3.5" />
          Post
        </button>
      </div>
    </div>
  );
}
