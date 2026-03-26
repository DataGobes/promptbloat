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
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function checkRateLimit(ip: string): string | null {
  const now = Date.now();

  // Reset daily counter
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
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
  const { prompt } = await req.json();

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
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis", raw: text }, { status: 500 });
  }
}
