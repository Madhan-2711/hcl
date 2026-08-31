/**
 * generate-path/index.ts — Supabase Edge Function
 * Replaces: POST /paths/generate
 *
 * Greedy topological path builder with track alignment and skill-gap closure.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqChat } from "../_shared/groq.ts";
import {
  computeGapScore,
  prerequisitesMet,
  simulateCourseCompletion,
  SkillMap,
} from "../_shared/skillGap.ts";
import { embedText } from "../_shared/embeddings.ts";
import { backfillEmbeddings, computeOverallSimilarity } from "../_shared/scoring.ts";

const MILESTONE_LABELS = [
  "Foundations",
  "Core Skills",
  "Intermediate Mastery",
  "Advanced Techniques",
  "Capstone",
];

const EXPLAIN_SYSTEM = `You are an encouraging AI learning advisor. In 2 concise sentences, explain to the learner why this specific course was recommended for their goal, referencing their background and what competencies this course teaches.`;

function assignMilestone(orderIndex: number, total: number): string {
  if (total <= 1) return MILESTONE_LABELS[0];
  const fraction = orderIndex / Math.max(total - 1, 1);
  const idx = Math.floor(fraction * (MILESTONE_LABELS.length - 1));
  return MILESTONE_LABELS[Math.min(idx, MILESTONE_LABELS.length - 1)];
}

function scoreCourses(
  candidates: any[],
  careerGoal: string,
  goalEmbedding: number[],
  learnerSkills: SkillMap,
  courseSkillMap: Record<number, { taught: number[]; prereqs: number[] }>,
  courseMap: Record<number, any>,
  newlyComputedEmbeddings: Array<{ id: number; embedding: number[] }>
): any[] {
  return candidates.map((c) => {
    const cid: number = c.id;
    const skillInfo = courseSkillMap[cid] ?? { taught: [], prereqs: [] };
    const [gapScore, gapSkillIds] = computeGapScore(learnerSkills, skillInfo.taught);

    const { sim, embedding, wasComputed } = computeOverallSimilarity(goalEmbedding, careerGoal, c);
    if (wasComputed) newlyComputedEmbeddings.push({ id: cid, embedding });

    const finalScore = 0.6 * sim + 0.4 * gapScore;
    const full = courseMap[cid] ?? c;

    return {
      course_id: cid,
      title: full.title ?? "",
      description: full.description,
      difficulty: full.difficulty,
      duration_hours: full.duration_hours,
      track: full.track,
      url: full.url,
      similarity_score: Math.round(sim * 10000) / 10000,
      gap_score: Math.round(gapScore * 10000) / 10000,
      final_score: Math.round(finalScore * 10000) / 10000,
      gap_skill_ids: gapSkillIds,
    };
  }).sort((a, b) => b.final_score - a.final_score);
}

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("Unauthorized", 401);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const maxLength = Number(body?.max_length) || 8;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch learner profile
    const { data: profile } = await admin
      .from("learner_profiles").select("*").eq("id", user.id).maybeSingle();
    
    const careerGoal: string = profile?.career_goal || "Machine Learning Engineer";

    // Fetch learner skills
    const { data: skillRows } = await admin
      .from("learner_skills").select("skill_id, proficiency").eq("learner_id", user.id);
    let currentSkills: SkillMap = {};
    for (const r of skillRows ?? []) currentSkills[r.skill_id] = r.proficiency;

    // Fetch skill name map
    const { data: skillNameRows } = await admin.from("skills").select("id, name");
    const skillNameMap: Record<number, string> = {};
    for (const s of skillNameRows ?? []) skillNameMap[s.id] = s.name;

    const knownSkillNames = Object.entries(currentSkills)
      .filter(([, p]) => p >= 50)
      .map(([sid]) => skillNameMap[Number(sid)] ?? "")
      .filter(Boolean);

    // Fetch all courses
    const { data: allCoursesData } = await admin.from("courses").select("*");
    const allCourses: any[] = allCoursesData ?? [];
    if (!allCourses.length) {
      return errorResponse("No courses found in database.", 404);
    }
    const courseMap: Record<number, any> = {};
    for (const c of allCourses) courseMap[c.id] = c;

    // Fetch course_skill_map
    const { data: csRows } = await admin
      .from("course_skills").select("course_id, skill_id, is_prerequisite");
    const courseSkillMap: Record<number, { taught: number[]; prereqs: number[] }> = {};
    for (const r of csRows ?? []) {
      if (!courseSkillMap[r.course_id]) courseSkillMap[r.course_id] = { taught: [], prereqs: [] };
      if (r.is_prerequisite) courseSkillMap[r.course_id].prereqs.push(r.skill_id);
      else courseSkillMap[r.course_id].taught.push(r.skill_id);
    }

    // Goal embedding computed once; courses without a stored embedding get one
    // derived locally and queued for a self-healing backfill into pgvector.
    const goalEmbedding = embedText(`${careerGoal} ${knownSkillNames.join(" ")}`);
    const newlyComputedEmbeddings: Array<{ id: number; embedding: number[] }> = [];

    // Greedy path building loop
    const path: any[] = [];
    const usedCourseIds = new Set<number>();

    for (let step = 0; step < maxLength; step++) {
      let unlockable = allCourses.filter(
        (c) =>
          !usedCourseIds.has(c.id) &&
          prerequisitesMet(
            currentSkills,
            courseSkillMap[c.id]?.prereqs ?? [],
            40
          )
      );

      // If no strictly unlockable course remains, relax prerequisites
      if (!unlockable.length) {
        unlockable = allCourses.filter((c) => !usedCourseIds.has(c.id));
      }

      if (!unlockable.length) break;

      const scored = scoreCourses(
        unlockable,
        careerGoal,
        goalEmbedding,
        currentSkills,
        courseSkillMap,
        courseMap,
        newlyComputedEmbeddings
      );

      const validScored = scored.filter(c => c.final_score > 0.15);
      if (!validScored.length) break;

      const best = validScored[0];
      usedCourseIds.add(best.course_id);

      // Simulate completion
      currentSkills = simulateCourseCompletion(
        currentSkills,
        courseSkillMap[best.course_id]?.taught ?? []
      );

      path.push({ ...best, order_index: step });
    }

    if (!path.length) {
      return errorResponse("Could not generate a path. Please refine your goal.", 422);
    }

    await backfillEmbeddings(admin, newlyComputedEmbeddings);

    // Assign milestones
    const total = path.length;
    for (const item of path) {
      item.milestone_label = assignMilestone(item.order_index, total);
    }

    // Generate Groq explanations (up to 3 in parallel)
    const CHUNK = 3;
    for (let i = 0; i < path.length; i += CHUNK) {
      const chunk = path.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map(async (item) => {
          const gapSkillNames = (item.gap_skill_ids ?? [])
            .map((sid: number) => skillNameMap[sid] ?? "")
            .filter(Boolean);

          const userMsg = `Learner's goal: ${careerGoal}
Learner currently knows: ${knownSkillNames.join(", ") || "basics"}
Course: ${item.title}
Skill gaps this course closes: ${gapSkillNames.join(", ") || "core competencies"}
Write 2 sentences explaining why this course was chosen.`;

          try {
            item.explanation = await groqChat(
              [{ role: "system", content: EXPLAIN_SYSTEM }, { role: "user", content: userMsg }],
              { temperature: 0.3, maxTokens: 150 }
            );
          } catch (e) {
            item.explanation = `This course builds key competencies in ${gapSkillNames.join(", ") || "the curriculum"} directly aligned with becoming a ${careerGoal}.`;
          }
        })
      );
    }

    // Create learning_paths record
    const { data: pathRecord, error: pathInsertErr } = await admin
      .from("learning_paths")
      .insert({ learner_id: user.id, goal_text: careerGoal })
      .select()
      .single();

    if (pathInsertErr || !pathRecord) {
      console.error("Error creating learning_path:", pathInsertErr);
      return errorResponse(pathInsertErr?.message || "Failed to create learning path record", 500);
    }

    const pathId: string = pathRecord.id;
    const pathCreatedAt: string = pathRecord.created_at;

    // Insert path_items
    const itemRecords = path.map((item) => ({
      path_id: pathId,
      course_id: item.course_id,
      order_index: item.order_index,
      status: "not_started",
      milestone_label: item.milestone_label,
      explanation: item.explanation,
      similarity_score: item.similarity_score,
      gap_score: item.gap_score,
      final_score: item.final_score,
    }));

    const { data: insertedItems, error: itemsInsertErr } = await admin
      .from("path_items").insert(itemRecords).select();

    if (itemsInsertErr) {
      console.error("Error creating path_items:", itemsInsertErr);
    }

    // Build response
    const pathItemOuts = (insertedItems ?? itemRecords).map((dbItem: any, idx: number) => {
      const course = courseMap[dbItem.course_id] ?? {};
      return {
        id: dbItem.id || `item-${idx}`,
        course_id: dbItem.course_id,
        order_index: dbItem.order_index,
        status: dbItem.status || "not_started",
        milestone_label: dbItem.milestone_label,
        explanation: dbItem.explanation,
        similarity_score: dbItem.similarity_score,
        gap_score: dbItem.gap_score,
        final_score: dbItem.final_score,
        course: {
          id: dbItem.course_id,
          title: course.title ?? "",
          description: course.description ?? null,
          difficulty: course.difficulty ?? null,
          duration_hours: course.duration_hours ?? null,
          track: course.track ?? null,
          url: course.url ?? null,
        },
      };
    }).sort((a: any, b: any) => a.order_index - b.order_index);

    return jsonResponse({
      path: {
        id: pathId,
        learner_id: user.id,
        goal_text: careerGoal,
        created_at: pathCreatedAt,
        items: pathItemOuts,
      },
    });
  } catch (err) {
    console.error("[generate-path] Unexpected error:", err);
    return errorResponse((err as Error).message);
  }
});
