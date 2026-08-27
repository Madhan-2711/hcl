/**
 * _shared/groq.ts — Shared Groq API wrapper for Supabase Edge Functions
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function groqChat(
  messages: Message[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY secret is not set");

  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1024,
  };
  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function groqJson(
  system: string,
  user: string,
  options: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const userMsg =
      attempt === 1
        ? user + "\n\nYour last response was not valid JSON. Return only valid JSON."
        : user;

    const raw = await groqChat(
      [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      { ...options, jsonMode: true }
    );

    try {
      return JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/```(?:json)?/g, "")
        .replace(/```/g, "")
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        continue;
      }
    }
  }
  throw new Error("LLM returned non-JSON after 2 attempts");
}
