import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import {
  Award, Brain, CheckCircle, XCircle, ArrowRight,
  RefreshCw, AlertCircle, Sparkles, HelpCircle, ChevronRight
} from 'lucide-react';

export default function SkillAssessment() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = session?.user?.id;

  const passedProfile = location.state?.profile || null;
  const numQuestions = location.state?.numQuestions || 5;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(passedProfile);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User answers state: questionIndex -> selectedOptionIndex (0-3)
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId] = useState(`mcq_${Date.now()}`);

  useEffect(() => {
    initAssessment();
  }, []);

  const initAssessment = async () => {
    setLoading(true);
    setError('');

    try {
      let targetProfile = profile;
      if (!targetProfile) {
        const dbProfile = await api.getProfile();
        const dbSkills = await api.getSkills();
        targetProfile = {
          goal: dbProfile?.career_goal || 'Software Engineer',
          experience_level: dbProfile?.experience_level || 'intermediate',
          skills: dbSkills?.map(s => s.skills?.name).filter(Boolean) || ['Python', 'SQL', 'React', 'Docker'],
        };
        setProfile(targetProfile);
      }

      const generated = await api.generateMCQQuestions(targetProfile, numQuestions);
      setQuestions(generated);
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize assessment:', err);
      setError(err.message || 'Could not generate MCQ assessment questions.');
      setLoading(false);
    }
  };

  const handleSelectOption = (index) => {
    if (isRevealed) return; // Prevent changing after confirmation
    setSelectedOption(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    setIsRevealed(true);
    setUserAnswers(prev => ({
      ...prev,
      [currentIdx]: selectedOption,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      const nextAnswer = userAnswers[currentIdx + 1];
      setSelectedOption(nextAnswer !== undefined ? nextAnswer : null);
      setIsRevealed(nextAnswer !== undefined);
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = async () => {
    setSubmitting(true);
    try {
      const updatedAnswers = {
        ...userAnswers,
        ...(selectedOption !== null ? { [currentIdx]: selectedOption } : {}),
      };

      const report = await api.evaluateMCQSession({
        sessionId,
        userId,
        goal: profile?.goal || profile?.career_goal || 'Software Engineering',
        questions,
        userAnswers: updatedAnswers,
      });

      navigate(`/assessment/report/${sessionId}`, { state: { report } });
    } catch (err) {
      console.error('Error finalizing assessment:', err);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="page-container hero-bg">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
          <div style={{ textAlign: 'center' }} className="fade-in">
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Generating Tailored MCQ Skill Test</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto' }}>
              Synthesizing practical technical questions for {profile?.goal || 'your profile'}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="page-container hero-bg">
        <Navbar />
        <div className="content-area" style={{ maxWidth: 640, textAlign: 'center', paddingTop: '3rem' }}>
          <div className="glass-card card-organic-1" style={{ padding: '3rem' }}>
            <AlertCircle size={44} style={{ color: 'var(--destructive)', margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Assessment Failed to Load</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error}</p>
            <button className="btn-primary" onClick={initAssessment} style={{ margin: '0 auto' }}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || {};
  const optionLetters = ['A', 'B', 'C', 'D'];
  const progressPercent = Math.round(((currentIdx + 1) / Math.max(questions.length, 1)) * 100);
  const isCorrect = selectedOption === currentQ.correct_option_index;

  return (
    <div className="page-container hero-bg">
      <Navbar />
      <div className="content-area" style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Header Progress */}
        <div className="fade-in" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-purple" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Award size={13} /> MCQ Skill Assessment
              </span>
              {currentQ.skill_focus && (
                <span className="badge badge-cyan">{currentQ.skill_focus}</span>
              )}
              {currentQ.difficulty && (
                <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>
                  {currentQ.difficulty}
                </span>
              )}
            </div>

            <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'Fraunces, serif', fontSize: '1.1rem' }}>
              Question {currentIdx + 1} of {questions.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 8, background: 'var(--muted)', borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
                borderRadius: 9999,
                width: `${progressPercent}%`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-card card-organic-1 fade-in" style={{ padding: '2.5rem', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Skill Evaluated: <span style={{ color: 'var(--primary)' }}>{currentQ.skill_focus}</span>
          </div>

          <h2 style={{ fontSize: '1.45rem', lineHeight: 1.45, marginBottom: '2rem', color: 'var(--foreground)' }}>
            {currentQ.question_text}
          </h2>

          {/* 4 MCQ Option Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
            {(currentQ.options || []).map((opt, oIdx) => {
              const letter = optionLetters[oIdx] || String(oIdx + 1);
              const isSelected = selectedOption === oIdx;
              const isOptionCorrect = currentQ.correct_option_index === oIdx;

              let cardBg = isSelected ? 'rgba(93, 112, 82, 0.08)' : 'var(--bg-secondary)';
              let cardBorder = isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)';

              if (isRevealed) {
                if (isOptionCorrect) {
                  cardBg = 'rgba(93, 112, 82, 0.14)';
                  cardBorder = '2px solid var(--primary)';
                } else if (isSelected && !isOptionCorrect) {
                  cardBg = 'rgba(168, 84, 72, 0.12)';
                  cardBorder = '2px solid var(--destructive)';
                }
              }

              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelectOption(oIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.1rem 1.35rem',
                    borderRadius: 'var(--radius-md)',
                    background: cardBg,
                    border: cardBorder,
                    cursor: isRevealed ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? 'var(--shadow-soft)' : 'none',
                  }}
                >
                  {/* Option Badge (A, B, C, D) */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isRevealed && isOptionCorrect
                      ? 'var(--primary)'
                      : isRevealed && isSelected && !isOptionCorrect
                      ? 'var(--destructive)'
                      : isSelected
                      ? 'var(--primary)'
                      : 'var(--muted)',
                    color: (isSelected || (isRevealed && isOptionCorrect)) ? '#FFFFFF' : 'var(--foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}>
                    {letter}
                  </div>

                  {/* Option Text */}
                  <div style={{ flex: 1, fontSize: '0.96rem', lineHeight: 1.5, color: 'var(--foreground)', fontWeight: isSelected ? 600 : 400 }}>
                    {opt}
                  </div>

                  {/* Right Status Icon */}
                  {isRevealed && isOptionCorrect && (
                    <CheckCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  )}
                  {isRevealed && isSelected && !isOptionCorrect && (
                    <XCircle size={20} style={{ color: 'var(--destructive)', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Box (Revealed after confirmation) */}
          {isRevealed && (
            <div className="fade-in" style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: isCorrect ? 'rgba(93, 112, 82, 0.08)' : 'rgba(168, 84, 72, 0.08)',
              border: isCorrect ? '1.5px solid rgba(93, 112, 82, 0.3)' : '1.5px solid rgba(168, 84, 72, 0.3)',
              marginBottom: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 800, fontSize: '0.95rem', color: isCorrect ? 'var(--primary)' : 'var(--destructive)' }}>
                {isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                <span>{isCorrect ? 'Correct Answer!' : `Incorrect — Correct answer is Option ${optionLetters[currentQ.correct_option_index]}`}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Action Button Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              type="button"
              onClick={finishAssessment}
              disabled={submitting}
              className="btn-ghost"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              Finish Early
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {!isRevealed ? (
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  disabled={selectedOption === null}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  Confirm Answer <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={submitting}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  {currentIdx + 1 < questions.length ? (
                    <>Next Question <ChevronRight size={16} /></>
                  ) : (
                    <>View Assessment Report <ArrowRight size={16} /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
