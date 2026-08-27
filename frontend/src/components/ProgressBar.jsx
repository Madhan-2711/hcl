import React from 'react'

export default function ProgressBar({ value = 0, max = 100, label, color, showPercent = true, size = 'md' }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const barColor = color || (pct >= 70 ? 'var(--primary)' : pct >= 40 ? 'var(--secondary)' : 'var(--destructive)')
  const heights = { sm: 6, md: 10, lg: 14 }
  const h = heights[size] || 10

  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', alignItems: 'center' }}>
          {label && (
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--foreground)' }}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div style={{
        height: h,
        background: 'var(--muted)',
        borderRadius: '9999px',
        overflow: 'hidden',
        border: '1px solid rgba(222, 216, 207, 0.6)',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: '9999px',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  )
}
