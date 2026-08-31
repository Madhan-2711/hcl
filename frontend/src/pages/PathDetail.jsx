import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { api } from '../lib/api'
import Navbar from '../components/Navbar'
import MilestoneTimeline from '../components/MilestoneTimeline'
import ProgressBar from '../components/ProgressBar'
import { ArrowLeft, Map, Clock, BookOpen, Sparkles, RefreshCw } from 'lucide-react'

export default function PathDetail() {
  const { pathId } = useParams()
  const [path, setPath] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPath()
  }, [pathId])

  const loadPath = async () => {
    setLoading(true)
    try {
      const [{ data: pathData }, { data: allCourses }, { data: itemsData }] = await Promise.all([
        supabase.from('learning_paths').select('*').eq('id', pathId).single(),
        supabase.from('courses').select('*'),
        supabase.from('path_items').select('*, courses(*)').eq('path_id', pathId).order('order_index'),
      ])
      setPath(pathData)

      const courseMap = {}
      for (const c of allCourses || []) {
        courseMap[c.id] = c
      }

      setItems((itemsData || []).map(item => {
        const nestedCourse = Array.isArray(item.courses) ? item.courses[0] : item.courses
        const course = nestedCourse || courseMap[item.course_id] || {}
        return { ...item, course }
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (itemId, newStatus) => {
    const res = await api.updateItemStatus(pathId, itemId, newStatus)
    if (res?.skills_updated) {
      // Completing a course re-scores the remaining items server-side.
      await loadPath()
    } else {
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      ))
    }
  }

  const completed = items.filter(i => i.status === 'completed').length
  const totalHours = items.reduce((sum, i) => sum + (i.course?.duration_hours || 0), 0)

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)' }}>
          <div className="spinner" style={{ width: 44, height: 44 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area">
        {/* Back + Header */}
        <div className="fade-in" style={{ marginBottom: '2.5rem' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              color: 'var(--primary)', textDecoration: 'none', fontSize: '0.88rem',
              fontWeight: 700, marginBottom: '1.25rem',
            }}
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.6rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-foreground)',
                  boxShadow: 'var(--shadow-soft)',
                }}>
                  <Map size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Curated Curriculum
                  </p>
                  <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.2 }}>
                    {path?.goal_text || 'My Learning Path'}
                  </h1>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary)' }} /> {items.length} courses
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} style={{ color: 'var(--secondary)' }} /> {totalHours}h estimated
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} /> {completed} of {items.length} completed
                </span>
              </div>
            </div>
            <button onClick={loadPath} className="btn-ghost" style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Progress Card */}
        <div className="glass-card card-organic-1 fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <ProgressBar
            value={completed}
            max={items.length || 1}
            label="Overall Curriculum Completion"
            size="lg"
            color="var(--primary)"
          />
        </div>

        {/* Timeline */}
        <div className="fade-in">
          <MilestoneTimeline items={items} onStatusChange={handleStatusChange} />
        </div>
      </div>
    </div>
  )
}
