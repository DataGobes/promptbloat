import { describe, it, expect } from "vitest";
import { analyzePrompt } from "@/lib/analyzer";

describe("analyzePrompt", () => {
  it("returns a complete analysis result", () => {
    const prompt = `Please make sure to always be concise.
Please ensure you are concise.
Always be concise in your responses.
Format rules:
- Use bullet points
- Use numbered lists
- Bold important terms
- Italicize definitions
- Use headers
- Use code blocks`;

    const result = analyzePrompt(prompt);

    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.bloatScore).toBeGreaterThanOrEqual(0);
    expect(result.bloatScore).toBeLessThanOrEqual(100);
    expect(typeof result.letterGrade).toBe("string");
    expect(typeof result.headline).toBe("string");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.costs.length).toBe(5);
  });

  it("returns low score for clean prompts", () => {
    const result = analyzePrompt("Respond in JSON with a name and email field.");
    expect(result.bloatScore).toBeLessThan(30);
  });

  it("handles empty input", () => {
    const result = analyzePrompt("");
    expect(result.totalTokens).toBe(0);
    expect(result.bloatScore).toBe(0);
    expect(result.issues.length).toBe(0);
  });
});
