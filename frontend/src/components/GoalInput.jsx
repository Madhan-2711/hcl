import React from 'react'
import { ChevronRight, Sparkles, ArrowRight } from 'lucide-react'

const EXAMPLES = [
  "I want to become an ML engineer. I know Python but I'm weak in statistics and deep learning.",
  "I'm transitioning from backend dev to data scientist. I know SQL and Python well.",
  "I want to build AI products. I have no ML experience but strong software engineering skills.",
]

export default function GoalInput({ value, onChange, onSubmit, loading, error }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <Sparkles size={18} style={{ color: 'var(--accent-blue)' }} />
        <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          What do you want to learn?
        </label>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Describe your goal in plain English. Tell us what you know, what you want to learn, and where you want to end up..."
        className="textarea-field"
        style={{ minHeight: 130, marginBottom: '0.75rem' }}
        disabled={loading}
      />

      {error && (
        <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
      )}

      {/* Examples */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          💡 Try an example:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => onChange(ex)}
              disabled={loading}
              style={{
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 8, padding: '0.5rem 0.75rem',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontSize: '0.8rem', textAlign: 'left', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)' }}
            >
              <ChevronRight size={11} style={{ display: 'inline', marginRight: 4 }} />
              {ex}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={onSubmit}
        disabled={loading || !value?.trim()}
        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
      >
        {loading
          ? <><div className="spinner" /> Analysing with AI...</>
          : <><Sparkles size={16} /> Analyse My Goal <ArrowRight size={14} /></>
        }
      </button>
    </div>
  )
}
