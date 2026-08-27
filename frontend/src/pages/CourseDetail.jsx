import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { ArrowLeft, BookOpen, Clock, BarChart2, Tag, ExternalLink } from 'lucide-react'

const DIFFICULTY_BADGE = {
  beginner: 'badge-green',
  intermediate: 'badge-amber',
  advanced: 'badge-pink',
}

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [courseSkills, setCourseSkills] = useState({ taught: [], prereqs: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    setLoading(true)
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      setCourse(courseData)

      const { data: csData } = await supabase
        .from('course_skills')
        .select('is_prerequisite, skills(name)')
        .eq('course_id', courseId)

      const taught = csData?.filter(r => !r.is_prerequisite).map(r => r.skills?.name).filter(Boolean) || []
      const prereqs = csData?.filter(r => r.is_prerequisite).map(r => r.skills?.name).filter(Boolean) || []
      setCourseSkills({ taught, prereqs })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  if (!course) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-area" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>Course not found</h2>
          <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area" style={{ maxWidth: 840 }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--primary)', textDecoration: 'none', fontSize: '0.88rem',
            fontWeight: 700, marginBottom: '1.75rem',
          }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>

        <div className="glass-card card-organic-1 fade-in" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {course.difficulty && <span className={`badge ${DIFFICULTY_BADGE[course.difficulty] || 'badge-blue'}`}>{course.difficulty}</span>}
            {course.track && <span className="badge badge-purple">{course.track?.replace('_', ' ')}</span>}
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '1.25rem', lineHeight: 1.25 }}>{course.title}</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '1.02rem', marginBottom: '2rem' }}>
            {course.description}
          </p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {course.duration_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} /> <span>{course.duration_hours} hours total</span>
              </div>
            )}
            {course.url && (
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
              >
                <ExternalLink size={15} /> Open Course Material
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card card-organic-2" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={16} style={{ color: 'var(--primary)' }} /> Skills You'll Learn
            </h3>
            {courseSkills.taught.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {courseSkills.taught.map(s => <span key={s} className="badge badge-green">{s}</span>)}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No skills mapped</p>
            )}
          </div>
          <div className="glass-card card-organic-3" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} style={{ color: 'var(--secondary)' }} /> Prerequisites
            </h3>
            {courseSkills.prereqs.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {courseSkills.prereqs.map(s => <span key={s} className="badge badge-amber">{s}</span>)}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No prerequisite requirements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
