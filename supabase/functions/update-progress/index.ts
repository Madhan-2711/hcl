/**
 * update-progress/index.ts — Supabase Edge Function
 * Replaces the old direct-table-write status update.
 *
 * Updates a path_item's status. When an item is freshly marked "completed",
 * this boosts the learner's proficiency in the skills that course teaches
 * and re-scores the remaining (not-yet-completed) items in the same path,
 * so the skill radar and recommendation scores actually reflect progress
 * instead of staying frozen at onboarding-time values.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { computeGapScore, simulateCourseCompletion, SkillMap } from "../_shared/skillGap.ts";
import { embedText } from "../_shared/embeddings.ts";
import { computeOverallSimilarity } from "../_shared/scoring.ts";

const VALID_STATUSES = ["not_started", "in_progress", "completed"];

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

    const { path_id, item_id, status } = await req.json();
    if (!path_id || !item_id || !VALID_STATUSES.includes(status)) {
      return errorResponse("path_id, item_id and a valid status are required", 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: item, error: itemErr } = await admin
      .from("path_items")
      .select("id, status, course_id, learning_paths(learner_id, goal_text)")
      .eq("id", item_id)
      .eq("path_id", path_id)
      .maybeSingle();

    if (itemErr || !item) return errorResponse("Path item not found", 404);
    if (item.learning_paths?.learner_id !== user.id) return errorResponse("Not your path item", 403);

    const wasCompleted = item.status === "completed";
    const { error: updateErr } = await admin.from("path_items").update({ status }).eq("id", item_id);
    if (updateErr) return errorResponse(updateErr.message, 500);

    let skillsUpdated = false;
    let itemsRescored = 0;

    if (status === "completed" && !wasCompleted) {
      const { data: taughtRows } = await admin
        .from("course_skills")
        .select("skill_id")
        .eq("course_id", item.course_id)
        .eq("is_prerequisite", false);
      const taughtIds = (taughtRows ?? []).map((r: any) => r.skill_id);

      if (taughtIds.length) {
        const { data: skillRows } = await admin
          .from("learner_skills").select("skill_id, proficiency").eq("learner_id", user.id);
        const skillMap: SkillMap = {};
        for (const r of skillRows ?? []) skillMap[r.skill_id] = r.proficiency;

        const updated = simulateCourseCompletion(skillMap, taughtIds);
        const rows = taughtIds.map((sid: number) => ({
          learner_id: user.id,
          skill_id: sid,
          proficiency: updated[sid],
          source: "inferred",
        }));
        await admin.from("learner_skills").upsert(rows, { onConflict: "learner_id,skill_id" });
        skillsUpdated = true;
      }

      if (skillsUpdated) {
        const { data: freshSkillRows } = await admin
          .from("learner_skills").select("skill_id, proficiency").eq("learner_id", user.id);
        const freshSkillMap: SkillMap = {};
        for (const r of freshSkillRows ?? []) freshSkillMap[r.skill_id] = r.proficiency;

        const { data: remainingItems } = await admin
          .from("path_items").select("id, course_id").eq("path_id", path_id).neq("status", "completed");

        if (remainingItems?.length) {
          const courseIds = remainingItems.map((i: any) => i.course_id);
          const [{ data: courses }, { data: csRows }] = await Promise.all([
            admin.from("courses").select("*").in("id", courseIds),
            admin.from("course_skills").select("course_id, skill_id").in("course_id", courseIds).eq("is_prerequisite", false),
          ]);

          const taughtMap: Record<number, number[]> = {};
          for (const r of csRows ?? []) {
            if (!taughtMap[r.course_id]) taughtMap[r.course_id] = [];
            taughtMap[r.course_id].push(r.skill_id);
          }

          const goalText = item.learning_paths?.goal_text ?? "";
          const goalEmbedding = embedText(goalText);

          const updates = (courses ?? []).map(async (c: any) => {
            const relatedItem = remainingItems.find((i: any) => i.course_id === c.id);
            if (!relatedItem) return;

            const [gapScore] = computeGapScore(freshSkillMap, taughtMap[c.id] ?? []);
            const { sim } = computeOverallSimilarity(goalEmbedding, goalText, c);
            const finalScore = 0.6 * sim + 0.4 * gapScore;

            await admin.from("path_items").update({
              similarity_score: Math.round(sim * 10000) / 10000,
              gap_score: Math.round(gapScore * 10000) / 10000,
              final_score: Math.round(finalScore * 10000) / 10000,
            }).eq("id", relatedItem.id);
            itemsRescored++;
          });

          await Promise.all(updates);
        }
      }
    }

    return jsonResponse({ updated: true, status, skills_updated: skillsUpdated, items_rescored: itemsRescored });
  } catch (err) {
    console.error("[update-progress] Unexpected error:", err);
    return errorResponse((err as Error).message);
  }
});
