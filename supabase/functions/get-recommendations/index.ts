/**
 * get-recommendations/index.ts — Supabase Edge Function
 * Replaces: POST /recommendations
 *
 * Computes semantic similarity + track alignment + skill-gap scoring.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { computeGapScore } from "../_shared/skillGap.ts";

function computeTrackSimilarity(goal: string, track: string | null): number {
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

function computeKeywordSimilarity(goal: string, course: any): number {
  const words = goal.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (!words.length) return 0.5;
  const target = `${course.title || ""} ${course.description || ""}`.toLowerCase();
  let matches = 0;
  for (const w of words) {
    if (target.includes(w)) matches++;
  }
  return Math.min(matches / words.length, 1.0);
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

    // Build course_skill_map
    const { data: csRows } = await admin
      .from("course_skills").select("course_id, skill_id, is_prerequisite");
    const courseSkillMap: Record<number, { taught: number[]; prereqs: number[] }> = {};
    for (const r of csRows ?? []) {
      if (!courseSkillMap[r.course_id]) courseSkillMap[r.course_id] = { taught: [], prereqs: [] };
      if (r.is_prerequisite) courseSkillMap[r.course_id].prereqs.push(r.skill_id);
      else courseSkillMap[r.course_id].taught.push(r.skill_id);
    }

    // Fetch skill name map
    const { data: skillNameRows } = await admin.from("skills").select("id, name");
    const skillNameMap: Record<number, string> = {};
    for (const s of skillNameRows ?? []) skillNameMap[s.id] = s.name;

    // Score candidates with track correlation + keyword similarity + skill-gap score
    const scored = coursesList.map((c: any) => {
      const cid: number = c.id ?? c.course_id;
      const skillInfo = courseSkillMap[cid] ?? { taught: [], prereqs: [] };
      const [gapScore, gapSkillIds] = computeGapScore(learnerSkills, skillInfo.taught);
      
      const trackSim = computeTrackSimilarity(careerGoal, c.track);
      const kwSim = computeKeywordSimilarity(careerGoal, c);
      const sim = Math.min(0.65 * trackSim + 0.35 * kwSim + (c.difficulty === "beginner" ? 0.05 : 0), 1.0);
      
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

    const validScored = scored.filter(c => c.final_score > 0.15);
    validScored.sort((a, b) => b.final_score - a.final_score);
    const recommendations = validScored.slice(0, Math.min(top_k, 20));

    return jsonResponse({ recommendations });
  } catch (err) {
    console.error("[get-recommendations] Error:", err);
    return errorResponse((err as Error).message);
  }
});
