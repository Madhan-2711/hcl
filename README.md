# LearnAI — AI-Powered Adaptive Learning & Career Path Platform

> **An intelligent, explainable, and multidisciplinary curriculum engine built on Supabase, pgvector, Groq LLMs, and an Organic (Wabi-Sabi) design system.**

---

## 🌟 Overview

**LearnAI** transforms free-text career aspirations, resume uploads, and skill assessments into structured, topological learning paths. Rather than browsing static course catalogs, learners receive dynamic, milestone-based curricula that adapt in real time as they verify skills, complete courses, and adjust their goals across both **Computer Science** and **Non-CS disciplines** (Healthcare, Law, Engineering, Forensics, Psychology, and more).

---

## ✨ Core Capabilities

### 1. 🤖 Conversational & Multidisciplinary Goal Parsing
- Natural language extraction powered by **Groq LLM** (`parse-goal`).
- Supports both Tech and Non-Tech career tracks:
  - **Tech**: Frontend, Backend, Machine Learning, Data Science, DevOps, Cloud.
  - **Non-Tech**: Medicine & Surgery, Corporate & Criminal Law, Civil & Mechanical Engineering, Forensic Science, Psychology, Creator Economy.
- Clean profile extraction mapping goals into canonical skills, experience levels, and estimated timeframes.

### 2. 📄 Resume-Driven Skill Gap Analyzer (`/skill-gap-analyzer`)
- Upload resumes (`.pdf`, `.docx`, `.txt`) parsed client-side using `pdfjs-dist` and `mammoth`.
- Scans candidate qualifications against **100+ industry job profiles** and **4,480+ curated competency mappings** (`role_skills.json`).
- Visualizes **Matched Competencies** vs. **Missing Skill Gaps**, generating tailored curricula with a single click.

### 3. 🎯 Topological Learning Paths & Hybrid Scoring
- Curates courses into pedagogical milestones: **Foundations ➔ Core Skills ➔ Intermediate Mastery ➔ Capstone**.
- **Hybrid Scoring Formula**:
  $$\text{final\_score} = 0.6 \times \text{similarity} + 0.4 \times \text{gap\_score}$$
  - **Similarity**: Track alignment + cosine semantic overlap over deterministic 384-dimensional vector embeddings (`pgvector`).
  - **Gap Score**: Computes the marginal skill gain relative to what the learner currently knows.

### 4. 📝 Interactive MCQ Skill Verification (`generate-quiz` / `submit-quiz`)
- Dynamic 3-question multiple-choice quizzes per skill generated via Groq (`generate-quiz`).
- Server-side grading (`submit-quiz`) recording verification attempts into `quiz_attempts` without exposing answer keys to clients.
- Standalone assessment mode (`/assessment` & `/assessment-report`) for comprehensive skill readiness reports.

### 5. ⚡ Adaptive Progress & Live Path Evolution (`update-progress` & Edit Plan)
- Marking courses completed automatically boosts learner skill proficiencies and server-side re-scores remaining path items.
- **Interactive Edit Plan Mode**: Learners can remove courses or prune path items with instant optimistic UI updates.
- **Multi-Goal Selector**: Save, switch between, and manage multiple career paths simultaneously.

### 6. 💬 Context-Aware AI Learning Guide (`ask-assistant`)
- Private mentorship chat scoped directly to the learner's active target role, verified skills, and roadmap sequence.
- Natural, advice-driven responses stripped of generic robotic formatting.

---

## 🏛️ System Architecture

```
Browser (React 19 + Vite 8 + Tailwind CSS 4 + Recharts)
  │
  ├──► Supabase Auth & PostgreSQL (Row Level Security enabled on all tables)
  │
  └──► Supabase Edge Functions (Deno / TypeScript — Serverless)
         ├── parse-goal             ──► LLM goal & skill profile extraction
         ├── get-recommendations    ──► pgvector semantic search + skill-gap ranking
         ├── generate-path          ──► Greedy topological path generator + AI rationales
         ├── update-progress        ──► Live skill boosting & curriculum re-scoring
         ├── generate-quiz          ──► Dynamic 3-question skill assessment generator
         ├── submit-quiz            ──► Server-side grading & skill verification
         ├── ask-assistant          ──► Contextual LLM chat mentor scoped to roadmap
         └── explain-path-item      ──► Individual milestone pedagogical rationale
```

---

## 📊 Database Schema (PostgreSQL + RLS)

| Table | Purpose | Security / Access |
| :--- | :--- | :--- |
| `learner_profiles` | Career target, experience level, preferences | User RLS |
| `skills` | Canonical catalog of CS & Non-CS skills | Public read |
| `learner_skills` | User skill proficiencies (`self-reported` / `inferred` / `assessed`) | User RLS |
| `courses` | Course catalog with pgvector `embedding(384)` | Public read |
| `course_skills` | Course-to-skill mappings (taught competencies & prerequisites) | Public read |
| `learning_paths` | Saved learner curricula and target goals | User RLS |
| `path_items` | Ordered milestone courses, status, scores, and AI explanations | User RLS |
| `quiz_attempts` | Skill verification quiz questions, user answers, and grades | User RLS |
| `chat_history` | Scoped conversational history with the AI mentor | User RLS |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+`
- Supabase CLI (`npx supabase`)
- Groq API Key

### 2. Database Migration & Seeding
In your [Supabase SQL Editor](https://supabase.com/dashboard):
```sql
-- 1. Run core schema and RLS policies
database/schema.sql

-- 2. Run vector RPC functions
database/rpc_functions.sql

-- 3. Seed skills, courses, and non-CS curricula
database/seed_v4.sql
database/seed_v5.sql
```

### 3. Deploy Supabase Edge Functions
```bash
# Link project
npx supabase link --project-ref <your-project-ref>

# Set Groq API Secret
npx supabase secrets set GROQ_API_KEY=<your-groq-api-key>

# Deploy all 8 serverless functions
npx supabase functions deploy parse-goal
npx supabase functions deploy generate-path
npx supabase functions deploy get-recommendations
npx supabase functions deploy update-progress
npx supabase functions deploy generate-quiz
npx supabase functions deploy submit-quiz
npx supabase functions deploy ask-assistant
npx supabase functions deploy explain-path-item
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Design System: Organic / Natural (Wabi-Sabi)

The platform is designed around organic, paper-like tactile warmth:
- **Palette**: Rice Paper (`#FDFCF8`), Deep Loam (`#2C2C24`), Moss Green (`#5D7052`), Terracotta (`#C18C5D`), Sand (`#E6DCCD`), and Raw Timber (`#DED8CF`).
- **Typography**: **Fraunces** (Warm editorial serif headings) & **Nunito** (Legible, rounded sans-serif body).
- **Physicality**: Tactile paper grain noise layer (`3.5%` opacity), asymmetric floating containers, and soft tinted shadows.

---

## 📁 Repository Structure

```
.
├── database/
│   ├── schema.sql              # Database DDL, RLS policies, & indexes
│   ├── rpc_functions.sql       # pgvector cosine similarity search RPC
│   ├── seed_v4.sql             # Modern Web & Tech course seeds
│   ├── seed_v5.sql             # Medical, Legal, Engineering, Forensics seeds
│   └── generate_non_cs.py      # Non-CS dataset generator
├── supabase/
│   ├── config.toml             # Supabase CLI project configuration
│   └── functions/
│       ├── _shared/            # Groq client, embeddings, scoring, & CORS
│       ├── parse-goal/         # Natural language goal parser
│       ├── generate-path/      # Topological curriculum generator
│       ├── get-recommendations/# Vector similarity + skill-gap recommendation engine
│       ├── update-progress/    # Live skill-boost & rescoring handler
│       ├── generate-quiz/      # 3-question MCQ generator via Groq
│       ├── submit-quiz/        # Server-side quiz evaluation & grading
│       ├── ask-assistant/      # Contextual AI mentor chat
│       └── explain-path-item/  # Individual milestone explainer
└── frontend/
    ├── public/
    │   └── role_skills.json    # 100+ roles and 4,480+ skill benchmarks
    └── src/
        ├── lib/                # supabaseClient.js, api.js, resumeParser.js
        ├── pages/              # Onboarding, Dashboard, PathDetail, SkillGapAnalyzer, Assessment
        └── components/         # MilestoneTimeline, AIAssistantPanel, SkillQuizModal, etc.
```

---

## 👥 Team
**Built by Code Catalyst** — August 2026
