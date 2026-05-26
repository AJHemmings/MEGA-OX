import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import { ChevronLeft } from '../icons';

const MODES = [
  {
    key:  'beginner',
    icon: '📖',
    label: 'Beginner',
    desc: 'Learn the core rule — how every move sends your opponent somewhere.',
    tint: 'rgba(249,168,37,0.12)',
    border: 'rgba(249,168,37,0.3)',
  },
  {
    key:  'intermediate',
    icon: '⚔️',
    label: 'Intermediate',
    desc: 'Core rule + a full endgame. Win the middle column to beat X.',
    tint: `rgba(0,212,170,0.12)`,
    border: `rgba(0,212,170,0.35)`,
  },
];

const HowToPlaySelectPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        maxWidth: 520, margin: '0 auto', padding: '0 20px',
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800 }}>How to Play</span>
        </div>

        <div style={{ fontSize: 14, color: tokens.textMuted, marginBottom: 28, fontWeight: 600 }}>
          Choose your starting point.
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => navigate(`/how-to-play/${m.key}`)}
              style={{
                flex: '1 1 160px', padding: '28px 20px', borderRadius: 16,
                background: m.tint, border: `1px solid ${m.border}`,
                color: tokens.text, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                fontFamily: tokens.font,
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: 36 }}>{m.icon}</span>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{m.label}</span>
              <span style={{ fontSize: 12, color: tokens.textMuted, textAlign: 'center', lineHeight: 1.5 }}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </PageBackground>
  );
};

export default HowToPlaySelectPage;
