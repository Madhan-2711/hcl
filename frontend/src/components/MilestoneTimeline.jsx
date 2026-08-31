import React from 'react'
import { CheckCircle2, Circle, Clock, Tag, Trash2 } from 'lucide-react'

const MILESTONE_COLORS = {
  'Foundations': 'var(--primary)',
  'Core Skills': '#587B7F',
  'Intermediate Mastery': 'var(--secondary)',
  'Advanced Techniques': '#7C6A59',
  'Capstone': 'var(--accent-pink)',
}

export default function MilestoneTimeline({ items = [], onStatusChange, onRemoveItem }) {
  const grouped = items.reduce((acc, item) => {
    const label = item.milestone_label || 'Foundations'
    if (!acc[label]) acc[label] = []
    acc[label].push(item)
    return acc
  }, {})

  const milestoneOrder = ['Foundations', 'Core Skills', 'Intermediate Mastery', 'Advanced Techniques', 'Capstone']
  const orderedGroups = milestoneOrder.filter(m => grouped[m]).map(m => [m, grouped[m]])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {orderedGroups.map(([milestone, group], mIdx) => {
        const color = MILESTONE_COLORS[milestone] || 'var(--primary)'
        const completedCount = group.filter(i => i.status === 'completed').length
        const progress = Math.round((completedCount / group.length) * 100)
        const cardShape = mIdx % 2 === 0 ? 'card-organic-1' : 'card-organic-2'

        return (
          <div key={milestone} className={`glass-card ${cardShape}`} style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
            {/* Top color bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color }} />

            {/* Milestone header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${color}18`,
                  border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.88rem', fontWeight: 800, color, fontFamily: 'Fraunces, serif',
                }}>
                  {mIdx + 1}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--foreground)' }}>{milestone}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {completedCount} of {group.length} courses completed
                  </p>
                </div>
              </div>
              <div style={{
                padding: '0.35rem 0.9rem',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--foreground)',
              }}>
                {progress}%
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 6, background: 'var(--muted)',
              borderRadius: '9999px', marginBottom: '1.5rem', overflow: 'hidden',
              border: '1px solid rgba(222, 216, 207, 0.4)',
            }}>
              <div style={{
                height: '100%', background: color, borderRadius: '9999px',
                width: `${progress}%`, transition: 'width 0.8s ease',
              }} />
            </div>

            {/* Course items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {group.map((item, idx) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  color={color}
                  isLast={idx === group.length - 1}
                  onStatusChange={onStatusChange}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimelineItem({ item, color, onStatusChange, onRemoveItem }) {
  const course = item.course || {}
  const status = item.status || 'not_started'

  const difficultyBadge = {
    beginner: 'badge-green',
    intermediate: 'badge-amber',
    advanced: 'badge-pink',
  }

  return (
    <div style={{
      display: 'flex', gap: '1rem', alignItems: 'flex-start',
      padding: '1.15rem 1.25rem',
      background: status === 'completed' ? 'rgba(93, 112, 82, 0.06)' : '#FFFFFF',
      border: `1.5px solid ${status === 'completed' ? 'rgba(93, 112, 82, 0.3)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      transition: 'all 0.25s ease',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
    }}>
      {/* Status icon */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: status === 'completed' ? 'rgba(93, 112, 82, 0.15)'
          : status === 'in_progress' ? 'rgba(193, 140, 93, 0.15)' : 'var(--muted)',
        border: `1.5px solid ${status === 'completed' ? 'var(--primary)'
          : status === 'in_progress' ? 'var(--secondary)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
        color: status === 'completed' ? 'var(--primary)'
          : status === 'in_progress' ? 'var(--secondary)' : 'var(--text-muted)',
      }}>
        {status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={14} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
              {course.title || `Course #${item.course_id}`}
            </p>
            {item.explanation && (
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.explanation}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {course.difficulty && <span className={`badge ${difficultyBadge[course.difficulty] || 'badge-blue'}`}>{course.difficulty}</span>}
              {course.duration_hours && <span className="badge badge-cyan">{course.duration_hours}h</span>}
              {course.track && <span className="badge badge-purple">{course.track?.replace('_', ' ')}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Status selector */}
            {onStatusChange && (
              <select
                value={status}
                onChange={e => onStatusChange(item.id, e.target.value)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.75rem',
                  color: 'var(--foreground)',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  outline: 'none',
                }}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            )}

            {/* Remove button */}
            {onRemoveItem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onRemoveItem(item.id);
                }}
                style={{
                  background: 'rgba(168, 84, 72, 0.12)',
                  border: '1px solid rgba(168, 84, 72, 0.35)',
                  borderRadius: '9999px',
                  padding: '0.45rem',
                  color: 'var(--destructive)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title="Remove course from path"
                aria-label="Remove course from path"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
