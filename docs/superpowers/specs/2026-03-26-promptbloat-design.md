# PromptBloat — Design Spec

**Tagline:** "Your prompts are fat. We'll prove it."

A web app where you paste your LLM prompt and get a brutally honest efficiency analysis. Client-side heuristics by default, optional LLM-powered deep analysis. Designed to go viral on LinkedIn in the data/AI community.

## Core Flow

1. User pastes a prompt (system prompt, user template, full conversation)
2. Client-side analysis runs instantly: tokenization, heuristic detectors, cost calculation
3. Results displayed: Bloat Score (letter grade), token heatmap, issue cards with snarky commentary
4. Optional "Deep Analysis" toggle: sends prompt to Anthropic API for semantic analysis, rewrite suggestions, before/after diffs
5. Share results on LinkedIn with a pre-filled post and screenshot-ready card

## Architecture

### Stack

- **Next.js** (App Router) — React 19, TypeScript
- **Client-side tokenization** — `tiktoken` via WASM for accurate token counts without a backend
- **Anthropic API** (Claude) — for deep analysis mode only, called via Next.js API route
- **Vercel** — deploy and share instantly
- **No database** — stateless, privacy-first

### Privacy Model

- All heuristic analysis runs 100% client-side — prompts never leave the browser
- Deep analysis mode sends the prompt to Claude via a server-side API route — user must opt in with a clear disclaimer
- No storage, no logging, no analytics on prompt content

## Analysis Engine

### Heuristic Detectors (client-side, instant)

| Detector | What it catches | Example callout |
|----------|----------------|-----------------|
| **Redundancy** | Repeated phrases, near-duplicate lines, recurring instruction patterns | "You said 'be concise' 3 times. Ironic." |
| **Filler phrases** | Politeness, hedging, unnecessary preamble | "You wrote 'please make sure to'. The model charges per token, not per manner." |
| **Over-specification** | Excessive formatting rules, edge case handling | "47 lines of formatting rules. The model got it after 5." |
| **Context stuffing** | Huge blocks of reference text vs actual instructions | "82% of your prompt is context. 18% is instructions. That's a haystack, not a prompt." |
| **Few-shot bloat** | Too many examples or overly verbose examples | "6 few-shot examples at 400 tokens each. 2 would do." |
| **Token-heavy patterns** | XML/JSON templates, markdown formatting overhead | "Your XML tags cost 340 tokens. Plain headers would cost 40." |

Each detector outputs:
- Severity: CRITICAL, WARNING, or INFO
- Estimated tokens wasted
- A snarky, memorable one-liner
- Location in the prompt (line range)

### Deep Analysis (LLM-powered, opt-in)

Uses Claude to perform:
- **Semantic deduplication** — finds paragraphs that say the same thing differently
- **Rewrite suggestions** — before/after with token savings and cost delta
- **Effectiveness estimate** — flags instructions unlikely to change model behavior
- **Section-level recommendations** — specific suggestions per detected section

### Scoring

- **Bloat Score: 0–100** (lower is better)
- Letter grade: A+ (0–10), A (11–20), B (21–35), C (36–55), D (56–75), F (76–100)
- Snarky headline per grade tier:
  - A+: "Surgically precise. Are you a compiler?"
  - A: "Clean. Suspiciously clean."
  - B: "Not bad. Room to trim."
  - C: "Average. Which means bloated."
  - D: "This prompt needs an intervention."
  - F: "This prompt is a cry for help."

## UI Design

### Visual Direction

- **Dark theme** — near-black background (#0a0a0a)
- **Orange accent** (#ff6b35) — for scores, highlights, CTAs
- **Monospace for prompt display**, system-ui for UI text
- Tone: snarky but useful, not mean-spirited

### Layout (single page)

#### Header
- Logo: "PromptBloat" in bold, orange
- Subtitle: "your prompts are fat"
- Privacy badge: "100% client-side. Your prompts never leave your browser."

#### Input Area
- Large monospace textarea for pasting prompts
- "Analyze" button (orange, prominent)
- Deep Analysis toggle with label: "Deep Analysis (uses Claude API)"

#### Results Panel

**Score Card (left column):**
- Giant letter grade (72px, orange)
- Bloat score (X/100)
- Snarky headline
- Cost breakdown:
  - Total tokens
  - Cost per call (GPT-4o, Claude Sonnet, Claude Haiku, Gemini)
  - Monthly cost at 1K calls/day

**Analysis (right column):**
- Token distribution heatmap bar (Instructions / Context / Examples / Formatting — color-coded)
- Issue cards, sorted by severity:
  - Severity badge (CRITICAL = red, WARNING = yellow, INFO = blue)
  - Issue name
  - Tokens wasted
  - Snarky description

#### Share Bar (bottom)
- "Copy Summary" button — copies a text summary to clipboard
- "Share on LinkedIn" button — opens LinkedIn share dialog with pre-filled post

### Deep Analysis Results (appended when toggled)

- Before/after diff view for each rewrite suggestion
- Token savings per suggestion
- Total potential savings summary

## Sharing & LinkedIn Virality

### Share Card
- Screenshot-ready image with: bloat score, letter grade, headline, token breakdown
- Optimized for LinkedIn image preview dimensions (1200x627)
- Generated client-side using canvas or HTML-to-image

### Pre-filled LinkedIn Post
Template: "My system prompt scored a [GRADE] on promptbloat.com. [STAT]. How bloated is yours?"
Example: "My system prompt scored a D+ on promptbloat.com. 82% of my tokens were context stuffing. How bloated is yours?"

### URL-based Results
- Encode score, grade, and issue summary into URL hash (no prompt data)
- Shareable link that shows results without exposing the prompt

### Open Graph Tags
- Dynamic OG image showing the score when URL is shared
- Title: "I scored a D+ on PromptBloat"
- Description: "Free tool to analyze your LLM prompt efficiency"

## Cost Calculator — Pricing Data

Per-token pricing for cost estimates (input tokens only, since we're analyzing the prompt):

| Model | Input price (per 1M tokens) |
|-------|----------------------------|
| GPT-4o | $2.50 |
| GPT-4o-mini | $0.15 |
| Claude Sonnet 4 | $3.00 |
| Claude Haiku 3.5 | $0.80 |
| Gemini 2.0 Flash | $0.10 |

These should be configurable/updatable since pricing changes frequently.

## Non-Goals

- No user accounts or authentication
- No prompt storage or history
- No API/CLI interface (web only for now)
- No prompt marketplace or sharing of actual prompts
- No real-time collaboration
