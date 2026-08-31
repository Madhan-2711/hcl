-- ============================================================
-- Additional CS Skills and Courses
-- Run in Supabase SQL Editor
-- ============================================================

insert into skills (name) values
  ('Data Structures'),
  ('Algorithms'),
  ('Operating Systems'),
  ('Computer Networks'),
  ('Database Systems'),
  ('Cybersecurity'),
  ('DevOps'),
  ('System Architecture')
on conflict (name) do nothing;

-- ---- CS CORE TRACK ----
insert into courses (title, description, difficulty, duration_hours, track) values

('Introduction to Data Structures',
 'Learn arrays, linked lists, stacks, queues, hash tables, and trees. Essential for technical interviews and efficient programming.',
 'beginner', 15, 'cs_core'),

('Advanced Algorithms',
 'Graph algorithms, dynamic programming, greedy algorithms, and string matching. Analyze time and space complexity using Big O notation.',
 'intermediate', 20, 'cs_core'),

('Operating Systems Fundamentals',
 'Processes, threads, scheduling, memory management, virtual memory, and file systems. Understand how software interacts with hardware.',
 'intermediate', 18, 'cs_core'),

('Computer Networks and Protocols',
 'OSI model, TCP/IP suite, DNS, HTTP/S, routing, switching, and socket programming. Build a foundational understanding of the internet.',
 'intermediate', 16, 'cs_core'),

('Database Systems Architecture',
 'Internal workings of DBMS, B-Trees, transaction management, ACID properties, concurrency control, and crash recovery.',
 'advanced', 22, 'cs_core'),

-- ---- CYBERSECURITY TRACK ----
('Cybersecurity Principles',
 'Confidentiality, Integrity, Availability (CIA) triad. Threat modeling, cryptography basics, and network security fundamentals.',
 'beginner', 14, 'cybersecurity'),

('Ethical Hacking and Penetration Testing',
 'Vulnerability scanning, exploitation, post-exploitation, and reporting. Learn to secure systems by understanding how they are attacked.',
 'intermediate', 25, 'cybersecurity'),

('Web Application Security',
 'Deep dive into OWASP Top 10: XSS, CSRF, SQL Injection, SSRF, and authentication bypass. Secure coding practices and secure architecture.',
 'advanced', 20, 'cybersecurity');

-- === Data Structures ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Introduction to Data Structures'),
   (select id from skills where name='Data Structures'), false)
on conflict do nothing;

-- === Algorithms ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Advanced Algorithms'),
   (select id from skills where name='Data Structures'), true),
  ((select id from courses where title='Advanced Algorithms'),
   (select id from skills where name='Algorithms'), false)
on conflict do nothing;

-- === OS ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Operating Systems Fundamentals'),
   (select id from skills where name='Operating Systems'), false)
on conflict do nothing;

-- === Networks ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Computer Networks and Protocols'),
   (select id from skills where name='Computer Networks'), false)
on conflict do nothing;

-- === Cyber Security ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Cybersecurity Principles'),
   (select id from skills where name='Cybersecurity'), false),
  ((select id from courses where title='Ethical Hacking and Penetration Testing'),
   (select id from skills where name='Computer Networks'), true),
  ((select id from courses where title='Ethical Hacking and Penetration Testing'),
   (select id from skills where name='Operating Systems'), true),
  ((select id from courses where title='Ethical Hacking and Penetration Testing'),
   (select id from skills where name='Cybersecurity'), false)
on conflict do nothing;
