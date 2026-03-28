import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActiveGame } from '../hooks/useActiveGame';

// Tracks forfeit game IDs already shown this session so refresh doesn't re-show them
const SHOWN_FORFEIT_KEY = 'shownForfeitGameId';

const ResumeGameToast: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeGameId, forfeitedGameId } = useActiveGame(user?.id ?? null, location.pathname);

  const [showForfeitToast, setShowForfeitToast] = useState(false);

  // Only show forfeit notification on the main menu, once per game ID
  useEffect(() => {
    if (!forfeitedGameId || location.pathname !== '/menu') {
      setShowForfeitToast(false);
      return;
    }
    const alreadyShown = sessionStorage.getItem(SHOWN_FORFEIT_KEY) === forfeitedGameId;
    if (alreadyShown) return;

    setShowForfeitToast(true);
    sessionStorage.setItem(SHOWN_FORFEIT_KEY, forfeitedGameId);
    const timer = setTimeout(() => setShowForfeitToast(false), 5000);
    return () => clearTimeout(timer);
  }, [forfeitedGameId, location.pathname]);

  // Don't show resume toast when already on any game screen.
  // The toast is only useful on non-game pages (menu, profile, etc.).
  // We can't reliably compare against activeGameId here because the DB query
  // may return a different game than the one in the URL (stale rps game, timing race).
  const isOnGameRoute = location.pathname.startsWith('/game/');

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

  if (activeGameId && !isOnGameRoute) {
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
