export type Severity = "CRITICAL" | "WARNING" | "INFO";

export interface Issue {
  detector: string;
  severity: Severity;
  tokensWasted: number;
  message: string;
  lineStart: number;
  lineEnd: number;
}

export interface DetectorResult {
  issues: Issue[];
}

export interface PromptSection {
  type: "instruction" | "context" | "example" | "formatting" | "other";
  content: string;
  tokenCount: number;
  lineStart: number;
  lineEnd: number;
}

export interface AnalysisResult {
  totalTokens: number;
  bloatScore: number;
  letterGrade: string;
  headline: string;
  issues: Issue[];
  sections: PromptSection[];
  costs: CostEstimate[];
}

export interface CostEstimate {
  model: string;
  costPerCall: number;
  costPerThousandCalls: number;
  costPerMonth1K: number;
}
