import { describe, it, expect } from "vitest";
import { computeBloatScore, getLetterGrade, getHeadline } from "@/lib/scorer";
import type { Issue } from "@/lib/detectors/types";

describe("computeBloatScore", () => {
  it("returns 0 for no issues and no tokens", () => {
    expect(computeBloatScore(0, [])).toBe(0);
  });

  it("returns higher score when more tokens are wasted", () => {
    const issues: Issue[] = [
      { detector: "filler", severity: "WARNING", tokensWasted: 500, message: "", lineStart: 1, lineEnd: 5 },
    ];
    const score = computeBloatScore(1000, issues);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("caps at 100", () => {
    const issues: Issue[] = [
      { detector: "filler", severity: "CRITICAL", tokensWasted: 5000, message: "", lineStart: 1, lineEnd: 5 },
      { detector: "redundancy", severity: "CRITICAL", tokensWasted: 3000, message: "", lineStart: 1, lineEnd: 5 },
      { detector: "overspec", severity: "WARNING", tokensWasted: 1000, message: "", lineStart: 1, lineEnd: 5 },
      { detector: "context", severity: "WARNING", tokensWasted: 500, message: "", lineStart: 1, lineEnd: 5 },
      { detector: "fewshot", severity: "WARNING", tokensWasted: 500, message: "", lineStart: 1, lineEnd: 5 },
    ];
    expect(computeBloatScore(100, issues)).toBeGreaterThanOrEqual(95);
  });
});

describe("getLetterGrade", () => {
  it("returns A+ for score 0-10", () => {
    expect(getLetterGrade(5)).toBe("A+");
    expect(getLetterGrade(10)).toBe("A+");
  });

  it("returns F for score 76-100", () => {
    expect(getLetterGrade(80)).toBe("F");
    expect(getLetterGrade(100)).toBe("F");
  });
});

describe("getHeadline", () => {
  it("returns a string for each grade", () => {
    for (const grade of ["A+", "A", "B", "C", "D", "F"]) {
      expect(typeof getHeadline(grade)).toBe("string");
      expect(getHeadline(grade).length).toBeGreaterThan(0);
    }
  });
});
