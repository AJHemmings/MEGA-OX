import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './modal';

const MultiplayerMenu: React.FC = () => {
  const navigate = useNavigate();
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2332',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '15%', right: '10%', width: '120px', height: '120px', backgroundColor: '#00d4aa', borderRadius: '50%', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '15%', width: '90px', height: '90px', backgroundColor: '#4299e1', borderRadius: '50%', opacity: 0.1, animation: 'float 7s ease-in-out infinite reverse' }} />

      <div style={{
        backgroundColor: '#2a3441',
        borderRadius: '24px',
        padding: '50px 40px',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        maxWidth: '420px',
        width: '90%',
        animation: 'slideUp 0.8s ease-out',
      }}>
        <h2 style={{ fontSize: '2.8em', margin: '0 0 15px 0', color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
          Multiplayer Mode
        </h2>
        <p style={{ color: '#a0aec0', fontSize: '1.2em', marginBottom: '40px', fontWeight: '500' }}>
          Choose your multiplayer experience
        </p>

        <div style={{ marginBottom: '30px' }}>
          <MenuButton onClick={() => navigate('/local')} primary={true} description="Play with a friend on the same device" color="#00d4aa">
            🏠 Local 2-Player
          </MenuButton>
          <MenuButton onClick={() => setShowNetworkInfo(true)} primary={true} description="Host a game for online friends" disabled={true} color="#4299e1">
            🌐 Host Online Game
          </MenuButton>
          <MenuButton onClick={() => setShowNetworkInfo(true)} primary={true} description="Join a friend's online game" disabled={true} color="#ed8936">
            🔍 Join Online Game
          </MenuButton>
          <MenuButton onClick={() => navigate('/')} primary={false} description="" color="#ff6b35">
            ← Back to Main Menu
          </MenuButton>
        </div>

        <Modal isOpen={showNetworkInfo} onClose={() => setShowNetworkInfo(false)} title="Online Multiplayer - Coming Soon!">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '4em', marginBottom: '20px' }}>🚧</div>
            <h3>Online Features Under Development</h3>
            <p style={{ marginBottom: '20px', color: '#666', lineHeight: '1.6' }}>
              Online multiplayer is currently being developed!
            </p>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <h4>🎮 Planned Features:</h4>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li><strong>Game Codes:</strong> Share a code with friends to invite them</li>
                <li><strong>Real-time Play:</strong> Live synchronization between players</li>
                <li><strong>Player Profiles:</strong> Stats, rankings, and match history</li>
                <li><strong>Matchmaking:</strong> Find random opponents to play against</li>
              </ul>
            </div>
            <p style={{ color: '#999', fontSize: '14px' }}>
              For now, enjoy local multiplayer and single-player modes!
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  primary: boolean;
  description: string;
  disabled?: boolean;
  color: string;
}> = ({ children, onClick, primary, description, disabled = false, color }) => (
  <div style={{ marginBottom: '15px' }}>
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        padding: '18px 24px',
        fontSize: '18px',
        fontWeight: 'bold',
        border: primary ? 'none' : `2px solid ${color}`,
        borderRadius: '16px',
        background: disabled ? '#3a4553' : primary ? color : 'transparent',
        color: disabled ? '#6b7280' : primary ? 'white' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(0) scale(1)',
        opacity: disabled ? 0.6 : 1,
        boxShadow: disabled ? 'none' : primary ? `0 8px 25px ${color}40, 0 4px 10px rgba(0, 0, 0, 0.1)` : '0 4px 15px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
          e.currentTarget.style.boxShadow = primary ? `0 12px 35px ${color}60, 0 8px 20px rgba(0, 0, 0, 0.15)` : `0 8px 25px ${color}30, 0 4px 15px rgba(0, 0, 0, 0.1)`;
          if (!primary) e.currentTarget.style.backgroundColor = `${color}15`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = primary ? `0 8px 25px ${color}40, 0 4px 10px rgba(0, 0, 0, 0.1)` : '0 4px 15px rgba(0, 0, 0, 0.1)';
          if (!primary) e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
    {description && (
      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#718096', textAlign: 'center' }}>
        {description}
      </p>
    )}
  </div>
);

export default MultiplayerMenu;
