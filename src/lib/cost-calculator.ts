import type { CostEstimate } from "@/lib/detectors/types";

const MODEL_PRICING: { model: string; inputPerMillion: number }[] = [
  { model: "GPT-5", inputPerMillion: 2.5 },
  { model: "GPT-5-mini", inputPerMillion: 0.25 },
  { model: "Claude Sonnet 4.6", inputPerMillion: 3.0 },
  { model: "Claude Haiku 4.5", inputPerMillion: 1.0 },
  { model: "Gemini 2.5 Flash", inputPerMillion: 0.3 },
];

export function calculateCosts(tokenCount: number): CostEstimate[] {
  return MODEL_PRICING.map(({ model, inputPerMillion }) => {
    const costPerCall = (tokenCount / 1_000_000) * inputPerMillion;
    return {
      model,
      costPerCall,
      costPerThousandCalls: costPerCall * 1000,
      costPerMonth1K: costPerCall * 1000 * 30,
    };
  });
}
