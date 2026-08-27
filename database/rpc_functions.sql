-- ============================================================
-- Supabase RPC: search_courses_by_embedding
-- Call this from the FastAPI backend for pgvector similarity search
-- Apply this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

create or replace function search_courses_by_embedding(
  query_embedding vector(384),
  match_count int default 20
)
returns table (
  id int,
  title text,
  description text,
  difficulty text,
  duration_hours int,
  track text,
  url text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.title,
    c.description,
    c.difficulty,
    c.duration_hours,
    c.track,
    c.url,
    1 - (c.embedding <=> query_embedding) as similarity
  from courses c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Grant execution to authenticated users
grant execute on function search_courses_by_embedding(vector, int) to authenticated;
grant execute on function search_courses_by_embedding(vector, int) to service_role;
