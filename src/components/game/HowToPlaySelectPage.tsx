import React from 'react';
import { useNavigate } from 'react-router-dom';

const HowToPlaySelectPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2332',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      gap: '16px',
    }}>
      <h1 style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        How to Play
      </h1>
      <p style={{ color: '#a0aec0', fontSize: '16px', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
        Choose your starting point.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>

        <button
          onClick={() => navigate('/how-to-play/beginner')}
          style={{
            width: '200px',
            padding: '32px 24px',
            background: '#2d3748',
            border: '2px solid #4a5568',
            borderRadius: '16px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '36px' }}>📖</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>Beginner</span>
          <span style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center' }}>
            Learn the core rule — how every move sends your opponent somewhere.
          </span>
        </button>

        <button
          onClick={() => navigate('/how-to-play/intermediate')}
          style={{
            width: '200px',
            padding: '32px 24px',
            background: '#2d3748',
            border: '2px solid #00d4aa',
            borderRadius: '16px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '36px' }}>⚔️</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>Intermediate</span>
          <span style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center' }}>
            Core rule + a full endgame. Win the middle column to beat X.
          </span>
        </button>

      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '32px',
          background: 'none',
          border: '1px solid #4a5568',
          color: '#a0aec0',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
    </div>
  );
};

export default HowToPlaySelectPage;
