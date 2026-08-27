import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

const THRESHOLD = 70

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const color = val >= THRESHOLD ? 'var(--accent-green)' : val >= 40 ? 'var(--accent-amber)' : '#ef4444'
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-glow)',
      borderRadius: 8, padding: '0.75rem 1rem',
    }}>
      <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>{label}</p>
      <p style={{ margin: 0, color, fontSize: '0.9rem', fontWeight: 700 }}>{val}% proficiency</p>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Target: {THRESHOLD}%
      </p>
    </div>
  )
}

export default function SkillGapChart({ skills = [] }) {
  if (!skills.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <p>No skills data yet. Complete onboarding to see your skill gaps.</p>
      </div>
    )
  }

  const data = skills.map(s => ({
    name: s.skill_name.length > 14 ? s.skill_name.slice(0, 12) + '…' : s.skill_name,
    fullName: s.skill_name,
    proficiency: s.proficiency,
  }))

  const getBarColor = (proficiency) => {
    if (proficiency >= THRESHOLD) return 'var(--accent-green)'
    if (proficiency >= 40) return 'var(--accent-amber)'
    return '#ef4444'
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--accent-green)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proficient (≥70%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--accent-amber)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Developing (40–69%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#ef4444' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gap (&lt;40%)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(99,179,237,0.15)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine
            y={THRESHOLD}
            stroke="rgba(99,179,237,0.4)"
            strokeDasharray="6 4"
            label={{ value: 'Target', position: 'insideTopRight', fill: 'var(--accent-cyan)', fontSize: 11 }}
          />
          <Bar dataKey="proficiency" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.proficiency)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
