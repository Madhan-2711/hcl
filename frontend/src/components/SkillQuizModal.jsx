import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { X, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

export default function SkillQuizModal({ skillId, skillName, onClose, onVerified }) {
  const [phase, setPhase] = useState('loading') // loading | answering | submitting | result | error
  const [attemptId, setAttemptId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.generateQuiz(skillId)
      .then(res => {
        if (cancelled) return
        setAttemptId(res.attempt_id)
        setQuestions(res.questions)
        setSelected(new Array(res.questions.length).fill(null))
        setPhase('answering')
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setPhase('error')
      })
    return () => { cancelled = true }
  }, [skillId])

  const handleSubmit = async () => {
    setPhase('submitting')
    try {
      const res = await api.submitQuiz(attemptId, selected)
      setResult(res)
      setPhase('result')
      if (res.passed) onVerified?.()
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  const allAnswered = selected.length > 0 && selected.every(s => s !== null)

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Verify: {skillName}</h3>
          <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
        </div>

        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Generating a quick 3-question check...</p>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--destructive)' }}>{error}</div>
        )}

        {(phase === 'answering' || phase === 'submitting') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {questions.map((q, qi) => (
              <div key={q.id}>
                <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{qi + 1}. {q.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: selected[qi] === oi ? 'rgba(93,112,82,0.08)' : '#fff',
                        border: `1.5px solid ${selected[qi] === oi ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={selected[qi] === oi}
                        onChange={() => setSelected(prev => prev.map((v, i) => i === qi ? oi : v))}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              disabled={!allAnswered || phase === 'submitting'}
              onClick={handleSubmit}
              style={{ justifyContent: 'center' }}
            >
              {phase === 'submitting' ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Sparkles size={16} />}
              Submit Answers
            </button>
          </div>
        )}

        {phase === 'result' && result && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {result.passed
              ? <CheckCircle2 size={40} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              : <XCircle size={40} style={{ color: 'var(--destructive)', margin: '0 auto 1rem' }} />}
            <h4 style={{ margin: '0 0 0.5rem' }}>{result.correct_count}/{result.total} correct ({result.score_pct}%)</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {result.passed
                ? `Verified! ${skillName} is now marked as assessed at ${Math.max(70, result.score_pct)}% proficiency.`
                : 'Not quite — you need 70%+ to verify this skill. Your recorded proficiency was not changed.'}
            </p>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(44,44,36,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
}
const modalStyle = {
  background: 'var(--bg-card, #FDFCF8)', borderRadius: 'var(--radius-lg, 16px)',
  padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}
const closeBtnStyle = {
  background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
}
