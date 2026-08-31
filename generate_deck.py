import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Colors
    DARK_BG = RGBColor(40, 48, 36)        # Deep forest / loam
    LIGHT_BG = RGBColor(248, 246, 240)    # Rice paper cream
    CARD_BG = RGBColor(255, 255, 255)     # Crisp white
    DARK_CARD_BG = RGBColor(52, 62, 47)   # Forest card
    PRIMARY = RGBColor(93, 112, 82)       # Moss green
    SECONDARY = RGBColor(193, 140, 93)    # Terracotta
    TEXT_DARK = RGBColor(44, 44, 36)      # Charcoal
    TEXT_LIGHT = RGBColor(248, 248, 242)  # Off-white
    TEXT_MUTED = RGBColor(140, 140, 130)  # Neutral grey
    BORDER_COLOR = RGBColor(220, 215, 205)

    def set_bg(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, category, title, dark=False):
        # Category / Kicker
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = SECONDARY if dark else PRIMARY

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.95), Inches(11.7), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_LIGHT if dark else TEXT_DARK

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=BORDER_COLOR):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        if border_color:
            shape.line.color.rgb = border_color
            shape.line.width = Pt(1.5)
        else:
            shape.line.fill.background()
        return shape

    # ==========================================
    # SLIDE 1: Title Slide (Dark)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide1, DARK_BG)

    # Decorative Badge
    badge = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(2.2), Inches(0.5))
    badge.fill.solid()
    badge.fill.fore_color.rgb = DARK_CARD_BG
    badge.line.color.rgb = PRIMARY
    badge.text = "🌿 LEARNAI PLATFORM"
    for p in badge.text_frame.paragraphs:
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_LIGHT
        p.alignment = PP_ALIGN.CENTER

    # Main Title
    t_box = slide1.shapes.add_textbox(Inches(0.8), Inches(2.0), Inches(11.5), Inches(2.0))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "An AI-Powered Personalized\nLearning & Skill-Gap Platform"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    # Subtitle
    sub_box = slide1.shapes.add_textbox(Inches(0.8), Inches(4.3), Inches(10.5), Inches(1.2))
    tf_sub = sub_box.text_frame
    tf_sub.word_wrap = True
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "Turning free-text career aspirations, resume uploads, and skill assessments into structured, explainable, and adaptive curricula — built on Supabase, pgvector, and Groq LLMs."
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = RGBColor(200, 205, 195)

    # Author
    auth_box = slide1.shapes.add_textbox(Inches(0.8), Inches(5.8), Inches(6.0), Inches(0.6))
    tf_auth = auth_box.text_frame
    p_auth = tf_auth.paragraphs[0]
    p_auth.text = "By Code Catalyst"
    p_auth.font.size = Pt(18)
    p_auth.font.bold = True
    p_auth.font.color.rgb = SECONDARY

    # Footer
    foot_box = slide1.shapes.add_textbox(Inches(0.8), Inches(6.6), Inches(11.5), Inches(0.4))
    tf_foot = foot_box.text_frame
    p_foot = tf_foot.paragraphs[0]
    p_foot.text = "PROJECT OVERVIEW  ·  AUGUST 2026"
    p_foot.font.size = Pt(11)
    p_foot.font.bold = True
    p_foot.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 2: The Problem (Light)
    # ==========================================
    slide2 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide2, LIGHT_BG)
    add_header(slide2, "The Problem", "Generic course catalogs don't know what you already know")

    col_w = Inches(3.64)
    gap = Inches(0.38)
    top_pos = Inches(2.1)
    card_h = Inches(4.5)

    problems = [
        ("1", "One-Size-Fits-All Catalogs", "Learners scroll endlessly through bloated catalogs with no sense of prerequisite order, relevance, or customized starting points based on existing skills."),
        ("2", "Goals Stay Unstructured", "\"I want to become an ML engineer\" or \"I want to be a Criminal Lawyer\" never gets translated into concrete, measurable, and verified competence benchmarks."),
        ("3", "Black-Box Recommendations", "Standard platforms offer recommendations without explainable reasoning — learners can't see why a course was picked or how it closes their specific skill gaps.")
    ]

    for i, (num, headline, desc) in enumerate(problems):
        left_pos = Inches(0.8) + i * (col_w + gap)
        add_card(slide2, left_pos, top_pos, col_w, card_h)

        # Number circle badge
        badge = slide2.shapes.add_shape(MSO_SHAPE.OVAL, left_pos + Inches(0.4), top_pos + Inches(0.4), Inches(0.65), Inches(0.65))
        badge.fill.solid()
        badge.fill.fore_color.rgb = PRIMARY
        badge.line.fill.background()
        badge.text = num
        badge.text_frame.paragraphs[0].font.size = Pt(14)
        badge.text_frame.paragraphs[0].font.bold = True
        badge.text_frame.paragraphs[0].font.color.rgb = TEXT_LIGHT
        badge.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

        # Text
        txt_box = slide2.shapes.add_textbox(left_pos + Inches(0.4), top_pos + Inches(1.3), col_w - Inches(0.8), Inches(2.8))
        tf = txt_box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = headline
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_DARK

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(13)
        p2.font.color.rgb = RGBColor(100, 100, 95)
        p2.space_before = Pt(12)

    # ==========================================
    # SLIDE 3: The Solution (Dark)
    # ==========================================
    slide3 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide3, DARK_BG)
    add_header(slide3, "The Solution", "LearnAI turns goals & resumes into guided, explainable paths", dark=True)

    steps = [
        ("Describe / Upload", "Free-text career goals or resume uploads (.pdf / .docx) across CS & Non-CS tracks."),
        ("AI Parses Skills", "Scans qualifications against 100+ roles and 4,480+ benchmark skills in role_skills.json."),
        ("Path Is Generated", "Topological sequencing + pgvector similarity + skill-gap scoring builds the roadmap."),
        ("Track & Adapt", "Interactive verified quizzes, dynamic progress updates, and a context-aware AI mentor.")
    ]

    col4_w = Inches(2.7)
    gap4 = Inches(0.3)
    top4 = Inches(2.2)
    h4 = Inches(4.3)

    for i, (title, desc) in enumerate(steps):
        left_pos = Inches(0.8) + i * (col4_w + gap4)
        add_card(slide3, left_pos, top4, col4_w, h4, bg_color=DARK_CARD_BG, border_color=PRIMARY)

        # Step tag
        tag = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos + Inches(0.3), top4 + Inches(0.4), Inches(1.2), Inches(0.35))
        tag.fill.solid()
        tag.fill.fore_color.rgb = SECONDARY
        tag.line.fill.background()
        tag.text = f"STEP {i+1}"
        tag.text_frame.paragraphs[0].font.size = Pt(10)
        tag.text_frame.paragraphs[0].font.bold = True
        tag.text_frame.paragraphs[0].font.color.rgb = TEXT_LIGHT
        tag.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

        txt_box = slide3.shapes.add_textbox(left_pos + Inches(0.3), top4 + Inches(1.1), col4_w - Inches(0.6), Inches(2.8))
        tf = txt_box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_LIGHT

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = RGBColor(200, 205, 195)
        p2.space_before = Pt(10)

    # ==========================================
    # SLIDE 4: Architecture (Light)
    # ==========================================
    slide4 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide4, LIGHT_BG)
    add_header(slide4, "Architecture", "A lean, serverless, and robust full-stack architecture")

    # Layer 1: Client
    add_card(slide4, Inches(0.8), Inches(1.9), Inches(11.73), Inches(1.3))
    t1 = slide4.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(11.0), Inches(1.1))
    tf1 = t1.text_frame
    p = tf1.paragraphs[0]
    p.text = "💻 Browser & Client Layer (React 19 + Vite 8 + Tailwind CSS 4)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p2 = tf1.add_paragraph()
    p2.text = "React Router 7, TanStack Query, Recharts (Radar & Mastery Graphs), PDF.js & Mammoth client-side parsing."
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_DARK

    # Layer 2: Middle (Auth + Edge Functions)
    add_card(slide4, Inches(0.8), Inches(3.4), Inches(5.6), Inches(2.0))
    t2 = slide4.shapes.add_textbox(Inches(1.0), Inches(3.5), Inches(5.2), Inches(1.8))
    tf2 = t2.text_frame
    p = tf2.paragraphs[0]
    p.text = "🔒 Auth & PostgreSQL (RLS)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_DARK
    p2 = tf2.add_paragraph()
    p2.text = "Supabase Auth, Row Level Security (RLS) on all user tables, pgvector cosine similarity search over 384-dimensional course embeddings."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = RGBColor(100, 100, 95)

    add_card(slide4, Inches(6.93), Inches(3.4), Inches(5.6), Inches(2.0))
    t3 = slide4.shapes.add_textbox(Inches(7.13), Inches(3.5), Inches(5.2), Inches(1.8))
    tf3 = t3.text_frame
    p = tf3.paragraphs[0]
    p.text = "⚡ 8 Serverless Edge Functions (Deno/TS)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_DARK
    p2 = tf3.add_paragraph()
    p2.text = "Eight micro-functions handle goal parsing, vector recommendations, greedy path compilation, live progress re-scoring, Groq quiz generation, and AI chat."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = RGBColor(100, 100, 95)

    # Layer 3: AI
    add_card(slide4, Inches(0.8), Inches(5.6), Inches(11.73), Inches(1.2))
    t4 = slide4.shapes.add_textbox(Inches(1.1), Inches(5.7), Inches(11.0), Inches(1.0))
    tf4 = t4.text_frame
    p = tf4.paragraphs[0]
    p.text = "🤖 Groq LLM Inference Layer"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = SECONDARY
    p2 = tf4.add_paragraph()
    p2.text = "Sub-second low-latency inference powering free-text profile extraction, personalized milestone explanations, MCQ quiz generation, and contextual AI mentoring."
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_DARK

    # ==========================================
    # SLIDE 5: Core Capabilities (Light)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide5, LIGHT_BG)
    add_header(slide5, "Core Features", "Six capabilities delivering one continuous learning experience")

    features = [
        ("Conversational Goal Parsing", "Free-text career goals parsed into canonical skill profiles via Groq LLM without hallucination."),
        ("Resume Skill Gap Analyzer", "Upload .pdf/.docx resumes to automatically benchmark skills against 100+ target roles."),
        ("Personalized Learning Paths", "Topological sequence compilation combining pgvector cosine similarity and skill-gap delta."),
        ("Interactive MCQ Quizzes", "Dynamic 3-question skill verification assessments with server-side grading and zero key leakage."),
        ("Adaptive Progress & Edit Plan", "Real-time skill boosting upon course completion + full flexibility to delete/prune path items."),
        ("Scoped AI Learning Guide", "Private mentor chat referencing learner's active target role, verified skills, and roadmap sequence.")
    ]

    card_w = Inches(3.64)
    card_h2 = Inches(2.2)
    for idx, (ft_title, ft_desc) in enumerate(features):
        row = idx // 3
        col = idx % 3
        c_left = Inches(0.8) + col * (card_w + Inches(0.38))
        c_top = Inches(2.0) + row * (card_h2 + Inches(0.35))

        add_card(slide5, c_left, c_top, card_w, card_h2)
        txt_box = slide5.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(0.25), card_w - Inches(0.6), card_h2 - Inches(0.5))
        tf = txt_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = ft_title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_DARK
        p2 = tf.add_paragraph()
        p2.text = ft_desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(100, 100, 95)
        p2.space_before = Pt(6)

    # ==========================================
    # SLIDE 6: The AI Layer (Dark)
    # ==========================================
    slide6 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide6, DARK_BG)
    add_header(slide6, "AI Layer", "Eight Supabase Edge Functions power every intelligent step", dark=True)

    functions_list = [
        ("parse-goal", "Extracts canonical skills, experience level, and timeframe from free-text goals."),
        ("get-recommendations", "Performs pgvector semantic search blended with marginal skill-gap scoring."),
        ("generate-path", "Greedy topological compiler structuring courses into milestone sequences."),
        ("update-progress", "Live boosts skill proficiency on completion and re-scores remaining path items."),
        ("generate-quiz", "Dynamically generates 3-question MCQ skill verification quizzes via Groq."),
        ("submit-quiz", "Grades quiz submissions server-side and logs verification into quiz_attempts."),
        ("ask-assistant", "Contextual AI mentor scoped directly to user goals, skills, and current path."),
        ("explain-path-item", "Generates personalized pedagogical reasoning for each recommended milestone.")
    ]

    fn_w = Inches(5.6)
    fn_h = Inches(1.05)
    for idx, (fn_name, fn_desc) in enumerate(functions_list):
        row = idx % 4
        col = idx // 4
        f_left = Inches(0.8) + col * (fn_w + Inches(0.53))
        f_top = Inches(2.0) + row * (fn_h + Inches(0.22))

        add_card(slide6, f_left, f_top, fn_w, fn_h, bg_color=DARK_CARD_BG, border_color=PRIMARY)
        txt = slide6.shapes.add_textbox(f_left + Inches(0.25), f_top + Inches(0.12), fn_w - Inches(0.5), fn_h - Inches(0.24))
        tf = txt.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"⚡ {fn_name}"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = SECONDARY
        p2 = tf.add_paragraph()
        p2.text = fn_desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = RGBColor(210, 215, 205)
        p2.space_before = Pt(3)

    # ==========================================
    # SLIDE 7: Scoring Engine (Light)
    # ==========================================
    slide7 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide7, LIGHT_BG)
    add_header(slide7, "Scoring Algorithm", "Every course gets a deterministic, explainable score")

    # Formula Banner
    f_banner = add_card(slide7, Inches(0.8), Inches(1.9), Inches(11.73), Inches(1.3), bg_color=RGBColor(235, 240, 230), border_color=PRIMARY)
    f_txt = slide7.shapes.add_textbox(Inches(1.0), Inches(2.05), Inches(11.3), Inches(1.0))
    tf_f = f_txt.text_frame
    p = tf_f.paragraphs[0]
    p.text = "final_score = 0.6 × similarity + 0.4 × gap_score"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.alignment = PP_ALIGN.CENTER
    p2 = tf_f.add_paragraph()
    p2.text = "similarity = 0.5 × track_alignment + 0.5 × vector_semantic_similarity + beginner_bonus"
    p2.font.size = Pt(13)
    p2.font.color.rgb = TEXT_DARK
    p2.alignment = PP_ALIGN.CENTER

    score_cards = [
        ("Track Similarity (50%)", "Evaluates goal alignment against the catalog track (e.g. ML, Web Dev, Law, Healthcare, Engineering)."),
        ("Vector Cosine Similarity (50%)", "Embeds goals and course descriptions using 384-dimensional vectors stored in pgvector."),
        ("Marginal Skill-Gap Score (40%)", "Rewards courses that teach competencies the learner currently lacks, avoiding redundant content.")
    ]

    for idx, (stitle, sdesc) in enumerate(score_cards):
        s_left = Inches(0.8) + idx * (col_w + gap)
        add_card(slide7, s_left, Inches(3.5), col_w, Inches(3.1))
        txt = slide7.shapes.add_textbox(s_left + Inches(0.3), Inches(3.8), col_w - Inches(0.6), Inches(2.5))
        tf = txt.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_DARK
        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(12)
        p2.font.color.rgb = RGBColor(100, 100, 95)
        p2.space_before = Pt(10)

    # ==========================================
    # SLIDE 8: Multidisciplinary Expansion (Dark)
    # ==========================================
    slide8 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide8, DARK_BG)
    add_header(slide8, "Multi-Disciplinary Taxonomy", "Broadening beyond tech: Native non-CS career curricula", dark=True)

    tracks = [
        ("💻 Technology & AI", ["Machine Learning", "Full-Stack Web Dev", "Cloud Architecture", "DevOps & Docker"]),
        ("🩺 Healthcare & Medicine", ["Human Anatomy", "Clinical Surgery Basics", "Medical Ethics", "Patient Assessment"]),
        ("⚖️ Law & Legal Ops", ["Criminal Litigation", "Corporate Contracts", "Legal Negotiation", "Constitutional Law"]),
        ("🏗️ Core Engineering", ["Civil Structural Design", "Mechanical Systems", "AutoCAD & Drafting", "Material Science"]),
        ("🔬 Forensics & Psychology", ["Crime Scene Investigation", "Cognitive Psychology", "DNA Analysis", "Behavioral Profiling"]),
        ("📈 Creator & Digital Economy", ["Digital Marketing", "Content Strategy", "Growth Analytics", "Brand Management"])
    ]

    for idx, (tname, tskills) in enumerate(tracks):
        row = idx // 3
        col = idx % 3
        t_left = Inches(0.8) + col * (card_w + Inches(0.38))
        t_top = Inches(2.0) + row * (card_h2 + Inches(0.35))

        add_card(slide8, t_left, t_top, card_w, card_h2, bg_color=DARK_CARD_BG, border_color=PRIMARY)
        txt = slide8.shapes.add_textbox(t_left + Inches(0.3), t_top + Inches(0.2), card_w - Inches(0.6), card_h2 - Inches(0.4))
        tf = txt.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = tname
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = SECONDARY
        for sk in tskills:
            p_sk = tf.add_paragraph()
            p_sk.text = f"• {sk}"
            p_sk.font.size = Pt(11)
            p_sk.font.color.rgb = RGBColor(210, 215, 205)

    # ==========================================
    # SLIDE 9: Data Model (Light)
    # ==========================================
    slide9 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide9, LIGHT_BG)
    add_header(slide9, "Data Model & Security", "Nine relational tables protected by PostgreSQL Row Level Security")

    # Table
    table_shape = slide9.shapes.add_table(10, 3, Inches(0.8), Inches(1.9), Inches(11.73), Inches(4.8))
    table = table_shape.table
    table.columns[0].width = Inches(2.8)
    table.columns[1].width = Inches(6.8)
    table.columns[2].width = Inches(2.13)

    headers = ["Table Name", "Functional Purpose", "Security / Access"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = TEXT_LIGHT

    rows_data = [
        ("learner_profiles", "Stores career goals, experience levels, and learning preferences.", "User RLS"),
        ("skills", "Canonical catalog of CS and non-CS competency benchmarks.", "Public Read"),
        ("learner_skills", "Per-user proficiency records (self-reported, inferred, or assessed).", "User RLS"),
        ("courses", "Course catalog populated with 384-dimensional pgvector embeddings.", "Public Read"),
        ("course_skills", "Maps courses to taught skills and explicit prerequisite requirements.", "Public Read"),
        ("learning_paths", "Maintains saved learning journeys and multi-goal curriculums.", "User RLS"),
        ("path_items", "Ordered milestone courses, statuses, scores, and AI explanations.", "User RLS"),
        ("quiz_attempts", "Server-side storage of quiz questions, answers, and evaluation grades.", "User RLS"),
        ("chat_history", "Contextual conversational transcripts with the AI mentor.", "User RLS")
    ]

    for row_idx, r in enumerate(rows_data):
        for col_idx, val in enumerate(r):
            cell = table.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if row_idx % 2 == 0 else RGBColor(245, 243, 238)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_DARK if col_idx < 2 else (PRIMARY if val == "User RLS" else SECONDARY)
            p.font.bold = (col_idx == 0 or col_idx == 2)

    # ==========================================
    # SLIDE 10: User Journey (Dark)
    # ==========================================
    slide10 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide10, DARK_BG)
    add_header(slide10, "User Journey", "From initial aspiration to an evolving, verified career path", dark=True)

    journey_steps = [
        ("1. Auth & Entry", "Secure Supabase Sign-in / Sign-up with session-aware route protection."),
        ("2. Goal & Resume", "Describe career ambitions or upload resume for automated skill extraction."),
        ("3. Skill Gap Analysis", "Explore matched competencies vs. missing requirements against target role."),
        ("4. Dynamic Roadmap", "Explore ordered milestone timeline with AI-generated pedagogical rationales."),
        ("5. Verify & Progress", "Take MCQ quizzes, complete milestones, boost skills, and prune path items.")
    ]

    j_w = Inches(2.15)
    j_gap = Inches(0.24)
    j_top = Inches(2.2)
    j_h = Inches(4.3)

    for i, (j_title, j_desc) in enumerate(journey_steps):
        left_pos = Inches(0.8) + i * (j_w + j_gap)
        add_card(slide10, left_pos, j_top, j_w, j_h, bg_color=DARK_CARD_BG, border_color=PRIMARY)

        # Step circle
        circle = slide10.shapes.add_shape(MSO_SHAPE.OVAL, left_pos + Inches(0.2), j_top + Inches(0.35), Inches(0.55), Inches(0.55))
        circle.fill.solid()
        circle.fill.fore_color.rgb = SECONDARY
        circle.line.fill.background()
        circle.text = str(i+1)
        circle.text_frame.paragraphs[0].font.size = Pt(13)
        circle.text_frame.paragraphs[0].font.bold = True
        circle.text_frame.paragraphs[0].font.color.rgb = TEXT_LIGHT
        circle.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

        txt_box = slide10.shapes.add_textbox(left_pos + Inches(0.2), j_top + Inches(1.1), j_w - Inches(0.4), Inches(2.8))
        tf = txt_box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = j_title
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_LIGHT

        p2 = tf.add_paragraph()
        p2.text = j_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = RGBColor(200, 205, 195)
        p2.space_before = Pt(8)

    # ==========================================
    # SLIDE 11: Conclusion (Dark)
    # ==========================================
    slide11 = prs.slides.add_slide(blank_slide_layout)
    set_bg(slide11, DARK_BG)

    # Badge Icon
    badge11 = slide11.shapes.add_shape(MSO_SHAPE.OVAL, Inches(6.16), Inches(1.8), Inches(1.0), Inches(1.0))
    badge11.fill.solid()
    badge11.fill.fore_color.rgb = SECONDARY
    badge11.line.fill.background()
    badge11.text = "🌱"
    badge11.text_frame.paragraphs[0].font.size = Pt(28)
    badge11.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    # Title
    t11 = slide11.shapes.add_textbox(Inches(1.0), Inches(3.1), Inches(11.33), Inches(1.2))
    tf11 = t11.text_frame
    p = tf11.paragraphs[0]
    p.text = "Grow a curriculum around every learner"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT
    p.alignment = PP_ALIGN.CENTER

    # Subtitle
    sub11 = slide11.shapes.add_textbox(Inches(1.5), Inches(4.3), Inches(10.33), Inches(1.0))
    tf_s11 = sub11.text_frame
    tf_s11.word_wrap = True
    p = tf_s11.paragraphs[0]
    p.text = "LearnAI — Conversational goals, resume skill-gap intelligence, explainable recommendations, and an adaptive learning design built to feel human."
    p.font.size = Pt(16)
    p.font.color.rgb = RGBColor(200, 205, 195)
    p.alignment = PP_ALIGN.CENTER

    # Thank you
    ty = slide11.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(11.33), Inches(0.8))
    tf_ty = ty.text_frame
    p = tf_ty.paragraphs[0]
    p.text = "Thank you — Code Catalyst"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.alignment = PP_ALIGN.CENTER

    output_path = "LearnAI_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {os.path.abspath(output_path)}")

if __name__ == "__main__":
    create_presentation()
