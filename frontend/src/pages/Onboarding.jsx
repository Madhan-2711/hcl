import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import Navbar from '../components/Navbar'
import {
  Sparkles, ArrowRight, Edit2, ChevronRight,
  Target, Brain, Clock, Zap, Compass
} from 'lucide-react'

const EXAMPLE_GOALS = [
  "I want to become an ML engineer. I know Python but I'm weak in statistics and deep learning.",
  "I'm a backend developer looking to transition to data science. I know SQL and Python well.",
  "I want to become a frontend developer. I have basic HTML knowledge but no JavaScript experience.",
  "I'm a data analyst wanting to upskill in machine learning and MLOps for production deployments.",
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: input, 2: parsing, 3: confirm, 4: generating
  const [goalText, setGoalText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')

  const handleParse = async () => {
    if (!goalText.trim() || goalText.length < 10) {
      setError('Please describe your goal in at least a few words.')
      return
    }
    setError('')
    setStep(2)
    try {
      const res = await api.parseGoal(goalText)
      setParsed(res.parsed)
      setStep(3)
    } catch (err) {
      setError(err.message)
      setStep(1)
    }
  }

  const handleGenerate = async () => {
    setStep(4)
    try {
      await api.generatePath()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setStep(3)
    }
  }

  const handleSkip = () => navigate('/dashboard')

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area" style={{ maxWidth: 740, margin: '0 auto' }}>
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
            <span>AI Goal Analysis</span>
          </div>
          <h1 style={{ fontSize: '2.6rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {step === 1 && <>Describe your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>aspirations</span></>}
            {step === 2 && <>Analyzing your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>skill profile...</span></>}
            {step === 3 && <>Confirm your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>profile</span></>}
            {step === 4 && <>Curating your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>learning path...</span></>}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 620, margin: '0 auto' }}>
            {step === 1 && "Describe what you want to achieve in natural language. Our AI will analyze your competencies, identify gaps, and craft a personalized sequence."}
            {step === 2 && "Our AI is interpreting your goals and identifying known vs target competencies..."}
            {step === 3 && "Review what our AI extracted from your goal. Edit or confirm to build your path."}
            {step === 4 && "Building your personalized roadmap with semantic vector matching and skill-gap scoring..."}
          </p>
        </div>

        {/* Step 1 — Goal Input */}
        {step === 1 && (
          <div className="glass-card card-organic-1 fade-in" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-float)' }}>
            <GoalInput
              value={goalText}
              onChange={setGoalText}
              onSubmit={handleParse}
              error={error}
              examples={EXAMPLE_GOALS}
            />
          </div>
        )}

        {/* Step 2 — Parsing Loading */}
        {step === 2 && (
          <div className="glass-card card-organic-2 fade-in" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 1.75rem' }} />
            <p style={{ color: 'var(--foreground)', fontFamily: 'Fraunces, serif', fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              Parsing your learning goals...
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Extracting skills', 'Inferring level', 'Structuring profile'].map((label, i) => (
                <div key={i} style={{
                  padding: '0.4rem 1rem',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 9999,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  animation: `fadeIn 0.4s ease ${i * 0.25}s both`,
                }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Confirm parsed profile */}
        {step === 3 && parsed && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card card-organic-1" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Target size={22} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Parsed Learning Profile</h3>
              </div>

              <div style={{ display: 'grid', gap: '1.15rem' }}>
                <ProfileRow icon={<Target size={16} />} label="Career Goal" value={parsed.goal} />
                <ProfileRow icon={<Brain size={16} />} label="Experience Level" value={parsed.experience_level} badge />
                {parsed.timeframe_months && (
                  <ProfileRow icon={<Clock size={16} />} label="Timeframe" value={`${parsed.timeframe_months} months`} />
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              <SkillSection title="Known Skills" skills={parsed.known_skills} badgeClass="badge-green" />
              <SkillSection title="Skills to Improve" skills={parsed.weak_skills} badgeClass="badge-amber" />
            </div>

            {error && (
              <div style={{
                padding: '0.85rem 1.25rem',
                background: 'rgba(168, 84, 72, 0.1)', border: '1px solid rgba(168, 84, 72, 0.3)',
                borderRadius: 'var(--radius-md)', color: 'var(--destructive)', fontSize: '0.88rem', fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button className="btn-ghost" onClick={() => setStep(1)} style={{ padding: '0.75rem 1.5rem' }}>
                <Edit2 size={15} /> Edit Goal
              </button>
              <button className="btn-primary" onClick={handleGenerate} style={{ flex: 1, justifyContent: 'center' }}>
                <Zap size={17} /> Generate My Learning Path
                <ArrowRight size={16} />
              </button>
            </div>
            <button
              onClick={handleSkip}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.88rem', textAlign: 'center', marginTop: '0.5rem',
                fontFamily: 'Nunito, sans-serif', fontWeight: 600,
              }}
            >
              Skip for now, I'll explore the dashboard →
            </button>
          </div>
        )}

        {/* Step 4 — Generating path */}
        {step === 4 && (
          <div className="glass-card card-organic-3 fade-in" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 1.75rem' }} />
            <p style={{ color: 'var(--foreground)', fontFamily: 'Fraunces, serif', fontSize: '1.3rem', marginBottom: '1.5rem' }}>
              Weaving your personalized curriculum...
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Vector Similarity', 'Skill Gap Scoring', 'Topological Ordering', 'AI Rationales'].map((label, i) => (
                <div key={i} style={{
                  padding: '0.45rem 1rem',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 9999,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
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
  )
}

function GoalInput({ value, onChange, onSubmit, error, examples }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--foreground)' }}>
        What role or mastery are you pursuing?
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. I want to become a machine learning engineer. I know Python basics and statistics but want to master neural networks, deep learning, and MLOps deployments..."
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
          {examples.slice(0, 2).map((ex, i) => (
            <button
              key={i}
              onClick={() => onChange(ex)}
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
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.background = '#FFFFFF'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--muted)'
              }}
            >
              <ChevronRight size={13} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
              {ex.length > 95 ? ex.slice(0, 95) + '…' : ex}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn-primary"
        onClick={onSubmit}
        style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
        disabled={!value.trim()}
      >
        <Sparkles size={17} /> Analyze My Learning Goal
        <ArrowRight size={16} />
      </button>
    </div>
  )
}

function ProfileRow({ icon, label, value, badge }) {
  const levelColors = { beginner: 'badge-green', intermediate: 'badge-amber', advanced: 'badge-pink' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minWidth: 140, fontWeight: 600 }}>{label}</span>
      {badge ? (
        <span className={`badge ${levelColors[value] || 'badge-blue'}`}>{value}</span>
      ) : (
        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{value}</span>
      )}
    </div>
  )
}

function SkillSection({ title, skills, badgeClass }) {
  return (
    <div className="glass-card card-organic-2" style={{ padding: '1.75rem' }}>
      <h4 style={{ fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.85rem', fontFamily: 'Fraunces, serif' }}>
        {title}
      </h4>
      {skills?.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {skills.map(s => <span key={s} className={`badge ${badgeClass}`}>{s}</span>)}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>None identified</p>
      )}
    </div>
  )
}
