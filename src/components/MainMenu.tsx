import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { useRecentGames } from '../hooks/useRecentGames';
import { supabase } from '../lib/supabase';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import NewsSlideshow from './layout/NewsSlideshow';
import { CreditsBalance } from './layout/CreditsBalance';
import { useTutorial } from '../hooks/useTutorial';
import { useLoginStreak } from '../hooks/useLoginStreak';
import { Modal } from './modal';
import { LevelBadge } from './progression/LevelBadge';

const MainMenu: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const profile = usePlayerProfile();
  const recentGames = useRecentGames();
  const [_activeSeason, setActiveSeason] = useState(false);
  const [_activeTournament, setActiveTournament] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const { shouldAutoStart, markComplete } = useTutorial('home');
  const streakData = useLoginStreak();
  const [streakDismissed, setStreakDismissed] = useState(false);

  useEffect(() => {
    supabase.from('seasons').select('id').eq('status', 'active').limit(1)
      .then(({ data }) => setActiveSeason((data?.length ?? 0) > 0));
    supabase.from('tournaments').select('id').in('status', ['registration', 'active']).limit(1)
      .then(({ data }) => setActiveTournament((data?.length ?? 0) > 0));
  }, []);

  const startIntro = useCallback(() => {
    introJs()
      .setOptions({
        steps: [
          {
            element: document.querySelector('#menu-play') as Element,
            intro: 'This is the <b>Play area</b>. Train against the AI, challenge a friend locally or online, join a league, play in a tournament, or compete in a season.',
            title: 'Play',
          },
          {
            element: document.querySelector('#menu-recent-games') as Element,
            intro: 'Your <b>last 5 games</b> are shown here. Win/Loss/Draw and who you played.',
            title: 'Recent Games',
          },
          {
            element: document.querySelector('#menu-news') as Element,
            intro: 'Stay up to date with <b>news</b> — updates, events, and announcements.',
            title: 'News',
          },
          {
            element: document.querySelector('#menu-leaderboard-btn') as Element,
            intro: 'Check the <b>Leaderboard</b> to see the top-ranked players.',
            title: 'Leaderboard',
          },
          {
            element: document.querySelector('#menu-profile') as Element,
            intro: 'Your <b>profile</b>, <b>rank tier</b>, and <b>settings</b> live up here. Click your name to view your full profile.',
            title: 'Your Profile',
          },
        ],
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Got it!',
        showBullets: false,
        exitOnOverlayClick: false,
      })
      .oncomplete(markComplete)
      .onexit(markComplete)
      .start();
  }, [markComplete]);

  useEffect(() => {
    if (!shouldAutoStart) return;
    const timer = setTimeout(startIntro, 500);
    return () => clearTimeout(timer);
  }, [shouldAutoStart, startIntro]);

  const container: React.CSSProperties = { minHeight: '100vh', background: '#1a2332', color: '#fff', fontFamily: 'sans-serif' };
  const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #3a4a5a' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px', maxWidth: '900px', margin: '0 auto' };
  const card: React.CSSProperties = { background: '#2a3441', borderRadius: '12px', padding: '24px' };
  const modeBtn = (disabled: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', padding: '14px', marginBottom: '10px', borderRadius: '8px',
    border: `1px solid ${disabled ? '#3a4a5a' : '#00d4aa'}`, background: 'transparent',
    color: disabled ? '#5a6a7a' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '15px', textAlign: 'left', opacity: disabled ? 0.5 : 1
  });

  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <h1 style={{ color: '#00d4aa', margin: 0 }}>MEGA OX</h1>
        <div id="menu-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {profile && (
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => navigate(`/profile/${profile.username}`)}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <LevelBadge level={profile.level} size="sm" />
                {profile.username}
              </div>
              <div style={{ fontSize: '12px', color: '#a0aec0' }}>{profile.rank_tier} · W:{profile.wins} L:{profile.losses} D:{profile.draws}</div>
            </div>
          )}
          <CreditsBalance />
          <button onClick={() => navigate('/settings')} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>Settings</button>
        </div>
      </div>

      <div style={grid}>
        {/* Play section */}
        <div id="menu-play" style={card}>
          <h2 style={{ color: '#a0aec0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Play</h2>
          <button style={modeBtn(false)} onClick={() => setShowDifficulty(true)}>Training (vs AI)</button>
          <button style={modeBtn(false)} onClick={() => navigate('/multiplayer')}>Multiplayer</button>
          <button style={modeBtn(false)} onClick={() => navigate('/how-to-play')}>How to Play</button>
        </div>

        {/* Last 5 games */}
        <div id="menu-recent-games" style={card}>
          <h2 style={{ color: '#a0aec0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Last 5 Games</h2>
          {recentGames.length === 0 ? (
            <div style={{ color: '#a0aec0', fontSize: '14px' }}>No games yet — play your first!</div>
          ) : (
            recentGames.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: g.result === 'Win' ? '#00d4aa' : g.result === 'Loss' ? '#ff6b35' : '#a0aec0', fontWeight: 'bold', width: '40px' }}>{g.result}</span>
                <span style={{ color: '#fff' }}>vs {g.opponentUsername}</span>
                <span style={{ color: '#a0aec0', textTransform: 'capitalize' }}>{g.match_type}</span>
              </div>
            ))
          )}
        </div>

        {/* News */}
        <div id="menu-news" style={{ ...card, gridColumn: '1 / -1' }}>
          <h2 style={{ color: '#a0aec0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>News</h2>
          <NewsSlideshow />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '16px', borderTop: '1px solid #3a4a5a' }}>
        <button id="menu-leaderboard-btn" onClick={() => navigate('/leaderboard')} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Leaderboard</button>
        <button onClick={signOut} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Sign out</button>
      </div>

      {streakData?.reward && !streakDismissed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#2a3441', borderRadius: '12px', padding: '32px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔥</div>
            <h3 style={{ color: '#00d4aa', margin: '0 0 8px' }}>Day {streakData.current} Streak!</h3>
            <p style={{ color: '#a0aec0', marginBottom: '20px' }}>You've earned a daily reward: <strong style={{ color: '#fff' }}>{streakData.reward.reward_description ?? streakData.reward.reward_type}</strong></p>
            <button onClick={() => setStreakDismissed(true)}
              style={{ background: '#00d4aa', border: 'none', color: '#1a2332', padding: '12px 28px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
              Claim Reward
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={showDifficulty} onClose={() => setShowDifficulty(false)} title="Select Difficulty">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(['Easy', 'Medium', 'Hard'] as const).map((level) => {
            const colors = { Easy: '#00d4aa', Medium: '#f7931e', Hard: '#ff6b35' };
            return (
              <button
                key={level}
                onClick={() => { setShowDifficulty(false); navigate(`/training?difficulty=${level.toLowerCase()}`); }}
                style={{ padding: '14px', borderRadius: '8px', border: 'none', background: colors[level], color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {level}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default MainMenu;
