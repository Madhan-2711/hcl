/**
 * explain-path-item/index.ts — Supabase Edge Function
 * Replaces: POST /assistant/explain
 *
 * Returns stored explanation for a path item, or generates one live via Groq
 * if none exists, and backfills the path_items.explanation column.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqChat } from "../_shared/groq.ts";

const EXPLAIN_SYSTEM = `You are a learning advisor. In 2-3 sentences, explain to the learner why this course
was recommended, referencing their specific goal, what they already know, and the skills this course teaches.
Be concrete and specific, not generic.`;

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

    const { path_item_id } = await req.json();
    if (!path_item_id) return errorResponse("path_item_id is required", 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch path item with relations
    const { data: item, error: itemErr } = await admin
      .from("path_items")
      .select("*, learning_paths(learner_id, goal_text), courses(title, description)")
      .eq("id", path_item_id)
      .maybeSingle();

    if (itemErr || !item) return errorResponse("Path item not found", 404);

    // Verify ownership
    if (item.learning_paths?.learner_id !== user.id) {
      return errorResponse("Not your path item", 403);
    }

    // Return stored explanation if it exists
    if (item.explanation) {
      return jsonResponse({ explanation: item.explanation, path_item_id });
    }

    // Generate live explanation
    const { data: profile } = await admin
      .from("learner_profiles").select("career_goal").eq("id", user.id).maybeSingle();
    const goal = profile?.career_goal ?? "your career goal";

    const { data: skillRows } = await admin
      .from("learner_skills")
      .select("proficiency, skills(name)")
      .eq("learner_id", user.id);

    const knownSkills = (skillRows ?? [])
      .filter((r: any) => r.skills && r.proficiency >= 50)
      .map((r: any) => r.skills.name);

    const course = item.courses ?? {};
    const userMsg = `Learner's goal: ${goal}
Learner currently knows: ${knownSkills.join(", ") || "nothing listed"}
Course: ${course.title ?? ""}
Similarity score: ${item.similarity_score ?? "N/A"}, Gap score: ${item.gap_score ?? "N/A"}
Write 2-3 sentences explaining why this course was recommended.`;

    const explanation = await groqChat(
      [{ role: "system", content: EXPLAIN_SYSTEM }, { role: "user", content: userMsg }],
      { temperature: 0.4, maxTokens: 200 }
    );

    // Backfill explanation
    await admin.from("path_items").update({ explanation }).eq("id", path_item_id);

    return jsonResponse({ explanation, path_item_id });
  } catch (err) {
    console.error("[explain-path-item] Error:", err);
    return errorResponse((err as Error).message);
  }
});
