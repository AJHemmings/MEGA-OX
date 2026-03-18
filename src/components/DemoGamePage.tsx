import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameWrapper from './GameWrapper';
import { Modal } from './modal';
import { UNLOCK_FEATURES } from './guestUnlockFeatures';

const DemoGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [showWantMore, setShowWantMore] = useState(false);

  const handleGameOver = (result: string) => {
    setGameOverResult(result);
  };

  const handlePlayAgain = () => {
    setGameOverResult(null);
    setGameKey((k) => k + 1); // forces GameWrapper remount = fresh game
  };

  const getResultText = () => {
    if (gameOverResult === 'X') return "You won! 🎉";
    if (gameOverResult === 'O') return "AI wins! 🤖";
    return "It's a draw!";
  };

  const wantMoreButton = (
    <button
      onClick={() => setShowWantMore(true)}
      style={{
        padding: '8px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        borderRadius: 10,
        border: '1.5px solid #00d4aa',
        backgroundColor: 'transparent',
        color: '#00d4aa',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#00d4aa';
        e.currentTarget.style.color = '#1a2332';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#00d4aa';
      }}
    >
      Want More?
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      <GameWrapper
        key={gameKey}
        gameMode="single"
        onBackToMenu={() => navigate('/')}
        onGameOver={handleGameOver}
        navExtra={wantMoreButton}
      />

      {/* Want More modal */}
      <Modal
        isOpen={showWantMore}
        onClose={() => setShowWantMore(false)}
        title="Want More?"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0aec0', marginBottom: '16px', fontSize: '14px' }}>
            Create a free account to unlock:
          </p>
          <ul
            style={{
              textAlign: 'left',
              margin: '0 auto 24px',
              padding: '0 0 0 18px',
              color: '#a0aec0',
              fontSize: '14px',
              lineHeight: '2',
              display: 'inline-block',
            }}
          >
            {UNLOCK_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '13px',
                fontWeight: 'bold',
                fontSize: '15px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#00d4aa',
                color: '#1a2332',
                cursor: 'pointer',
                boxShadow: '0 4px 15px #00d4aa40',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Sign Up — It's Free
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '11px',
                fontSize: '14px',
                borderRadius: '12px',
                border: '2px solid #4299e1',
                backgroundColor: 'transparent',
                color: '#4299e1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4299e1';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4299e1';
              }}
            >
              Already have an account? Log In
            </button>
          </div>
        </div>
      </Modal>

      {/* Post-game modal */}
      <Modal
        isOpen={gameOverResult !== null}
        onClose={handlePlayAgain}
        title={getResultText()}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0aec0', marginBottom: '24px' }}>
            Sign up to save your stats, play online, and customise your profile.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '13px',
                fontWeight: 'bold',
                fontSize: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#00d4aa',
                color: '#1a2332',
                cursor: 'pointer',
                boxShadow: '0 4px 15px #00d4aa40',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '11px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '2px solid #4299e1',
                backgroundColor: 'transparent',
                color: '#4299e1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4299e1';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4299e1';
              }}
            >
              Log In
            </button>
            <button
              onClick={handlePlayAgain}
              style={{
                padding: '11px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '2px solid #718096',
                backgroundColor: 'transparent',
                color: '#718096',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a0aec0';
                e.currentTarget.style.color = '#a0aec0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#718096';
                e.currentTarget.style.color = '#718096';
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DemoGamePage;
