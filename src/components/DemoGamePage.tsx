import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameWrapper from './GameWrapper';
import Glass from './common/Glass';
import PrimaryButton from './common/PrimaryButton';
import { SparkleIcon } from './icons';
import { tokens } from '../styles/tokens';

const DemoGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameKey, setGameKey]         = useState(0);
  const [showNudge, setShowNudge]     = useState(false);
  const [gameOver, setGameOver]       = useState(false);

  // Show nudge after 30 s of play, or immediately on game over
  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 30_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey]);

  const handleGameOver = () => {
    setGameOver(true);
    setShowNudge(true);
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setShowNudge(false);
    setGameKey(k => k + 1);
  };

  return (
    <>
      <GameWrapper
        key={gameKey}
        gameMode="single"
        demoMode
        onBackToMenu={() => navigate('/')}
        onGameOver={handleGameOver}
      />

      {/* Sign-up nudge card — fixed bottom overlay */}
      {showNudge && (
        <div style={{
          position: 'fixed', left: 16, right: 16, bottom: 24,
          zIndex: 200, maxWidth: 420, margin: '0 auto',
        }}>
          <Glass padding={0} style={{ overflow: 'hidden' }}>
            {/* Gradient overlay strip */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(124,77,255,0.18))',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(0,212,170,0.2)', border: `1px solid ${tokens.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SparkleIcon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>
                  {gameOver ? 'Game over!' : 'Enjoying the game?'}
                </div>
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  Sign up to save progress and rank up
                </div>
              </div>
              {/* Dismiss */}
              {!gameOver && (
                <button
                  onClick={() => setShowNudge(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, fontSize: 18, padding: 4, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', gap: 10 }}>
              <PrimaryButton onClick={() => navigate('/signup')} fullWidth>Sign Up</PrimaryButton>
              {gameOver && (
                <button
                  onClick={handlePlayAgain}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: tokens.rBtn,
                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                    color: tokens.textMuted, fontFamily: tokens.font, fontSize: 14, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                >
                  Play again
                </button>
              )}
            </div>
          </Glass>
        </div>
      )}
    </>
  );
};

export default DemoGamePage;
