import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { useRecentGames } from '../hooks/useRecentGames';
import { supabase } from '../lib/supabase';
import NewsSlideshow from './layout/NewsSlideshow';
import TutorialOverlay from './layout/TutorialOverlay';
import { useTutorial } from '../hooks/useTutorial';
import { Modal } from './modal';

const MainMenu: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const profile = usePlayerProfile();
  const recentGames = useRecentGames();
  const [activeSeason, setActiveSeason] = useState(false);
  const [activeTournament, setActiveTournament] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const { showTutorial, completeTutorial } = useTutorial('home');

  useEffect(() => {
    supabase.from('seasons').select('id').eq('status', 'active').limit(1)
      .then(({ data }) => setActiveSeason((data?.length ?? 0) > 0));
    supabase.from('tournaments').select('id').in('status', ['registration', 'active']).limit(1)
      .then(({ data }) => setActiveTournament((data?.length ?? 0) > 0));
  }, []);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {profile && (
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => navigate(`/profile/${profile.username}`)}>
              <div style={{ fontWeight: 'bold' }}>{profile.username}</div>
              <div style={{ fontSize: '12px', color: '#a0aec0' }}>{profile.rank_tier} · W:{profile.wins} L:{profile.losses} D:{profile.draws}</div>
            </div>
          )}
          <button onClick={() => navigate('/settings')} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>Settings</button>
        </div>
      </div>

      <div style={grid}>
        {/* Play section */}
        <div style={card}>
          <h2 style={{ color: '#a0aec0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Play</h2>
          <button style={modeBtn(false)} onClick={() => setShowDifficulty(true)}>Training (vs AI)</button>
          <button style={modeBtn(false)} onClick={() => navigate('/multiplayer')}>Multiplayer</button>
        </div>

        {/* Last 5 games */}
        <div style={card}>
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
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <h2 style={{ color: '#a0aec0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>News</h2>
          <NewsSlideshow />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '16px', borderTop: '1px solid #3a4a5a' }}>
        <button onClick={() => navigate('/leaderboard')} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Leaderboard</button>
        <button onClick={signOut} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Sign out</button>
      </div>

      {showTutorial && (
        <TutorialOverlay
          steps={[
            { title: 'Welcome to MEGA OX!', description: 'MEGA OX is Ultimate Tic-Tac-Toe — a 3×3 grid of smaller boards. Win a small board to claim that cell on the big board. Win three big cells in a row to win the game.' },
            { title: 'Your move sends your opponent', description: 'The cell you play in a small board determines which small board your opponent must play in next. Plan ahead!' },
            { title: 'Play vs AI or Online', description: 'Use Training to play against the AI, or use Multiplayer to challenge a friend locally or online. Good luck!' },
          ]}
          onComplete={completeTutorial}
        />
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
