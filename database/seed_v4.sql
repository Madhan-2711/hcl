-- ============================================================
-- Adding missing core web dev skills to the database
-- ============================================================
insert into skills (name) values
  ('JavaScript'),
  ('TypeScript'),
  ('HTML'),
  ('CSS'),
  ('React'),
  ('Next.js'),
  ('Node.js'),
  ('Tailwind CSS'),
  ('Vue.js'),
  ('Angular')
on conflict (name) do nothing;

-- Also let's map them to the original frontend courses in seed.sql that were awkwardly mapping to Data Visualization
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Modern JavaScript and TypeScript'), (select id from skills where name='JavaScript'), false),
  ((select id from courses where title='Modern JavaScript and TypeScript'), (select id from skills where name='TypeScript'), false),
  ((select id from courses where title='React Fundamentals'), (select id from skills where name='React'), false),
  ((select id from courses where title='React Fundamentals'), (select id from skills where name='JavaScript'), true),
  ((select id from courses where title='Building UIs with Tailwind CSS'), (select id from skills where name='CSS'), true),
  ((select id from courses where title='Building UIs with Tailwind CSS'), (select id from skills where name='Tailwind CSS'), false),
  ((select id from courses where title='Full-Stack with Next.js'), (select id from skills where name='React'), true),
  ((select id from courses where title='Full-Stack with Next.js'), (select id from skills where name='Next.js'), false)
on conflict do nothing;
