/**
 * skill-test/index.ts — Supabase Edge Function
 * Replaces & supercharges /session/start and /session/answer from new2
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqJson } from "../_shared/groq.ts";

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

    const body = await req.json();
    const action = body.action || "generate"; // "generate" | "evaluate"

    if (action === "generate") {
      const { profile, num_questions = 5 } = body;
      const skills = Array.isArray(profile?.skills) ? profile.skills.join(", ") : "Core Engineering";
      const goal = profile?.goal || "Software Engineer";

      const systemPrompt = `You are a distinguished technical lead and skill assessment proctor.
Generate exactly ${num_questions} technical and architectural assessment questions tailored specifically to the candidate's declared skills (${skills}) and target career goal (${goal}).

Rules:
1. Ground questions in practical system design, algorithm depth, and domain engineering.
2. Return ONLY a valid JSON object matching:
{
  "questions": [
    {
      "id": 1,
      "order_num": 1,
      "skill_focus": "Skill Name",
      "question_text": "Detailed question prompt..."
    }
  ]
}`;

      const res = await groqJson(systemPrompt, `Goal: ${goal}\nSkills: ${skills}`, { temperature: 0.6 });
      return jsonResponse(res);
    }

    if (action === "evaluate") {
      const { question, answer_history = [], current_answer, candidate_skills = [], followup_num = 0 } = body;
      let historyText = "";
      for (const a of answer_history) {
        historyText += `${a.is_followup ? `Follow-up ${a.followup_num}` : "Main Answer"}: ${a.answer_text}\n`;
      }
      historyText += `${followup_num > 0 ? `Follow-up ${followup_num}` : "Main Answer"}: ${current_answer}\n`;

      const systemPrompt = `You are an expert technical interviewer evaluating a candidate's answer.
QUESTION: ${question.question_text}
FOLLOW-UPS GIVEN: ${followup_num} (max: 3)
CANDIDATE SKILLS: ${candidate_skills.join(", ") || "General"}

Evaluate on 4 metrics (0-10 each): relevance, completeness, technical_depth, clarity.
Decide: "followup" if incomplete and followup_num < 3; "next" if complete or followup_num >= 3.
Identify missed_points (max 3 points).

Return ONLY JSON:
{
  "decision": "followup" | "next",
  "followup_question": string,
  "scores": { "relevance": number, "completeness": number, "technical_depth": number, "clarity": number },
  "missed_points": string[],
  "model_suggestion": string
}`;

      const res = await groqJson(systemPrompt, `CANDIDATE ANSWERS:\n${historyText}`, { temperature: 0.3 });
      return jsonResponse(res);
    }

    return errorResponse("Invalid action parameter", 400);
  } catch (err) {
    console.error("[skill-test] Error:", err);
    return errorResponse((err as Error).message);
  }
});

