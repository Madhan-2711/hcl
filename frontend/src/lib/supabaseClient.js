import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env)
  ? process.env
  : {}

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://mielerarasvclffzkoda.supabase.co'
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZWxlcmFyYXN2Y2xmZnprb2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTY0NjAsImV4cCI6MjEwMzM3MjQ2MH0.BjZkv_1OkatSjMtS6Jce3gQUXx6a6tRSlopyse1kOd4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
