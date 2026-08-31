/**
 * groqClient.js — Direct Groq LLM integration client for frontend with robust JSON parsing
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export function getGroqApiKey() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env
    : (typeof process !== 'undefined' && process.env)
    ? process.env
    : {};
  return env.VITE_GROQ_API_KEY || '';
}

export async function groqChat(messages, options = {}) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Missing Groq API Key. Set VITE_GROQ_API_KEY in your environment.');
  }

  const body = {
    model: options.model || DEFAULT_MODEL,
    messages,
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.maxTokens || 1500,
  };

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

export async function groqJson(systemPrompt, userPrompt, options = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const userContent =
      attempt === 1
        ? `${userPrompt}\n\nNote: Return ONLY valid JSON format with no additional markdown, text, or explanations.`
        : userPrompt;

    const raw = await groqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      { ...options, jsonMode: true }
    );

    try {
      return JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        // Continue to attempt 2
      }
    }
  }
  throw new Error('Groq LLM returned non-JSON response after 2 attempts.');
}
