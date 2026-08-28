import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { api } from '../lib/api'
import { useAuth } from '../App'
import Navbar from '../components/Navbar'
import SkillGapChart from '../components/SkillGapChart'
import ProgressBar from '../components/ProgressBar'
import MilestoneTimeline from '../components/MilestoneTimeline'
import RecommendationCard from '../components/RecommendationCard'
import AIAssistantPanel from '../components/AIAssistantPanel'
import {
  Brain, TrendingUp, Zap, BookOpen, ArrowRight,
  Sparkles, BarChart2, MessageCircle, Map, RefreshCw,
  CheckCircle, Clock, PlayCircle, Compass
} from 'lucide-react'

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user?.id

  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [pathItems, setPathItems] = useState([])
  const [latestPath, setLatestPath] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [activeTab, setActiveTab] = useState('overview') // overview | path | skills | recs | chat
  const [loading, setLoading] = useState(true)
  const [recsLoading, setRecsLoading] = useState(false)

  useEffect(() => {
    if (userId) loadDashboard()
  }, [userId])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const { data: profileData } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!profileData) {
        navigate('/onboarding')
        return
      }
      setProfile(profileData)

      const { data: skillsData } = await supabase
        .from('learner_skills')
        .select('*, skills(name)')
        .eq('learner_id', userId)
      setSkills((skillsData || []).map(s => ({
        ...s,
        skill_name: s.skills?.name || `Skill ${s.skill_id}`,
      })))

      const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('learner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (paths?.length > 0) {
        const path = paths[0]
        setLatestPath(path)

        const [{ data: allCourses }, { data: items }] = await Promise.all([
          supabase.from('courses').select('*'),
          supabase.from('path_items').select('*, courses(*)').eq('path_id', path.id).order('order_index'),
        ])

        const courseMap = {}
        for (const c of allCourses || []) {
          courseMap[c.id] = c
        }

        setPathItems((items || []).map(item => {
          const nestedCourse = Array.isArray(item.courses) ? item.courses[0] : item.courses
          const course = nestedCourse || courseMap[item.course_id] || {}
          return {
            ...item,
            course,
          }
        }))
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    setRecsLoading(true)
    try {
      const res = await api.getRecommendations(5)
      setRecommendations(res.recommendations || [])
    } catch (err) {
      console.error('Recs error:', err)
    } finally {
      setRecsLoading(false)
    }
  }

  const handleStatusChange = async (itemId, newStatus) => {
    if (!latestPath) return
    await api.updateItemStatus(latestPath.id, itemId, newStatus)
    setPathItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: newStatus } : item
    ))
  }

  const totalItems = pathItems.length
  const completedItems = pathItems.filter(i => i.status === 'completed').length
  const inProgressItems = pathItems.filter(i => i.status === 'in_progress').length
  const nextItem = pathItems.find(i => i.status !== 'completed')
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const totalHours = pathItems.reduce((sum, item) => sum + (item.course?.duration_hours || 0), 0)
  const completedHours = pathItems.filter(i => i.status === 'completed').reduce((sum, item) => sum + (item.course?.duration_hours || 0), 0)

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ width: 44, height: 44, margin: '0 auto 1.25rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontFamily: 'Fraunces, serif', fontSize: '1.1rem' }}>
              Gathering your learning journey...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'path', label: 'My Path', icon: Map },
    { id: 'skills', label: 'Skills', icon: Brain },
    { id: 'recs', label: 'Recommended', icon: Sparkles },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
  ]

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area">
        {/* Welcome Header */}
        <div className="fade-in" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(93, 112, 82, 0.1)',
                border: '1px solid rgba(93, 112, 82, 0.25)',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.6rem',
              }}>
                <Compass size={13} />
                <span>Learning Dashboard</span>
              </div>
              <h1 style={{ fontSize: '2.4rem', margin: '0 0 0.4rem', lineHeight: 1.2 }}>
                {profile?.career_goal ? (
                  <>Path to <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>{profile.career_goal}</span></>
                ) : (
                  'Your Learning Journey'
                )}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                {session?.user?.email} · {skills.length} skills tracked · {totalItems} courses curated
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/onboarding" className="btn-secondary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.88rem' }}>
                <Sparkles size={15} /> New Goal
              </Link>
              <button onClick={loadDashboard} className="btn-ghost" style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards (Asymmetric Wabi-Sabi Cards) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }} className="fade-in">
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Overall Progress"
            value={`${overallProgress}%`}
            sub={`${completedItems}/${totalItems} courses completed`}
            color="var(--primary)"
            progress={overallProgress}
            cardClass="card-organic-1"
          />
          <StatCard
            icon={<CheckCircle size={20} />}
            label="Completed"
            value={completedItems}
            sub="milestones achieved"
            color="var(--primary)"
            cardClass="card-organic-2"
          />
          <StatCard
            icon={<PlayCircle size={20} />}
            label="In Progress"
            value={inProgressItems}
            sub="active course"
            color="var(--secondary)"
            cardClass="card-organic-3"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Hours Learned"
            value={completedHours}
            sub={`of ${totalHours}h total estimated`}
            color="#587B7F"
            cardClass="card-organic-1"
          />
          <StatCard
            icon={<Brain size={20} />}
            label="Skills Tracked"
            value={skills.length}
            sub={`${skills.filter(s => s.proficiency >= 70).length} proficient (70%+)`}
            color="var(--accent-foreground)"
            cardClass="card-organic-2"
          />
        </div>

        {/* Segmented Pill Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: '9999px',
          padding: 5,
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id)
                  if (id === 'recs' && recommendations.length === 0) loadRecommendations()
                }}
                style={{
                  flex: 1,
                  minWidth: 110,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  border: 'none',
                  borderRadius: '9999px',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? 'var(--foreground)' : 'var(--text-muted)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  fontFamily: 'Nunito, sans-serif',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(93, 112, 82, 0.12)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Icon size={16} style={{ color: active ? 'var(--primary)' : 'inherit' }} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="fade-in" key={activeTab}>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.8fr)', gap: '2rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Next Action Card */}
                {nextItem && (
                  <div className="glass-card card-organic-1" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, bottom: 0,
                      width: 5,
                      background: 'var(--secondary)',
                    }} />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <Zap size={18} style={{ color: 'var(--secondary)' }} />
                      <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Next Milestone
                      </h3>
                    </div>
                    <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.4rem' }}>{nextItem.course?.title}</h2>
                    {nextItem.explanation && (
                      <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {nextItem.explanation}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      {nextItem.course?.difficulty && (
                        <span className={`badge ${nextItem.course.difficulty === 'beginner' ? 'badge-green' : nextItem.course.difficulty === 'intermediate' ? 'badge-amber' : 'badge-pink'}`}>
                          {nextItem.course.difficulty}
                        </span>
                      )}
                      {nextItem.course?.duration_hours && (
                        <span className="badge badge-cyan">{nextItem.course.duration_hours}h</span>
                      )}
                      <span className="badge badge-purple">{nextItem.milestone_label || 'Core'}</span>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => handleStatusChange(nextItem.id, 'in_progress')}
                    >
                      <PlayCircle size={17} /> Start Course <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* Overall progress Card */}
                <div className="glass-card card-organic-2" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem' }}>
                    Curriculum Progress
                  </h3>
                  <ProgressBar
                    value={completedItems}
                    max={totalItems || 1}
                    size="lg"
                    label={`${completedItems} of ${totalItems} courses completed`}
                    color="var(--primary)"
                  />
                  <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Not Started', count: totalItems - completedItems - inProgressItems, color: 'var(--text-muted)' },
                      { label: 'In Progress', count: inProgressItems, color: 'var(--secondary)' },
                      { label: 'Completed', count: completedItems, color: 'var(--primary)' },
                    ].map(({ label, count, color }) => (
                      <div key={label}>
                        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'Fraunces, serif' }}>{count}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: AI Assistant Panel */}
              <div className="glass-card card-organic-3" style={{ overflow: 'hidden', height: 560 }}>
                <AIAssistantPanel />
              </div>
            </div>
          )}

          {/* PATH */}
          {activeTab === 'path' && (
            <div>
              {latestPath && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.5rem' }}>Your Curated Curriculum</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Target: {latestPath.goal_text} · {totalItems} courses · {totalHours}h estimated
                    </p>
                  </div>
                  <Link to={`/paths/${latestPath.id}`} className="btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
                    <Map size={15} /> Full View
                  </Link>
                </div>
              )}
              {pathItems.length > 0 ? (
                <MilestoneTimeline items={pathItems} onStatusChange={handleStatusChange} />
              ) : (
                <div className="glass-card card-organic-1" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                  <BookOpen size={44} style={{ color: 'var(--primary)', margin: '0 auto 1.25rem', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>No learning path yet</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 1.5rem' }}>
                    Describe your career goal in natural language to let our algorithm curate your personalized sequence.
                  </p>
                  <Link to="/onboarding" className="btn-primary" style={{ display: 'inline-flex' }}>
                    <Sparkles size={16} /> Start Onboarding
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* SKILLS */}
          {activeTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-card card-organic-1" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Skill Mastery Radar</h3>
                <SkillGapChart skills={skills} />
              </div>
              <div className="glass-card card-organic-2" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>All Tracked Competencies</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {skills.sort((a, b) => b.proficiency - a.proficiency).map(skill => (
                    <div key={skill.skill_id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <span style={{ minWidth: 150, fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        {skill.skill_name}
                      </span>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={skill.proficiency} max={100} showPercent={false} size="sm" />
                      </div>
                      <span style={{
                        minWidth: 42,
                        textAlign: 'right',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: skill.proficiency >= 70 ? 'var(--primary)' : skill.proficiency >= 40 ? 'var(--secondary)' : 'var(--destructive)',
                      }}>
                        {skill.proficiency}%
                      </span>
                      <span className={`badge ${skill.source === 'assessed' ? 'badge-blue' : skill.source === 'inferred' ? 'badge-purple' : 'badge-cyan'}`}>
                        {skill.source}
                      </span>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>No skills recorded yet. Complete onboarding to analyze your profile.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RECOMMENDATIONS */}
          {activeTab === 'recs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.5rem' }}>Semantic AI Recommendations</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Ranked by pgvector semantic similarity & skill-gap closure
                  </p>
                </div>
                <button onClick={loadRecommendations} disabled={recsLoading} className="btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
                  {recsLoading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
                  Refresh
                </button>
              </div>

              {recsLoading && (
                <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 1.25rem' }} />
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem' }}>Calculating semantic course alignments...</p>
                </div>
              )}

              {!recsLoading && recommendations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {recommendations.map((rec, i) => (
                    <RecommendationCard key={rec.course?.id || i} rec={rec} index={i} />
                  ))}
                </div>
              )}

              {!recsLoading && recommendations.length === 0 && (
                <div className="glass-card card-organic-1" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                  <Sparkles size={44} style={{ color: 'var(--secondary)', margin: '0 auto 1.25rem', opacity: 0.8 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 440, margin: '0 auto' }}>
                    Click "Refresh" to discover courses tailored to your specific career goal and skill gaps.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <div className="glass-card card-organic-2" style={{ overflow: 'hidden', height: 620 }}>
              <AIAssistantPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, progress, cardClass = 'card-organic-1' }) {
  return (
    <div className={`glass-card ${cardClass}`} style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `${color}18`, border: `1.5px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <p style={{ margin: '0 0 0.25rem', fontSize: '1.85rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'Fraunces, serif' }}>{value}</p>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{sub}</p>
      {progress !== undefined && (
        <div style={{ marginTop: '0.85rem' }}>
          <ProgressBar value={progress} max={100} showPercent={false} size="sm" color={color} />
        </div>
      )}
    </div>
  )
}
