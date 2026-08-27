/**
 * get-recommendations/index.ts — Supabase Edge Function
 * Replaces: POST /recommendations
 *
 * Safe similarity search + skill-gap scoring → top-k results.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { computeGapScore } from "../_shared/skillGap.ts";

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
    const top_k = Number(body?.top_k) || 5;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch learner profile
    const { data: profile } = await admin
      .from("learner_profiles").select("career_goal").eq("id", user.id).maybeSingle();
    
    const careerGoal = profile?.career_goal || "Machine Learning Engineer";

    // Fetch learner skills
    const { data: skillRows } = await admin
      .from("learner_skills").select("skill_id, proficiency").eq("learner_id", user.id);
    const learnerSkills: Record<number, number> = {};
    for (const r of skillRows ?? []) learnerSkills[r.skill_id] = r.proficiency;

    // Fetch all courses
    const { data: allCourses } = await admin.from("courses").select("*");
    const coursesList = allCourses ?? [];
    if (!coursesList.length) {
      return jsonResponse({ recommendations: [] });
    }

    let candidateSimilarities: Record<number, number> = {};

    try {
      // @ts-ignore Supabase global
      if (typeof Supabase !== "undefined" && Supabase.ai) {
        // @ts-ignore
        const aiSession = new Supabase.ai.Session("gte-small");
        const embeddingOutput = await aiSession.run(careerGoal, {
          mean_pool: true,
          normalize: true,
        });
        const embedding: number[] = Array.from(embeddingOutput.data as Float32Array);
        const vecStr = `[${embedding.map((v: number) => v.toFixed(6)).join(",")}]`;

        const { data: rpcData } = await admin.rpc("search_courses_by_embedding", {
          query_embedding: vecStr,
          match_count: 20,
        });
        for (const c of rpcData ?? []) {
          candidateSimilarities[c.id ?? c.course_id] = c.similarity ?? 0;
        }
      }
    } catch (e) {
      console.warn("[get-recommendations] embedding search fallback:", e);
    }

    // Build course_skill_map
    const { data: csRows } = await admin
      .from("course_skills").select("course_id, skill_id, is_prerequisite");
    const courseSkillMap: Record<number, { taught: number[]; prereqs: number[] }> = {};
    for (const r of csRows ?? []) {
      if (!courseSkillMap[r.course_id]) courseSkillMap[r.course_id] = { taught: [], prereqs: [] };
      if (r.is_prerequisite) courseSkillMap[r.course_id].prereqs.push(r.skill_id);
      else courseSkillMap[r.course_id].taught.push(r.skill_id);
    }

    // Fetch skill name map for gap_skills
    const { data: skillNameRows } = await admin.from("skills").select("id, name");
    const skillNameMap: Record<number, string> = {};
    for (const s of skillNameRows ?? []) skillNameMap[s.id] = s.name;

    // Score candidates
    const scored = coursesList.map((c: any) => {
      const cid: number = c.id ?? c.course_id;
      const skillInfo = courseSkillMap[cid] ?? { taught: [], prereqs: [] };
      const [gapScore, gapSkillIds] = computeGapScore(learnerSkills, skillInfo.taught);
      const sim: number = candidateSimilarities[cid] ?? 0;
      const finalScore = 0.6 * sim + 0.4 * gapScore;

      return {
        course: {
          id: cid,
          title: c.title ?? "",
          description: c.description ?? null,
          difficulty: c.difficulty ?? null,
          duration_hours: c.duration_hours ?? null,
          track: c.track ?? null,
          url: c.url ?? null,
        },
        similarity_score: Math.round(sim * 10000) / 10000,
        gap_score: Math.round(gapScore * 10000) / 10000,
        final_score: Math.round(finalScore * 10000) / 10000,
        gap_skills: gapSkillIds.map((sid) => skillNameMap[sid] ?? String(sid)),
      };
    });

    scored.sort((a, b) => b.final_score - a.final_score);
    const recommendations = scored.slice(0, Math.min(top_k, 20));

    return jsonResponse({ recommendations });
  } catch (err) {
    console.error("[get-recommendations] Error:", err);
    return errorResponse((err as Error).message);
  }
});
