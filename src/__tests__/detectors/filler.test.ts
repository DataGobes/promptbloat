import { describe, it, expect } from "vitest";
import { detectFiller } from "@/lib/detectors/filler";

describe("detectFiller", () => {
  it("detects politeness phrases", () => {
    const prompt = `Please make sure to respond carefully.
Please ensure that you always consider the context.
Could you please provide a detailed answer.`;
    const result = detectFiller(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].detector).toBe("filler");
  });

  it("detects hedging language", () => {
    const prompt = `It would be great if you could maybe try to provide some kind of answer that might be helpful.`;
    const result = detectFiller(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("returns no issues for direct language", () => {
    const prompt = `Respond in JSON. Include the user's name and email.`;
    const result = detectFiller(prompt);
    expect(result.issues.length).toBe(0);
  });
});
