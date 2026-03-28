interface Suggestion {
  title: string;
  before: string;
  after: string;
  tokensSaved: number;
  explanation: string;
}

interface DeepAnalysisProps {
  suggestions: Suggestion[];
  totalTokensSaveable: number;
  summary: string;
}

export function DeepAnalysis({ suggestions, totalTokensSaveable, summary }: DeepAnalysisProps) {
  return (
    <div className="p-8 border-t border-[#222]">
      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
        Deep Analysis — {totalTokensSaveable} tokens saveable
      </div>
      <p className="text-sm text-gray-400 mb-4 italic">{summary}</p>

      {suggestions.map((s, i) => (
        <div key={i} className="bg-[#111] border border-[#222] rounded-md p-4 mb-3">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-200 font-medium text-sm">{s.title}</span>
            <span className="text-green-400 text-xs">-{s.tokensSaved} tokens</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <div className="text-red-400 mb-1 font-sans text-xs">Before</div>
              <div className="bg-red-950/20 border border-red-900/30 rounded p-2 text-gray-400 whitespace-pre-wrap">
                {s.before}
              </div>
            </div>
            <div>
              <div className="text-green-400 mb-1 font-sans text-xs">After</div>
              <div className="bg-green-950/20 border border-green-900/30 rounded p-2 text-gray-400 whitespace-pre-wrap">
                {s.after}
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-xs mt-2 italic">{s.explanation}</p>
        </div>
      ))}
    </div>
  );
}
