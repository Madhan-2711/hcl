import React, { useState } from 'react'
import { BookOpen, Clock, BarChart2, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

const DIFFICULTY_BADGE = {
  beginner: 'badge-green',
  intermediate: 'badge-amber',
  advanced: 'badge-pink',
}

const TRACK_COLORS = {
  data_scientist: 'var(--primary)',
  ml_engineer: 'var(--secondary)',
  backend: '#587B7F',
  frontend: 'var(--accent-pink)',
}

export default function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false)
  const course = rec.course || {}
  const trackColor = TRACK_COLORS[course.track] || 'var(--primary)'

  const finalPct = Math.round((rec.final_score || 0) * 100)
  const simPct = Math.round((rec.similarity_score || 0) * 100)
  const gapPct = Math.round((rec.gap_score || 0) * 100)

  // Cycle through organic card patterns
  const cardShape = index % 3 === 0 ? 'card-organic-1' : index % 3 === 1 ? 'card-organic-2' : 'card-organic-3'

  return (
    <div
      className={`glass-card ${cardShape} fade-in`}
      style={{
        padding: '1.75rem',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'both',
      }}
    >
      {/* Left Accent Bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: trackColor }} />

      <div style={{ paddingLeft: '0.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--muted)', border: `1px solid var(--border)`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800, color: 'var(--foreground)', flexShrink: 0,
              }}>
                #{index + 1}
              </span>
              {course.difficulty && <span className={`badge ${DIFFICULTY_BADGE[course.difficulty] || 'badge-blue'}`}>{course.difficulty}</span>}
              {course.track && <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{course.track?.replace('_', ' ')}</span>}
            </div>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 }}>
              {course.title}
            </h3>
            {course.description && (
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {course.description.length > 130 ? course.description.slice(0, 128) + '…' : course.description}
              </p>
            )}
          </div>

          {/* Match score Badge */}
          <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '1.25rem' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: `conic-gradient(var(--primary) ${finalPct * 3.6}deg, var(--muted) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(93, 112, 82, 0.15)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)',
                fontFamily: 'Fraunces, serif',
              }}>
                {finalPct}%
              </div>
            </div>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>match</p>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          {course.duration_hours && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <Clock size={13} style={{ color: 'var(--primary)' }} /> {course.duration_hours}h estimated
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <BarChart2 size={13} style={{ color: 'var(--primary)' }} /> Relevance: {simPct}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Sparkles size={13} style={{ color: 'var(--secondary)' }} /> Gap Score: {gapPct}%
          </span>
        </div>

        {/* Gap skills */}
        {rec.gap_skills?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Closes gaps:</span>
            {rec.gap_skills.map(s => (
              <span key={s} className="badge badge-amber">{s}</span>
            ))}
          </div>
        )}

        {/* Explanation Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-ghost"
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.8rem',
            borderRadius: '9999px',
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--secondary)' }} />
          Why this course?
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <div style={{
            marginTop: '0.85rem', padding: '1rem 1.25rem',
            background: 'rgba(240, 235, 229, 0.6)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65,
            animation: 'fadeIn 0.3s ease',
          }}>
            {rec.explanation || (
              rec.gap_skills?.length > 0
                ? `This course is recommended because it directly addresses your skill gaps in ${rec.gap_skills.join(', ')}. The ${simPct}% semantic alignment makes it highly valuable for your learning trajectory.`
                : "This course aligns strongly with your target career track based on semantic matching and foundational skill development."
            )}
          </div>
        )}
      </div>
    </div>
  )
}
