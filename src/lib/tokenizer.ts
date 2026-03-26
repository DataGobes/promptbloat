import { encodingForModel } from "js-tiktoken";

const encoder = encodingForModel("gpt-4o");

export function countTokens(text: string): number {
  if (!text) return 0;
  return encoder.encode(text).length;
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens = encoder.encode(text);
  return tokens.map((t) => {
    const decoded = encoder.decode([t]);
    if (typeof decoded === "string") return decoded;
    return new TextDecoder().decode(decoded as Uint8Array);
  });
}
