# LearnAI — AI-Powered Personalized Learning Platform

A full-stack AI learning platform featuring an **Organic / Natural (Wabi-sabi)** design system and powered directly by **Supabase Edge Functions** and **Groq LLM**:

- 🤖 **Conversational Goal Parsing**: Extract career goals and skill profiles via Groq LLM.
- 🎯 **Personalized Learning Paths**: Topological curriculum curation using vector similarity + skill-gap scoring.
- 📈 **Adaptive Progress**: Completing a course boosts measured skill proficiency and re-scores the remaining path — recommendations aren't frozen at onboarding time.
- ✅ **Skill Verification Quizzes**: Auto-generated 3-question checks let a skill move from LLM-inferred to `assessed`.
- 📊 **Dynamic Dashboard**: Interactive mastery radar charts (Recharts) and milestone progression.
- 💬 **AI Learning Guide**: Scoped assistant with chat history context.
- 🔐 **Supabase Backend**: Auth, Postgres database, Row Level Security (RLS), and Deno/TypeScript Edge Functions.

---

## 🏛️ Architecture

```
Browser (React 19 + Vite 8 + Tailwind CSS)
  ├── supabase-js (anon key) ──► Supabase Auth & PostgreSQL (RLS)
  └── supabase.functions.invoke() ──► Supabase Edge Functions (Deno / TypeScript)
                                         ├── parse-goal (Groq LLM extraction)
                                         ├── get-recommendations (Vector similarity + skill gap)
                                         ├── generate-path (Topological path builder + explanations)
                                         ├── update-progress (Status update → skill boost → re-score)
                                         ├── generate-quiz / submit-quiz (Skill verification)
                                         ├── ask-assistant (Context-aware chat assistant)
                                         └── explain-path-item (Course recommendation rationale)
```

**Vector similarity, honestly**: courses and goals are embedded locally with a deterministic
hashing-trick text embedding (`supabase/functions/_shared/embeddings.ts`) — bag-of-words +
bigrams projected into a 384-dim vector, L2-normalized, compared by cosine similarity. No
external embedding API, no model download, no added latency or secrets. Vectors are cached
in `courses.embedding` (pgvector) on first use and reused after that.

---

## 🚀 Getting Started

### 1. Database Setup
Execute the SQL files in your [Supabase SQL Editor](https://supabase.com/dashboard):
1. `database/schema.sql` — Schema, RLS policies, vector extension.
2. `database/rpc_functions.sql` — `search_courses_by_embedding` pgvector search function.
3. `database/seed.sql` (+ `seed_v2`–`seed_v5.sql`) — Skills & course catalog.
4. `supabase/migrations/*.sql` in order — adds `quiz_attempts` for skill verification.

### 2. Supabase Edge Functions Setup
Deploy the Edge Functions to your Supabase project:
```bash
# Link project
npx supabase link --project-ref <your-project-ref>

# Set Groq API key secret
npx supabase secrets set GROQ_API_KEY=<your-groq-api-key>

# Deploy functions
npx supabase functions deploy parse-goal
npx supabase functions deploy get-recommendations
npx supabase functions deploy generate-path
npx supabase functions deploy update-progress
npx supabase functions deploy generate-quiz
npx supabase functions deploy submit-quiz
npx supabase functions deploy ask-assistant
npx supabase functions deploy explain-path-item
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file in `frontend/`:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Design System

Built on an **Organic / Natural (Wabi-sabi)** philosophy:
- **Palette**: Rice Paper (`#FDFCF8`), Deep Loam (`#2C2C24`), Moss Green (`#5D7052`), Terracotta (`#C18C5D`), Sand (`#E6DCCD`), and Raw Timber (`#DED8CF`).
- **Typography**: **Fraunces** for serif headings & **Nunito** for rounded body typography.
- **Texture**: Subtle fixed paper grain noise layer (`3.5%` opacity, `multiply` blend mode).
- **Shapes**: Floating pill navbar, tactile asymmetric card containers, and soft tinted shadows.

---

## 📂 Project Structure

```
.
├── database/
│   ├── schema.sql          # Tables, RLS, indexes
│   ├── rpc_functions.sql   # pgvector cosine similarity RPC
│   └── seed.sql            # Course & skill seeds
├── supabase/
│   ├── config.toml         # Supabase CLI config
│   ├── migrations/         # RLS + quiz_attempts schema migrations
│   └── functions/
│       ├── _shared/        # Groq client, embeddings, scoring, skillGap logic, CORS headers
│       ├── parse-goal/     # Goal parsing function
│       ├── get-recommendations/
│       ├── generate-path/  # Topological curriculum builder
│       ├── update-progress/ # Status update → skill boost → path re-score
│       ├── generate-quiz/  # Skill verification quiz generation
│       ├── submit-quiz/    # Server-side grading → source='assessed'
│       ├── ask-assistant/  # Scoped AI chat
│       └── explain-path-item/
└── frontend/
    └── src/
        ├── lib/            # supabaseClient.js, api.js
        ├── pages/          # Login, Onboarding, Dashboard, PathDetail, CourseDetail
        └── components/     # Navbar, MilestoneTimeline, AIAssistantPanel, SkillQuizModal, etc.
```
