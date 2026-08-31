-- ============================================================
-- Massive Expansion of Skills and Courses
-- ============================================================

insert into skills (name) values
  ('Docker'),
  ('Kubernetes'),
  ('CI/CD'),
  ('Terraform'),
  ('AWS'),
  ('GCP'),
  ('Azure'),
  ('Unity'),
  ('C#'),
  ('Unreal Engine'),
  ('C++'),
  ('3D Modeling'),
  ('Game Design'),
  ('Swift'),
  ('iOS Development'),
  ('Kotlin'),
  ('Android Development'),
  ('React Native'),
  ('Flutter'),
  ('Blockchain'),
  ('Solidity'),
  ('Smart Contracts'),
  ('Cryptography'),
  ('Web3'),
  ('Figma'),
  ('User Research'),
  ('Wireframing'),
  ('Prototyping'),
  ('Accessibility'),
  ('Automated Testing'),
  ('Selenium'),
  ('Cypress'),
  ('Jest'),
  ('QA Methodologies'),
  ('Rust'),
  ('Go'),
  ('Microservices'),
  ('GraphQL'),
  ('WebSockets'),
  ('Serverless')
on conflict (name) do nothing;

insert into courses (title, description, difficulty, duration_hours, track) values
('Containerization with Docker', 'Learn how to package, distribute, and run applications in isolated environments using Docker.', 'beginner', 12, 'devops'),
('Kubernetes Orchestration', 'Master container orchestration, scaling, pods, deployments, and services with K8s.', 'advanced', 24, 'devops'),
('Infrastructure as Code', 'Use Terraform to provision cloud infrastructure automatically and manage state.', 'intermediate', 16, 'devops'),
('Continuous Integration/Deployment', 'Build robust CI/CD pipelines using GitHub Actions, GitLab CI, and Jenkins.', 'intermediate', 14, 'devops'),
('Introduction to Game Dev with Unity', 'Build your first 2D and 3D games using Unity and C#.', 'beginner', 20, 'game_dev'),
('Unreal Engine Fundamentals', 'Learn Blueprints, material editors, and C++ for high-fidelity game development.', 'intermediate', 25, 'game_dev'),
('Game Design Principles', 'Level design, player psychology, progression systems, and game loops.', 'beginner', 10, 'game_dev'),
('iOS App Development with Swift', 'Build native iOS applications using Swift and SwiftUI.', 'intermediate', 22, 'mobile_dev'),
('Android App Development with Kotlin', 'Build native Android apps using Kotlin and Jetpack Compose.', 'intermediate', 22, 'mobile_dev'),
('Cross-Platform with React Native', 'Write once, run on iOS and Android using React and JavaScript.', 'intermediate', 18, 'mobile_dev'),
('Flutter and Dart Mastery', 'Build beautiful, natively compiled applications for mobile from a single codebase.', 'intermediate', 20, 'mobile_dev'),
('Blockchain Fundamentals', 'Understand distributed ledgers, consensus algorithms, and the architecture of Bitcoin and Ethereum.', 'beginner', 12, 'blockchain'),
('Smart Contract Development', 'Write, test, and deploy smart contracts on Ethereum using Solidity and Hardhat.', 'intermediate', 18, 'blockchain'),
('Web3 DApp Development', 'Build decentralized applications connecting React frontends to blockchain backends.', 'advanced', 20, 'blockchain'),
('UI Design with Figma', 'Master Figma for interface design, components, auto-layout, and design systems.', 'beginner', 14, 'ux_ui'),
('UX Research and Psychology', 'Conduct user interviews, usability testing, and apply cognitive psychology to design.', 'beginner', 16, 'ux_ui'),
('Advanced Prototyping', 'Create high-fidelity, interactive prototypes with micro-interactions.', 'intermediate', 12, 'ux_ui'),
('Software Testing Foundations', 'Learn test plans, test cases, bug reporting, and agile testing methodologies.', 'beginner', 10, 'qa_testing'),
('End-to-End Testing with Cypress', 'Write reliable automated UI tests for modern web applications.', 'intermediate', 14, 'qa_testing'),
('Test Automation Frameworks', 'Build scalable testing frameworks using Selenium and Python/Java.', 'advanced', 18, 'qa_testing'),
('High-Performance Systems in Rust', 'Memory safety, concurrency without data races, and building fast backends in Rust.', 'advanced', 25, 'backend_advanced'),
('Concurrent Programming in Go', 'Goroutines, channels, and building scalable microservices in Go.', 'intermediate', 18, 'backend_advanced'),
('GraphQL API Development', 'Design and implement efficient GraphQL APIs to replace legacy REST endpoints.', 'intermediate', 14, 'backend_advanced'),
('Serverless Architecture', 'Build event-driven apps using AWS Lambda, DynamoDB, and API Gateway.', 'intermediate', 16, 'backend_advanced');

-- === Containerization with Docker ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Containerization with Docker'), (select id from skills where name='Docker'), false)
on conflict do nothing;

-- === Kubernetes Orchestration ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Kubernetes Orchestration'), (select id from skills where name='Docker'), true),
  ((select id from courses where title='Kubernetes Orchestration'), (select id from skills where name='Kubernetes'), false)
on conflict do nothing;

-- === Infrastructure as Code ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Infrastructure as Code'), (select id from skills where name='AWS'), true),
  ((select id from courses where title='Infrastructure as Code'), (select id from skills where name='Terraform'), false)
on conflict do nothing;

-- === Continuous Integration/Deployment ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Continuous Integration/Deployment'), (select id from skills where name='Docker'), true),
  ((select id from courses where title='Continuous Integration/Deployment'), (select id from skills where name='Git'), true),
  ((select id from courses where title='Continuous Integration/Deployment'), (select id from skills where name='CI/CD'), false)
on conflict do nothing;

-- === Introduction to Game Dev with Unity ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Introduction to Game Dev with Unity'), (select id from skills where name='Unity'), false),
  ((select id from courses where title='Introduction to Game Dev with Unity'), (select id from skills where name='C#'), false)
on conflict do nothing;

-- === Unreal Engine Fundamentals ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Unreal Engine Fundamentals'), (select id from skills where name='Unreal Engine'), false),
  ((select id from courses where title='Unreal Engine Fundamentals'), (select id from skills where name='C++'), false)
on conflict do nothing;

-- === Game Design Principles ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Game Design Principles'), (select id from skills where name='Game Design'), false)
on conflict do nothing;

-- === iOS App Development with Swift ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='iOS App Development with Swift'), (select id from skills where name='Swift'), false),
  ((select id from courses where title='iOS App Development with Swift'), (select id from skills where name='iOS Development'), false)
on conflict do nothing;

-- === Android App Development with Kotlin ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Android App Development with Kotlin'), (select id from skills where name='Kotlin'), false),
  ((select id from courses where title='Android App Development with Kotlin'), (select id from skills where name='Android Development'), false)
on conflict do nothing;

-- === Cross-Platform with React Native ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Cross-Platform with React Native'), (select id from skills where name='React Native'), false)
on conflict do nothing;

-- === Flutter and Dart Mastery ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Flutter and Dart Mastery'), (select id from skills where name='Flutter'), false)
on conflict do nothing;

-- === Blockchain Fundamentals ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Blockchain Fundamentals'), (select id from skills where name='Blockchain'), false),
  ((select id from courses where title='Blockchain Fundamentals'), (select id from skills where name='Cryptography'), false)
on conflict do nothing;

-- === Smart Contract Development ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Smart Contract Development'), (select id from skills where name='Blockchain'), true),
  ((select id from courses where title='Smart Contract Development'), (select id from skills where name='Solidity'), false),
  ((select id from courses where title='Smart Contract Development'), (select id from skills where name='Smart Contracts'), false)
on conflict do nothing;

-- === Web3 DApp Development ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Web3 DApp Development'), (select id from skills where name='Solidity'), true),
  ((select id from courses where title='Web3 DApp Development'), (select id from skills where name='Web3'), false)
on conflict do nothing;

-- === UI Design with Figma ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='UI Design with Figma'), (select id from skills where name='Figma'), false)
on conflict do nothing;

-- === UX Research and Psychology ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='UX Research and Psychology'), (select id from skills where name='User Research'), false)
on conflict do nothing;

-- === Advanced Prototyping ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Advanced Prototyping'), (select id from skills where name='Figma'), true),
  ((select id from courses where title='Advanced Prototyping'), (select id from skills where name='Prototyping'), false)
on conflict do nothing;

-- === Software Testing Foundations ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Software Testing Foundations'), (select id from skills where name='QA Methodologies'), false)
on conflict do nothing;

-- === End-to-End Testing with Cypress ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='End-to-End Testing with Cypress'), (select id from skills where name='Cypress'), false),
  ((select id from courses where title='End-to-End Testing with Cypress'), (select id from skills where name='Automated Testing'), false)
on conflict do nothing;

-- === Test Automation Frameworks ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Test Automation Frameworks'), (select id from skills where name='Python'), true),
  ((select id from courses where title='Test Automation Frameworks'), (select id from skills where name='Selenium'), false),
  ((select id from courses where title='Test Automation Frameworks'), (select id from skills where name='Automated Testing'), false)
on conflict do nothing;

-- === High-Performance Systems in Rust ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='High-Performance Systems in Rust'), (select id from skills where name='Rust'), false)
on conflict do nothing;

-- === Concurrent Programming in Go ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Concurrent Programming in Go'), (select id from skills where name='Go'), false),
  ((select id from courses where title='Concurrent Programming in Go'), (select id from skills where name='Microservices'), false)
on conflict do nothing;

-- === GraphQL API Development ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='GraphQL API Development'), (select id from skills where name='GraphQL'), false)
on conflict do nothing;

-- === Serverless Architecture ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Serverless Architecture'), (select id from skills where name='Serverless'), false),
  ((select id from courses where title='Serverless Architecture'), (select id from skills where name='AWS'), false)
on conflict do nothing;

