import React from 'react';
import { useNavigate } from 'react-router-dom';

const UNLOCK_FEATURES = [
  'Online multiplayer — play against others in real time',
  'Leaderboard — track your ranking and win rate',
  "Game history — review every game you've played",
  'Profile customisation — username and avatar',
];

const GuestLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        {/* Game name */}
        <h1
          style={{
            fontSize: '3.5em',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#00d4aa',
            letterSpacing: '4px',
          }}
        >
          MEGA OX
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '1.1em',
            color: '#a0aec0',
            margin: '0 0 40px 0',
          }}
        >
          Ultimate Noughts &amp; Crosses. Every move matters.
        </p>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/demo')}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: '#00d4aa',
            color: '#1a2332',
            cursor: 'pointer',
            marginBottom: '32px',
            boxShadow: '0 8px 25px #00d4aa40',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px #00d4aa60';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px #00d4aa40';
          }}
        >
          Play Demo
        </button>

        {/* Unlock list */}
        <div
          style={{
            backgroundColor: '#2a3441',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              margin: '0 0 16px 0',
              fontWeight: 'bold',
              color: '#ffffff',
              fontSize: '15px',
            }}
          >
            Create an account to unlock:
          </p>
          <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#a0aec0', lineHeight: '2' }}>
            {UNLOCK_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Auth links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: '2px solid #00d4aa',
              backgroundColor: 'transparent',
              color: '#00d4aa',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
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
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 'bold',
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
      </div>
    </div>
  );
};

export default GuestLandingPage;
