import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { api } from '../lib/api.js';
import Navbar from '../components/Navbar';
import {
  Sparkles, ArrowRight, Edit2, ChevronRight,
  Target, Brain, Clock, Zap, UploadCloud, FileText,
  CheckCircle, Plus, X, Award, Briefcase, FolderGit2
} from 'lucide-react';

const EXAMPLE_GOALS = [
  "I want to become a data analyst. I know SQL and Excel well but want to master Python, Pandas, and Data Visualization.",
  "I want to become an ML engineer. I know Python but I'm weak in statistics and deep learning.",
  "I'm a backend developer looking to transition to data science. I know SQL and Python well.",
  "I want to become a frontend developer. I have basic HTML knowledge but want to master React and TypeScript.",
];

const POPULAR_ROLES = [
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'text'
  const [step, setStep] = useState(1); // 1: input, 2: parsing, 3: confirm, 4: generating
  const [goalText, setGoalText] = useState('');
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [error, setError] = useState('');

  // Handle file drop/selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  // Handle parsing from resume or text
  const handleParse = async () => {
    setError('');
    setStep(2);

    try {
      let res;
      if (inputMode === 'upload') {
        if (!file) {
          setError('Please select or upload a resume file.');
          setStep(1);
          return;
        }
        res = await api.parseResumeFile(file);
      } else {
        if (!goalText.trim() || goalText.length < 5) {
          setError('Please describe your career goal in at least a few words.');
          setStep(1);
          return;
        }
        res = await api.parseGoal(goalText);
      }

      setParsed(res.parsed);
      setStep(3);
    } catch (err) {
      console.error('Parsing error:', err);
      setError(err.message || 'Failed to parse resume or aspirations.');
      setStep(1);
    }
  };

  // Generate learning path directly
  const handleGenerate = async () => {
    setStep(4);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && parsed?.goal) {
        await supabase.from('learner_profiles').upsert({
          id: user.id,
          career_goal: parsed.goal,
          experience_level: parsed.experience_level || 'intermediate',
          interests: parsed.known_skills || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
      await api.generatePath();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setStep(3);
    }
  };

  // Start skill-based assessment test
  const handleStartAssessment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && parsed?.goal) {
        await supabase.from('learner_profiles').upsert({
          id: user.id,
          career_goal: parsed.goal,
          experience_level: parsed.experience_level || 'intermediate',
          interests: parsed.known_skills || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('Profile save before assessment notice:', e);
    }

    navigate('/assessment', {
      state: {
        profile: parsed,
        numQuestions: 5,
      },
    });
  };

  // Skill tag modifiers
  const handleRemoveKnownSkill = (skillToRemove) => {
    setParsed(prev => ({
      ...prev,
      known_skills: prev.known_skills.filter(s => s !== skillToRemove),
    }));
  };

  const handleAddKnownSkill = () => {
    if (!newSkillInput.trim()) return;
    const skillName = newSkillInput.trim();
    if (!parsed.known_skills.includes(skillName)) {
      setParsed(prev => ({
        ...prev,
        known_skills: [...prev.known_skills, skillName],
      }));
    }
    setNewSkillInput('');
  };

  const handleGoalChange = (newGoal) => {
    setParsed(prev => ({
      ...prev,
      goal: newGoal,
    }));
  };

  const handleLevelChange = (newLevel) => {
    setParsed(prev => ({
      ...prev,
      experience_level: newLevel,
    }));
  };

  const handleSkip = () => navigate('/dashboard');

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area" style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 1rem',
            background: 'rgba(93, 112, 82, 0.1)', border: '1px solid rgba(93, 112, 82, 0.25)',
            borderRadius: 9999, marginBottom: '1rem',
            color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700,
          }}>
            <Sparkles size={14} />
            <span>AI Resume & Goal Extraction</span>
          </div>
          <h1 style={{ fontSize: '2.6rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {step === 1 && <>Build your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>skill profile</span></>}
            {step === 2 && <>Extracting <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>competencies...</span></>}
            {step === 3 && <>Verify your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>skills & roadmap</span></>}
            {step === 4 && <>Curating your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>learning path...</span></>}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
            {step === 1 && "Upload your resume (PDF, DOCX, TXT) or describe your career ambitions in plain English. Our AI extracts your core skills and crafts a personalized roadmap."}
            {step === 2 && "Analyzing your technical experience, projects, and target competencies..."}
            {step === 3 && "Review what our AI extracted. Confirm your target role, take an interactive MCQ skill test, or generate your roadmap directly."}
            {step === 4 && "Building your personalized roadmap with semantic vector matching and skill-gap scoring..."}
          </p>
        </div>

        {/* Step 1 — Input Choice (Upload Resume vs Text Input) */}
        {step === 1 && (
          <div className="glass-card card-organic-1 fade-in" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-float)' }}>
            {/* Mode Selector Tabs */}
            <div style={{
              display: 'flex', gap: '0.5rem', background: 'var(--muted)',
              padding: '0.35rem', borderRadius: 9999, marginBottom: '2rem',
            }}>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                style={{
                  flex: 1, padding: '0.65rem 1rem', border: 'none', borderRadius: 9999,
                  background: inputMode === 'upload' ? '#FFFFFF' : 'transparent',
                  color: inputMode === 'upload' ? 'var(--foreground)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: inputMode === 'upload' ? 'var(--shadow-soft)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <UploadCloud size={17} style={{ color: inputMode === 'upload' ? 'var(--primary)' : 'inherit' }} />
                Upload Resume / CV
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                style={{
                  flex: 1, padding: '0.65rem 1rem', border: 'none', borderRadius: 9999,
                  background: inputMode === 'text' ? '#FFFFFF' : 'transparent',
                  color: inputMode === 'text' ? 'var(--foreground)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: inputMode === 'text' ? 'var(--shadow-soft)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <FileText size={17} style={{ color: inputMode === 'text' ? 'var(--primary)' : 'inherit' }} />
                Describe Goals in Text
              </button>
            </div>

            {/* Mode 1: File Upload */}
            {inputMode === 'upload' && (
              <div>
                <label
                  htmlFor="resume-upload"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem', background: file ? 'rgba(93, 112, 82, 0.06)' : 'var(--bg-secondary)',
                    borderColor: file ? 'var(--primary)' : 'var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center',
                    marginBottom: '1.5rem',
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      setFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: file ? 'var(--primary)' : 'rgba(93, 112, 82, 0.12)',
                    color: file ? '#FFFFFF' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem',
                  }}>
                    {file ? <CheckCircle size={28} /> : <UploadCloud size={28} />}
                  </div>
                  {file ? (
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 0.25rem', color: 'var(--foreground)' }}>
                        {file.name}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        {(file.size / 1024).toFixed(1)} KB · Ready to extract skills & experience
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.35rem', color: 'var(--foreground)' }}>
                        Click to upload or drag & drop your resume
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        Supports PDF, Word (DOCX), and TXT formats
                      </p>
                    </div>
                  )}
                </label>

                {error && (
                  <p style={{ color: 'var(--destructive)', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1rem' }}>
                    {error}
                  </p>
                )}

                <button
                  className="btn-primary"
                  onClick={handleParse}
                  disabled={!file}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Sparkles size={17} /> Extract Skills & Analyze Profile <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Mode 2: Text Input */}
            {inputMode === 'text' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--foreground)' }}>
                  What role or competencies are you pursuing?
                </label>
                <textarea
                  value={goalText}
                  onChange={e => setGoalText(e.target.value)}
                  placeholder="e.g. I want to become a data analyst. I know SQL, Excel, and statistics well but want to master Python, Pandas, and Data Visualization..."
                  className="textarea-field"
                  style={{ minHeight: 140, marginBottom: '1rem' }}
                />
                {error && (
                  <p style={{ color: 'var(--destructive)', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.85rem' }}>{error}</p>
                )}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Inspiration prompts:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {EXAMPLE_GOALS.slice(0, 2).map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setGoalText(ex)}
                        style={{
                          background: 'var(--muted)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.95rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          fontFamily: 'Nunito, sans-serif',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <ChevronRight size={13} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleParse}
                  disabled={!goalText.trim()}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Sparkles size={17} /> Analyze My Learning Goal <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Parsing Indicator */}
        {step === 2 && (
          <div className="glass-card card-organic-2 fade-in" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 1.75rem' }} />
            <p style={{ color: 'var(--foreground)', fontFamily: 'Fraunces, serif', fontSize: '1.3rem', marginBottom: '1.25rem' }}>
              Parsing your technical profile with AI...
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Inferring Target Role', 'Extracting Skill Tokens', 'Structuring Projects', 'Calibrating Track'].map((label, i) => (
                <div key={i} style={{
                  padding: '0.4rem 1rem', background: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: 9999,
                  fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)',
                  animation: `fadeIn 0.4s ease ${i * 0.2}s both`,
                }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Confirm Parsed Profile & Test Prompt */}
        {step === 3 && parsed && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Primary Profile Summary */}
            <div className="glass-card card-organic-1" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <Target size={22} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Target Career Role & Profile</h3>
              </div>

              {/* Editable Target Role */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Career Role (Editable):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={parsed.goal}
                    onChange={e => handleGoalChange(e.target.value)}
                    placeholder="e.g. Data Analyst, Machine Learning Engineer, Frontend Developer..."
                    style={{ fontWeight: 700, fontSize: '1rem' }}
                  />
                </div>

                {/* Quick select role buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {POPULAR_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleGoalChange(role)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 9999,
                        border: parsed.goal.toLowerCase() === role.toLowerCase() ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        background: parsed.goal.toLowerCase() === role.toLowerCase() ? 'rgba(93, 112, 82, 0.12)' : 'var(--bg-secondary)',
                        color: parsed.goal.toLowerCase() === role.toLowerCase() ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Experience Level:
                </span>
                {['beginner', 'intermediate', 'advanced'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelChange(lvl)}
                    className={`badge ${parsed.experience_level === lvl ? 'badge-green' : 'badge-cyan'}`}
                    style={{
                      cursor: 'pointer',
                      border: parsed.experience_level === lvl ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                      padding: '0.35rem 0.85rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills Grids */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {/* Known Skills */}
              <div className="glass-card card-organic-2" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--foreground)', marginBottom: '0.85rem', fontFamily: 'Fraunces, serif' }}>
                  Extracted Known Skills ({parsed.known_skills?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
                  {(parsed.known_skills || []).map(s => (
                    <span key={s} className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveKnownSkill(s)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'inherit' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(!parsed.known_skills || parsed.known_skills.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No specific skills identified.</p>
                  )}
                </div>

                {/* Add Custom Skill Tag */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Add additional skill..."
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddKnownSkill())}
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddKnownSkill}
                    className="btn-ghost"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Skills to Improve */}
              <div className="glass-card card-organic-3" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--foreground)', marginBottom: '0.85rem', fontFamily: 'Fraunces, serif' }}>
                  Target Skills for {parsed.goal}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(parsed.weak_skills || []).map(s => (
                    <span key={s} className="badge badge-amber">{s}</span>
                  ))}
                  {(!parsed.weak_skills || parsed.weak_skills.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None identified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Projects / Experience (if resume was parsed) */}
            {parsed.projects?.length > 0 && (
              <div className="glass-card card-organic-1" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--foreground)', marginBottom: '0.85rem', fontFamily: 'Fraunces, serif', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderGit2 size={16} style={{ color: 'var(--primary)' }} /> Extracted Projects
                </h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {parsed.projects.slice(0, 3).map((p, idx) => (
                    <div key={idx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.title}</div>
                      {p.technologies?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.3rem 0' }}>
                          {p.technologies.map(t => (
                            <span key={t} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{t}</span>
                          ))}
                        </div>
                      )}
                      {p.bullets?.[0] && (
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.bullets[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Assessment Recommendation Banner */}
            <div className="glass-card card-organic-2" style={{
              padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(93, 112, 82, 0.08) 0%, rgba(193, 140, 93, 0.08) 100%)',
              border: '1.5px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <Award size={20} style={{ color: 'var(--primary)' }} />
                <h4 style={{ margin: 0, fontSize: '1.15rem' }}>Test Your Skills for {parsed.goal}</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                Validate your competencies with a 5-question interactive MCQ quiz tailored specifically to <strong>{parsed.goal}</strong>. Correct answers verify mastery, and missed questions automatically guide your custom roadmap!
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleStartAssessment}
                  className="btn-primary"
                  style={{ flex: 1, minWidth: 240, justifyContent: 'center' }}
                >
                  <Award size={17} /> Take MCQ Skill Test for {parsed.goal}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="btn-secondary"
                  style={{ flex: 1, minWidth: 240, justifyContent: 'center' }}
                >
                  <Zap size={17} /> Skip Test & Generate Path Directly
                </button>
              </div>
            </div>

            <button
              onClick={handleSkip}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.88rem', textAlign: 'center', marginTop: '0.5rem',
                fontFamily: 'Nunito, sans-serif', fontWeight: 600,
              }}
            >
              Skip for now, go to dashboard →
            </button>
          </div>
        )}

        {/* Step 4 — Generating Path */}
        {step === 4 && (
          <div className="glass-card card-organic-3 fade-in" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 1.75rem' }} />
            <p style={{ color: 'var(--foreground)', fontFamily: 'Fraunces, serif', fontSize: '1.3rem', marginBottom: '1.5rem' }}>
              Weaving your personalized curriculum for {parsed?.goal || 'your target role'}...
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Track Alignment', 'Skill Gap Scoring', 'Topological Ordering', 'Milestone Synthesis'].map((label, i) => (
                <div key={i} style={{
                  padding: '0.45rem 1rem', background: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: 9999,
                  fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)',
                  animation: `fadeIn 0.4s ease ${i * 0.3}s both`,
                }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
