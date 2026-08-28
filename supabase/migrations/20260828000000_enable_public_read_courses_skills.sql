-- Enable RLS and add public read policies on courses, skills, and course_skills
alter table courses enable row level security;
alter table skills enable row level security;
alter table course_skills enable row level security;

drop policy if exists "public read courses" on courses;
create policy "public read courses" on courses for select using (true);

drop policy if exists "public read skills" on skills;
create policy "public read skills" on skills for select using (true);

drop policy if exists "public read course_skills" on course_skills;
create policy "public read course_skills" on course_skills for select using (true);

grant select on courses to anon, authenticated;
grant select on skills to anon, authenticated;
grant select on course_skills to anon, authenticated;
