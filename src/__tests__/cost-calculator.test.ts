import { describe, it, expect } from "vitest";
import { calculateCosts } from "@/lib/cost-calculator";

describe("calculateCosts", () => {
  it("returns cost estimates for all models", () => {
    const costs = calculateCosts(1000);
    expect(costs.length).toBe(5);
    expect(costs[0]).toMatchObject({
      model: expect.any(String),
      costPerCall: expect.any(Number),
      costPerThousandCalls: expect.any(Number),
      costPerMonth1K: expect.any(Number),
    });
  });

  it("calculates correct cost for GPT-5 at 1000 tokens", () => {
    const costs = calculateCosts(1000);
    const gpt5 = costs.find((c) => c.model === "GPT-5")!;
    // $2.50 per 1M tokens → $0.0025 per 1K tokens → $0.0025 for 1000 tokens
    expect(gpt5.costPerCall).toBeCloseTo(0.0025, 4);
    expect(gpt5.costPerMonth1K).toBeCloseTo(0.0025 * 1000 * 30, 2);
  });

  it("returns zero costs for zero tokens", () => {
    const costs = calculateCosts(0);
    expect(costs.every((c) => c.costPerCall === 0)).toBe(true);
  });
});
