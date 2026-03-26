# PromptBloat

**Your prompts are fat. We'll prove it.**

Paste your LLM prompt, get a brutally honest efficiency analysis. Find out how many tokens you're wasting and how much it's costing you.

**[Try it live at promptbloat.vercel.app](https://promptbloat.vercel.app)**

## What it does

- **Bloat Score** (0-100) with letter grade and snarky headline
- **6 heuristic detectors** — redundancy, filler phrases, over-specification, context stuffing, few-shot bloat, token-heavy patterns
- **Token distribution heatmap** — see where your token budget actually goes
- **Cost calculator** — per-call and monthly cost estimates across GPT-5, Claude Sonnet 4.6, Gemini 2.5 Flash, and more
- **Deep Analysis** (optional) — LLM-powered semantic analysis with before/after rewrite suggestions
- **LinkedIn sharing** — share your bloat score with a pre-filled post

## Privacy

All heuristic analysis runs **100% client-side**. Your prompts never leave your browser. Deep Analysis mode is opt-in and sends the prompt to an API for LLM analysis.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For Deep Analysis, create a `.env.local`:

```
MINIMAX_API_KEY=your-key-here
```

## Running tests

```bash
pnpm test
```

## Tech stack

- Next.js (App Router), React 19, TypeScript
- js-tiktoken for client-side tokenization
- Tailwind CSS
- MiniMax API for deep analysis
- Deployed on Vercel

## Author

Built by [@DataGobes](https://github.com/DataGobes)
