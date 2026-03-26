# PromptBloat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app at promptbloat.com where users paste LLM prompts and get a brutally honest efficiency analysis with a bloat score, issue cards, cost estimates, and sharing.

**Architecture:** Single-page Next.js app. Client-side heuristic analysis using js-tiktoken for tokenization. Optional deep analysis via Anthropic API through a Next.js API route. Stateless — no database, no storage.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, js-tiktoken, Anthropic SDK, Tailwind CSS, Vercel

---

## File Structure

```
autonomy/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                    # ANTHROPIC_API_KEY (deep analysis only)
├── .env.example                  # Template for env vars
├── .gitignore
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout: dark theme, fonts, metadata
│   │   ├── page.tsx              # Main page: input + results
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts      # Deep analysis API route (Anthropic)
│   ├── components/
│   │   ├── prompt-input.tsx      # Textarea + analyze button + deep toggle
│   │   ├── results-panel.tsx     # Score card + analysis column container
│   │   ├── score-card.tsx        # Letter grade, bloat score, cost breakdown
│   │   ├── token-heatmap.tsx     # Horizontal bar showing token distribution
│   │   ├── issue-card.tsx        # Single issue with severity, tokens, snark
│   │   ├── issue-list.tsx        # Sorted list of issue cards
│   │   ├── share-bar.tsx         # Copy + LinkedIn share buttons
│   │   └── deep-analysis.tsx     # Before/after diffs, rewrite suggestions
│   ├── lib/
│   │   ├── tokenizer.ts          # js-tiktoken wrapper, token counting
│   │   ├── analyzer.ts           # Orchestrator: runs all detectors, computes score
│   │   ├── scorer.ts             # Bloat score calculation, letter grades, headlines
│   │   ├── cost-calculator.ts    # Per-model cost estimates
│   │   └── detectors/
│   │       ├── types.ts          # Shared types: Issue, Severity, DetectorResult
│   │       ├── redundancy.ts     # Repeated phrases, near-duplicate lines
│   │       ├── filler.ts         # Politeness, hedging, preamble
│   │       ├── overspec.ts       # Excessive formatting/edge-case rules
│   │       ├── context-stuffing.ts  # High context-to-instruction ratio
│   │       ├── fewshot-bloat.ts  # Too many or verbose examples
│   │       └── token-heavy.ts    # XML/JSON/markdown formatting overhead
│   └── __tests__/
│       ├── tokenizer.test.ts
│       ├── analyzer.test.ts
│       ├── scorer.test.ts
│       ├── cost-calculator.test.ts
│       └── detectors/
│           ├── redundancy.test.ts
│           ├── filler.test.ts
│           ├── overspec.test.ts
│           ├── context-stuffing.test.ts
│           ├── fewshot-bloat.test.ts
│           └── token-heavy.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/datagobes/Projects/autonomy
pnpm create next-app@latest . --yes --ts --tailwind --eslint --app --turbopack --import-alias "@/*" --src-dir
```

Expected: Next.js project created with App Router, TypeScript, Tailwind, src/ directory.

- [ ] **Step 2: Install dependencies**

Run:
```bash
pnpm add js-tiktoken @anthropic-ai/sdk
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to `scripts` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create .env.example**

Create `.env.example`:
```
# Required only for Deep Analysis mode
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 7: Configure dark theme in layout.tsx**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "PromptBloat — Your prompts are fat",
  description: "Free tool to analyze your LLM prompt efficiency. 100% client-side.",
  openGraph: {
    title: "PromptBloat — Your prompts are fat",
    description: "Free tool to analyze your LLM prompt efficiency",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} bg-[#0a0a0a] text-gray-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder page**

Replace `src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-extrabold text-[#ff6b35]">PromptBloat</h1>
    </main>
  );
}
```

- [ ] **Step 9: Update globals.css for dark theme**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --accent: #ff6b35;
  --bg: #0a0a0a;
  --surface: #111111;
  --border: #222222;
  --critical: #ff4444;
  --warning: #fbbf24;
  --info: #60a5fa;
}

body {
  background: var(--bg);
}

::selection {
  background: rgba(255, 107, 53, 0.3);
}
```

- [ ] **Step 10: Verify dev server starts**

Run:
```bash
pnpm dev
```

Expected: Dev server starts, page shows "PromptBloat" in orange at localhost:3000.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with dark theme"
```

---

### Task 2: Core Types & Tokenizer

**Files:**
- Create: `src/lib/detectors/types.ts`, `src/lib/tokenizer.ts`, `src/__tests__/tokenizer.test.ts`

- [ ] **Step 1: Write detector types**

Create `src/lib/detectors/types.ts`:
```typescript
export type Severity = "CRITICAL" | "WARNING" | "INFO";

export interface Issue {
  detector: string;
  severity: Severity;
  tokensWasted: number;
  message: string;
  lineStart: number;
  lineEnd: number;
}

export interface DetectorResult {
  issues: Issue[];
}

export interface PromptSection {
  type: "instruction" | "context" | "example" | "formatting" | "other";
  content: string;
  tokenCount: number;
  lineStart: number;
  lineEnd: number;
}

export interface AnalysisResult {
  totalTokens: number;
  bloatScore: number;
  letterGrade: string;
  headline: string;
  issues: Issue[];
  sections: PromptSection[];
  costs: CostEstimate[];
}

export interface CostEstimate {
  model: string;
  costPerCall: number;
  costPerThousandCalls: number;
  costPerMonth1K: number;
}
```

- [ ] **Step 2: Write failing tokenizer tests**

Create `src/__tests__/tokenizer.test.ts`:
```typescript
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run:
```bash
pnpm test -- src/__tests__/tokenizer.test.ts
```

Expected: FAIL — module `@/lib/tokenizer` not found.

- [ ] **Step 4: Implement tokenizer**

Create `src/lib/tokenizer.ts`:
```typescript
import { encodingForModel } from "js-tiktoken";

const encoder = encodingForModel("gpt-4o");

export function countTokens(text: string): number {
  if (!text) return 0;
  return encoder.encode(text).length;
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens = encoder.encode(text);
  return tokens.map((t) => encoder.decode([t]));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
pnpm test -- src/__tests__/tokenizer.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/detectors/types.ts src/lib/tokenizer.ts src/__tests__/tokenizer.test.ts
git commit -m "feat: add core types and tokenizer wrapper"
```

---

### Task 3: Cost Calculator

**Files:**
- Create: `src/lib/cost-calculator.ts`, `src/__tests__/cost-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/cost-calculator.test.ts`:
```typescript
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

  it("calculates correct cost for GPT-4o at 1000 tokens", () => {
    const costs = calculateCosts(1000);
    const gpt4o = costs.find((c) => c.model === "GPT-4o")!;
    // $2.50 per 1M tokens → $0.0025 per 1K tokens → $0.0025 for 1000 tokens
    expect(gpt4o.costPerCall).toBeCloseTo(0.0025, 4);
    expect(gpt4o.costPerMonth1K).toBeCloseTo(0.0025 * 1000 * 30, 2);
  });

  it("returns zero costs for zero tokens", () => {
    const costs = calculateCosts(0);
    expect(costs.every((c) => c.costPerCall === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm test -- src/__tests__/cost-calculator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement cost calculator**

Create `src/lib/cost-calculator.ts`:
```typescript
import type { CostEstimate } from "@/lib/detectors/types";

const MODEL_PRICING: { model: string; inputPerMillion: number }[] = [
  { model: "GPT-4o", inputPerMillion: 2.5 },
  { model: "GPT-4o-mini", inputPerMillion: 0.15 },
  { model: "Claude Sonnet 4", inputPerMillion: 3.0 },
  { model: "Claude Haiku 3.5", inputPerMillion: 0.8 },
  { model: "Gemini 2.0 Flash", inputPerMillion: 0.1 },
];

export function calculateCosts(tokenCount: number): CostEstimate[] {
  return MODEL_PRICING.map(({ model, inputPerMillion }) => {
    const costPerCall = (tokenCount / 1_000_000) * inputPerMillion;
    return {
      model,
      costPerCall,
      costPerThousandCalls: costPerCall * 1000,
      costPerMonth1K: costPerCall * 1000 * 30,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm test -- src/__tests__/cost-calculator.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cost-calculator.ts src/__tests__/cost-calculator.test.ts
git commit -m "feat: add cost calculator with multi-model pricing"
```

---

### Task 4: Scorer

**Files:**
- Create: `src/lib/scorer.ts`, `src/__tests__/scorer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/scorer.test.ts`:
```typescript
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
      { detector: "filler", severity: "CRITICAL", tokensWasted: 9000, message: "", lineStart: 1, lineEnd: 5 },
    ];
    expect(computeBloatScore(100, issues)).toBe(100);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm test -- src/__tests__/scorer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement scorer**

Create `src/lib/scorer.ts`:
```typescript
import type { Issue } from "@/lib/detectors/types";

export function computeBloatScore(totalTokens: number, issues: Issue[]): number {
  if (totalTokens === 0 && issues.length === 0) return 0;
  if (totalTokens === 0) return 100;

  const totalWasted = issues.reduce((sum, i) => sum + i.tokensWasted, 0);
  const wasteRatio = totalWasted / totalTokens;

  const severityPenalty = issues.reduce((sum, i) => {
    if (i.severity === "CRITICAL") return sum + 10;
    if (i.severity === "WARNING") return sum + 5;
    return sum + 2;
  }, 0);

  const raw = wasteRatio * 70 + Math.min(severityPenalty, 30);
  return Math.min(100, Math.round(raw));
}

const GRADE_THRESHOLDS: [number, string][] = [
  [10, "A+"],
  [20, "A"],
  [35, "B"],
  [55, "C"],
  [75, "D"],
  [Infinity, "F"],
];

export function getLetterGrade(score: number): string {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score <= threshold) return grade;
  }
  return "F";
}

const HEADLINES: Record<string, string> = {
  "A+": "Surgically precise. Are you a compiler?",
  A: "Clean. Suspiciously clean.",
  B: "Not bad. Room to trim.",
  C: "Average. Which means bloated.",
  D: "This prompt needs an intervention.",
  F: "This prompt is a cry for help.",
};

export function getHeadline(grade: string): string {
  return HEADLINES[grade] ?? HEADLINES["F"];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm test -- src/__tests__/scorer.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scorer.ts src/__tests__/scorer.test.ts
git commit -m "feat: add bloat score calculator with grades and headlines"
```

---

### Task 5: Heuristic Detectors

**Files:**
- Create: all 6 detectors in `src/lib/detectors/` and their tests in `src/__tests__/detectors/`

- [ ] **Step 1: Write failing redundancy detector test**

Create `src/__tests__/detectors/redundancy.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test -- src/__tests__/detectors/redundancy.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement redundancy detector**

Create `src/lib/detectors/redundancy.ts`:
```typescript
import type { DetectorResult, Issue } from "./types";
import { countTokens } from "@/lib/tokenizer";

function normalize(line: string): string {
  return line.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function tokenizeWords(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter((w) => w.length > 3));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function detectRedundancy(prompt: string): DetectorResult {
  const lines = prompt.split("\n").filter((l) => l.trim().length > 0);
  const issues: Issue[] = [];
  const flagged = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (flagged.has(i)) continue;
    const wordsI = tokenizeWords(normalize(lines[i]));
    if (wordsI.size < 3) continue;

    const duplicates: number[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (flagged.has(j)) continue;
      const wordsJ = tokenizeWords(normalize(lines[j]));
      if (jaccardSimilarity(wordsI, wordsJ) > 0.5) {
        duplicates.push(j);
        flagged.add(j);
      }
    }

    if (duplicates.length > 0) {
      const duplicateText = duplicates.map((d) => lines[d]).join("\n");
      const tokensWasted = countTokens(duplicateText);
      issues.push({
        detector: "redundancy",
        severity: duplicates.length >= 2 ? "CRITICAL" : "WARNING",
        tokensWasted,
        message: `You said "${lines[i].trim().slice(0, 40)}..." ${duplicates.length + 1} times. We get it.`,
        lineStart: i + 1,
        lineEnd: duplicates[duplicates.length - 1] + 1,
      });
    }
  }

  // Check for repeated short phrases (3+ word sequences appearing 3+ times)
  const phrases = new Map<string, number>();
  const words = prompt.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
  }

  for (const [phrase, count] of phrases) {
    if (count >= 3 && phrase.split(" ").some((w) => w.length > 3)) {
      const tokensWasted = countTokens(phrase) * (count - 1);
      issues.push({
        detector: "redundancy",
        severity: "WARNING",
        tokensWasted,
        message: `You said "${phrase}" ${count} times. Ironic.`,
        lineStart: 1,
        lineEnd: lines.length,
      });
    }
  }

  return { issues };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm test -- src/__tests__/detectors/redundancy.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Write failing filler detector test**

Create `src/__tests__/detectors/filler.test.ts`:
```typescript
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
```

- [ ] **Step 6: Implement filler detector**

Create `src/lib/detectors/filler.ts`:
```typescript
import type { DetectorResult, Issue } from "./types";
import { countTokens } from "@/lib/tokenizer";

const FILLER_PATTERNS: { pattern: RegExp; label: string; snark: string }[] = [
  { pattern: /please\s+(make\s+sure|ensure|be\s+sure)\s+to/gi, label: "excessive politeness", snark: "The model charges per token, not per manner." },
  { pattern: /could\s+you\s+please/gi, label: "politeness", snark: "It's a language model, not a dinner guest." },
  { pattern: /I\s+would\s+like\s+you\s+to/gi, label: "hedging", snark: "Just tell it what to do." },
  { pattern: /it\s+would\s+be\s+(great|nice|helpful)\s+if/gi, label: "hedging", snark: "This isn't a wish — it's an instruction. Be direct." },
  { pattern: /\bmaybe\s+try\s+to\b/gi, label: "hedging", snark: "Confidence costs zero tokens." },
  { pattern: /\bsome\s+kind\s+of\b/gi, label: "vague qualifier", snark: "Be specific. 'Some kind of' adds tokens, removes clarity." },
  { pattern: /\bmight\s+be\s+helpful\b/gi, label: "hedging", snark: "It either is or isn't. Commit." },
  { pattern: /\bplease\s+note\s+that\b/gi, label: "preamble", snark: "Just state the thing. The model is always noting." },
  { pattern: /\bkeep\s+in\s+mind\s+that\b/gi, label: "preamble", snark: "It has no mind. Just say it." },
  { pattern: /\bit\s+is\s+important\s+(to\s+note\s+)?that\b/gi, label: "preamble", snark: "If it's important, just say the important thing." },
];

export function detectFiller(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  for (const { pattern, label, snark } of FILLER_PATTERNS) {
    const matches = prompt.match(pattern);
    if (matches && matches.length > 0) {
      const totalFillerTokens = matches.reduce((sum, m) => sum + countTokens(m), 0);

      // Find the line number of the first match
      let lineNum = 1;
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          lineNum = i + 1;
          break;
        }
        // Reset lastIndex since we're reusing regex with global flag
        pattern.lastIndex = 0;
      }
      pattern.lastIndex = 0;

      issues.push({
        detector: "filler",
        severity: matches.length >= 3 ? "WARNING" : "INFO",
        tokensWasted: totalFillerTokens,
        message: `${matches.length}x ${label}. ${snark}`,
        lineStart: lineNum,
        lineEnd: lineNum,
      });
    }
  }

  return { issues };
}
```

- [ ] **Step 7: Run filler test**

Run:
```bash
pnpm test -- src/__tests__/detectors/filler.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 8: Write failing overspec detector test**

Create `src/__tests__/detectors/overspec.test.ts`:
```typescript
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
```

- [ ] **Step 9: Implement overspec detector**

Create `src/lib/detectors/overspec.ts`:
```typescript
import type { DetectorResult, Issue } from "./types";
import { countTokens } from "@/lib/tokenizer";

const FORMAT_INDICATORS = [
  /\b(use|format|style|always|never|must)\b.*\b(bullet|numbered|bold|italic|header|code\s*block|table|blockquote|indent|capitalize|uppercase|lowercase|markdown|html|json)\b/gi,
  /^[-*]\s+(use|always|never|format|style)\b/gim,
];

export function detectOverspec(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  // Find runs of formatting-related lines
  let formatLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isFormatLine = FORMAT_INDICATORS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
    if (isFormatLine) {
      formatLines.push(i);
    }
  }

  if (formatLines.length >= 6) {
    const formatContent = formatLines.map((i) => lines[i]).join("\n");
    const tokensWasted = countTokens(formatContent) - countTokens(lines[formatLines[0]] + "\n" + lines[formatLines[1]]);
    issues.push({
      detector: "overspec",
      severity: formatLines.length >= 10 ? "CRITICAL" : "WARNING",
      tokensWasted: Math.max(0, tokensWasted),
      message: `${formatLines.length} formatting rules. The model got it after 2-3.`,
      lineStart: formatLines[0] + 1,
      lineEnd: formatLines[formatLines.length - 1] + 1,
    });
  }

  return { issues };
}
```

- [ ] **Step 10: Run overspec test**

Run:
```bash
pnpm test -- src/__tests__/detectors/overspec.test.ts
```

Expected: All 2 tests PASS.

- [ ] **Step 11: Write failing context-stuffing detector test**

Create `src/__tests__/detectors/context-stuffing.test.ts`:
```typescript
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
```

- [ ] **Step 12: Implement context-stuffing detector**

Create `src/lib/detectors/context-stuffing.ts`:
```typescript
import type { DetectorResult, Issue } from "./types";
import { countTokens } from "@/lib/tokenizer";

const CONTEXT_MARKERS = [
  /^(context|background|reference|data|document|source|information|input):/im,
  /^(here is|below is|the following|given the|based on)/im,
  /^```[\s\S]*?```$/gm,
  /^<(context|document|data|source)>/im,
];

export function detectContextStuffing(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");
  const totalTokens = countTokens(prompt);

  if (totalTokens < 100) return { issues };

  // Find context blocks
  let contextTokens = 0;
  let inContext = false;
  let contextStart = 0;
  let contextEnd = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isContextStart = CONTEXT_MARKERS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });

    if (isContextStart && !inContext) {
      inContext = true;
      contextStart = i;
    }

    if (inContext) {
      contextTokens += countTokens(line);
      contextEnd = i;
    }

    // End context on empty line after substantial context block
    if (inContext && line.trim() === "" && contextTokens > 50) {
      inContext = false;
    }
  }

  const contextRatio = contextTokens / totalTokens;
  const instructionTokens = totalTokens - contextTokens;

  if (contextRatio > 0.7 && totalTokens > 200) {
    const contextPct = Math.round(contextRatio * 100);
    const instructionPct = 100 - contextPct;
    issues.push({
      detector: "context-stuffing",
      severity: contextRatio > 0.85 ? "CRITICAL" : "WARNING",
      tokensWasted: Math.round(contextTokens * 0.3),
      message: `${contextPct}% of your prompt is context. ${instructionPct}% is instructions. That's a haystack, not a prompt.`,
      lineStart: contextStart + 1,
      lineEnd: contextEnd + 1,
    });
  }

  return { issues };
}
```

- [ ] **Step 13: Run context-stuffing test**

Run:
```bash
pnpm test -- src/__tests__/detectors/context-stuffing.test.ts
```

Expected: All 2 tests PASS.

- [ ] **Step 14: Write failing fewshot-bloat detector test**

Create `src/__tests__/detectors/fewshot-bloat.test.ts`:
```typescript
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
```

- [ ] **Step 15: Implement fewshot-bloat detector**

Create `src/lib/detectors/fewshot-bloat.ts`:
```typescript
import type { DetectorResult, Issue } from "./types";
import { countTokens } from "@/lib/tokenizer";

const EXAMPLE_PATTERNS = [
  /^example\s*\d*\s*:/gim,
  /^(input|user|human)\s*:/gim,
  /^(output|assistant|ai)\s*:/gim,
  /^#{1,3}\s*example/gim,
  /^<example>/gim,
];

export function detectFewshotBloat(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  let exampleCount = 0;
  const exampleLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isExample = EXAMPLE_PATTERNS.some((p) => {
      p.lastIndex = 0;
      return p.test(line);
    });
    if (isExample && /example/i.test(line)) {
      exampleCount++;
      exampleLines.push(i);
    }
  }

  // Also count by input/output pairs
  const ioCount = (prompt.match(/^(input|user|human)\s*:/gim) ?? []).length;
  exampleCount = Math.max(exampleCount, ioCount);

  if (exampleCount >= 4) {
    const exampleContent = exampleLines.length > 0
      ? exampleLines.map((i) => lines[i]).join("\n")
      : "";
    const exampleTokens = exampleContent ? countTokens(exampleContent) : countTokens(prompt) * 0.3;
    const excessExamples = exampleCount - 2;
    const tokensWasted = Math.round((exampleTokens / exampleCount) * excessExamples);

    issues.push({
      detector: "fewshot-bloat",
      severity: exampleCount >= 6 ? "WARNING" : "INFO",
      tokensWasted,
      message: `${exampleCount} few-shot examples. 2-3 would do. The rest are burning tokens for diminishing returns.`,
      lineStart: exampleLines[0] ? exampleLines[0] + 1 : 1,
      lineEnd: exampleLines.length > 0 ? exampleLines[exampleLines.length - 1] + 1 : lines.length,
    });
  }

  return { issues };
}
```

- [ ] **Step 16: Run fewshot-bloat test**

Run:
```bash
pnpm test -- src/__tests__/detectors/fewshot-bloat.test.ts
```

Expected: All 2 tests PASS.

- [ ] **Step 17: Write failing token-heavy detector test**

Create `src/__tests__/detectors/token-heavy.test.ts`:
```typescript
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
```

- [ ] **Step 18: Implement token-heavy detector**

Create `src/lib/detectors/token-heavy.ts`:
```typescript
import type { DetectorResult, Issue } from "./types";
import { countTokens } from "@/lib/tokenizer";

export function detectTokenHeavy(prompt: string): DetectorResult {
  const issues: Issue[] = [];
  const lines = prompt.split("\n");

  // Count XML/HTML tags
  const xmlTags = prompt.match(/<\/?[a-zA-Z][a-zA-Z0-9-]*[^>]*>/g) ?? [];
  if (xmlTags.length >= 8) {
    const tagTokens = countTokens(xmlTags.join(""));
    issues.push({
      detector: "token-heavy",
      severity: xmlTags.length >= 15 ? "WARNING" : "INFO",
      tokensWasted: Math.round(tagTokens * 0.6),
      message: `${xmlTags.length} XML/HTML tags costing ~${tagTokens} tokens. Plain text headers would cost a fraction.`,
      lineStart: 1,
      lineEnd: lines.length,
    });
  }

  // Count JSON structure overhead
  const jsonBlocks = prompt.match(/\{[\s\S]*?\}/g) ?? [];
  const jsonTokens = jsonBlocks.reduce((sum, b) => {
    const structuralChars = b.replace(/[^{}\[\]",:]/g, "");
    return sum + countTokens(structuralChars);
  }, 0);

  if (jsonTokens > 50) {
    issues.push({
      detector: "token-heavy",
      severity: jsonTokens > 150 ? "WARNING" : "INFO",
      tokensWasted: jsonTokens,
      message: `JSON structure overhead: ~${jsonTokens} tokens on braces, quotes, and commas. Consider plain text for instructions.`,
      lineStart: 1,
      lineEnd: lines.length,
    });
  }

  return { issues };
}
```

- [ ] **Step 19: Run token-heavy test**

Run:
```bash
pnpm test -- src/__tests__/detectors/token-heavy.test.ts
```

Expected: All 2 tests PASS.

- [ ] **Step 20: Run all detector tests**

Run:
```bash
pnpm test -- src/__tests__/detectors/
```

Expected: All detector tests PASS.

- [ ] **Step 21: Commit**

```bash
git add src/lib/detectors/ src/__tests__/detectors/
git commit -m "feat: add 6 heuristic detectors for prompt bloat analysis"
```

---

### Task 6: Analysis Orchestrator

**Files:**
- Create: `src/lib/analyzer.ts`, `src/__tests__/analyzer.test.ts`

- [ ] **Step 1: Write failing analyzer test**

Create `src/__tests__/analyzer.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test -- src/__tests__/analyzer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement analyzer**

Create `src/lib/analyzer.ts`:
```typescript
import type { AnalysisResult, Issue, PromptSection } from "@/lib/detectors/types";
import { countTokens } from "@/lib/tokenizer";
import { computeBloatScore, getLetterGrade, getHeadline } from "@/lib/scorer";
import { calculateCosts } from "@/lib/cost-calculator";
import { detectRedundancy } from "@/lib/detectors/redundancy";
import { detectFiller } from "@/lib/detectors/filler";
import { detectOverspec } from "@/lib/detectors/overspec";
import { detectContextStuffing } from "@/lib/detectors/context-stuffing";
import { detectFewshotBloat } from "@/lib/detectors/fewshot-bloat";
import { detectTokenHeavy } from "@/lib/detectors/token-heavy";

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;

export function analyzePrompt(prompt: string): AnalysisResult {
  if (!prompt.trim()) {
    return {
      totalTokens: 0,
      bloatScore: 0,
      letterGrade: "A+",
      headline: getHeadline("A+"),
      issues: [],
      sections: [],
      costs: calculateCosts(0),
    };
  }

  const totalTokens = countTokens(prompt);

  const allResults = [
    detectRedundancy(prompt),
    detectFiller(prompt),
    detectOverspec(prompt),
    detectContextStuffing(prompt),
    detectFewshotBloat(prompt),
    detectTokenHeavy(prompt),
  ];

  const issues: Issue[] = allResults
    .flatMap((r) => r.issues)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const bloatScore = computeBloatScore(totalTokens, issues);
  const letterGrade = getLetterGrade(bloatScore);
  const headline = getHeadline(letterGrade);
  const costs = calculateCosts(totalTokens);

  const sections = classifySections(prompt);

  return { totalTokens, bloatScore, letterGrade, headline, issues, sections, costs };
}

function classifySections(prompt: string): PromptSection[] {
  const lines = prompt.split("\n");
  const sections: PromptSection[] = [];

  let currentType: PromptSection["type"] = "instruction";
  let currentLines: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    let newType: PromptSection["type"] | null = null;

    if (/^(context|background|reference|data|document|here is|below is|given the)/.test(line)) {
      newType = "context";
    } else if (/^(example|input:|output:|user:|assistant:)/.test(line)) {
      newType = "example";
    } else if (/^(format|style|rules?:|[-*]\s+(use|always|never|format))/.test(line)) {
      newType = "formatting";
    }

    if (newType && newType !== currentType && currentLines.length > 0) {
      const content = currentLines.join("\n");
      sections.push({
        type: currentType,
        content,
        tokenCount: countTokens(content),
        lineStart: startLine + 1,
        lineEnd: i,
      });
      currentLines = [];
      startLine = i;
      currentType = newType;
    }

    currentLines.push(lines[i]);
  }

  if (currentLines.length > 0) {
    const content = currentLines.join("\n");
    sections.push({
      type: currentType,
      content,
      tokenCount: countTokens(content),
      lineStart: startLine + 1,
      lineEnd: lines.length,
    });
  }

  return sections;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm test -- src/__tests__/analyzer.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Run full test suite**

Run:
```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/analyzer.ts src/__tests__/analyzer.test.ts
git commit -m "feat: add analysis orchestrator combining all detectors"
```

---

### Task 7: UI Components — Input & Results

**Files:**
- Create: `src/components/prompt-input.tsx`, `src/components/score-card.tsx`, `src/components/token-heatmap.tsx`, `src/components/issue-card.tsx`, `src/components/issue-list.tsx`, `src/components/results-panel.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create PromptInput component**

Create `src/components/prompt-input.tsx`:
```tsx
"use client";

import { useState } from "react";

interface PromptInputProps {
  onAnalyze: (prompt: string, deep: boolean) => void;
  isLoading: boolean;
}

export function PromptInput({ onAnalyze, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [deepMode, setDeepMode] = useState(false);

  return (
    <div className="p-8 border-b border-[#222]">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your prompt here...&#10;&#10;System prompts, user templates, full conversations — anything you send to an LLM."
        className="w-full min-h-[150px] bg-[#111] border border-[#333] rounded-lg p-4 text-gray-300 font-mono text-sm resize-y focus:outline-none focus:border-[#ff6b35] placeholder-gray-600"
      />
      <div className="flex gap-3 mt-3 items-center">
        <button
          onClick={() => onAnalyze(prompt, deepMode)}
          disabled={!prompt.trim() || isLoading}
          className="bg-[#ff6b35] text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-[#ff8555] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
        <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer">
          <div
            onClick={() => setDeepMode(!deepMode)}
            className={`w-8 h-[18px] rounded-full relative transition-colors cursor-pointer ${deepMode ? "bg-[#ff6b35]" : "bg-[#333]"}`}
          >
            <div
              className={`w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] transition-all ${deepMode ? "left-[14px]" : "left-[2px]"}`}
            />
          </div>
          Deep Analysis (uses Claude API)
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ScoreCard component**

Create `src/components/score-card.tsx`:
```tsx
import type { AnalysisResult } from "@/lib/detectors/types";

interface ScoreCardProps {
  result: AnalysisResult;
}

export function ScoreCard({ result }: ScoreCardProps) {
  const gradeColor =
    result.bloatScore <= 20 ? "text-green-400" :
    result.bloatScore <= 55 ? "text-yellow-400" :
    "text-[#ff6b35]";

  return (
    <div className="text-center">
      <div className={`text-7xl font-black ${gradeColor}`}>{result.letterGrade}</div>
      <div className="text-sm text-gray-500 mt-1">Bloat Score: {result.bloatScore}/100</div>
      <div className="text-sm text-[#ff6b35] mt-2 italic">&ldquo;{result.headline}&rdquo;</div>

      <div className="mt-4 text-left text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Tokens</span>
          <span className="text-gray-200">{result.totalTokens.toLocaleString()}</span>
        </div>
        {result.costs.map((cost) => (
          <div key={cost.model} className="flex justify-between">
            <span>{cost.model}</span>
            <span className="text-gray-200">${cost.costPerCall.toFixed(4)}/call</span>
          </div>
        ))}
        <div className="flex justify-between pt-1 border-t border-[#222]">
          <span>At 1K calls/day</span>
          <span className="text-red-400">
            ${result.costs[0].costPerMonth1K.toFixed(0)}/mo
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TokenHeatmap component**

Create `src/components/token-heatmap.tsx`:
```tsx
import type { PromptSection } from "@/lib/detectors/types";

interface TokenHeatmapProps {
  sections: PromptSection[];
  totalTokens: number;
}

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  instruction: { bg: "bg-green-900/40", text: "text-green-400" },
  context: { bg: "bg-red-900/40", text: "text-[#ff6b35]" },
  example: { bg: "bg-yellow-900/40", text: "text-yellow-400" },
  formatting: { bg: "bg-orange-900/30", text: "text-gray-400" },
  other: { bg: "bg-gray-800", text: "text-gray-500" },
};

export function TokenHeatmap({ sections, totalTokens }: TokenHeatmapProps) {
  if (totalTokens === 0 || sections.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Token Distribution</div>
      <div className="flex h-8 rounded overflow-hidden text-xs">
        {sections.map((section, i) => {
          const pct = section.tokenCount / totalTokens;
          if (pct < 0.03) return null;
          const colors = SECTION_COLORS[section.type] ?? SECTION_COLORS.other;
          return (
            <div
              key={i}
              className={`${colors.bg} ${colors.text} flex items-center justify-center`}
              style={{ flex: pct }}
            >
              {pct > 0.08 && `${section.type} ${Math.round(pct * 100)}%`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create IssueCard component**

Create `src/components/issue-card.tsx`:
```tsx
import type { Issue } from "@/lib/detectors/types";

interface IssueCardProps {
  issue: Issue;
}

const SEVERITY_STYLES = {
  CRITICAL: { border: "border-red-900/50", bg: "bg-red-950/30", badge: "text-red-400" },
  WARNING: { border: "border-yellow-900/50", bg: "bg-yellow-950/20", badge: "text-yellow-400" },
  INFO: { border: "border-blue-900/50", bg: "bg-blue-950/20", badge: "text-blue-400" },
} as const;

export function IssueCard({ issue }: IssueCardProps) {
  const styles = SEVERITY_STYLES[issue.severity];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-md p-3 mb-2`}>
      <div className="flex justify-between items-start">
        <div>
          <span className={`${styles.badge} font-semibold text-xs`}>{issue.severity}</span>
          <span className="text-gray-200 ml-2 text-sm">{issue.detector.replace(/-/g, " ")}</span>
        </div>
        <span className="text-[#ff6b35] text-xs">~{issue.tokensWasted} tokens wasted</span>
      </div>
      <div className="text-gray-400 text-sm mt-1">{issue.message}</div>
    </div>
  );
}
```

- [ ] **Step 5: Create IssueList component**

Create `src/components/issue-list.tsx`:
```tsx
import type { Issue } from "@/lib/detectors/types";
import { IssueCard } from "./issue-card";

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">No issues found. Your prompt is clean.</div>
    );
  }

  return (
    <div>
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
        Issues Found ({issues.length})
      </div>
      {issues.map((issue, i) => (
        <IssueCard key={i} issue={issue} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create ResultsPanel component**

Create `src/components/results-panel.tsx`:
```tsx
import type { AnalysisResult } from "@/lib/detectors/types";
import { ScoreCard } from "./score-card";
import { TokenHeatmap } from "./token-heatmap";
import { IssueList } from "./issue-list";

interface ResultsPanelProps {
  result: AnalysisResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-[200px_1fr] gap-8">
        <ScoreCard result={result} />
        <div>
          <TokenHeatmap sections={result.sections} totalTokens={result.totalTokens} />
          <IssueList issues={result.issues} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Wire up the main page**

Replace `src/app/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { PromptInput } from "@/components/prompt-input";
import { ResultsPanel } from "@/components/results-panel";
import type { AnalysisResult } from "@/lib/detectors/types";
import { analyzePrompt } from "@/lib/analyzer";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleAnalyze(prompt: string, deep: boolean) {
    setIsLoading(true);
    // Run heuristic analysis synchronously (client-side)
    const analysis = analyzePrompt(prompt);
    setResult(analysis);
    setIsLoading(false);
    // TODO: deep analysis in Task 8
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#222] flex justify-between items-center">
        <div>
          <span className="text-2xl font-extrabold text-[#ff6b35]">PromptBloat</span>
          <span className="text-sm text-gray-600 ml-2">your prompts are fat</span>
        </div>
        <div className="text-xs text-gray-600">
          100% client-side. Your prompts never leave your browser.
        </div>
      </div>

      {/* Input */}
      <PromptInput onAnalyze={handleAnalyze} isLoading={isLoading} />

      {/* Results */}
      {result && result.totalTokens > 0 && <ResultsPanel result={result} />}
    </main>
  );
}
```

- [ ] **Step 8: Verify the app renders and works**

Run:
```bash
pnpm dev
```

Expected: App loads. Paste a prompt, click Analyze, see results with score, heatmap, and issues.

- [ ] **Step 9: Commit**

```bash
git add src/components/ src/app/page.tsx
git commit -m "feat: add UI components for prompt input, score, heatmap, and issues"
```

---

### Task 8: Deep Analysis API Route

**Files:**
- Create: `src/app/api/analyze/route.ts`
- Modify: `src/app/page.tsx`, `src/components/deep-analysis.tsx`

- [ ] **Step 1: Create the API route**

Create `src/app/api/analyze/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (prompt.length > 50000) {
    return NextResponse.json({ error: "Prompt too long (max 50,000 chars)" }, { status: 400 });
  }

  const systemPrompt = `You are a prompt efficiency analyst. Analyze the following LLM prompt for waste and bloat.

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "title": "Short description of the issue",
      "before": "The original text that's bloated",
      "after": "A more efficient rewrite",
      "tokensSaved": <estimated tokens saved as a number>,
      "explanation": "Why this is wasteful (one sentence, witty)"
    }
  ],
  "totalTokensSaveable": <total tokens that could be saved>,
  "summary": "One sentence overall assessment"
}

Focus on:
1. Semantic duplication — paragraphs saying the same thing differently
2. Instructions unlikely to change model behavior
3. Verbose phrasings that can be compressed
4. Unnecessary context or examples

Be specific with before/after — show exact text. Be witty but helpful in explanations.
Return ONLY valid JSON, no markdown fences.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Analyze this prompt for bloat and waste:\n\n---\n${prompt}\n---`,
      },
    ],
    system: systemPrompt,
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis", raw: text }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create DeepAnalysis component**

Create `src/components/deep-analysis.tsx`:
```tsx
interface Suggestion {
  title: string;
  before: string;
  after: string;
  tokensSaved: number;
  explanation: string;
}

interface DeepAnalysisProps {
  suggestions: Suggestion[];
  totalTokensSaveable: number;
  summary: string;
}

export function DeepAnalysis({ suggestions, totalTokensSaveable, summary }: DeepAnalysisProps) {
  return (
    <div className="p-8 border-t border-[#222]">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
        Deep Analysis — {totalTokensSaveable} tokens saveable
      </div>
      <p className="text-sm text-gray-400 mb-4 italic">{summary}</p>

      {suggestions.map((s, i) => (
        <div key={i} className="bg-[#111] border border-[#222] rounded-md p-4 mb-3">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-200 font-medium text-sm">{s.title}</span>
            <span className="text-green-400 text-xs">-{s.tokensSaved} tokens</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <div className="text-red-400 mb-1 font-sans text-xs">Before</div>
              <div className="bg-red-950/20 border border-red-900/30 rounded p-2 text-gray-400 whitespace-pre-wrap">
                {s.before}
              </div>
            </div>
            <div>
              <div className="text-green-400 mb-1 font-sans text-xs">After</div>
              <div className="bg-green-950/20 border border-green-900/30 rounded p-2 text-gray-400 whitespace-pre-wrap">
                {s.after}
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-2 italic">{s.explanation}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Wire deep analysis into the main page**

Update `src/app/page.tsx` — add deep analysis state and fetch logic. Replace the `handleAnalyze` function and add the DeepAnalysis import and render:

Add import at top:
```tsx
import { DeepAnalysis } from "@/components/deep-analysis";
```

Replace the state and handler:
```tsx
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [deepResult, setDeepResult] = useState<{
    suggestions: { title: string; before: string; after: string; tokensSaved: number; explanation: string }[];
    totalTokensSaveable: number;
    summary: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyze(prompt: string, deep: boolean) {
    setIsLoading(true);
    setDeepResult(null);

    const analysis = analyzePrompt(prompt);
    setResult(analysis);

    if (deep) {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (res.ok) {
          const data = await res.json();
          setDeepResult(data);
        }
      } catch {
        // Deep analysis failed silently — heuristic results still show
      }
    }

    setIsLoading(false);
  }
```

Add after the ResultsPanel render:
```tsx
      {deepResult && <DeepAnalysis {...deepResult} />}
```

- [ ] **Step 4: Create .env.local with API key**

Create `.env.local`:
```
ANTHROPIC_API_KEY=<your-key-here>
```

- [ ] **Step 5: Verify deep analysis works**

Run:
```bash
pnpm dev
```

Expected: Toggle "Deep Analysis" on, paste a prompt, click Analyze. After heuristic results appear, deep analysis suggestions load below with before/after diffs.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/analyze/route.ts src/components/deep-analysis.tsx src/app/page.tsx
git commit -m "feat: add deep analysis via Anthropic API with before/after diffs"
```

---

### Task 9: Share Functionality

**Files:**
- Create: `src/components/share-bar.tsx`
- Modify: `src/components/results-panel.tsx`

- [ ] **Step 1: Create ShareBar component**

Create `src/components/share-bar.tsx`:
```tsx
"use client";

import type { AnalysisResult } from "@/lib/detectors/types";

interface ShareBarProps {
  result: AnalysisResult;
}

export function ShareBar({ result }: ShareBarProps) {
  const topIssue = result.issues[0];
  const stat = topIssue
    ? `${topIssue.message.split(".")[0]}.`
    : `${result.totalTokens} tokens analyzed.`;

  const shareText = `My system prompt scored a ${result.letterGrade} on PromptBloat. ${stat} How bloated is yours?`;

  function copyToClipboard() {
    const summary = [
      `PromptBloat Score: ${result.letterGrade} (${result.bloatScore}/100)`,
      `"${result.headline}"`,
      `Tokens: ${result.totalTokens.toLocaleString()}`,
      `Issues: ${result.issues.length}`,
      ...result.issues.map((i) => `  ${i.severity}: ${i.message}`),
      `\nAnalyzed at promptbloat.com`,
    ].join("\n");

    navigator.clipboard.writeText(summary);
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://promptbloat.com")}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  }

  return (
    <div className="mx-8 mt-6 p-4 bg-[#111] rounded-md flex justify-between items-center">
      <div className="text-sm text-gray-500">Share your bloat score — if you dare</div>
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="bg-[#222] text-gray-200 px-4 py-1.5 rounded text-sm hover:bg-[#333] transition-colors"
        >
          Copy Summary
        </button>
        <button
          onClick={shareOnLinkedIn}
          className="bg-[#0077b5] text-white px-4 py-1.5 rounded text-sm hover:bg-[#0088cc] transition-colors"
        >
          Share on LinkedIn
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add ShareBar to ResultsPanel**

Update `src/components/results-panel.tsx`:

Add import:
```tsx
import { ShareBar } from "./share-bar";
```

Add after the closing `</div>` of the grid:
```tsx
      <ShareBar result={result} />
```

The full component becomes:
```tsx
import type { AnalysisResult } from "@/lib/detectors/types";
import { ScoreCard } from "./score-card";
import { TokenHeatmap } from "./token-heatmap";
import { IssueList } from "./issue-list";
import { ShareBar } from "./share-bar";

interface ResultsPanelProps {
  result: AnalysisResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-[200px_1fr] gap-8">
        <ScoreCard result={result} />
        <div>
          <TokenHeatmap sections={result.sections} totalTokens={result.totalTokens} />
          <IssueList issues={result.issues} />
        </div>
      </div>
      <ShareBar result={result} />
    </div>
  );
}
```

- [ ] **Step 3: Verify share functionality**

Run:
```bash
pnpm dev
```

Expected: After analysis, share bar appears. "Copy Summary" copies text to clipboard. "Share on LinkedIn" opens a LinkedIn share window.

- [ ] **Step 4: Commit**

```bash
git add src/components/share-bar.tsx src/components/results-panel.tsx
git commit -m "feat: add share bar with copy and LinkedIn sharing"
```

---

### Task 10: Open Graph & Meta Tags

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update metadata in layout.tsx**

Update `src/app/layout.tsx` metadata:
```tsx
export const metadata: Metadata = {
  title: "PromptBloat — Your prompts are fat",
  description: "Free tool to analyze your LLM prompt efficiency. Paste your prompt, get a bloat score. 100% client-side.",
  metadataBase: new URL("https://promptbloat.com"),
  openGraph: {
    title: "PromptBloat — Your prompts are fat",
    description: "Free tool to analyze your LLM prompt efficiency. How bloated is your system prompt?",
    type: "website",
    url: "https://promptbloat.com",
    siteName: "PromptBloat",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptBloat — Your prompts are fat",
    description: "Free tool to analyze your LLM prompt efficiency.",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Open Graph and Twitter meta tags"
```

---

### Task 11: Final Polish & Responsive Design

**Files:**
- Modify: `src/components/results-panel.tsx`, `src/components/score-card.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Make results panel responsive**

Update the grid in `src/components/results-panel.tsx` to stack on mobile:

Change:
```tsx
<div className="grid grid-cols-[200px_1fr] gap-8">
```
To:
```tsx
<div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
```

- [ ] **Step 2: Make header responsive**

Update the header in `src/app/page.tsx`:

Change the header div:
```tsx
<div className="px-8 py-6 border-b border-[#222] flex justify-between items-center">
```
To:
```tsx
<div className="px-4 md:px-8 py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
```

- [ ] **Step 3: Add max-width container**

Wrap the `<main>` content in a max-width container in `src/app/page.tsx`:

```tsx
<main className="min-h-screen max-w-5xl mx-auto">
```

- [ ] **Step 4: Run full test suite**

Run:
```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 5: Verify responsive design**

Run:
```bash
pnpm dev
```

Expected: App looks good at desktop and mobile widths. Results stack on small screens.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/app/page.tsx
git commit -m "feat: responsive layout and final polish"
```

---

### Task 12: Build & Deploy Prep

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Verify production build**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run production server locally**

Run:
```bash
pnpm start
```

Expected: App runs at localhost:3000, all features work.

- [ ] **Step 3: Run full test suite one final time**

Run:
```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: verify production build"
```
