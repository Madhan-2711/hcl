/**
 * api.js — Frontend API client
 *
 * All LLM/AI-heavy operations call Supabase Edge Functions with direct client-side
 * Groq LLM + dynamic Supabase catalog synchronization and web course search fallback.
 */
import { supabase } from './supabaseClient.js';
import { groqJson, groqChat } from './groqClient.js';
import { extractTextFromFile, parseResumeText, normalizeSkillName, inferCareerGoal } from './resumeParser.js';
import { assessmentService } from './assessmentService.js';
import { searchWebCourses } from './courseSearch.js';

/** Invoke a Supabase Edge Function and return the data, or throw on error. */
async function invokeFunction(name, body = null) {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body ?? undefined,
  });
  if (error) {
    let msg = error.message;
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error) msg = parsed.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data;
}

export const api = {
  /**
   * Parse free-text goal or extracted resume text with intelligent career goal inference,
   * unconstrained skill extraction, and dynamic database catalog synchronization
   */
  parseGoal: async (text, resumeMetadata = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Perform NLP heuristic role inference first
      const heuristicGoal = inferCareerGoal(
        text,
        resumeMetadata?.skills,
        resumeMetadata?.experience,
        resumeMetadata?.projects
      );

      const systemPrompt = `You are an elite technical recruiter and AI curriculum advisor.
Analyze the user's resume, technical portfolio, or career aspirations description.

Your task is to identify their EXACT target career goal/role and extract ALL genuine technical competencies, programming languages, libraries, frameworks, cloud services, databases, architectures, and developer tools mentioned in the text.

Instructions:
1. "goal": A clear, standard job title matching their stated or implied target role (e.g. "Data Analyst", "Data Scientist", "Machine Learning Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Cloud Architect", "AI Engineer", "Mobile Developer", "Security Engineer").
2. "known_skills": An exhaustive array of canonical skill names the candidate explicitly knows, has worked with, or developed projects in.
3. "weak_skills": An array of complementary or advanced skills that would round out their profile for their target career goal.
4. "experience_level": One of "beginner", "intermediate", "advanced".
5. "timeframe_months": Number of months (default 6).

Return ONLY valid JSON matching this schema:
{
  "goal": string,
  "known_skills": string[],
  "weak_skills": string[],
  "experience_level": "beginner" | "intermediate" | "advanced",
  "timeframe_months": number
}`;

      let parsed;
      try {
        parsed = await groqJson(systemPrompt, text.slice(0, 6000), { temperature: 0.1 });
      } catch (err) {
        console.warn('Groq parsing notice, using heuristic fallback:', err);
        parsed = {
          goal: heuristicGoal,
          known_skills: resumeMetadata?.skills || [],
          weak_skills: ['SQL', 'Data Visualization', 'Pandas'],
          experience_level: 'intermediate',
          timeframe_months: 6,
        };
      }

      // Determine final career goal prioritizing user's explicitly stated role
      let resolvedGoal = heuristicGoal;
      if (parsed?.goal && parsed.goal !== 'Software Engineer' && parsed.goal !== 'Engineer') {
        resolvedGoal = parsed.goal;
      } else if (heuristicGoal) {
        resolvedGoal = heuristicGoal;
      }

      // Merge regex heuristic scanned skills with LLM parsed skills
      const rawCombinedKnown = [
        ...(Array.isArray(parsed.known_skills) ? parsed.known_skills : []),
        ...(Array.isArray(resumeMetadata?.skills) ? resumeMetadata.skills : []),
      ].map(normalizeSkillName).filter(Boolean);

      const uniqueKnownSkills = Array.from(new Set(rawCombinedKnown));
      const uniqueWeakSkills = Array.from(new Set((parsed.weak_skills || []).map(normalizeSkillName))).filter(s => !uniqueKnownSkills.includes(s));

      const finalParsed = {
        goal: resolvedGoal || 'Data Analyst',
        known_skills: uniqueKnownSkills.length > 0 ? uniqueKnownSkills : ['SQL', 'Python', 'Problem Solving'],
        weak_skills: uniqueWeakSkills.length > 0 ? uniqueWeakSkills : ['Data Visualization', 'Statistics'],
        experience_level: parsed.experience_level || 'intermediate',
        timeframe_months: parsed.timeframe_months || 6,
        ...(resumeMetadata || {}),
      };

      // Synchronize skills with Supabase database (dynamic skill upsert)
      if (user?.id) {
        try {
          const { data: existingSkills } = await supabase.from('skills').select('id, name');
          const skillMap = {};
          for (const s of existingSkills || []) {
            skillMap[s.name.toLowerCase()] = s.id;
          }

          // Insert any newly discovered skills into `skills` table
          const allSkillsToMap = [...finalParsed.known_skills, ...finalParsed.weak_skills];
          const newSkillsToInsert = [];
          for (const s of allSkillsToMap) {
            if (!skillMap[s.toLowerCase()]) {
              newSkillsToInsert.push({ name: s });
              skillMap[s.toLowerCase()] = true; // placeholder to prevent duplicate inserts
            }
          }

          if (newSkillsToInsert.length > 0) {
            const { data: inserted } = await supabase.from('skills').insert(newSkillsToInsert).select();
            for (const s of inserted || []) {
              skillMap[s.name.toLowerCase()] = s.id;
            }
          }

          // Re-query full skill map
          const { data: refetchedSkills } = await supabase.from('skills').select('id, name');
          const completeSkillMap = {};
          for (const s of refetchedSkills || []) {
            completeSkillMap[s.name.toLowerCase()] = s.id;
          }

          // Update learner_profiles
          await supabase.from('learner_profiles').upsert({
            id: user.id,
            career_goal: finalParsed.goal,
            experience_level: finalParsed.experience_level,
            interests: finalParsed.known_skills,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          // Reset and upsert learner_skills
          await supabase.from('learner_skills').delete().eq('learner_id', user.id);

          for (const s of finalParsed.known_skills) {
            const sid = completeSkillMap[s.toLowerCase()];
            if (sid) {
              await supabase.from('learner_skills').upsert({
                learner_id: user.id,
                skill_id: sid,
                proficiency: 65,
                source: 'inferred',
              }, { onConflict: 'learner_id,skill_id' });
            }
          }

          for (const s of finalParsed.weak_skills) {
            const sid = completeSkillMap[s.toLowerCase()];
            if (sid) {
              await supabase.from('learner_skills').upsert({
                learner_id: user.id,
                skill_id: sid,
                proficiency: 20,
                source: 'inferred',
              }, { onConflict: 'learner_id,skill_id' });
            }
          }
        } catch (dbErr) {
          console.warn('Supabase DB skill sync warning:', dbErr);
        }
      }

      return { parsed: finalParsed, profile_updated: true };
    } catch (err) {
      console.error('api.parseGoal error:', err);
      throw err;
    }
  },

  /**
   * Parse uploaded resume file (.pdf, .docx, .txt) with comprehensive text extraction
   */
  parseResumeFile: async (file) => {
    const rawText = await extractTextFromFile(file);
    if (!rawText || rawText.trim().length < 20) {
      throw new Error('Could not extract text from the file. Please ensure the document contains selectable text.');
    }
    const structuredResume = parseResumeText(rawText);
    const result = await api.parseGoal(rawText, structuredResume);
    return {
      ...result,
      structuredResume,
      rawText,
    };
  },

  /** Get AI course recommendations (pgvector + skill-gap scoring) */
  getRecommendations: (top_k = 5) => invokeFunction('get-recommendations', { top_k }),

  /**
   * Generate and store a personalised learning path tailored to the user's specific career goal and track.
   * If relevant courses are missing in Supabase, searches and returns curated web courses!
   */
  generatePath: async (opts = {}) => {
    try {
      return await invokeFunction('generate-path', { max_length: 10, proficiency_threshold: 70, ...opts });
    } catch (err) {
      console.warn('[api.generatePath] Dynamic curriculum synthesis with web courses:', err);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('learner_profiles').select('*').eq('id', user.id).maybeSingle();
      const { data: dbCourses } = await supabase.from('courses').select('*');
      
      const goal = profile?.career_goal || 'Data Analyst';
      const gLower = goal.toLowerCase();
      
      // Determine preferred track for the career goal
      let preferredTrack = 'data_scientist';
      if (gLower.includes('analyst') || gLower.includes('analytics') || gLower.includes('data science') || gLower.includes('statistic')) {
        preferredTrack = 'data_scientist';
      } else if (gLower.includes('machine learning') || gLower.includes('ml') || gLower.includes('ai') || gLower.includes('deep learning')) {
        preferredTrack = 'ml_engineer';
      } else if (gLower.includes('frontend') || gLower.includes('react') || gLower.includes('web') || gLower.includes('ui')) {
        preferredTrack = 'frontend';
      } else if (gLower.includes('backend') || gLower.includes('node') || gLower.includes('api') || gLower.includes('server') || gLower.includes('database')) {
        preferredTrack = 'backend';
      }

      // Search curated web courses for topics missing from local database
      const allCourses = [...(dbCourses || [])];
      const webCourses = searchWebCourses(goal, profile?.interests || [], 4);

      for (const wc of webCourses) {
        const exists = allCourses.some(c => c.title.toLowerCase() === wc.title.toLowerCase());
        if (!exists) {
          try {
            const { data: insertedCourse } = await supabase.from('courses').insert({
              title: wc.title,
              description: wc.description,
              difficulty: wc.difficulty,
              duration_hours: wc.duration_hours,
              track: wc.track,
              url: wc.url,
            }).select().maybeSingle();

            if (insertedCourse) {
              allCourses.push(insertedCourse);
            } else {
              allCourses.push({ id: `web_${Math.random()}`, ...wc });
            }
          } catch (insertErr) {
            allCourses.push({ id: `web_${Math.random()}`, ...wc });
          }
        }
      }

      // Filter and sort courses matching track or keyword
      const trackCourses = allCourses.filter(c => c.track === preferredTrack);
      const otherCourses = allCourses.filter(c => c.track !== preferredTrack);
      const sortedCourses = [...trackCourses, ...otherCourses].slice(0, 8);

      const { data: pathRecord, error: pathErr } = await supabase
        .from('learning_paths')
        .insert({ learner_id: user.id, goal_text: goal })
        .select()
        .single();
      
      if (pathErr) throw pathErr;

      const items = sortedCourses.map((c, i) => ({
        path_id: pathRecord.id,
        course_id: typeof c.id === 'number' ? c.id : null,
        order_index: i,
        status: 'not_started',
        milestone_label: i === 0 ? 'Foundations' : i < 3 ? 'Core Skills' : i < 6 ? 'Intermediate Mastery' : 'Capstone',
        explanation: `Recommended to master essential competencies in ${c.title} for ${goal}.${c.url ? ' Includes direct web course link.' : ''}`,
        similarity_score: c.track === preferredTrack ? 0.95 : 0.70,
        gap_score: 0.80,
        final_score: c.track === preferredTrack ? 0.90 : 0.72,
      }));

      await supabase.from('path_items').insert(items);
      return { path: { ...pathRecord, items } };
    }
  },

  /** Fetch a specific learning path with items */
  getPath: async (pathId) => {
    const [{ data: path, error: pathErr }, { data: allCourses }, { data: items, error: itemsErr }] = await Promise.all([
      supabase.from('learning_paths').select('*').eq('id', pathId).maybeSingle(),
      supabase.from('courses').select('*'),
      supabase.from('path_items').select('*, courses(*)').eq('path_id', pathId).order('order_index'),
    ]);
    if (pathErr) throw new Error(pathErr.message);
    if (itemsErr) throw new Error(itemsErr.message);

    const courseMap = {};
    for (const c of allCourses || []) {
      courseMap[c.id] = c;
    }

    return {
      ...path,
      items: (items ?? []).map((item) => {
        const nestedCourse = Array.isArray(item.courses) ? item.courses[0] : item.courses;
        const course = nestedCourse || courseMap[item.course_id] || {};
        return { ...item, course };
      }),
    };
  },

  /** Update status of a path item */
  updateItemStatus: async (pathId, itemId, status) => {
    const { error } = await supabase
      .from('path_items')
      .update({ status })
      .eq('id', itemId)
      .eq('path_id', pathId);
    if (error) throw new Error(error.message);
    return { updated: true, status };
  },

  /** Remove a path item from learning path */
  removePathItem: async (itemId) => {
    const { error } = await supabase
      .from('path_items')
      .delete()
      .eq('id', itemId);
    if (error) throw new Error(error.message);
    return { deleted: true };
  },

  /** Generate explanation for a path item */
  explain: (path_item_id) => invokeFunction('explain-path-item', { path_item_id }),

  /** Ask the AI assistant a question */
  ask: (question) => invokeFunction('ask-assistant', { question }),

  /** Get learner profile */
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('learner_profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Get learner skills */
  getSkills: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('learner_skills').select('*, skills(name)').eq('learner_id', user.id);
    if (error) throw new Error(error.message);
    return data;
  },

  // ─── MCQ Assessment API Methods ───────────────────────────────────────────

  generateMCQQuestions: assessmentService.generateMCQQuestions,
  evaluateMCQSession: assessmentService.evaluateMCQSession,
  getAssessmentReport: assessmentService.getReport,
  listAssessmentHistory: assessmentService.listHistory,
};
