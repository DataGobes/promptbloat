import { describe, it, expect } from "vitest";
import { detectContextStuffing } from "@/lib/detectors/context-stuffing";

describe("detectContextStuffing", () => {
  it("detects high context-to-instruction ratio", () => {
    const context = "Lorem ipsum dolor sit amet. ".repeat(100);
    const prompt = `You are a helpful assistant.\n\nContext:\n${context}\n\nAnswer the user's question.`;
    const result = detectContextStuffing(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].severity).toBe("CRITICAL");
  });

  it("returns no issues for balanced prompts", () => {
    const prompt = `You are a helpful assistant that answers questions about our product.
Use the following context to answer: Our product is a CRM tool.
Answer concisely and accurately.`;
    const result = detectContextStuffing(prompt);
    expect(result.issues.length).toBe(0);
  });
});
