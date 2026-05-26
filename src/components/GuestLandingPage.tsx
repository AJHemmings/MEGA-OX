import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../styles/tokens';
import PageBackground from './common/PageBackground';
import Glass from './common/Glass';
import PrimaryButton from './common/PrimaryButton';
import SecondaryButton from './common/SecondaryButton';
import { SparkleIcon } from './icons';

const UNLOCK_ROWS = [
  { icon: '🏆', label: 'Ranked multiplayer + leaderboards', tint: 'rgba(0,212,170,0.15)' },
  { icon: '⚡', label: 'XP system + achievements',          tint: 'rgba(124,77,255,0.15)' },
  { icon: '🎨', label: 'Skins, avatars + customisation',    tint: 'rgba(249,168,37,0.15)' },
];

const GuestLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        maxWidth: 420, margin: '0 auto',
        padding: '60px 20px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minHeight: '100vh',
      }}>

        {/* Hero logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            fontSize: 44, fontWeight: 900, letterSpacing: 4, lineHeight: 1.1,
            background: 'linear-gradient(135deg, #fff 30%, #00d4aa 70%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            MEGA<br />OX
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 1.7 }}>
          Ultimate Noughts &amp; Crosses.<br />Every move matters.
        </div>

        {/* Board preview placeholder */}
        <div style={{
          width: 240, height: 240, borderRadius: 20, marginBottom: 28, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(124,77,255,0.22))',
          border: '2px solid rgba(0,212,170,0.35)',
          boxShadow: 'inset 0 0 40px rgba(0,212,170,0.25), 0 8px 32px rgba(0,0,0,0.4)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 3, padding: 12,
        }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 8,
              background: i === 4
                ? 'rgba(0,212,170,0.15)'
                : 'rgba(255,255,255,0.04)',
              border: i === 4
                ? '1px solid rgba(0,212,170,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i === 4 && <SparkleIcon size={14} />}
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div style={{ width: '100%', marginBottom: 20 }}>
          <PrimaryButton onClick={() => navigate('/demo')} fullWidth>
            ▶&nbsp; Play Demo
          </PrimaryButton>
        </div>

        {/* Unlock list */}
        <Glass style={{ width: '100%', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
            Create an account to unlock
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UNLOCK_ROWS.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: r.tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {r.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: tokens.text }}>{r.label}</span>
              </div>
            ))}
          </div>
        </Glass>

        {/* Auth row */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <SecondaryButton onClick={() => navigate('/login')} fullWidth>Log In</SecondaryButton>
          {/* Outline / tertiary variant */}
          <button
            onClick={() => navigate('/signup')}
            style={{
              flex: 1, padding: '12px 0', borderRadius: tokens.rBtn,
              border: `1.5px solid ${tokens.accent}`,
              color: tokens.accent, background: 'transparent',
              fontFamily: tokens.font, fontSize: 14, fontWeight: 800,
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = tokens.accent;
              e.currentTarget.style.color = tokens.bgBase;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = tokens.accent;
            }}
          >
            Sign Up
          </button>
        </div>

      </div>
    </PageBackground>
  );
};

export default GuestLandingPage;
