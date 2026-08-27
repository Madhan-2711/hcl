/**
 * ask-assistant/index.ts — Supabase Edge Function
 * Replaces: POST /assistant/ask
 *
 * Conversational AI assistant scoped to the learner's own profile/path.
 * READ-ONLY for profile/path data; WRITES only to chat_history.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqChat } from "../_shared/groq.ts";

const ASK_SYSTEM_BASE = `You are a personalised learning assistant. You help learners understand their learning path,
courses, and skill gaps. You have access to the learner's goal, skills, and current path.
IMPORTANT RULES:
- Only discuss topics directly related to the learner's learning path, profile, courses, or career goal.
- Do NOT act as a general tutor or solve homework problems.
- Be concise, supportive, and actionable.
- If the user asks about something outside their learning plan, politely redirect them.`;

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

    const { question } = await req.json();
    if (!question || question.length < 3) return errorResponse("Question too short", 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch learner profile
    const { data: profile } = await admin
      .from("learner_profiles").select("*").eq("id", user.id).maybeSingle();

    // Fetch skills
    const { data: skillRows } = await admin
      .from("learner_skills")
      .select("proficiency, skills(name)")
      .eq("learner_id", user.id);

    const skillSummary = (skillRows ?? [])
      .filter((r: any) => r.skills)
      .map((r: any) => `${r.skills.name}(${r.proficiency}%)`)
      .join(", ");

    // Fetch latest learning path
    const { data: paths } = await admin
      .from("learning_paths")
      .select("id, goal_text")
      .eq("learner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let pathSummary = "No path generated yet";
    if (paths?.length) {
      const { data: items } = await admin
        .from("path_items")
        .select("status, courses(title)")
        .eq("path_id", paths[0].id)
        .order("order_index");

      const itemsText = (items ?? [])
        .filter((i: any) => i.courses)
        .map((i: any) => `${i.courses.title} [${i.status}]`)
        .join(" → ");
      pathSummary = `Current path: ${itemsText}`;
    }

    // Fetch last 6 chat messages
    const { data: historyRows } = await admin
      .from("chat_history")
      .select("role, content")
      .eq("learner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    const history = [...(historyRows ?? [])].reverse().map((r: any) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    const systemPrompt = `${ASK_SYSTEM_BASE}\n\nLearner Context:\n- Career Goal: ${profile?.career_goal ?? "Not set"}\n- Experience Level: ${profile?.experience_level ?? "Not set"}\n- Skills: ${skillSummary || "None recorded"}\n- ${pathSummary}`;

    const answer = await groqChat(
      [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: question },
      ],
      { temperature: 0.5, maxTokens: 512 }
    );

    // Store in chat_history
    await admin.from("chat_history").insert([
      { learner_id: user.id, role: "user", content: question },
      { learner_id: user.id, role: "assistant", content: answer },
    ]);

    return jsonResponse({ answer, question });
  } catch (err) {
    console.error("[ask-assistant] Error:", err);
    return errorResponse((err as Error).message);
  }
});
