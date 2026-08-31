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

const getSystemPrompt = (skillsList: string[]) => `You are an expert AI curriculum advisor and career goal parser.
Analyze the user's free-text description of their background, aspirations, and goals.

You MUST map their mentioned competencies ONLY to this canonical list of skills where applicable:
${JSON.stringify(skillsList)}

Instructions:
1. "goal": A clear, standard career title (e.g. "Machine Learning Engineer", "Data Scientist", "Data Analyst", "Backend Developer", "Frontend Developer", "Full Stack Developer", "AI Engineer", "MLOps Engineer", "UI/UX Designer", "Mobile Developer", "DevOps Engineer").
2. "known_skills": Array of canonical skill names the learner explicitly or implicitly knows or has experience with.
3. "weak_skills": Array of canonical skill names the learner explicitly needs to learn, lacks, or wants to improve. If none are explicitly specified in the text, leave this array EMPTY. Do NOT guess or infer skills.
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

function keywordFallback(text: string, skillsList: string[]) {
  const lower = text.toLowerCase();
  
  let level = "intermediate";
  if (["beginner", "new", "just started", "no experience", "basics"].some((w) => lower.includes(w))) level = "beginner";
  else if (["advanced", "expert", "senior", "years of", "experienced"].some((w) => lower.includes(w))) level = "advanced";

  let goal = "Frontend Engineer";
  for (const role of [
    "data scientist", "machine learning engineer", "ml engineer", "data analyst",
    "backend developer", "frontend developer", "full stack developer", "ai engineer", "devops", "cloud engineer",
    "game developer", "mobile developer", "blockchain developer", "ui/ux designer", "qa tester"
  ]) {
    if (lower.includes(role)) {
      goal = role.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  // Very rough fallback mapping for known skills
  const known = new Set<string>();
  const weak = new Set<string>();
  for (const skill of skillsList) {
    if (lower.includes(skill.toLowerCase())) {
        if (["weak", "don't know", "learning", "need", "lack", "want to learn", "improve", "struggling", "new to"].some((n) => lower.includes(n))) {
            weak.add(skill);
        } else {
            known.add(skill);
        }
    }
  }

  // We rely on downstream logic to inject default weak skills if none found


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

    // Use admin client for DB persistence & fetching skills
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch skills dynamically
    const { data: skillRows } = await admin.from("skills").select("id, name");
    const skillMap: Record<string, number> = {};
    const skillNames: string[] = [];
    for (const s of skillRows ?? []) {
      skillMap[s.name.toLowerCase()] = s.id;
      skillMap[s.name] = s.id;
      skillNames.push(s.name);
    }

    // Parse with Groq LLM
    let parsed: any;
    try {
      parsed = await groqJson(getSystemPrompt(skillNames), text, { temperature: 0.1 });
    } catch (e) {
      console.warn("[parse-goal] LLM JSON parsing failed, using keyword fallback:", e);
      parsed = keywordFallback(text, skillNames);
    }

    // Normalize extracted skills to canonical database set (case insensitive matching)
    const normalizedKnown = new Set<string>();
    for (const s of parsed.known_skills ?? []) {
        const id = skillMap[String(s)] || skillMap[String(s).toLowerCase()];
        if (id) {
           const match = skillRows?.find(r => r.id === id);
           if (match) normalizedKnown.add(match.name);
        }
    }

    const normalizedWeak = new Set<string>();
    for (const s of parsed.weak_skills ?? []) {
        const id = skillMap[String(s)] || skillMap[String(s).toLowerCase()];
        if (id) {
           const match = skillRows?.find(r => r.id === id);
           if (match) normalizedWeak.add(match.name);
        }
    }

    // If no weak skills were explicitly identified, infer complementary skills for the career goal
    if (normalizedWeak.size === 0) {
      const lowerGoal = (parsed.goal || "").toLowerCase();
      if (lowerGoal.includes("data scientist") || lowerGoal.includes("analyst")) {
        ["Statistics", "Pandas", "SQL", "Data Visualization"].forEach((s) => {
          if (!normalizedKnown.has(s) && skillMap[s]) normalizedWeak.add(s);
        });
      } else if (lowerGoal.includes("machine learning") || lowerGoal.includes("ml") || lowerGoal.includes("ai")) {
        ["Machine Learning", "Deep Learning", "Neural Networks", "MLOps"].forEach((s) => {
          if (!normalizedKnown.has(s) && skillMap[s]) normalizedWeak.add(s);
        });
      } else if (lowerGoal.includes("frontend") || lowerGoal.includes("ui") || lowerGoal.includes("ux")) {
        ["React", "HTML", "CSS", "Figma", "TypeScript"].forEach((s) => {
            // Find roughly matching skills we added
            const found = skillNames.find(sn => sn.toLowerCase().includes(s.toLowerCase()));
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("doctor") || lowerGoal.includes("medic") || lowerGoal.includes("health") || lowerGoal.includes("nurs")) {
        ["Anatomy", "Patient Care", "Medical Ethics", "Physiology"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("law") || lowerGoal.includes("attorney") || lowerGoal.includes("legal")) {
        ["Criminal Law", "Contract Law", "Legal Research", "Negotiation"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("civil") || lowerGoal.includes("mechanical") || lowerGoal.includes("engineer")) {
        ["AutoCAD", "Structural Analysis", "Thermodynamics", "Project Management"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("forensic") || lowerGoal.includes("investigat")) {
        ["Crime Scene Investigation", "DNA Analysis", "Forensic Pathology", "Criminalistics"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("psychology") || lowerGoal.includes("therap") || lowerGoal.includes("counsel")) {
        ["Cognitive Psychology", "Counseling", "Behavioral Analysis"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("market") || lowerGoal.includes("creator") || lowerGoal.includes("social")) {
        ["Digital Marketing", "SEO", "Content Creation", "Social Media Strategy"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else if (lowerGoal.includes("business") || lowerGoal.includes("financ") || lowerGoal.includes("entrepren")) {
        ["Entrepreneurship", "Personal Finance", "Investing"].forEach((s) => {
            const found = skillNames.find(sn => sn.toLowerCase() === s.toLowerCase());
            if (found && !normalizedKnown.has(found)) normalizedWeak.add(found);
        });
      } else {
        // Fallback for generic tech roles
        ["Git", "SQL"].forEach((s) => {
          if (!normalizedKnown.has(s) && skillMap[s]) normalizedWeak.add(s);
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

    // Upsert learner_profiles
    await admin.from("learner_profiles").upsert({
      id: user.id,
      career_goal: finalParsed.goal,
      experience_level: finalParsed.experience_level,
      interests: finalParsed.known_skills,
    }, { onConflict: "id" });

    // Clear old skills so we don't mix ML Engineer skills with Frontend Engineer skills on re-parse
    await admin.from("learner_skills").delete().eq("learner_id", user.id);
    
    // Clear old chat history so the AI forgets conversations about the old path
    await admin.from("chat_history").delete().eq("learner_id", user.id);

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
