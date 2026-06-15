import React, { useState } from 'react';
import { ChevronLeft } from '../icons';
import { tokens } from '../../styles/tokens';

interface BackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, ariaLabel = 'Go back' }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        background: hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none',
        borderRadius: 20,
        cursor: 'pointer',
        color: tokens.text,
        padding: 0,
        lineHeight: 0,
        flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <ChevronLeft size={24} />
    </button>
  );
};

export default BackButton;
