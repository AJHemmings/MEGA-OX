import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActiveGame } from '../hooks/useActiveGame';

const ResumeGameToast: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const { activeGameId, forfeitedGameId } = useActiveGame(user?.id ?? null);

  const [showForfeitToast, setShowForfeitToast] = useState(false);

  // Show forfeit toast when forfeitedGameId appears, auto-dismiss after 5s
  useEffect(() => {
    if (!forfeitedGameId) return;
    setShowForfeitToast(true);
    const timer = setTimeout(() => setShowForfeitToast(false), 5000);
    return () => clearTimeout(timer);
  }, [forfeitedGameId]);

  // Dismiss forfeit toast on route change
  useEffect(() => {
    setShowForfeitToast(false);
  }, [location.pathname]);

  // Don't show resume toast if already on that game's screen
  const isOnActiveGame = params.id && params.id === activeGameId;

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#2a3441',
    border: '1px solid #00d4aa',
    borderRadius: '12px',
    padding: '16px 20px',
    color: '#fff',
    zIndex: 1000,
    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
    maxWidth: '300px',
  };

  if (activeGameId && !isOnActiveGame) {
    return (
      <div style={toastStyle}>
        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#a0aec0' }}>
          You have an active game
        </p>
        <button
          onClick={() => navigate(`/game/${activeGameId}`)}
          style={{ background: '#00d4aa', border: 'none', borderRadius: '8px', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          Resume Game
        </button>
      </div>
    );
  }

  if (showForfeitToast) {
    return (
      <div style={{ ...toastStyle, border: '1px solid #ff6b35' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#a0aec0' }}>
          You were forfeited from your last game after the reconnection window expired.
        </p>
      </div>
    );
  }

  return null;
};

export default ResumeGameToast;
