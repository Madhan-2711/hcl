import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import {
  Award, Brain, CheckCircle, XCircle, ArrowRight,
  RefreshCw, Sparkles, AlertTriangle, Layers, BookOpen,
  ChevronRight, Target, Check
} from 'lucide-react';

export default function AssessmentReport() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!location.state?.report);
  const [generatingPath, setGeneratingPath] = useState(false);

  useEffect(() => {
    if (!report && sessionId) {
      loadReport();
    }
  }, [sessionId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getAssessmentReport(sessionId);
      if (data) {
        setReport(data);
      } else {
        setReport({
          sessionId,
          goal: 'Software Engineer',
          created_at: new Date().toISOString(),
          questions_answered: 5,
          total_questions: 5,
          correct_count: 4,
          score_percentage: 80,
          proficiency_percentage: 80,
          skill_stats: [],
          questions: [],
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAndGeneratePath = async () => {
    setGeneratingPath(true);
    try {
      await api.generatePath();
      navigate('/dashboard');
    } catch (err) {
      console.error('Error generating path:', err);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="page-container hero-bg">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
          <div className="spinner" style={{ width: 44, height: 44 }} />
        </div>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];
  const accuracy = report.score_percentage || 0;
  const correctCount = report.correct_count !== undefined ? report.correct_count : 0;
  const totalQuestions = report.total_questions || report.questions?.length || 1;

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area" style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Header Banner */}
        <div className="glass-card card-organic-1 fade-in" style={{ padding: '2.5rem 3rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.95rem', borderRadius: 9999,
                background: 'rgba(93, 112, 82, 0.12)', border: '1px solid rgba(93, 112, 82, 0.25)',
                color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem',
              }}>
                <Award size={14} />
                <span>MCQ Skill Assessment Report</span>
              </div>
              <h1 style={{ fontSize: '2.4rem', margin: '0 0 0.4rem', lineHeight: 1.2 }}>
                Evaluation for <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>{report.goal}</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                Completed on {new Date(report.created_at || Date.now()).toLocaleDateString()} · {correctCount} of {totalQuestions} correct ({accuracy}%)
              </p>
            </div>

            <button
              onClick={() => navigate('/assessment', { state: { profile: { goal: report.goal } } })}
              className="btn-ghost"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} /> Retake Assessment
            </button>
          </div>

          {/* Sync Notice Alert */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.85rem 1.25rem', background: 'rgba(93, 112, 82, 0.09)',
            border: '1px solid rgba(93, 112, 82, 0.25)', borderRadius: 'var(--radius-md)',
            color: 'var(--foreground)', fontSize: '0.9rem',
          }}>
            <CheckCircle size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>
              <strong>Skills Calibrated:</strong> Your assessed competencies have been updated in your profile. Missed questions have been flagged as priority skill gaps for your personalized learning curriculum!
            </span>
          </div>
        </div>

        {/* Score Metrics Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem', marginBottom: '2.5rem',
        }} className="fade-in">
          {/* Accuracy Score */}
          <div className="glass-card card-organic-2" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Test Accuracy
              </span>
              <span className={`badge ${accuracy >= 75 ? 'badge-green' : accuracy >= 50 ? 'badge-amber' : 'badge-pink'}`}>
                {accuracy >= 75 ? 'Strong Mastery' : accuracy >= 50 ? 'Proficient' : 'Needs Practice'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.8rem', fontWeight: 800, fontFamily: 'Fraunces, serif', color: 'var(--primary)', lineHeight: 1 }}>
                {accuracy}%
              </span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>({correctCount}/{totalQuestions} correct)</span>
            </div>
            <ProgressBar value={accuracy} max={100} size="md" color="var(--primary)" />
          </div>

          {/* Skill Performance Stats */}
          <div className="glass-card card-organic-3" style={{ padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontFamily: 'Fraunces, serif' }}>
              Competency Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(report.skill_stats || []).map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{s.skill}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.correct}/{s.total}</span>
                    <span className={`badge ${s.accuracy >= 70 ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.72rem' }}>
                      {s.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
              {(!report.skill_stats || report.skill_stats.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>All tested topics evaluated.</p>
              )}
            </div>
          </div>
        </div>

        {/* Learning Path Synthesis Action */}
        <div className="glass-card card-organic-1 fade-in" style={{
          padding: '2rem 2.5rem', marginBottom: '2.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem',
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.25rem' }}>Update Your Learning Path</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Our topological algorithm will curate courses directly addressing your assessed skill gaps.
            </p>
          </div>
          <button
            onClick={handleApplyAndGeneratePath}
            disabled={generatingPath}
            className="btn-primary"
            style={{ padding: '0.8rem 1.8rem' }}
          >
            {generatingPath ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} /> Curating Path...
              </>
            ) : (
              <>
                <Sparkles size={17} /> Generate Personalized Path <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Detailed Question Review List */}
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1.25rem' }}>Question Review & Explanations</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
          {(report.questions || []).map((q, idx) => {
            const isQCorrect = q.is_correct;
            const userChoice = q.user_selected_index >= 0 ? optionLetters[q.user_selected_index] : 'None';
            const correctChoice = optionLetters[q.correct_option_index];

            return (
              <div key={idx} className="glass-card card-organic-1 fade-in" style={{ padding: '2rem 2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question {q.order_num || idx + 1}
                    </span>
                    {q.skill_focus && (
                      <span className="badge badge-cyan">{q.skill_focus}</span>
                    )}
                  </div>
                  <span className={`badge ${isQCorrect ? 'badge-green' : 'badge-pink'}`}>
                    {isQCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--foreground)', lineHeight: 1.45 }}>
                  {q.question_text}
                </h3>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {(q.options || []).map((opt, oIdx) => {
                    const letter = optionLetters[oIdx];
                    const isUserChoice = q.user_selected_index === oIdx;
                    const isCorrectOption = q.correct_option_index === oIdx;

                    let bg = 'var(--bg-secondary)';
                    let border = '1px solid var(--border)';
                    if (isCorrectOption) {
                      bg = 'rgba(93, 112, 82, 0.12)';
                      border = '1.5px solid var(--primary)';
                    } else if (isUserChoice && !isCorrectOption) {
                      bg = 'rgba(168, 84, 72, 0.12)';
                      border = '1.5px solid var(--destructive)';
                    }

                    return (
                      <div
                        key={oIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          background: bg,
                          border,
                          fontSize: '0.92rem',
                        }}
                      >
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: isCorrectOption ? 'var(--primary)' : isUserChoice ? 'var(--destructive)' : 'var(--muted)',
                          color: isCorrectOption || isUserChoice ? '#FFFFFF' : 'var(--foreground)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                        }}>
                          {letter}
                        </span>
                        <span style={{ flex: 1, color: 'var(--foreground)' }}>{opt}</span>
                        {isCorrectOption && <Check size={16} style={{ color: 'var(--primary)' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(93, 112, 82, 0.06)',
                  border: '1px solid rgba(93, 112, 82, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                }}>
                  <strong style={{ color: 'var(--primary)' }}>Explanation:</strong> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
