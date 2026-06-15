import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft } from '../icons';
import { tokens } from '../../styles/tokens';

interface BackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, ariaLabel = 'Go back' }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  // Keep a stable ref to onClick so the Escape listener never needs to re-subscribe
  const onClickRef = useRef(onClick);
  useEffect(() => { onClickRef.current = onClick; });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!ref.current) return;
      // Skip if this button is not visible (handles dual mobile/desktop render)
      if (ref.current.offsetWidth === 0 && ref.current.offsetHeight === 0) return;
      onClickRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <button
      ref={ref}
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
