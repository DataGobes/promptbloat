import { describe, it, expect } from "vitest";
import { detectFewshotBloat } from "@/lib/detectors/fewshot-bloat";

describe("detectFewshotBloat", () => {
  it("detects too many examples", () => {
    const prompt = `Example 1: Input: "hello" Output: "hi"
Example 2: Input: "bye" Output: "goodbye"
Example 3: Input: "thanks" Output: "you're welcome"
Example 4: Input: "help" Output: "how can I assist?"
Example 5: Input: "ok" Output: "understood"
Example 6: Input: "yes" Output: "confirmed"`;
    const result = detectFewshotBloat(prompt);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("returns no issues for 1-2 examples", () => {
    const prompt = `Example: Input: "hello" Output: "hi"
Now respond to the user.`;
    const result = detectFewshotBloat(prompt);
    expect(result.issues.length).toBe(0);
  });
});
