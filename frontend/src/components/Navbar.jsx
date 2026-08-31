import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../App'
import {
  LayoutDashboard, BookOpen, LogOut, Menu, X, Sparkles, User, Brain
} from 'lucide-react'
import LogoIcon from './LogoIcon'

export default function Navbar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/skill-gap', label: 'SkillGap', icon: Brain },
    { to: '/onboarding', label: 'New Goal', icon: Sparkles },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div style={{
      position: 'sticky',
      top: '1rem',
      zIndex: 50,
      padding: '0 1.25rem',
      maxWidth: 1280,
      margin: '0 auto 1.5rem',
    }}>
      <nav style={{
        background: scrolled ? 'rgba(253, 252, 248, 0.94)' : 'rgba(253, 252, 248, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid var(--border)',
        borderRadius: '9999px',
        boxShadow: scrolled ? 'var(--shadow-soft-hover)' : 'var(--shadow-soft)',
        padding: '0.5rem 1.25rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link
            to="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}
          >
            <div style={{
              width: 38,
              height: 38,
              background: 'rgba(93, 112, 82, 0.12)',
              border: '1.5px solid var(--border)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-soft)',
              color: 'var(--primary)',
              transition: 'transform 0.3s ease',
            }}>
              <LogoIcon size={24} color="var(--primary)" />
            </div>
            <span style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}>
              LearnAI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(240, 235, 229, 0.5)',
              padding: '0.25rem 0.35rem',
              borderRadius: '9999px',
              border: '1px solid rgba(222, 216, 207, 0.6)',
            }}>
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = isActive(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif',
                      textDecoration: 'none',
                      color: active ? 'var(--foreground)' : 'var(--text-muted)',
                      background: active ? '#FFFFFF' : 'transparent',
                      boxShadow: active ? '0 2px 8px rgba(93, 112, 82, 0.12)' : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icon size={15} style={{ color: active ? 'var(--primary)' : 'inherit' }} />
                      {label}
                    </span>
                    {active && (
                      <span style={{
                        position: 'absolute',
                        bottom: 3,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                      }} />
                    )}
                  </Link>
                )
              })}
            </div>

            {session && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginLeft: '0.5rem' }}>
                <div
                  title={session.user?.email}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: '1.5px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: 'var(--foreground)',
                  }}
                >
                  {(session.user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-ghost"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}
