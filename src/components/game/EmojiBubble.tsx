// src/components/game/EmojiBubble.tsx
import React from 'react';

interface Props {
  emoji: string;
  side: 'left' | 'right'; // which side of the board
}

const EmojiBubble: React.FC<Props> = ({ emoji, side }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    [side]: '-60px',
    transform: 'translateY(-50%)',
    background: '#2a3441',
    border: '2px solid #4a5568',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    animation: 'emojiBounce 0.3s ease-out',
    zIndex: 10,
    pointerEvents: 'none',
  }}>
    {emoji}
  </div>
);

export default EmojiBubble;
