/**
 * assessmentService.js — Interactive AI MCQ Skill Assessment & Evaluation Engine
 */
import { groqJson } from './groqClient.js';
import { supabase } from './supabaseClient.js';
import { getUniqueBankQuestions } from './questionBank.js';

const STORAGE_PREFIX = 'learnai_mcq_assessment_';

export const assessmentService = {
  /**
   * Generate technical Multiple Choice Questions (MCQ) based on extracted skills & goal
   */
  generateMCQQuestions: async (profile, numQuestions = 5) => {
    const skillsList = Array.isArray(profile.skills)
      ? profile.skills
      : profile.known_skills || ['SQL', 'Python', 'Data Visualization'];

    const skills = skillsList.slice(0, 12).join(', ');
    const goal = profile.goal || profile.career_goal || 'Data Analyst';
    const experience = profile.experience_level || 'intermediate';

    const systemPrompt = `You are a distinguished technical lead and skill assessment creator.
Generate exactly ${numQuestions} completely unique, practical, and distinct Multiple Choice Questions (MCQ) specifically testing the candidate's declared competencies (${skills}) and target career role (${goal}).

Crucial Rules:
1. Every single question must be unique and test a DIFFERENT concept/skill from: ${skills}.
2. DO NOT repeat question formats or option structures.
3. Randomize the correct answer index across 0 (A), 1 (B), 2 (C), and 3 (D) across different questions.
4. Provide exactly 4 realistic, distinct options per question. Exactly ONE option must be correct.
5. "correct_option_index" must be an integer from 0 to 3.
6. "explanation": Provide a 2-3 sentence technical explanation explaining why the correct answer is right.
7. "difficulty": One of "beginner", "intermediate", "advanced".

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": 1,
      "order_num": 1,
      "skill_focus": "Skill Name (e.g. SQL, Pandas, Tableau, Python, React, etc.)",
      "difficulty": "intermediate",
      "question_text": "Clear, authentic technical question or practical code/data scenario...",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correct_option_index": 0,
      "explanation": "Detailed rationale explaining the correct answer."
    }
  ]
}`;

    const userPrompt = `TARGET ROLE: ${goal}
LEVEL: ${experience}
SKILLS TO TEST: ${skills}
SEED: ${Date.now()}

Generate ${numQuestions} diverse, non-repeating technical MCQs.`;

    try {
      const res = await groqJson(systemPrompt, userPrompt, { temperature: 0.7 });
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res.questions)) {
        list = res.questions;
      } else if (typeof res === 'object') {
        const firstArr = Object.values(res).find(v => Array.isArray(v));
        list = firstArr || [];
      }

      if (!list.length) {
        throw new Error('Groq returned empty question array');
      }

      const formatted = list.slice(0, numQuestions).map((q, idx) => ({
        id: q.id || idx + 1,
        order_num: idx + 1,
        skill_focus: q.skill_focus || skillsList[idx % skillsList.length] || 'Core Skill',
        difficulty: q.difficulty || 'intermediate',
        question_text: q.question_text || q.text || 'What is the optimal approach for this scenario?',
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : [
              'Use indexed range queries with composite keys',
              'Perform a sequential unindexed scan',
              'Disable connection caching',
              'Recompute state on every request'
            ],
        correct_option_index: typeof q.correct_option_index === 'number' && q.correct_option_index >= 0 && q.correct_option_index < 4
          ? q.correct_option_index
          : idx % 4,
        explanation: q.explanation || 'This strategy optimizes performance by minimizing I/O overhead.',
      }));

      return formatted;
    } catch (err) {
      console.warn('Using authentic domain question bank:', err);
      // Retrieve unique, high-yield, hand-crafted MCQs for this role & skill set
      return getUniqueBankQuestions(skillsList, goal, numQuestions);
    }
  },

  /**
   * Evaluate completed MCQ session, calculate scores, and update Supabase learner_skills
   */
  evaluateMCQSession: async ({ sessionId, userId, goal, questions, userAnswers }) => {
    let correctCount = 0;
    const evaluatedQuestions = [];
    const skillStats = {};

    questions.forEach((q, idx) => {
      const selectedIndex = userAnswers[idx] !== undefined ? userAnswers[idx] : -1;
      const isCorrect = selectedIndex === q.correct_option_index;

      if (isCorrect) correctCount++;

      const skill = q.skill_focus || 'General';
      if (!skillStats[skill]) {
        skillStats[skill] = { total: 0, correct: 0 };
      }
      skillStats[skill].total++;
      if (isCorrect) skillStats[skill].correct++;

      evaluatedQuestions.push({
        id: q.id,
        order_num: q.order_num,
        skill_focus: q.skill_focus,
        difficulty: q.difficulty,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        user_selected_index: selectedIndex,
        is_correct: isCorrect,
        explanation: q.explanation,
      });
    });

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const overallTechnical = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10 * 10) / 10 : 0;
    const overallCommunication = Math.min(Math.round((overallTechnical + 1.2) * 10) / 10, 10);

    const report = {
      sessionId: sessionId || `mcq_${Date.now()}`,
      userId,
      goal: goal || 'Data Analyst',
      created_at: new Date().toISOString(),
      questions_answered: Object.keys(userAnswers).length,
      total_questions: totalQuestions,
      correct_count: correctCount,
      score_percentage: scorePercentage,
      overall_technical: overallTechnical,
      overall_communication: overallCommunication,
      proficiency_percentage: scorePercentage,
      skill_stats: Object.entries(skillStats).map(([name, data]) => ({
        skill: name,
        total: data.total,
        correct: data.correct,
        accuracy: Math.round((data.correct / data.total) * 100),
      })),
      questions: evaluatedQuestions,
    };

    // Save to LocalStorage
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${report.sessionId}`, JSON.stringify(report));
      const historyRaw = localStorage.getItem(`${STORAGE_PREFIX}history`) || '[]';
      const history = JSON.parse(historyRaw);
      history.unshift({
        sessionId: report.sessionId,
        goal: report.goal,
        created_at: report.created_at,
        correct_count: correctCount,
        total_questions: totalQuestions,
        score_percentage: scorePercentage,
        overall_technical: overallTechnical,
        proficiency_percentage: scorePercentage,
      });
      localStorage.setItem(`${STORAGE_PREFIX}history`, JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    // Synchronize assessed proficiency directly into Supabase learner_skills
    if (userId) {
      try {
        const { data: allSkills } = await supabase.from('skills').select('id, name');
        const skillMap = {};
        for (const s of allSkills || []) {
          skillMap[s.name.toLowerCase()] = s.id;
        }

        for (const stat of report.skill_stats) {
          const sid = skillMap[stat.skill.toLowerCase()];
          if (sid) {
            // If answered correctly, set 85%+ proficiency; if incorrect, set to 35% to prioritize in path
            const assessedProficiency = stat.accuracy >= 50 ? Math.max(stat.accuracy, 80) : 35;
            await supabase.from('learner_skills').upsert({
              learner_id: userId,
              skill_id: sid,
              proficiency: assessedProficiency,
              source: 'assessed',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'learner_id,skill_id' });
          }
        }
      } catch (dbErr) {
        console.warn('Could not sync assessed skills to Supabase:', dbErr);
      }
    }

    return report;
  },

  /**
   * Fetch an assessment report by session ID
   */
  getReport: async (sessionId) => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return null;
  },

  /**
   * List past MCQ assessment history
   */
  listHistory: () => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}history`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
