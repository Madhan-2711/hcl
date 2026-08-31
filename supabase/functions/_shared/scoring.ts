/**
 * _shared/scoring.ts — Shared course-scoring logic for generate-path and
 * get-recommendations, so the two edge functions can't drift out of sync.
 */
import { embedText, cosineSimilarity, parseStoredEmbedding } from "./embeddings.ts";

export function computeTrackSimilarity(goal: string, track: string | null): number {
  if (!track) return 0.2;
  const g = goal.toLowerCase();
  const t = track.toLowerCase();
  if (g.includes("machine learning") || g.includes("ml") || g.includes("ai") || g.includes("deep learning")) {
    if (t === "ml_engineer") return 0.95;
    if (t === "data_scientist") return 0.8;
  }
  if (g.includes("data scientist") || g.includes("analytics") || g.includes("data analyst") || g.includes("statistics")) {
    if (t === "data_scientist") return 0.95;
    if (t === "ml_engineer") return 0.75;
  }
  if (g.includes("backend") || g.includes("api") || g.includes("database") || g.includes("server") || g.includes("sql")) {
    if (t === "backend") return 0.95;
  }
  if (g.includes("frontend") || g.includes("web") || g.includes("react") || g.includes("ui")) {
    if (t === "frontend") return 0.95;
  }
  return 0.35;
}

export interface CourseForScoring {
  id: number;
  title?: string;
  description?: string;
  track?: string | null;
  difficulty?: string | null;
  embedding?: unknown;
}

export interface EmbeddingLookupResult {
  embedding: number[];
  wasComputed: boolean;
}

/** Reuses a stored pgvector embedding if present, otherwise derives one locally. */
export function resolveCourseEmbedding(course: CourseForScoring): EmbeddingLookupResult {
  const stored = parseStoredEmbedding(course.embedding);
  if (stored) return { embedding: stored, wasComputed: false };
  return {
    embedding: embedText(`${course.title ?? ""} ${course.description ?? ""}`),
    wasComputed: true,
  };
}

export interface OverallSimilarityResult {
  sim: number;
  embedding: number[];
  wasComputed: boolean;
}

export function computeOverallSimilarity(
  goalEmbedding: number[],
  careerGoal: string,
  course: CourseForScoring
): OverallSimilarityResult {
  const trackSim = computeTrackSimilarity(careerGoal, course.track ?? null);
  const { embedding, wasComputed } = resolveCourseEmbedding(course);
  const semanticSim = cosineSimilarity(goalEmbedding, embedding);
  const beginnerBonus = course.difficulty === "beginner" ? 0.05 : 0;
  const sim = Math.min(0.5 * trackSim + 0.5 * semanticSim + beginnerBonus, 1.0);
  return { sim, embedding, wasComputed };
}

/**
 * Persists any locally-derived embeddings back to courses.embedding so future
 * requests reuse them instead of recomputing (self-healing backfill — no
 * separate migration script needed). Best-effort: failures are logged, not thrown.
 */
export function backfillEmbeddings(
  admin: { from: (table: string) => any },
  computed: Array<{ id: number; embedding: number[] }>
): Promise<void> {
  const deduped = [...new Map(computed.map((c) => [c.id, c])).values()];
  if (!deduped.length) return Promise.resolve();
  const run = async () => {
    await Promise.all(
      deduped.map(({ id, embedding }) =>
        admin.from("courses").update({ embedding }).eq("id", id).then(
          ({ error }: { error: unknown }) => {
            if (error) console.error(`[backfillEmbeddings] course ${id}:`, error);
          }
        )
      )
    );
  };
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) {
    rt.waitUntil(run());
    return Promise.resolve();
  }
  return run();
}
