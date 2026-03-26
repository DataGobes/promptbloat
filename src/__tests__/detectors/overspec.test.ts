import { describe, it, expect } from "vitest";
import { detectOverspec } from "@/lib/detectors/overspec";

describe("detectOverspec", () => {
  it("detects excessive formatting rules", () => {
    const prompt = `Format rules:
- Use bullet points for lists
- Use numbered lists for sequences
- Bold important terms
- Italicize definitions
- Use headers for sections
- Use code blocks for code
- Use tables for comparisons
- Use blockquotes for quotes
- Indent nested items
- Use horizontal rules between sections
- Always use sentence case
- Never use all caps`;
    const result = detectOverspec(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].detector).toBe("overspec");
  });

  it("returns no issues for minimal formatting rules", () => {
    const prompt = `Respond in markdown. Use code blocks for code.`;
    const result = detectOverspec(prompt);
    expect(result.issues.length).toBe(0);
  });
});
