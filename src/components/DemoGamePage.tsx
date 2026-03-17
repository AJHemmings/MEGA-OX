import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameWrapper from './GameWrapper';
import { Modal } from './modal';
import { UNLOCK_FEATURES } from './guestUnlockFeatures';

const DemoGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '24px',
        padding: '20px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        flexWrap: 'wrap',
      }}
    >
      {/* Game area */}
      <div style={{ flex: '0 0 auto' }}>
        <GameWrapper
          key={gameKey}
          gameMode="single"
          onBackToMenu={() => navigate('/')}
          onGameOver={handleGameOver}
        />
      </div>

      {/* Signup sidebar */}
      <div
        style={{
          flex: '0 0 240px',
          backgroundColor: '#2a3441',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          alignSelf: 'flex-start',
          marginTop: '20px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2em', color: '#00d4aa' }}>
          Want more?
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#a0aec0', fontSize: '14px' }}>
          Create a free account to unlock:
        </p>
        <ul
          style={{
            margin: '0 0 24px 0',
            padding: '0 0 0 18px',
            color: '#a0aec0',
            fontSize: '14px',
            lineHeight: '2',
          }}
        >
          {UNLOCK_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            padding: '12px',
            fontWeight: 'bold',
            fontSize: '15px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#00d4aa',
            color: '#1a2332',
            cursor: 'pointer',
            marginBottom: '10px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px #00d4aa40',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 25px #00d4aa60';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px #00d4aa40';
          }}
        >
          Sign Up
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '10px',
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
          Log In
        </button>
      </div>

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
