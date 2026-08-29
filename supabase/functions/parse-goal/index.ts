/**
 * parse-goal/index.ts — Supabase Edge Function
 * Replaces: POST /goals/parse
 *
 * Parses a free-text learner goal using Groq LLM, maps extracted competencies
 * directly to canonical database skills, and upserts learner_profiles + learner_skills.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqJson } from "../_shared/groq.ts";

const CANONICAL_SKILLS = [
  "Python", "Statistics", "NumPy", "Pandas", "Machine Learning",
  "Deep Learning", "SQL", "MLOps", "Data Visualization", "Communication",
  "Git", "Cloud Basics", "Linear Algebra", "Neural Networks", "Model Deployment"
];

const SKILL_ALIASES: Record<string, string> = {
  "python": "Python",
  "py": "Python",
  "stats": "Statistics",
  "probability": "Statistics",
  "data analysis": "Statistics",
  "numpy": "NumPy",
  "pandas": "Pandas",
  "dataframes": "Pandas",
  "machine learning": "Machine Learning",
  "ml": "Machine Learning",
  "scikit-learn": "Machine Learning",
  "sklearn": "Machine Learning",
  "deep learning": "Deep Learning",
  "dl": "Deep Learning",
  "pytorch": "Deep Learning",
  "tensorflow": "Deep Learning",
  "keras": "Deep Learning",
  "sql": "SQL",
  "postgres": "SQL",
  "postgresql": "SQL",
  "database": "SQL",
  "mlops": "MLOps",
  "ml pipelines": "MLOps",
  "data visualization": "Data Visualization",
  "visualization": "Data Visualization",
  "matplotlib": "Data Visualization",
  "seaborn": "Data Visualization",
  "plotly": "Data Visualization",
  "communication": "Communication",
  "presentation": "Communication",
  "git": "Git",
  "github": "Git",
  "version control": "Git",
  "cloud": "Cloud Basics",
  "cloud basics": "Cloud Basics",
  "aws": "Cloud Basics",
  "gcp": "Cloud Basics",
  "azure": "Cloud Basics",
  "docker": "Cloud Basics",
  "linear algebra": "Linear Algebra",
  "matrices": "Linear Algebra",
  "vectors": "Linear Algebra",
  "math": "Linear Algebra",
  "neural networks": "Neural Networks",
  "ann": "Neural Networks",
  "cnn": "Neural Networks",
  "rnn": "Neural Networks",
  "transformers": "Neural Networks",
  "llm": "Neural Networks",
  "model deployment": "Model Deployment",
  "fastapi": "Model Deployment",
  "api": "Model Deployment",
  "serving": "Model Deployment",
  "production": "Model Deployment",
};

const SYSTEM_PROMPT = `You are an expert AI curriculum advisor and career goal parser.
Analyze the user's free-text description of their background, aspirations, and goals.

You MUST map their mentioned competencies ONLY to this canonical list of skills where applicable:
${JSON.stringify(CANONICAL_SKILLS)}

Instructions:
1. "goal": A clear, standard career title (e.g. "Machine Learning Engineer", "Data Scientist", "Data Analyst", "Backend Developer", "Frontend Developer", "Full Stack Developer", "AI Engineer", "MLOps Engineer").
2. "known_skills": Array of canonical skill names the learner explicitly or implicitly knows or has experience with.
3. "weak_skills": Array of canonical skill names the learner needs to learn, lacks, struggles with, or wants to improve.
4. "experience_level": One of "beginner", "intermediate", "advanced" based on what they already know.
5. "timeframe_months": Estimated target months (default 6 if not specified).

Return ONLY a valid JSON object matching this schema:
{
  "goal": string,
  "known_skills": string[],
  "weak_skills": string[],
  "experience_level": "beginner" | "intermediate" | "advanced",
  "timeframe_months": number
}`;

function matchCanonicalSkill(raw: string): string | null {
  const clean = raw.trim().toLowerCase();
  if (SKILL_ALIASES[clean]) return SKILL_ALIASES[clean];
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (clean.includes(alias) || alias.includes(clean)) return canonical;
  }
  return null;
}

function keywordFallback(text: string) {
  const lower = text.toLowerCase();
  const known = new Set<string>();
  const weak = new Set<string>();

  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (lower.includes(alias)) {
      if (["weak", "don't know", "learning", "need", "lack", "want to learn", "improve", "struggling", "new to"].some((n) => lower.includes(n))) {
        weak.add(canonical);
      } else {
        known.add(canonical);
      }
    }
  }

  let level = "intermediate";
  if (["beginner", "new", "just started", "no experience", "basics"].some((w) => lower.includes(w))) level = "beginner";
  else if (["advanced", "expert", "senior", "years of", "experienced"].some((w) => lower.includes(w))) level = "advanced";

  let goal = "Machine Learning Engineer";
  for (const role of [
    "data scientist", "machine learning engineer", "ml engineer", "data analyst",
    "backend developer", "frontend developer", "full stack developer", "ai engineer", "devops", "cloud engineer"
  ]) {
    if (lower.includes(role)) {
      goal = role.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  return {
    goal,
    known_skills: Array.from(known),
    weak_skills: Array.from(weak),
    experience_level: level,
    timeframe_months: 6,
  };
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

    const { text } = await req.json();
    if (!text || text.trim().length < 5) return errorResponse("Goal text too short", 400);

    // Parse with Groq LLM
    let parsed: any;
    try {
      parsed = await groqJson(SYSTEM_PROMPT, text, { temperature: 0.1 });
    } catch (e) {
      console.warn("[parse-goal] LLM JSON parsing failed, using keyword fallback:", e);
      parsed = keywordFallback(text);
    }

    // Normalize extracted skills to canonical database set
    const normalizedKnown = new Set<string>();
    for (const s of parsed.known_skills ?? []) {
      const match = matchCanonicalSkill(String(s));
      if (match) normalizedKnown.add(match);
    }

    const normalizedWeak = new Set<string>();
    for (const s of parsed.weak_skills ?? []) {
      const match = matchCanonicalSkill(String(s));
      if (match) normalizedWeak.add(match);
    }

    // If no weak skills were explicitly identified, infer complementary skills for the career goal
    if (normalizedWeak.size === 0) {
      const lowerGoal = (parsed.goal || "").toLowerCase();
      if (lowerGoal.includes("data scientist") || lowerGoal.includes("analyst")) {
        ["Statistics", "Pandas", "SQL", "Data Visualization"].forEach((s) => {
          if (!normalizedKnown.has(s)) normalizedWeak.add(s);
        });
      } else if (lowerGoal.includes("machine learning") || lowerGoal.includes("ml") || lowerGoal.includes("ai")) {
        ["Machine Learning", "Deep Learning", "Neural Networks", "MLOps"].forEach((s) => {
          if (!normalizedKnown.has(s)) normalizedWeak.add(s);
        });
      } else {
        ["Python", "Git", "SQL"].forEach((s) => {
          if (!normalizedKnown.has(s)) normalizedWeak.add(s);
        });
      }
    }

    const finalParsed = {
      goal: parsed.goal || "Machine Learning Engineer",
      known_skills: Array.from(normalizedKnown),
      weak_skills: Array.from(normalizedWeak),
      experience_level: parsed.experience_level || "beginner",
      timeframe_months: parsed.timeframe_months || 6,
    };

    // Use admin client for DB persistence
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch skills name -> id
    const { data: skillRows } = await admin.from("skills").select("id, name");
    const skillMap: Record<string, number> = {};
    for (const s of skillRows ?? []) {
      skillMap[s.name] = s.id;
    }

    // Upsert learner_profiles
    await admin.from("learner_profiles").upsert({
      id: user.id,
      career_goal: finalParsed.goal,
      experience_level: finalParsed.experience_level,
      interests: finalParsed.known_skills,
    }, { onConflict: "id" });

    // Upsert known skills (proficiency 65%)
    for (const skillName of finalParsed.known_skills) {
      const sid = skillMap[skillName];
      if (sid) {
        await admin.from("learner_skills").upsert({
          learner_id: user.id,
          skill_id: sid,
          proficiency: 65,
          source: "inferred",
        }, { onConflict: "learner_id,skill_id" });
      }
    }

    // Upsert weak skills (proficiency 15%)
    for (const skillName of finalParsed.weak_skills) {
      const sid = skillMap[skillName];
      if (sid) {
        await admin.from("learner_skills").upsert({
          learner_id: user.id,
          skill_id: sid,
          proficiency: 15,
          source: "inferred",
        }, { onConflict: "learner_id,skill_id" });
      }
    }

    return jsonResponse({ parsed: finalParsed, profile_updated: true });
  } catch (err) {
    console.error("[parse-goal] Error:", err);
    return errorResponse((err as Error).message);
  }
});
