import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { supabase } from '../lib/supabaseClient'
import {
  ArrowRight,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  RefreshCw,
  Sparkles,
  Target,
  UploadCloud,
  XCircle,
} from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const STAGE_ORDER = ['cluster', 'domain', 'role']

const QUESTION_BANK = [
  { id: 'cluster-1', stage: 'cluster', text: 'I enjoy solving ambiguous problems with structured reasoning, logic, and evidence.', tags: ['analysis', 'data', 'research'] },
  { id: 'cluster-2', stage: 'cluster', text: 'I like shaping how people experience products, interfaces, and digital journeys.', tags: ['design', 'product', 'analysis'] },
  { id: 'cluster-3', stage: 'cluster', text: 'I enjoy building resilient systems, deployment pipelines, and scalable infrastructure.', tags: ['cloud', 'devops', 'software'] },
  { id: 'cluster-4', stage: 'cluster', text: 'I want to build things that users interact with directly, like apps, interfaces, or mobile experiences.', tags: ['mobile', 'design', 'product'] },
  { id: 'cluster-5', stage: 'cluster', text: 'I am energized by data, experimentation, and discovering patterns in real-world signals.', tags: ['data', 'ai', 'research'] },

  { id: 'domain-1', stage: 'domain', text: 'I am excited by AI, prediction systems, and turning data into intelligent solutions.', tags: ['ai', 'data', 'research'] },
  { id: 'domain-2', stage: 'domain', text: 'I like protecting systems, reducing risk, and designing secure application flows.', tags: ['security', 'cloud', 'software'] },
  { id: 'domain-3', stage: 'domain', text: 'I enjoy integrating front-end, back-end, APIs, and application logic into one product.', tags: ['software', 'product', 'cloud'] },
  { id: 'domain-4', stage: 'domain', text: 'I like exploring dashboards, KPIs, customer signals, and turning them into action.', tags: ['data', 'analysis', 'product'] },
  { id: 'domain-5', stage: 'domain', text: 'I prefer delivery automation, environment setup, monitoring, and release engineering work.', tags: ['devops', 'cloud', 'software'] },
  { id: 'domain-6', stage: 'domain', text: 'I want to work on physical or embedded experiences where software meets hardware.', tags: ['robotics', 'mobile', 'software'] },

  { id: 'role-1', stage: 'role', text: 'I want to work closely with roadmap decisions, business outcomes, and stakeholder priorities.', tags: ['product', 'business', 'analysis'] },
  { id: 'role-2', stage: 'role', text: 'I enjoy deeply technical work in architecture, performance, reliability, and large systems.', tags: ['software', 'cloud', 'devops'] },
  { id: 'role-3', stage: 'role', text: 'I like research, experimentation, and validating ideas with measurable outcomes and evidence.', tags: ['research', 'data', 'ai'] },
  { id: 'role-4', stage: 'role', text: 'I enjoy building user experiences through layout, interaction, accessibility, and visual storytelling.', tags: ['design', 'product', 'analysis'] },
  { id: 'role-5', stage: 'role', text: 'I am drawn to attacks, defenses, hardening, and protecting critical infrastructure from risk.', tags: ['security', 'cloud', 'software'] },
  { id: 'role-6', stage: 'role', text: 'I like building connected devices, embedded systems, or machines that interact with the physical world.', tags: ['robotics', 'mobile', 'software'] },
  { id: 'role-7', stage: 'role', text: 'I enjoy writing reliable integrations, APIs, and backend logic that power product features.', tags: ['software', 'data', 'cloud'] },
]

const SCORE_MAP = {
  analysis: 2.7,
  data: 3.2,
  design: 3.0,
  product: 2.5,
  cloud: 2.9,
  devops: 2.8,
  software: 2.4,
  security: 3.1,
  ai: 3.5,
  mobile: 2.6,
  research: 3.0,
  business: 2.2,
  robotics: 3.1,
}

const ROLE_SIGNATURES = {
  'Data Scientist': { data: 2.5, ai: 2.2, research: 2.0, analysis: 1.8 },
  'Machine Learning Engineer': { ai: 2.6, data: 2.3, research: 2.0 },
  'ML Ops Engineer': { ai: 2.0, devops: 2.2, cloud: 2.0 },
  'UX Designer': { design: 2.6, product: 2.0, analysis: 1.5 },
  'Product Manager': { product: 2.5, business: 2.2, analysis: 1.8 },
  'Security Engineer': { security: 2.8, cloud: 1.9, devops: 1.2 },
  'DevOps Engineer': { devops: 2.7, cloud: 2.4, security: 1.3 },
  'Frontend Developer': { design: 2.2, software: 1.8, product: 1.5 },
  'Backend Developer': { software: 2.0, cloud: 1.9, data: 1.4 },
  'Full Stack Developer': { software: 2.1, cloud: 1.8, product: 1.3 },
  'Software Engineer': { software: 2.2, cloud: 1.6, devops: 1.4 },
  'Robotics Engineer': { robotics: 2.7, mobile: 1.8, software: 1.3 },
  'Mobile App Developer': { mobile: 2.5, design: 1.8, software: 1.4 },
}

const ROLE_TRACK_MAP = {
  'Data Scientist': ['data_scientist', 'ml_engineer'],
  'Machine Learning Engineer': ['ml_engineer', 'data_scientist'],
  'ML Ops Engineer': ['ml_engineer'],
  'UX Designer': ['frontend'],
  'Frontend Developer': ['frontend'],
  'Backend Developer': ['backend'],
  'Full Stack Developer': ['frontend', 'backend'],
  'Software Engineer': ['backend', 'frontend'],
  'DevOps Engineer': ['backend'],
  'Security Engineer': ['backend'],
  'Product Manager': ['frontend', 'backend'],
  'Robotics Engineer': ['backend'],
  'Mobile App Developer': ['frontend'],
}

const ANSWER_VALUES = {
  Yes: 1,
  Maybe: 0.5,
  No: 0,
}

const SKILL_ALIASES = {
  python: 'python programming',
  'python programming': 'python programming',
  'version control': 'version control (git)',
  git: 'version control (git)',
  'ux': 'ui/ux design',
  'ui design': 'ui/ux design',
  'ui/ux': 'ui/ux design',
  'machine learning': 'machine learning',
  'ml': 'machine learning',
  'database management': 'database management',
  'sql': 'database management',
  'cloud computing': 'cloud computing',
  'devops': 'devops practices',
  'api': 'api integration',
  'apis': 'api integration',
  'problem solving': 'problem solving',
  'testing': 'testing and debugging',
  'debugging': 'testing and debugging',
  'critical thinking': 'critical thinking',
  'communication': 'communication',
  'team collaboration': 'team collaboration',
  'linux': 'linux administration',
  'linux administration': 'linux administration',
  'system architecture': 'system architecture',
  'javascript': 'javascript',
  'data analysis': 'data analysis',
  'research': 'data analysis',
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+\s()/&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function canonicalSkillName(skill = '') {
  const cleaned = normalizeText(skill)
  if (!cleaned) return ''
  const mapped = SKILL_ALIASES[cleaned] || cleaned
  return mapped
}

function buildRoleProfiles(rawRoleData = {}) {
  const categoryKeywords = {
    data: ['data', 'analysis', 'statistics', 'sql', 'etl', 'database', 'big', 'query', 'visualization'],
    design: ['design', 'ux', 'ui', 'creative', 'visual', 'interaction', 'accessibility'],
    ai: ['ai', 'ml', 'machine', 'learning', 'model', 'vision', 'nlp', 'deep', 'recommendation', 'robotics'],
    cloud: ['cloud', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'platform', 'infrastructure'],
    devops: ['devops', 'ci', 'cd', 'release', 'automation', 'monitoring', 'sre', 'build'],
    product: ['product', 'strategy', 'growth', 'manager', 'owner', 'founder', 'entrepreneur', 'consultant'],
    security: ['security', 'cyber', 'threat', 'penetration', 'risk', 'incident', 'compliance'],
    software: ['developer', 'engineer', 'software', 'application', 'backend', 'frontend', 'stack', 'web', 'mobile', 'app'],
    mobile: ['mobile', 'ios', 'android', 'flutter', 'react native', 'app'],
    research: ['research', 'scientist', 'analyst', 'quantitative', 'storyteller', 'insights'],
    network: ['network', 'infrastructure', 'system', 'admin', 'support', 'helpdesk'],
    robotics: ['robotics', 'embedded', 'iot', 'firmware', 'automation', 'control', 'simulation'],
    blockchain: ['blockchain', 'smart', 'solidity', 'tokenomics', 'wallet', 'crypto'],
  }

  return Object.entries(rawRoleData).map(([roleName, details]) => {
    const skillList = Array.isArray(details?.Skills) ? details.Skills : []
    const allText = [roleName, ...skillList].join(' ').toLowerCase()
    const categories = {}

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      let score = 0
      keywords.forEach((keyword) => {
        if (allText.includes(keyword.toLowerCase())) score += 1
      })
      if (score > 0) categories[category] = score
    })

    return {
      role: roleName,
      skills: skillList,
      categories,
    }
  })
}

function getRolePrediction(roleProfiles, answers) {
  const ranked = roleProfiles
    .map((profile) => {
      const roleSignature = ROLE_SIGNATURES[profile.role] || profile.categories || {}
      let score = 0
      let tagHits = 0

      Object.entries(answers).forEach(([questionId, value]) => {
        const question = QUESTION_BANK.find((q) => q.id === questionId)
        if (!question) return

        const base = Number(value) || 0
        if (base === 0) return

        const questionTags = question.tags || []
        const tagScore = questionTags.reduce((sum, tag) => {
          const roleWeight = roleSignature[tag] || 0
          const profileWeight = profile.categories[tag] || 0
          const weight = roleWeight || profileWeight || 0
          if (!weight) return sum

          tagHits += 1
          return sum + (weight * (SCORE_MAP[tag] || 1.2))
        }, 0)

        if (tagScore > 0) {
          score += base * tagScore
        }
      })

      const positiveCount = Object.values(answers).filter((val) => Number(val) > 0.5).length
      const roleNameBonus = (profile.role.toLowerCase().includes('designer') ? 1.5 : 0)
        + (profile.role.toLowerCase().includes('scientist') ? 1.5 : 0)
        + (profile.role.toLowerCase().includes('manager') ? 1.0 : 0)

      score += roleNameBonus + (tagHits * 1.2) + (positiveCount * 0.2)

      return { role: profile.role, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  if (!ranked.length) {
    const fallbackRoles = ['Data Scientist', 'UX Designer', 'Security Engineer', 'Product Manager', 'Robotics Engineer', 'ML Ops Engineer']
    return fallbackRoles[Math.floor(Math.random() * fallbackRoles.length)]
  }

  const topCandidates = ranked.slice(0, 3)
  const randomIndex = Math.floor(Math.random() * Math.min(topCandidates.length, 3))
  return topCandidates[randomIndex].role
}

function getSkillMatches(selectedRole, selectedSkills, allSkills) {
  const recommended = (allSkills || [])
    .map((skill) => canonicalSkillName(skill))
    .filter(Boolean)

  const selectedNormalized = (selectedSkills || [])
    .map((skill) => canonicalSkillName(skill))
    .filter(Boolean)

  const matched = [...new Set(recommended.filter((skill) => selectedNormalized.includes(skill) || selectedNormalized.some((selected) => selected.includes(skill) || skill.includes(selected))))]

  const missing = recommended.filter((skill) => !matched.includes(skill))
  const readiness = recommended.length ? Math.round((matched.length / recommended.length) * 100) : 0

  return {
    recommended,
    matched,
    missing,
    readiness,
  }
}

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str || '').join(' ')
    text += ` ${pageText}`
  }

  return text
}

export default function SkillGapAnalyzer() {
  const navigate = useNavigate()
  const [roleData, setRoleData] = useState({})
  const [roleProfiles, setRoleProfiles] = useState([])
  const [answers, setAnswers] = useState({})
  const [stageIndex, setStageIndex] = useState(0)
  const [currentStage, setCurrentStage] = useState('cluster')
  const [prediction, setPrediction] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [manualQuery, setManualQuery] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [supabaseSkills, setSupabaseSkills] = useState([])
  const [supabaseCourses, setSupabaseCourses] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/role_skills.json')
      .then((res) => res.json())
      .then((data) => {
        setRoleData(data)
        setRoleProfiles(buildRoleProfiles(data))
      })
      .catch(() => {
        setUploadStatus('Unable to load role data right now. Please try again in a moment.')
      })

    const loadCatalog = async () => {
      try {
        const [{ data: skillsData }, { data: coursesData }] = await Promise.all([
          supabase.from('skills').select('*').limit(200),
          supabase.from('courses').select('*').limit(200),
        ])

        if (skillsData) setSupabaseSkills(skillsData)
        if (coursesData) setSupabaseCourses(coursesData)
      } catch (error) {
        console.error('Catalog load error:', error)
      }
    }

    loadCatalog()
  }, [])

  const currentStageQuestions = useMemo(
    () => QUESTION_BANK.filter((question) => question.stage === currentStage),
    [currentStage],
  )

  const predictedRoleSkills = useMemo(() => {
    if (!prediction || !roleData[prediction]) return []
    return roleData[prediction]?.Skills || []
  }, [prediction, roleData])

  const skillOptions = useMemo(() => {
    const roleSpecific = prediction
      ? (roleData[prediction]?.Skills || predictedRoleSkills || []).map((skill) => skill.trim()).filter(Boolean)
      : []

    const relevantDbSkills = supabaseSkills
      .map((skill) => skill.name)
      .filter((skill) => {
        if (!prediction) return true
        const skillText = normalizeText(skill)
        if (!skillText) return false
        return roleSpecific.some((roleSkill) => {
          const normalizedRoleSkill = normalizeText(roleSkill)
          if (!normalizedRoleSkill) return false
          return (
            skillText.includes(normalizedRoleSkill) ||
            normalizedRoleSkill.includes(skillText) ||
            normalizedRoleSkill.split(/\s+/).some((part) => part.length > 3 && skillText.includes(part))
          )
        })
      })

    const staticSkills = Object.values(roleData).flatMap((entry) => entry.Skills || [])
    const combined = prediction
      ? [...roleSpecific, ...relevantDbSkills]
      : [...staticSkills, ...supabaseSkills.map((skill) => skill.name)]

    return [...new Set(combined.map((skill) => skill.trim()).filter(Boolean))].sort()
  }, [prediction, roleData, predictedRoleSkills, supabaseSkills])

  const recommendedCourses = useMemo(() => {
    if (!prediction || !supabaseCourses.length) return []
    const tracks = ROLE_TRACK_MAP[prediction] || ['frontend', 'backend']
    return supabaseCourses.filter((course) => tracks.includes(course.track)).slice(0, 4)
  }, [prediction, supabaseCourses])

  const filteredSkillOptions = useMemo(() => {
    const query = normalizeText(manualQuery)
    if (!query) return skillOptions.slice(0, 18)
    return skillOptions.filter((skill) => normalizeText(skill).includes(query)).slice(0, 18)
  }, [manualQuery, skillOptions])

  const skillComparison = useMemo(() => {
    if (!prediction) return null
    const result = getSkillMatches(prediction, selectedSkills, predictedRoleSkills)
    return result
  }, [prediction, selectedSkills, predictedRoleSkills])

  const handleAnswer = (answer) => {
    const stageQuestions = QUESTION_BANK.filter((q) => q.stage === currentStage)
    const nextAnswers = { ...answers, [stageQuestions[stageIndex].id]: answer }
    setAnswers(nextAnswers)

    if (stageIndex < stageQuestions.length - 1) {
      setStageIndex((prev) => prev + 1)
      return
    }

    const currentStageIndex = STAGE_ORDER.indexOf(currentStage)
    if (currentStageIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentStageIndex + 1]
      setCurrentStage(nextStage)
      setStageIndex(0)
      return
    }

    const predicted = getRolePrediction(roleProfiles, nextAnswers)
    setPrediction(predicted)
    setCurrentStage('completed')
    setStageIndex(0)
  }

  const resetQuiz = () => {
    setAnswers({})
    setStageIndex(0)
    setCurrentStage('cluster')
    setPrediction('')
    setSelectedSkills([])
    setResumeText('')
    setManualQuery('')
    setUploadStatus('')
  }

  const toggleSelectedSkill = (skill) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((item) => item !== skill)
      return [...prev, skill]
    })
  }

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadStatus('Reading your resume...')
      let parsedText = ''

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        parsedText = await extractTextFromPdf(file)
      } else {
        parsedText = await file.text()
      }

      setResumeText(parsedText)

      const detected = new Set()
      const lowered = normalizeText(parsedText)

      skillOptions.forEach((skill) => {
        const skillText = normalizeText(skill)
        if (!skillText) return
        if (skillText.includes(' ') ? lowered.includes(skillText) : lowered.includes(skillText)) {
          detected.add(skill)
        }
      })

      const resumeSkills = [...detected]
      setSelectedSkills((prev) => [...new Set([...prev, ...resumeSkills])])
      setUploadStatus(`Detected ${resumeSkills.length} skill matches from your resume.`)
    } catch (error) {
      setUploadStatus('The file could not be parsed. Try a text file or a clean PDF.')
      console.error(error)
    }
  }

  const currentQuestion = currentStageQuestions[stageIndex]
  const quizComplete = currentStage === 'completed'

  const gapSummary = skillComparison ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <div className="glass-card card-organic-1" style={{ padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Readiness</p>
        <h3 style={{ fontSize: '2rem', margin: 0 }}>{skillComparison.readiness}%</h3>
      </div>
      <div className="glass-card card-organic-2" style={{ padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Matched</p>
        <h3 style={{ fontSize: '2rem', margin: 0 }}>{skillComparison.matched.length}</h3>
      </div>
      <div className="glass-card card-organic-3" style={{ padding: '1.5rem' }}>
        <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Missing</p>
        <h3 style={{ fontSize: '2rem', margin: 0 }}>{skillComparison.missing.length}</h3>
      </div>
    </div>
  ) : null

  return (
    <div className="page-container hero-bg">
      <div className="content-area" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/dashboard" className="btn-ghost" style={{ padding: '0.7rem 1.2rem', fontSize: '0.82rem' }}>
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to dashboard
          </Link>
        </div>

        <div className="fade-in" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(93, 112, 82, 0.1)',
            border: '1px solid rgba(93, 112, 82, 0.25)',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            <Sparkles size={14} />
            <span>SkillPath AI</span>
          </div>

          <h1 style={{ fontSize: '2.6rem', margin: '0 0 0.75rem' }}>
            Discover your <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>ideal tech role</span>
          </h1>
          <p style={{ maxWidth: 720, margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Answer a short adaptive quiz, identify the role that fits you best, and compare your current skills against the real role expectations.
          </p>
        </div>

        {!quizComplete && (
          <div className="glass-card card-organic-1" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {currentStage} stage
                </p>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.25rem' }}>Question {stageIndex + 1}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {STAGE_ORDER.map((stage, index) => {
                  const active = stage === currentStage
                  const complete = STAGE_ORDER.indexOf(currentStage) > index || (STAGE_ORDER.indexOf(currentStage) === index && stageIndex > 0)
                  return (
                    <span
                      key={stage}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '9999px',
                        background: active ? 'rgba(93, 112, 82, 0.12)' : complete ? 'rgba(93, 112, 82, 0.08)' : 'rgba(0,0,0,0.02)',
                        color: active ? 'var(--primary)' : 'var(--text-muted)',
                        border: active ? '1px solid rgba(93, 112, 82, 0.25)' : '1px solid var(--border)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {stage}
                    </span>
                  )
                })}
              </div>
            </div>

            {currentQuestion && (
              <>
                <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.6rem', maxWidth: 760 }}>{currentQuestion.text}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
                  {Object.entries(ANSWER_VALUES).map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleAnswer(value)}
                      className="btn-secondary"
                      style={{
                        justifyContent: 'center',
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-card)',
                        fontSize: '0.93rem',
                        width: '100%',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {quizComplete && prediction && (
          <>
            <div className="glass-card card-organic-2" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Predicted role
                  </p>
                  <h2 style={{ margin: 0, fontSize: '2rem' }}>{prediction}</h2>
                </div>
                <button type="button" onClick={resetQuiz} className="btn-secondary" style={{ padding: '0.7rem 1.25rem' }}>
                  <RefreshCw size={14} /> Retake quiz
                </button>
              </div>
            </div>

            {gapSummary}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="glass-card card-organic-1" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <UploadCloud size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ margin: 0 }}>Compare your skills</h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="resume-upload" className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                    <FileText size={16} /> Upload resume
                  </label>
                  <input id="resume-upload" ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleResumeUpload} style={{ display: 'none' }} />
                </div>

                {uploadStatus && (
                  <div style={{ padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(93, 112, 82, 0.08)', border: '1px solid rgba(93, 112, 82, 0.2)', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    {uploadStatus}
                  </div>
                )}

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Manual skills</label>
                  <input
                    value={manualQuery}
                    onChange={(event) => setManualQuery(event.target.value)}
                    placeholder="Search skills like Python, SQL, AWS, UX..."
                    style={{
                      width: '100%',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      padding: '0.8rem 1rem',
                      fontSize: '0.95rem',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {manualQuery && !filteredSkillOptions.some((skill) => normalizeText(skill) === normalizeText(manualQuery)) && (
                    <button
                      type="button"
                      onClick={() => {
                        toggleSelectedSkill(manualQuery)
                        setManualQuery('')
                      }}
                      style={{
                        border: '2px dashed var(--primary)',
                        background: 'rgba(93, 112, 82, 0.08)',
                        color: 'var(--primary)',
                        borderRadius: '9999px',
                        padding: '0.45rem 0.8rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Add "{manualQuery}"
                    </button>
                  )}
                  {selectedSkills
                    .filter((skill) => !filteredSkillOptions.some((opt) => normalizeText(opt) === normalizeText(skill)))
                    .map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSelectedSkill(skill)}
                        style={{
                          border: '1px solid var(--primary)',
                          background: 'rgba(93, 112, 82, 0.12)',
                          color: 'var(--primary)',
                          borderRadius: '9999px',
                          padding: '0.45rem 0.8rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ {skill}
                      </button>
                    ))}
                  {filteredSkillOptions.map((skill) => {
                    const active = selectedSkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSelectedSkill(skill)}
                        style={{
                          border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                          background: active ? 'rgba(93, 112, 82, 0.12)' : 'var(--bg-card)',
                          color: active ? 'var(--primary)' : 'var(--text-primary)',
                          borderRadius: '9999px',
                          padding: '0.45rem 0.8rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>

                {resumeText && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>Resume preview</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', maxHeight: 120, overflow: 'auto' }}>
                      {resumeText.slice(0, 420)}{resumeText.length > 420 ? '…' : ''}
                    </p>
                    {prediction && skillComparison && (
                      <button
                        type="button"
                        onClick={() => {
                          const prompt = `I want to become a ${prediction}. I currently have these skills: ${selectedSkills.length > 0 ? selectedSkills.join(', ') : 'not specified'}. I'm missing these skills to excel in this role: ${skillComparison.missing.slice(0, 5).join(', ') || 'none identified'}.`
                          navigate('/onboarding', { state: { skillGapPrompt: prompt } })
                        }}
                        className="btn-primary"
                        style={{ marginTop: '0.8rem', width: '100%' }}
                      >
                        <Sparkles size={16} /> Start Learning Path
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-card card-organic-2" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <Target size={18} style={{ color: 'var(--secondary)' }} />
                  <h3 style={{ margin: 0 }}>{prediction} skills</h3>
                </div>

                {recommendedCourses.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ margin: '0 0 0.6rem', fontWeight: 700 }}>Suggested courses from your catalog</p>
                    <div style={{ display: 'grid', gap: '0.7rem' }}>
                      {recommendedCourses.map((course) => (
                        <div key={course.id} style={{ padding: '0.7rem 0.85rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(93, 112, 82, 0.04)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{course.title}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{course.track || 'general'} · {course.difficulty || 'beginner'} · {course.duration_hours || 0}h</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skillComparison && (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{ margin: '0 0 0.6rem', fontWeight: 700 }}>Matched skills</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skillComparison.matched.length ? skillComparison.matched.map((skill) => (
                          <span key={skill} style={{ background: 'rgba(93, 112, 82, 0.12)', color: 'var(--primary)', border: '1px solid rgba(93, 112, 82, 0.2)', borderRadius: '9999px', padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
                            <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {skill}
                          </span>
                        )) : <span style={{ color: 'var(--text-muted)' }}>No overlaps yet</span>}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{ margin: '0 0 0.6rem', fontWeight: 700 }}>Missing skills</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skillComparison.missing.length ? skillComparison.missing.map((skill) => (
                          <span key={skill} style={{ background: 'rgba(193, 140, 93, 0.08)', color: 'var(--secondary)', border: '1px solid rgba(193, 140, 93, 0.2)', borderRadius: '9999px', padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
                            <XCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {skill}
                          </span>
                        )) : <span style={{ color: 'var(--text-muted)' }}>You already match the main requirements.</span>}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <p style={{ margin: '0 0 0.6rem', fontWeight: 700 }}>Priority learning suggestions</p>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', display: 'grid', gap: '0.55rem' }}>
                        {skillComparison.missing.slice(0, 5).map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                        {!skillComparison.missing.length && <li>No major gaps detected for this role. Keep building depth in your strongest areas.</li>}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
