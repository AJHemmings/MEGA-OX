// src/components/season/SeasonPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import Pill from '../common/Pill';
import TabBar from '../common/TabBar';
import { ChevronLeft } from '../icons';

const SeasonPage: React.FC = () => {
  const navigate = useNavigate();
  const profile  = usePlayerProfile();
  const isMobile = useIsMobile();

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        maxWidth: 520, margin: '0 auto', padding: '0 16px',
        paddingBottom: isMobile ? 100 : 60,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Season</span>
          <Pill variant="purple">SEASON 04</Pill>
        </div>

        <Glass style={{ textAlign: 'center', padding: '48px 24px' } as React.CSSProperties}>
          {/* Season emblem */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, rgba(124,77,255,0.4), rgba(74,31,160,0.6))',
            border: '2px solid rgba(124,77,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
            boxShadow: '0 8px 28px rgba(124,77,255,0.35)',
          }}>
            🏆
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Season 04</div>
          <div style={{ fontSize: 14, color: tokens.textMuted, marginBottom: 20, fontWeight: 600, lineHeight: 1.6 }}>
            Season rankings, rewards, and challenges<br />are coming soon.
          </div>
          <div style={{ fontSize: 12, color: tokens.textDim, fontWeight: 700, letterSpacing: 0.5 }}>
            STAY TUNED
          </div>
        </Glass>
      </div>
      {isMobile && <TabBar username={profile?.username ?? undefined} />}
    </PageBackground>
  );
};

export default SeasonPage;
