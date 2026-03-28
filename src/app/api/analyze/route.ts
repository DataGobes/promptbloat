import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    apiKey: process.env.MINIMAX_API_KEY ?? "",
    baseURL: "https://api.minimax.io/v1",
  });
}

// In-memory rate limiting (resets on cold start, good enough for serverless)
const ipMinute = new Map<string, number[]>();
const ipHour = new Map<string, number[]>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

const LIMITS = {
  perMinute: 3,
  perHour: 10,
  perDay: 250,
  maxChars: 20_000,
};

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function pruneStaleEntries(now: number) {
  for (const [ip, hits] of ipMinute) {
    const fresh = hits.filter((t) => now - t < 60_000);
    if (fresh.length === 0) ipMinute.delete(ip);
    else ipMinute.set(ip, fresh);
  }
  for (const [ip, hits] of ipHour) {
    const fresh = hits.filter((t) => now - t < 3_600_000);
    if (fresh.length === 0) ipHour.delete(ip);
    else ipHour.set(ip, fresh);
  }
}

function checkRateLimit(ip: string): string | null {
  const now = Date.now();

  // Reset daily counter
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
    pruneStaleEntries(now);
  }

  if (dailyCount >= LIMITS.perDay) {
    return "Daily limit reached. Try again tomorrow.";
  }

  // Per-minute check
  const minuteHits = (ipMinute.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (minuteHits.length >= LIMITS.perMinute) {
    return "Too many requests. Max 3 per minute.";
  }

  // Per-hour check
  const hourHits = (ipHour.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (hourHits.length >= LIMITS.perHour) {
    return "Hourly limit reached. Max 10 per hour.";
  }

  // Record this request
  minuteHits.push(now);
  ipMinute.set(ip, minuteHits);
  hourHits.push(now);
  ipHour.set(ip, hourHits);
  dailyCount++;

  return null;
}

export async function POST(req: NextRequest) {
  let prompt: unknown;
  try {
    ({ prompt } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!process.env.MINIMAX_API_KEY) {
    return NextResponse.json({ error: "Deep analysis not configured" }, { status: 503 });
  }

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (prompt.length > LIMITS.maxChars) {
    return NextResponse.json({ error: `Prompt too long (max ${LIMITS.maxChars.toLocaleString()} chars)` }, { status: 400 });
  }

  const rateLimitError = checkRateLimit(getIP(req));
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 });
  }

  const systemPrompt = `You are a prompt efficiency analyst. Analyze the following LLM prompt for waste and bloat.

Return a JSON object with this exact structure:
{
  "bloatScore": <0-100 integer, where 0 is perfectly efficient and 100 is pure waste>,
  "letterGrade": "<A+|A|B|C|D|F>",
  "headline": "<One witty sentence summarizing the prompt quality>",
  "issues": [
    {
      "detector": "<kebab-case category like 'semantic-duplication' or 'filler-phrases'>",
      "severity": "<CRITICAL|WARNING|INFO>",
      "tokensWasted": <estimated tokens wasted>,
      "message": "<One sentence describing the specific issue>"
    }
  ],
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

Scoring guide:
- A+ (0-10): Surgically precise, no waste
- A (11-20): Clean, minimal bloat
- B (21-35): Decent but has trimmable fat
- C (36-55): Average, noticeably bloated
- D (56-75): Needs serious trimming
- F (76-100): Overwhelmingly wasteful

Focus on:
1. Semantic duplication — paragraphs saying the same thing differently
2. Instructions unlikely to change model behavior
3. Verbose phrasings that can be compressed
4. Unnecessary context or examples
5. Filler words and hedge phrases
6. Over-specified formatting rules

Be specific with before/after — show exact text. Be witty but helpful.
Return ONLY valid JSON, no markdown fences.`;

  const completion = await getClient().chat.completions.create({
    model: "MiniMax-M2.7",
    max_tokens: 2000,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze this prompt for bloat and waste:\n\n---\n${prompt}\n---`,
      },
    ],
  });

  let text = completion.choices[0]?.message?.content ?? "";

  // Strip <think>...</think> tags that some models prepend
  text = text.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();

  // Extract JSON if wrapped in markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(text);

    // Validate expected shape before forwarding to client
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
    }

    return NextResponse.json({
      bloatScore: Math.min(100, Math.max(0, Number(parsed.bloatScore ?? 50))),
      letterGrade: String(parsed.letterGrade ?? "C"),
      headline: String(parsed.headline ?? ""),
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.map((i: Record<string, unknown>) => ({
            detector: String(i.detector ?? "general"),
            severity: ["CRITICAL", "WARNING", "INFO"].includes(String(i.severity))
              ? String(i.severity)
              : "WARNING",
            tokensWasted: Number(i.tokensWasted ?? 0),
            message: String(i.message ?? ""),
            lineStart: 0,
            lineEnd: 0,
          }))
        : [],
      suggestions: parsed.suggestions.map((s: Record<string, unknown>) => ({
        title: String(s.title ?? ""),
        before: String(s.before ?? ""),
        after: String(s.after ?? ""),
        tokensSaved: Number(s.tokensSaved ?? 0),
        explanation: String(s.explanation ?? ""),
      })),
      totalTokensSaveable: Number(parsed.totalTokensSaveable ?? 0),
      summary: String(parsed.summary ?? ""),
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
  }
}
