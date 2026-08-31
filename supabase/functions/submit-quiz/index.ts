/**
 * submit-quiz/index.ts — Supabase Edge Function
 *
 * Grades a quiz attempt server-side (the client never received correct_index),
 * and on a passing score (>=70%) upserts learner_skills with source='assessed'
 * so verified skills are visibly distinct from LLM-inferred guesses.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const PASS_THRESHOLD = 70;

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

    const { attempt_id, answers } = await req.json();
    if (!attempt_id || !Array.isArray(answers)) {
      return errorResponse("attempt_id and answers are required", 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: attempt, error: attemptErr } = await admin
      .from("quiz_attempts").select("*").eq("id", attempt_id).maybeSingle();
    if (attemptErr || !attempt) return errorResponse("Quiz attempt not found", 404);
    if (attempt.learner_id !== user.id) return errorResponse("Not your quiz attempt", 403);
    if (attempt.score_pct !== null) return errorResponse("Quiz already submitted", 409);

    const questions = attempt.questions as Array<{ correct_index: number }>;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) correct++;
    });
    const scorePct = Math.round((correct / questions.length) * 100);
    const passed = scorePct >= PASS_THRESHOLD;

    await admin.from("quiz_attempts").update({ score_pct: scorePct, passed }).eq("id", attempt_id);

    if (passed) {
      await admin.from("learner_skills").upsert({
        learner_id: user.id,
        skill_id: attempt.skill_id,
        proficiency: Math.max(PASS_THRESHOLD, scorePct),
        source: "assessed",
      }, { onConflict: "learner_id,skill_id" });
    }

    return jsonResponse({
      score_pct: scorePct,
      passed,
      correct_count: correct,
      total: questions.length,
      correct_answers: questions.map((q) => q.correct_index),
    });
  } catch (err) {
    console.error("[submit-quiz] Error:", err);
    return errorResponse((err as Error).message);
  }
});
