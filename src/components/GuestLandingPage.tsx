import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../styles/tokens';
import PageBackground from './common/PageBackground';
import Glass from './common/Glass';
import PrimaryButton from './common/PrimaryButton';

const UNLOCK_ROWS = [
  { icon: '🏆', label: 'Ranked multiplayer + leaderboards', tint: 'rgba(0,212,170,0.15)', comingSoon: true },
  { icon: '⚡', label: 'XP system + achievements',          tint: 'rgba(124,77,255,0.15)', comingSoon: false },
  { icon: '🎨', label: 'Skins, avatars + customisation',    tint: 'rgba(249,168,37,0.15)', comingSoon: false },
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
                {r.comingSoon && (
                  <span style={{
                    marginLeft: 'auto', flexShrink: 0,
                    fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                    color: tokens.accent, background: 'rgba(0,212,170,0.12)',
                    border: '1px solid rgba(0,212,170,0.3)',
                    borderRadius: 100, padding: '2px 8px',
                  }}>
                    Coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </Glass>

        {/* Auth section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <PrimaryButton onClick={() => navigate('/login')} fullWidth>Log In</PrimaryButton>
          <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted }}>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: tokens.font, fontSize: 13, fontWeight: 700,
                color: tokens.accent, cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Sign up!
            </button>
          </p>
        </div>

      </div>
    </PageBackground>
  );
};

export default GuestLandingPage;
