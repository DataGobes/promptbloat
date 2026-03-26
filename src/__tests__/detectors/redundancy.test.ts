import { describe, it, expect } from "vitest";
import { detectRedundancy } from "@/lib/detectors/redundancy";

describe("detectRedundancy", () => {
  it("detects repeated phrases", () => {
    const prompt = `You must be concise in your responses.
Always be concise.
Remember to be concise at all times.`;
    const result = detectRedundancy(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].severity).toBe("WARNING");
    expect(result.issues[0].detector).toBe("redundancy");
  });

  it("detects near-duplicate lines", () => {
    const prompt = `Format the output as JSON.
Always format your output as JSON.
Make sure the output is in JSON format.`;
    const result = detectRedundancy(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("returns no issues for unique content", () => {
    const prompt = `You are a helpful assistant.
Respond in English.
Use markdown formatting.`;
    const result = detectRedundancy(prompt);
    expect(result.issues.length).toBe(0);
  });
});
