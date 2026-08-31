-- ============================================================
-- Skill verification quizzes
-- Lets learner_skills.source actually reach 'assessed' (previously only
-- 'inferred' was ever written, from LLM goal-parsing guesses).
-- ============================================================
create table if not exists quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid references auth.users(id) on delete cascade,
  skill_id    int references skills(id) on delete cascade,
  questions   jsonb not null,       -- generated MCQs incl. correct_index (server-side only)
  score_pct   int,
  passed      boolean,
  created_at  timestamptz default now()
);

alter table quiz_attempts enable row level security;
drop policy if exists "own quiz attempts" on quiz_attempts;
create policy "own quiz attempts" on quiz_attempts
  for all using (auth.uid() = learner_id);

create index if not exists idx_quiz_attempts_learner on quiz_attempts(learner_id);
