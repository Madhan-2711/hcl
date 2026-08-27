/**
 * api.js — Frontend API client
 *
 * All LLM/AI-heavy operations call Supabase Edge Functions via supabase.functions.invoke().
 * Simple CRUD (status updates, profile/skills reads) goes directly to Supabase tables.
 * Auth is handled automatically by the Supabase SDK — no manual JWT management.
 */
import { supabase } from './supabaseClient'

/** Invoke a Supabase Edge Function and return the data, or throw on error. */
async function invokeFunction(name, body = null) {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body ?? undefined,
  })
  if (error) {
    // error.message may be the raw JSON from the edge function error response
    let msg = error.message
    try {
      const parsed = JSON.parse(msg)
      if (parsed?.error) msg = parsed.error
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  return data
}

export const api = {
  /** Parse free-text goal → writes learner_profiles + learner_skills */
  parseGoal: (text) => invokeFunction('parse-goal', { text }),

  /** Get AI course recommendations (pgvector + skill-gap scoring) */
  getRecommendations: (top_k = 5) => invokeFunction('get-recommendations', { top_k }),

  /** Generate and store a personalised learning path */
  generatePath: (opts = {}) =>
    invokeFunction('generate-path', { max_length: 10, proficiency_threshold: 70, ...opts }),

  /** Fetch a specific learning path with items (direct Supabase query) */
  getPath: async (pathId) => {
    const { data: path, error: pathErr } = await supabase
      .from('learning_paths').select('*').eq('id', pathId).maybeSingle()
    if (pathErr) throw new Error(pathErr.message)

    const { data: items, error: itemsErr } = await supabase
      .from('path_items').select('*, courses(*)').eq('path_id', pathId).order('order_index')
    if (itemsErr) throw new Error(itemsErr.message)

    return {
      ...path,
      items: (items ?? []).map((item) => ({ ...item, course: item.courses || null })),
    }
  },

  /** Update status of a path item (not_started | in_progress | completed) */
  updateItemStatus: async (pathId, itemId, status) => {
    const { error } = await supabase
      .from('path_items')
      .update({ status })
      .eq('id', itemId)
      .eq('path_id', pathId)
    if (error) throw new Error(error.message)
    return { updated: true, status }
  },

  /** Generate/return explanation for a path item */
  explain: (path_item_id) => invokeFunction('explain-path-item', { path_item_id }),

  /** Ask the AI assistant a question */
  ask: (question) => invokeFunction('ask-assistant', { question }),

  /** Get learner profile (direct Supabase query) */
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('learner_profiles').select('*').eq('id', user.id).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  /** Get learner skills (direct Supabase query) */
  getSkills: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('learner_skills').select('*, skills(name)').eq('learner_id', user.id)
    if (error) throw new Error(error.message)
    return data
  },
}
