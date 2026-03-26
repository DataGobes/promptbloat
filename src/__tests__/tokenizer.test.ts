import { describe, it, expect } from "vitest";
import { countTokens, tokenize } from "@/lib/tokenizer";

describe("tokenizer", () => {
  it("counts tokens for a simple string", () => {
    const count = countTokens("Hello, world!");
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);
  });

  it("counts tokens for an empty string", () => {
    expect(countTokens("")).toBe(0);
  });

  it("returns token boundaries for highlighting", () => {
    const tokens = tokenize("Hello, world!");
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((t) => typeof t === "string")).toBe(true);
  });
});
