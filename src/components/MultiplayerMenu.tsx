import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../styles/tokens';
import PageBackground from './common/PageBackground';
import Glass from './common/Glass';
import BackButton from './common/BackButton';
import TabBar from './common/TabBar';
import { useIsMobile } from '../hooks/useIsMobile';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerProfile } from '../hooks/usePlayerProfile';

interface GameCard {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  bg: string;
  border: string;
  borderHover: string;
  onClick: () => void;
}

const FriendlyCard: React.FC<GameCard> = ({ id, emoji, title, sub, bg, border, borderHover, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      key={id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
        background: hovered ? bg.replace(/0\.\d+\)/, '0.18)') : bg,
        border: `1px solid ${hovered ? borderHover : border}`,
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        fontFamily: tokens.font,
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: tokens.textMuted }}>{sub}</div>
      </div>
      <span style={{ color: tokens.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
    </button>
  );
};

const MultiplayerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const profile = usePlayerProfile();
  const isMobile = useIsMobile();

  const modeCards: GameCard[] = [
    {
      id: 'find',
      emoji: '⚡',
      title: 'Find Game',
      sub: 'Match up against another player',
      bg: 'rgba(0,212,170,0.10)',
      border: 'rgba(0,212,170,0.25)',
      borderHover: 'rgba(0,212,170,0.45)',
      onClick: () => navigate('/matchmaking?mode=ranked&view=searching'),
    },
    {
      id: 'host',
      emoji: '🌐',
      title: 'Host a game',
      sub: 'Get a 6-letter code to share',
      bg: 'rgba(66,153,225,0.10)',
      border: 'rgba(66,153,225,0.25)',
      borderHover: 'rgba(66,153,225,0.40)',
      onClick: () => navigate('/matchmaking?mode=friendly&view=create'),
    },
    {
      id: 'join',
      emoji: '🔍',
      title: 'Join with code',
      sub: "Enter your friend's code",
      bg: 'rgba(124,77,255,0.10)',
      border: 'rgba(124,77,255,0.25)',
      borderHover: 'rgba(124,77,255,0.40)',
      onClick: () => navigate('/matchmaking?mode=friendly&view=join'),
    },
    {
      id: 'local',
      emoji: '👥',
      title: 'Local 2-player',
      sub: 'Pass and play on this device',
      bg: 'rgba(247,147,30,0.10)',
      border: 'rgba(247,147,30,0.25)',
      borderHover: 'rgba(247,147,30,0.40)',
      onClick: () => navigate('/local'),
    },
  ];

  const content = (
    <div style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 600, margin: isMobile ? undefined : '40px auto', padding: isMobile ? '0 16px' : '0 60px', paddingBottom: isMobile ? 100 : 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '16px 0 12px' : '20px 0 16px' }}>
        <BackButton onClick={() => navigate('/menu')} />
        <span style={{ fontSize: 18, fontWeight: 800 }}>Multiplayer</span>
      </div>

      {/* Mode cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {modeCards.map((card) => <FriendlyCard key={card.id} {...card} />)}
      </div>

      {/* Online now strip */}
      <Glass padding={14} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: tokens.accent, flexShrink: 0,
          boxShadow: `0 0 6px ${tokens.accent}`, display: 'inline-block', animation: 'mxPulse 1.5s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textMuted }}>Players online now</span>
      </Glass>

    </div>
  );

  return (
    <PageBackground>
      {content}
      {isMobile && <TabBar username={profile?.username} />}
    </PageBackground>
  );
};

export default MultiplayerMenu;
