// src/components/game/EmojiBubble.tsx
import React from 'react';
import '../animations.css';

interface Props {
  emoji: string;
  align?: 'left' | 'center' | 'right'; // horizontal anchor — parent must be position:relative
}

const alignStyle: Record<NonNullable<Props['align']>, React.CSSProperties> = {
  left:   { left: 0 },
  center: { left: '50%', transform: 'translateX(-50%)' },
  right:  { right: 0 },
};

// Absolutely positioned so it overlays the UI without ever pushing layout —
// it must sit just below an ancestor with position:relative.
const EmojiBubble: React.FC<Props> = ({ emoji, align = 'center' }) => (
  <div style={{
    position: 'absolute',
    top: 'calc(100% + 6px)',
    ...alignStyle[align],
    background: '#2a3441',
    border: '2px solid #4a5568',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    animation: 'emojiBounce 0.3s ease-out',
    zIndex: 10,
    pointerEvents: 'none',
  }}>
    {emoji}
  </div>
);

export default EmojiBubble;
