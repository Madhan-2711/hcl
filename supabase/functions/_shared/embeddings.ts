/**
 * _shared/embeddings.ts — Deterministic local text embeddings.
 *
 * Courses and goals are embedded with the hashing trick (signed bag-of-words
 * + bigrams projected into a fixed-size vector), L2-normalized, then compared
 * with cosine similarity. No external embedding API or model download is
 * required, so this runs entirely inside the edge function with no added
 * latency or new secrets. This is what actually populates courses.embedding
 * (pgvector) and replaces the old keyword-substring-count heuristic.
 */

export const EMBEDDING_DIM = 384;

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedText(text: string, dim = EMBEDDING_DIM): number[] {
  const vec = new Array(dim).fill(0);
  const tokens = tokenize(text);

  for (const tok of tokens) {
    const h = hash32(tok);
    vec[h % dim] += (h & 1) === 0 ? 1 : -1;
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const h = hash32(tokens[i] + "_" + tokens[i + 1]);
    vec[h % dim] += (h & 1) === 0 ? 0.5 : -0.5;
  }

  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

/** Both inputs are L2-normalized, so the dot product equals cosine similarity. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return Math.max(0, Math.min(1, dot));
}

/** pgvector returns embeddings as either a JSON array or its "[0.1,0.2,...]" text form. */
export function parseStoredEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}
