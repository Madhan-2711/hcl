/**
 * ask-assistant/index.ts — Supabase Edge Function
 * Replaces: POST /assistant/ask
 *
 * Natural, human-like chat assistant scoped to learner profile and roadmap.
 * Strips markdown tables, robotic headers, asterisks, and emojis.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { groqChat } from "../_shared/groq.ts";

const ASK_SYSTEM_BASE = `You are a supportive, knowledgeable personal learning advisor chatting directly with a student in a private messaging window.

STRICT CONVERSATIONAL RULES:
1. Tone: Natural, friendly, human, and direct. Talk like an experienced mentor giving clear guidance.
2. FORMATTING RESTRICTIONS:
   - Do NOT use markdown tables or pipe symbols (|).
   - Do NOT use bold asterisks (**) or markdown formatting.
   - Do NOT use hashtags (#) or section titles like "Actionable plan:" or "Next step:".
   - Do NOT use emojis.
   - Do NOT dump long daily checklists unless explicitly asked for a schedule.
3. Response Length: Keep your response concise (2 to 4 natural sentences, max 2 short paragraphs).
4. Context: Directly answer using their career goal, their current skills, and their curriculum path.`;

function cleanResponse(text: string): string {
  return text
    // Strip markdown table rows and divider lines
    .replace(/^\|[^\n]+\|$/gm, "")
    .replace(/\|[-:\s|]+\|/g, "")
    .replace(/\|/g, "")
    // Strip asterisks and bold markers
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    // Strip header prefixes
    .replace(/^#{1,6}\s+/gm, "")
    // Strip emojis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, "")
    // Collapse extra blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

    const { question } = await req.json();
    if (!question || question.trim().length < 2) return errorResponse("Question too short", 400);

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
      .map((r: any) => `${r.skills.name} (${r.proficiency}%)`)
      .join(", ");

    // Fetch latest learning path with course titles
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
        .select("status, order_index, courses(title)")
        .eq("path_id", paths[0].id)
        .order("order_index");

      const itemsText = (items ?? [])
        .filter((i: any) => i.courses)
        .map((i: any) => `${i.courses.title} [Status: ${i.status}]`)
        .join(" -> ");
      pathSummary = `Curriculum Sequence: ${itemsText}`;
    }

    // Fetch last 4 chat messages for natural flow
    const { data: historyRows } = await admin
      .from("chat_history")
      .select("role, content")
      .eq("learner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4);

    const history = [...(historyRows ?? [])].reverse().map((r: any) => ({
      role: r.role as "user" | "assistant",
      content: cleanResponse(r.content),
    }));

    const systemPrompt = `${ASK_SYSTEM_BASE}

Learner Profile & Context:
- Target Career: ${profile?.career_goal ?? "Not set"}
- Experience Level: ${profile?.experience_level ?? "Not set"}
- Current Skills: ${skillSummary || "None recorded"}
- Current Curriculum: ${pathSummary}`;

    const rawAnswer = await groqChat(
      [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: question },
      ],
      { temperature: 0.4, maxTokens: 350 }
    );

    const answer = cleanResponse(rawAnswer);

    // Store cleaned conversation in chat_history
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
