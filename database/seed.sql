-- ============================================================
-- AI Learning Platform — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- SKILLS  (15 skills)
-- ============================================================
insert into skills (name) values
  ('Python'),
  ('Statistics'),
  ('NumPy'),
  ('Pandas'),
  ('Machine Learning'),
  ('Deep Learning'),
  ('SQL'),
  ('MLOps'),
  ('Data Visualization'),
  ('Communication'),
  ('Git'),
  ('Cloud Basics'),
  ('Linear Algebra'),
  ('Neural Networks'),
  ('Model Deployment')
on conflict (name) do nothing;

-- ============================================================
-- COURSES  (35 courses across 4 tracks)
-- ============================================================

-- ---- DATA SCIENTIST TRACK ----
insert into courses (title, description, difficulty, duration_hours, track) values

('Python for Data Science',
 'Learn Python fundamentals tailored for data science: variables, control flow, functions, comprehensions, and working with files. Build your first data pipeline from raw CSV to insights.',
 'beginner', 12, 'data_scientist'),

('Statistics Fundamentals for Data Science',
 'Master descriptive statistics, probability distributions, hypothesis testing, confidence intervals, and A/B testing concepts with hands-on Python exercises using SciPy.',
 'beginner', 14, 'data_scientist'),

('SQL for Data Analysis',
 'Write complex SQL queries for data exploration: JOINs, subqueries, window functions, CTEs, and aggregations. Practice on real-world retail and healthcare datasets.',
 'beginner', 10, 'data_scientist'),

('Data Wrangling with Pandas',
 'Transform messy real-world data into analysis-ready DataFrames. Topics: reshaping, merging, time-series, handling missing values, and performance optimization.',
 'intermediate', 16, 'data_scientist'),

('Numerical Computing with NumPy',
 'Build intuition for array operations, broadcasting, linear algebra routines, and vectorised computation. Essential for ML research and scientific computing.',
 'intermediate', 10, 'data_scientist'),

('Data Visualization Mastery',
 'Create compelling, publication-ready visualizations with Matplotlib, Seaborn, and Plotly. Cover chart selection, color theory, storytelling with data, and interactive dashboards.',
 'intermediate', 12, 'data_scientist'),

('Machine Learning Fundamentals',
 'Supervised and unsupervised learning: linear regression, logistic regression, decision trees, SVMs, k-means, and dimensionality reduction. Evaluation metrics and cross-validation best practices.',
 'intermediate', 20, 'data_scientist'),

('Applied Machine Learning Projects',
 'Build five end-to-end ML pipelines: churn prediction, house price forecasting, customer segmentation, sentiment analysis, and anomaly detection. Focus on feature engineering and model selection.',
 'intermediate', 24, 'data_scientist'),

('Statistical Modeling and Inference',
 'Bayesian reasoning, ANOVA, regression diagnostics, time-series forecasting with ARIMA/SARIMA, and causal inference techniques for robust data science conclusions.',
 'advanced', 18, 'data_scientist'),

-- ---- ML ENGINEER TRACK ----
('Linear Algebra for Machine Learning',
 'Vectors, matrices, eigendecomposition, SVD, and geometric intuition behind transformations. The mathematical backbone of every ML model explained with code.',
 'beginner', 12, 'ml_engineer'),

('Deep Learning Foundations',
 'Understand neural networks from scratch: forward/backprop, activation functions, optimizers, regularization, and batch normalization. Build MLPs in pure NumPy, then PyTorch.',
 'intermediate', 22, 'ml_engineer'),

('Convolutional Neural Networks',
 'Image classification, object detection, and transfer learning with CNNs. Implement ResNet, MobileNet, and YOLO. Fine-tune pretrained models for custom datasets.',
 'advanced', 20, 'ml_engineer'),

('Natural Language Processing with Transformers',
 'Tokenization, attention mechanisms, BERT, GPT, and fine-tuning large language models. Build text classifiers, summarizers, and QA systems with Hugging Face.',
 'advanced', 24, 'ml_engineer'),

('MLOps: From Experiment to Production',
 'ML lifecycle management: experiment tracking with MLflow, data versioning with DVC, CI/CD for ML, model registries, and monitoring for model drift in production.',
 'advanced', 20, 'ml_engineer'),

('Model Deployment with FastAPI and Docker',
 'Package ML models as REST APIs using FastAPI. Containerize with Docker, orchestrate with Kubernetes, and deploy to cloud platforms. Includes A/B testing infrastructure.',
 'advanced', 16, 'ml_engineer'),

('Cloud ML Platforms',
 'Train and deploy models on AWS SageMaker, GCP Vertex AI, and Azure ML. Managed pipelines, auto-scaling endpoints, and cost optimization for production workloads.',
 'advanced', 18, 'ml_engineer'),

('Feature Engineering and Selection',
 'Advanced feature creation: target encoding, embeddings, time-series features, interaction terms, and automated feature selection with Boruta and SHAP values.',
 'intermediate', 14, 'ml_engineer'),

('Reinforcement Learning Fundamentals',
 'MDPs, Q-learning, policy gradients, and actor-critic methods. Train agents in OpenAI Gymnasium environments and understand applications in recommendation and robotics.',
 'advanced', 22, 'ml_engineer'),

-- ---- BACKEND DEVELOPER TRACK ----
('Python Backend Development with FastAPI',
 'Build production-grade REST APIs: routing, Pydantic validation, dependency injection, background tasks, WebSockets, and OpenAPI docs. Security best practices included.',
 'intermediate', 18, 'backend'),

('PostgreSQL Deep Dive',
 'Advanced PostgreSQL: indexes, query optimization, EXPLAIN ANALYZE, partitioning, full-text search, JSONB, and stored procedures. Design schemas that scale.',
 'intermediate', 16, 'backend'),

('Database Design and ORM Mastery',
 'Relational data modeling, normalization, SQLAlchemy ORM, Alembic migrations, connection pooling, and async database access patterns for high-throughput APIs.',
 'intermediate', 14, 'backend'),

('Authentication and Security',
 'JWT, OAuth2, session management, HTTPS, input sanitization, SQL injection prevention, rate limiting, and OWASP Top 10 for backend engineers.',
 'intermediate', 12, 'backend'),

('Git and Version Control Workflows',
 'Git internals, branching strategies (GitFlow, trunk-based), rebasing, pull requests, code review best practices, and CI/CD pipeline integration.',
 'beginner', 8, 'backend'),

('Asynchronous Python and Task Queues',
 'async/await, asyncio, concurrent programming patterns, Celery with Redis, and distributed task processing for background jobs in web applications.',
 'advanced', 14, 'backend'),

('Microservices and API Design',
 'RESTful API design principles, versioning, pagination, gRPC, event-driven architecture with Kafka, service mesh, and observability with distributed tracing.',
 'advanced', 20, 'backend'),

('Cloud Infrastructure and DevOps',
 'AWS core services (EC2, S3, RDS, Lambda), Infrastructure as Code with Terraform, Docker Compose for local dev, and GitHub Actions for automated deployments.',
 'intermediate', 18, 'backend'),

('System Design for Scale',
 'Design patterns for scalable systems: caching with Redis, CDNs, load balancing, database sharding, read replicas, CQRS, and event sourcing.',
 'advanced', 22, 'backend'),

-- ---- FRONTEND DEVELOPER TRACK ----
('Modern JavaScript and TypeScript',
 'ES2024 features, closures, prototypes, async/await, TypeScript type system, generics, utility types, and tsconfig best practices for large codebases.',
 'beginner', 14, 'frontend'),

('React Fundamentals',
 'Component thinking, JSX, hooks (useState, useEffect, useContext, custom hooks), lifting state, prop drilling, and the React reconciliation model.',
 'beginner', 16, 'frontend'),

('React Advanced Patterns',
 'Context API, Redux Toolkit, React Query for server state, compound components, render props, portals, lazy loading, and performance profiling with DevTools.',
 'intermediate', 18, 'frontend'),

('Building UIs with Tailwind CSS',
 'Utility-first CSS philosophy, responsive design, dark mode, custom design tokens, component extraction, and integrating Tailwind with shadcn/ui.',
 'beginner', 10, 'frontend'),

('Full-Stack with Next.js',
 'Server-side rendering, static generation, App Router, server actions, API routes, image optimization, and deployment on Vercel. Build a full-stack SaaS app.',
 'intermediate', 22, 'frontend'),

('Web Performance Optimization',
 'Core Web Vitals, code splitting, tree shaking, lazy loading, service workers, caching strategies, and real-user monitoring for production React apps.',
 'advanced', 14, 'frontend'),

('Data Visualization with D3 and Recharts',
 'SVG fundamentals, D3 scales/axes/transitions, Recharts integration with React, building interactive charts, dashboards, and real-time streaming visualizations.',
 'intermediate', 16, 'frontend'),

('Frontend Testing and Quality',
 'Unit testing with Vitest, component testing with Testing Library, end-to-end testing with Playwright, accessibility audits, and CI integration.',
 'intermediate', 12, 'frontend');

-- ============================================================
-- COURSE SKILLS MAPPINGS
-- is_prerequisite = true  → learner needs this skill BEFORE taking the course
-- is_prerequisite = false → course TEACHES this skill
-- ============================================================

-- Helper: we reference skills by name. Get IDs first via subselect.

-- === Python for Data Science ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  -- teaches
  ((select id from courses where title='Python for Data Science'),
   (select id from skills where name='Python'), false),
  ((select id from courses where title='Python for Data Science'),
   (select id from skills where name='Git'), false)
on conflict do nothing;

-- === Statistics Fundamentals ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Statistics Fundamentals for Data Science'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Statistics Fundamentals for Data Science'),
   (select id from skills where name='Statistics'), false)
on conflict do nothing;

-- === SQL for Data Analysis ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='SQL for Data Analysis'),
   (select id from skills where name='SQL'), false)
on conflict do nothing;

-- === Data Wrangling with Pandas ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Data Wrangling with Pandas'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Data Wrangling with Pandas'),
   (select id from skills where name='Pandas'), false),
  ((select id from courses where title='Data Wrangling with Pandas'),
   (select id from skills where name='NumPy'), false)
on conflict do nothing;

-- === Numerical Computing with NumPy ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Numerical Computing with NumPy'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Numerical Computing with NumPy'),
   (select id from skills where name='NumPy'), false),
  ((select id from courses where title='Numerical Computing with NumPy'),
   (select id from skills where name='Linear Algebra'), false)
on conflict do nothing;

-- === Data Visualization Mastery ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Data Visualization Mastery'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Data Visualization Mastery'),
   (select id from skills where name='Pandas'), true),
  ((select id from courses where title='Data Visualization Mastery'),
   (select id from skills where name='Data Visualization'), false),
  ((select id from courses where title='Data Visualization Mastery'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === Machine Learning Fundamentals ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Machine Learning Fundamentals'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Machine Learning Fundamentals'),
   (select id from skills where name='Statistics'), true),
  ((select id from courses where title='Machine Learning Fundamentals'),
   (select id from skills where name='NumPy'), true),
  ((select id from courses where title='Machine Learning Fundamentals'),
   (select id from skills where name='Machine Learning'), false),
  ((select id from courses where title='Machine Learning Fundamentals'),
   (select id from skills where name='Data Visualization'), false)
on conflict do nothing;

-- === Applied Machine Learning Projects ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Applied Machine Learning Projects'),
   (select id from skills where name='Machine Learning'), true),
  ((select id from courses where title='Applied Machine Learning Projects'),
   (select id from skills where name='Pandas'), true),
  ((select id from courses where title='Applied Machine Learning Projects'),
   (select id from skills where name='Machine Learning'), false),
  ((select id from courses where title='Applied Machine Learning Projects'),
   (select id from skills where name='Data Visualization'), false),
  ((select id from courses where title='Applied Machine Learning Projects'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === Statistical Modeling and Inference ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Statistical Modeling and Inference'),
   (select id from skills where name='Statistics'), true),
  ((select id from courses where title='Statistical Modeling and Inference'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Statistical Modeling and Inference'),
   (select id from skills where name='Statistics'), false)
on conflict do nothing;

-- === Linear Algebra for Machine Learning ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Linear Algebra for Machine Learning'),
   (select id from skills where name='Linear Algebra'), false),
  ((select id from courses where title='Linear Algebra for Machine Learning'),
   (select id from skills where name='NumPy'), false)
on conflict do nothing;

-- === Deep Learning Foundations ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Deep Learning Foundations'),
   (select id from skills where name='Machine Learning'), true),
  ((select id from courses where title='Deep Learning Foundations'),
   (select id from skills where name='Linear Algebra'), true),
  ((select id from courses where title='Deep Learning Foundations'),
   (select id from skills where name='NumPy'), true),
  ((select id from courses where title='Deep Learning Foundations'),
   (select id from skills where name='Deep Learning'), false),
  ((select id from courses where title='Deep Learning Foundations'),
   (select id from skills where name='Neural Networks'), false)
on conflict do nothing;

-- === Convolutional Neural Networks ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Convolutional Neural Networks'),
   (select id from skills where name='Deep Learning'), true),
  ((select id from courses where title='Convolutional Neural Networks'),
   (select id from skills where name='Neural Networks'), true),
  ((select id from courses where title='Convolutional Neural Networks'),
   (select id from skills where name='Neural Networks'), false),
  ((select id from courses where title='Convolutional Neural Networks'),
   (select id from skills where name='Deep Learning'), false)
on conflict do nothing;

-- === NLP with Transformers ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Natural Language Processing with Transformers'),
   (select id from skills where name='Deep Learning'), true),
  ((select id from courses where title='Natural Language Processing with Transformers'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Natural Language Processing with Transformers'),
   (select id from skills where name='Deep Learning'), false),
  ((select id from courses where title='Natural Language Processing with Transformers'),
   (select id from skills where name='Neural Networks'), false)
on conflict do nothing;

-- === MLOps ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='MLOps: From Experiment to Production'),
   (select id from skills where name='Machine Learning'), true),
  ((select id from courses where title='MLOps: From Experiment to Production'),
   (select id from skills where name='Git'), true),
  ((select id from courses where title='MLOps: From Experiment to Production'),
   (select id from skills where name='Cloud Basics'), true),
  ((select id from courses where title='MLOps: From Experiment to Production'),
   (select id from skills where name='MLOps'), false),
  ((select id from courses where title='MLOps: From Experiment to Production'),
   (select id from skills where name='Model Deployment'), false)
on conflict do nothing;

-- === Model Deployment with FastAPI ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Model Deployment with FastAPI and Docker'),
   (select id from skills where name='Machine Learning'), true),
  ((select id from courses where title='Model Deployment with FastAPI and Docker'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Model Deployment with FastAPI and Docker'),
   (select id from skills where name='Model Deployment'), false),
  ((select id from courses where title='Model Deployment with FastAPI and Docker'),
   (select id from skills where name='Cloud Basics'), false),
  ((select id from courses where title='Model Deployment with FastAPI and Docker'),
   (select id from skills where name='MLOps'), false)
on conflict do nothing;

-- === Cloud ML Platforms ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Cloud ML Platforms'),
   (select id from skills where name='Cloud Basics'), true),
  ((select id from courses where title='Cloud ML Platforms'),
   (select id from skills where name='MLOps'), true),
  ((select id from courses where title='Cloud ML Platforms'),
   (select id from skills where name='Cloud Basics'), false),
  ((select id from courses where title='Cloud ML Platforms'),
   (select id from skills where name='Model Deployment'), false)
on conflict do nothing;

-- === Feature Engineering ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Feature Engineering and Selection'),
   (select id from skills where name='Machine Learning'), true),
  ((select id from courses where title='Feature Engineering and Selection'),
   (select id from skills where name='Pandas'), true),
  ((select id from courses where title='Feature Engineering and Selection'),
   (select id from skills where name='Machine Learning'), false),
  ((select id from courses where title='Feature Engineering and Selection'),
   (select id from skills where name='Statistics'), false)
on conflict do nothing;

-- === Reinforcement Learning ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Reinforcement Learning Fundamentals'),
   (select id from skills where name='Machine Learning'), true),
  ((select id from courses where title='Reinforcement Learning Fundamentals'),
   (select id from skills where name='Linear Algebra'), true),
  ((select id from courses where title='Reinforcement Learning Fundamentals'),
   (select id from skills where name='Deep Learning'), false),
  ((select id from courses where title='Reinforcement Learning Fundamentals'),
   (select id from skills where name='Neural Networks'), false)
on conflict do nothing;

-- === Python Backend Development ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Python Backend Development with FastAPI'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Python Backend Development with FastAPI'),
   (select id from skills where name='SQL'), true),
  ((select id from courses where title='Python Backend Development with FastAPI'),
   (select id from skills where name='Python'), false),
  ((select id from courses where title='Python Backend Development with FastAPI'),
   (select id from skills where name='Model Deployment'), false)
on conflict do nothing;

-- === PostgreSQL Deep Dive ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='PostgreSQL Deep Dive'),
   (select id from skills where name='SQL'), true),
  ((select id from courses where title='PostgreSQL Deep Dive'),
   (select id from skills where name='SQL'), false)
on conflict do nothing;

-- === Database Design and ORM ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Database Design and ORM Mastery'),
   (select id from skills where name='SQL'), true),
  ((select id from courses where title='Database Design and ORM Mastery'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Database Design and ORM Mastery'),
   (select id from skills where name='SQL'), false)
on conflict do nothing;

-- === Auth and Security ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Authentication and Security'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Authentication and Security'),
   (select id from skills where name='SQL'), true),
  ((select id from courses where title='Authentication and Security'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === Git and Version Control ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Git and Version Control Workflows'),
   (select id from skills where name='Git'), false)
on conflict do nothing;

-- === Async Python ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Asynchronous Python and Task Queues'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Asynchronous Python and Task Queues'),
   (select id from skills where name='Python'), false)
on conflict do nothing;

-- === Microservices ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Microservices and API Design'),
   (select id from skills where name='Python'), true),
  ((select id from courses where title='Microservices and API Design'),
   (select id from skills where name='Cloud Basics'), true),
  ((select id from courses where title='Microservices and API Design'),
   (select id from skills where name='Cloud Basics'), false),
  ((select id from courses where title='Microservices and API Design'),
   (select id from skills where name='Model Deployment'), false)
on conflict do nothing;

-- === Cloud Infrastructure ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Cloud Infrastructure and DevOps'),
   (select id from skills where name='Git'), true),
  ((select id from courses where title='Cloud Infrastructure and DevOps'),
   (select id from skills where name='Cloud Basics'), false),
  ((select id from courses where title='Cloud Infrastructure and DevOps'),
   (select id from skills where name='MLOps'), false)
on conflict do nothing;

-- === System Design ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='System Design for Scale'),
   (select id from skills where name='SQL'), true),
  ((select id from courses where title='System Design for Scale'),
   (select id from skills where name='Cloud Basics'), true),
  ((select id from courses where title='System Design for Scale'),
   (select id from skills where name='Cloud Basics'), false),
  ((select id from courses where title='System Design for Scale'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === Modern JS/TS ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Modern JavaScript and TypeScript'),
   (select id from skills where name='Git'), false),
  ((select id from courses where title='Modern JavaScript and TypeScript'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === React Fundamentals ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='React Fundamentals'),
   (select id from skills where name='Data Visualization'), false)
on conflict do nothing;

-- === React Advanced ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='React Advanced Patterns'),
   (select id from skills where name='Data Visualization'), false)
on conflict do nothing;

-- === Tailwind CSS ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Building UIs with Tailwind CSS'),
   (select id from skills where name='Data Visualization'), false),
  ((select id from courses where title='Building UIs with Tailwind CSS'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === Next.js ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Full-Stack with Next.js'),
   (select id from skills where name='SQL'), true),
  ((select id from courses where title='Full-Stack with Next.js'),
   (select id from skills where name='Data Visualization'), false),
  ((select id from courses where title='Full-Stack with Next.js'),
   (select id from skills where name='Cloud Basics'), false)
on conflict do nothing;

-- === Web Performance ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Web Performance Optimization'),
   (select id from skills where name='Data Visualization'), false),
  ((select id from courses where title='Web Performance Optimization'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;

-- === D3 and Recharts ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Data Visualization with D3 and Recharts'),
   (select id from skills where name='Data Visualization'), false)
on conflict do nothing;

-- === Frontend Testing ===
insert into course_skills (course_id, skill_id, is_prerequisite) values
  ((select id from courses where title='Frontend Testing and Quality'),
   (select id from skills where name='Git'), true),
  ((select id from courses where title='Frontend Testing and Quality'),
   (select id from skills where name='Communication'), false)
on conflict do nothing;
