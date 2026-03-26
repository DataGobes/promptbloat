import { describe, it, expect } from "vitest";
import { detectTokenHeavy } from "@/lib/detectors/token-heavy";

describe("detectTokenHeavy", () => {
  it("detects heavy XML usage", () => {
    const prompt = `<system><role>assistant</role><behavior><rule>be helpful</rule><rule>be concise</rule><rule>be accurate</rule></behavior><output-format><type>json</type><schema><field name="result" type="string"/></schema></output-format></system>`;
    const result = detectTokenHeavy(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("returns no issues for light markup", () => {
    const prompt = `# Instructions\nBe helpful and concise.`;
    const result = detectTokenHeavy(prompt);
    expect(result.issues.length).toBe(0);
  });
});
