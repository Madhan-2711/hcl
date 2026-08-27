/**
 * _shared/skillGap.ts — TypeScript port of backend/services/skill_gap.py
 *
 * Computes skill-gap scores, checks prerequisites, and simulates course completion.
 * Used by both get-recommendations and generate-path edge functions.
 */

/** skill_id → proficiency (0-100) */
export type SkillMap = Record<number, number>;

/**
 * Compute a normalised 0-1 gap score for a course.
 * Returns [gapScore, gapSkillIds].
 */
export function computeGapScore(
  learnerSkills: SkillMap,
  courseTaughtSkills: number[],
  threshold = 70
): [number, number[]] {
  if (!courseTaughtSkills.length) return [0, []];

  const gapSkillIds: number[] = [];
  let totalGap = 0;

  for (const sid of courseTaughtSkills) {
    const current = learnerSkills[sid] ?? 0;
    if (current < threshold) {
      totalGap += threshold - current;
      gapSkillIds.push(sid);
    }
  }

  const maxPossible = courseTaughtSkills.length * threshold;
  const score = maxPossible > 0 ? Math.min(totalGap / maxPossible, 1.0) : 0;
  return [score, gapSkillIds];
}

/**
 * Returns true if learner has all prerequisite skills above min_proficiency.
 */
export function prerequisitesMet(
  learnerSkills: SkillMap,
  prereqSkillIds: number[],
  minProficiency = 40
): boolean {
  return prereqSkillIds.every(
    (sid) => (learnerSkills[sid] ?? 0) >= minProficiency
  );
}

/**
 * Returns true if learner has all required skills above threshold.
 */
export function skillsAboveThreshold(
  learnerSkills: SkillMap,
  requiredSkillIds: number[],
  threshold = 70
): boolean {
  return requiredSkillIds.every(
    (sid) => (learnerSkills[sid] ?? 0) >= threshold
  );
}

/**
 * Simulate completing a course: boost taught skills by `boost`, capped at `cap`.
 * Returns a new SkillMap (does not mutate the input).
 */
export function simulateCourseCompletion(
  learnerSkills: SkillMap,
  courseTaughtSkills: number[],
  boost = 30,
  cap = 100
): SkillMap {
  const updated = { ...learnerSkills };
  for (const sid of courseTaughtSkills) {
    updated[sid] = Math.min((updated[sid] ?? 10) + boost, cap);
  }
  return updated;
}
