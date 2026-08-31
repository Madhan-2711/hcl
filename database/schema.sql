-- ============================================================
-- AI Learning Platform — Supabase Schema
-- Apply this in the Supabase SQL Editor (run the whole file)
-- ============================================================

-- Enable pgvector for semantic similarity search
create extension if not exists vector;

-- ============================================================
-- LEARNER PROFILES
-- ============================================================
create table if not exists learner_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  career_goal     text,
  experience_level text check (experience_level in ('beginner','intermediate','advanced')),
  interests       text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- SKILLS CATALOGUE  (public read, no RLS)
-- ============================================================
create table if not exists skills (
  id   serial primary key,
  name text unique not null
);

-- ============================================================
-- LEARNER SKILLS  (per-user proficiency, RLS-protected)
-- ============================================================
create table if not exists learner_skills (
  learner_id  uuid references auth.users(id) on delete cascade,
  skill_id    int  references skills(id)     on delete cascade,
  proficiency int  check (proficiency between 0 and 100),
  source      text check (source in ('self-reported','inferred','assessed')),
  updated_at  timestamptz default now(),
  primary key (learner_id, skill_id)
);

-- ============================================================
-- COURSES CATALOGUE  (public read, no RLS)
-- ============================================================
create table if not exists courses (
  id             serial primary key,
  title          text not null,
  description    text,
  difficulty     text check (difficulty in ('beginner','intermediate','advanced')),
  duration_hours int,
  track          text,          -- 'data_scientist' | 'ml_engineer' | 'backend' | 'frontend'
  url            text,          -- optional external URL
  embedding      vector(384)    -- local hashing-trick text embedding (see _shared/embeddings.ts);
                                 -- self-healing backfill: generate-path/get-recommendations compute
                                 -- and persist it on first use if a course row has none yet
);

-- ============================================================
-- COURSE → SKILLS mapping  (public read, no RLS)
-- ============================================================
create table if not exists course_skills (
  course_id       int     references courses(id) on delete cascade,
  skill_id        int     references skills(id)  on delete cascade,
  is_prerequisite boolean default false,
  primary key (course_id, skill_id, is_prerequisite)
);

-- ============================================================
-- LEARNING PATHS  (RLS-protected)
-- ============================================================
create table if not exists learning_paths (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid references auth.users(id) on delete cascade,
  goal_text   text,
  created_at  timestamptz default now()
);

-- ============================================================
-- PATH ITEMS  (ordered courses within a path)
-- ============================================================
create table if not exists path_items (
  id              uuid primary key default gen_random_uuid(),
  path_id         uuid references learning_paths(id) on delete cascade,
  course_id       int  references courses(id),
  order_index     int,
  status          text default 'not_started'
                  check (status in ('not_started','in_progress','completed')),
  milestone_label text,
  explanation     text,
  similarity_score  float,
  gap_score         float,
  final_score       float
);

-- ============================================================
-- CHAT HISTORY  (RLS-protected)
-- ============================================================
create table if not exists chat_history (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid references auth.users(id) on delete cascade,
  role        text check (role in ('user','assistant')),
  content     text,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- learner_profiles
alter table learner_profiles enable row level security;
drop policy if exists "own profile" on learner_profiles;
create policy "own profile" on learner_profiles
  for all using (auth.uid() = id);

-- learner_skills
alter table learner_skills enable row level security;
drop policy if exists "own skills" on learner_skills;
create policy "own skills" on learner_skills
  for all using (auth.uid() = learner_id);

-- learning_paths
alter table learning_paths enable row level security;
drop policy if exists "own paths" on learning_paths;
create policy "own paths" on learning_paths
  for all using (auth.uid() = learner_id);

-- path_items
alter table path_items enable row level security;
drop policy if exists "own path items" on path_items;
create policy "own path items" on path_items
  for all using (
    auth.uid() = (select learner_id from learning_paths where id = path_id)
  );

-- chat_history
alter table chat_history enable row level security;
drop policy if exists "own chat" on chat_history;
create policy "own chat" on chat_history
  for all using (auth.uid() = learner_id);

-- courses, skills, course_skills: public read (no RLS)
-- Grant authenticated users read access
grant select on courses to authenticated;
grant select on skills to authenticated;
grant select on course_skills to authenticated;
grant select on courses to anon;
grant select on skills to anon;
grant select on course_skills to anon;

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_learner_skills_learner    on learner_skills(learner_id);
create index if not exists idx_path_items_path           on path_items(path_id);
create index if not exists idx_path_items_status         on path_items(status);
create index if not exists idx_chat_history_learner_time on chat_history(learner_id, created_at desc);
create index if not exists idx_course_skills_course      on course_skills(course_id);
create index if not exists idx_course_skills_skill       on course_skills(skill_id);

-- pgvector cosine similarity index (HNSW for fast ANN search)
create index if not exists idx_courses_embedding
  on courses using hnsw (embedding vector_cosine_ops);
