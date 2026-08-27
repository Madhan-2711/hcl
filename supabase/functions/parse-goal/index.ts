/**
 * parse-goal/index.ts — Supabase Edge Function
 * Replaces: POST /goals/parse
 *
 * Parses a free-text learner goal using Groq, then upserts
 * learner_profiles + learner_skills in Supabase.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqJson } from "../_shared/groq.ts";

const KNOWN_SKILLS = [
  "Python", "Statistics", "NumPy", "Pandas", "Machine Learning",
  "Deep Learning", "SQL", "MLOps", "Data Visualization", "Communication",
  "Git", "Cloud Basics", "Linear Algebra", "Neural Networks", "Model Deployment",
];

const SYSTEM_PROMPT = `You are a learner-goal parser. Given free text, extract a JSON object with:
- "goal": string, the target role/career
- "known_skills": array of strings, skills the learner claims to have
- "weak_skills": array of strings, skills the learner says they lack or want to improve
- "experience_level": one of "beginner","intermediate","advanced", inferred from text
- "timeframe_months": integer or null
Return ONLY the JSON object, no prose, no markdown fences.`;

function keywordFallback(text: string) {
  const lower = text.toLowerCase();
  const known: string[] = [];
  const weak: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    if (lower.includes(skill.toLowerCase())) {
      if (["weak", "don't know", "learning", "new to", "struggling"].some((n) => lower.includes(n))) {
        weak.push(skill);
      } else {
        known.push(skill);
      }
    }
  }

  let level = "intermediate";
  if (["beginner", "new", "just started", "no experience"].some((w) => lower.includes(w))) level = "beginner";
  else if (["advanced", "expert", "senior", "years of"].some((w) => lower.includes(w))) level = "advanced";

  let goal = "Machine Learning Engineer";
  for (const role of ["data scientist", "ml engineer", "backend developer", "frontend developer", "software engineer", "data analyst", "devops"]) {
    if (lower.includes(role)) { goal = role.replace(/\b\w/g, (c) => c.toUpperCase()); break; }
  }

  return { goal, known_skills: known, weak_skills: weak, experience_level: level, timeframe_months: null };
}

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("Unauthorized", 401);

    const { text } = await req.json();
    if (!text || text.length < 5) return errorResponse("Goal text too short", 400);

    // Parse with LLM, fall back to keyword matching
    let parsed: Record<string, unknown>;
    try {
      parsed = await groqJson(SYSTEM_PROMPT, text);
    } catch (e) {
      console.error("[parse-goal] LLM failed, using keyword fallback:", e);
      parsed = keywordFallback(text);
    }

    // Use admin client for DB writes (bypasses RLS)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all skills to build name→id map
    const { data: skillRows } = await admin.from("skills").select("id, name");
    const skillMap: Record<string, number> = {};
    for (const s of skillRows ?? []) skillMap[s.name] = s.id;

    // Upsert learner_profiles
    await admin.from("learner_profiles").upsert({
      id: user.id,
      career_goal: parsed.goal,
      experience_level: parsed.experience_level,
      interests: parsed.known_skills,
    }, { onConflict: "id" });

    // Upsert known skills (proficiency 60)
    for (const skillName of (parsed.known_skills as string[]) ?? []) {
      const sid = skillMap[skillName];
      if (sid) {
        await admin.from("learner_skills").upsert({
          learner_id: user.id, skill_id: sid, proficiency: 60, source: "inferred",
        }, { onConflict: "learner_id,skill_id" });
      }
    }

    // Upsert weak skills (proficiency 15)
    for (const skillName of (parsed.weak_skills as string[]) ?? []) {
      const sid = skillMap[skillName];
      if (sid) {
        await admin.from("learner_skills").upsert({
          learner_id: user.id, skill_id: sid, proficiency: 15, source: "inferred",
        }, { onConflict: "learner_id,skill_id" });
      }
    }

    return jsonResponse({ parsed, profile_updated: true });
  } catch (err) {
    console.error("[parse-goal] Error:", err);
    return errorResponse((err as Error).message);
  }
});
