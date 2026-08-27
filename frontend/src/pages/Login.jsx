import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { BookOpen, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, Compass } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) throw error
        setSuccess('Check your email for a magic link!')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const profileRes = await supabase
          .from('learner_profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()
        navigate(profileRes.data ? '/dashboard' : '/onboarding')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container hero-bg" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 1.5rem',
      position: 'relative',
    }}>
      {/* Large Organic Color-Wash Blobs */}
      <div
        className="blob-shape-1"
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          top: '-12%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(93, 112, 82, 0.15) 0%, rgba(230, 220, 205, 0.1) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="blob-shape-2"
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          bottom: '-10%',
          right: '-8%',
          background: 'radial-gradient(circle, rgba(193, 140, 93, 0.16) 0%, rgba(240, 235, 229, 0.1) 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card card-organic-1 fade-in"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '2.75rem 2.5rem',
          position: 'relative',
          zIndex: 10,
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              margin: '0 auto 1.25rem',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-soft)',
              color: 'var(--primary-foreground)',
            }}
            className="float"
          >
            <Compass size={30} />
          </div>
          <h1 style={{
            fontSize: '2rem',
            margin: '0 0 0.4rem',
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 700,
            color: 'var(--foreground)',
          }}>
            LearnAI
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            Personalised, handcrafted learning paths guided by AI
          </p>
        </div>

        {/* Mode Selector (Pill Tabs) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: 'var(--muted)',
          borderRadius: '9999px',
          padding: 4,
          gap: 4,
          marginBottom: '1.75rem',
          border: '1px solid var(--border)',
        }}>
          {[
            { id: 'signin', label: 'Sign In' },
            { id: 'signup', label: 'Sign Up' },
            { id: 'magic', label: 'Magic Link' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setError(''); setSuccess('') }}
              style={{
                padding: '0.55rem',
                border: 'none',
                borderRadius: '9999px',
                background: mode === id ? '#FFFFFF' : 'transparent',
                color: mode === id ? 'var(--foreground)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
                cursor: 'pointer',
                boxShadow: mode === id ? '0 2px 8px rgba(93, 112, 82, 0.12)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '0.45rem',
              color: 'var(--text-secondary)',
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          {mode !== 'magic' && (
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '0.45rem',
                color: 'var(--text-secondary)',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              background: 'rgba(168, 84, 72, 0.1)',
              border: '1px solid rgba(168, 84, 72, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--destructive)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              background: 'rgba(93, 112, 82, 0.12)',
              border: '1px solid rgba(93, 112, 82, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.85rem',
              fontSize: '1rem',
            }}
          >
            {loading ? <div className="spinner" /> : <ArrowRight size={18} />}
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}>
          Rooted in personalized skill growth and mastery.
        </p>
      </div>
    </div>
  )
}
