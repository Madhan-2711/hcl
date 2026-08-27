import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../App'
import { Send, Bot, User, Sparkles, Compass } from 'lucide-react'

export default function AIAssistantPanel() {
  const { session } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)

  // Load chat history from Supabase on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from('chat_history')
        .select('role, content, created_at')
        .eq('learner_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(20)
      setMessages(data || [])
      setLoadingHistory(false)
    }
    loadHistory()
  }, [session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')

    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await api.ask(question)
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an issue: ${err.message}. Please try again.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const SUGGESTED = [
    "What should I learn next?",
    "Explain why my first course was recommended",
    "How long will my path take to complete?",
    "What skills am I still missing?",
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400, background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.15rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'rgba(253, 252, 248, 0.7)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <Compass size={18} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Fraunces, serif' }}>AI Learning Guide</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>● Active Context</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.85rem' }}>Loading conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div style={{
              width: 52, height: 52, margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'rgba(93, 112, 82, 0.12)',
              color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} className="float">
              <Sparkles size={24} />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', fontFamily: 'Fraunces, serif' }}>
              Ask your personal AI Advisor
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              I have real-time access to your goals, competencies, and tailored roadmap.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  style={{
                    background: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px', padding: '0.55rem 1rem',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, textAlign: 'left', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--muted)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))
        )}
        {loading && <LoadingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.6rem',
        flexShrink: 0,
        background: 'rgba(253, 252, 248, 0.7)',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your path or courses... (Enter to send)"
          disabled={loading}
          className="textarea-field"
          style={{
            minHeight: 44,
            maxHeight: 120,
            resize: 'none',
            flex: 1,
            fontSize: '0.88rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
          }}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ padding: '0.65rem 1.1rem', alignSelf: 'flex-end', flexShrink: 0 }}
        >
          {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', gap: '0.65rem',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--secondary)' : 'var(--primary)',
        color: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-soft)',
      }}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>
      <div style={{
        maxWidth: '78%',
        padding: '0.75rem 1.15rem',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'var(--muted)' : '#FFFFFF',
        border: `1.5px solid ${isUser ? 'rgba(193, 140, 93, 0.3)' : 'var(--border)'}`,
        fontSize: '0.88rem',
        lineHeight: 1.6,
        color: 'var(--foreground)',
        whiteSpace: 'pre-wrap',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

function LoadingBubble() {
  return (
    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--primary)',
        color: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={15} />
      </div>
      <div style={{
        padding: '0.85rem 1.25rem',
        background: '#FFFFFF',
        border: '1.5px solid var(--border)',
        borderRadius: '18px 18px 18px 4px',
        display: 'flex', gap: '0.45rem', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--primary)',
            animation: `pulse-glow 1.2s ease-in-out ${i * 0.25}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}
