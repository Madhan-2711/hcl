/**
 * generate-quiz/index.ts — Supabase Edge Function
 *
 * Generates a 3-question multiple-choice quiz for a given skill via Groq,
 * stores the questions (with correct answers) server-side in quiz_attempts,
 * and returns only the question text/options to the client — the answer key
 * never leaves the server until after grading.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqJson } from "../_shared/groq.ts";

function quizSystemPrompt(skillName: string): string {
  return `You are an expert technical assessor. Generate exactly 3 multiple-choice questions that test whether someone genuinely has practical, working knowledge of "${skillName}" (not trivia).
Return ONLY valid JSON matching this schema:
{
  "questions": [
    { "question": string, "options": [string, string, string, string], "correct_index": number }
  ]
}
Each question must have exactly 4 options. correct_index is the 0-based index of the correct option.`;
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

    const { skill_id } = await req.json();
    if (!skill_id) return errorResponse("skill_id is required", 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: skill } = await admin.from("skills").select("id, name").eq("id", skill_id).maybeSingle();
    if (!skill) return errorResponse("Skill not found", 404);

    const parsed = await groqJson(quizSystemPrompt(skill.name), `Generate the quiz for: ${skill.name}`, {
      temperature: 0.5,
    });

    const questions = Array.isArray((parsed as any).questions) ? (parsed as any).questions.slice(0, 3) : [];
    const valid = questions.length === 3 && questions.every(
      (q: any) => q?.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correct_index === "number"
    );
    if (!valid) return errorResponse("Could not generate a valid quiz, please retry", 502);

    const { data: attempt, error: insertErr } = await admin
      .from("quiz_attempts")
      .insert({ learner_id: user.id, skill_id, questions })
      .select()
      .single();
    if (insertErr || !attempt) return errorResponse(insertErr?.message || "Failed to create quiz attempt", 500);

    const clientQuestions = questions.map((q: any, i: number) => ({
      id: i,
      question: q.question,
      options: q.options,
    }));

    return jsonResponse({ attempt_id: attempt.id, skill: skill.name, questions: clientQuestions });
  } catch (err) {
    console.error("[generate-quiz] Error:", err);
    return errorResponse((err as Error).message);
  }
});
