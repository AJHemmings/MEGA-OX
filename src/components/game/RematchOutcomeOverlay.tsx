import React, { useEffect, useRef } from 'react';
import { tokens } from '../../styles/tokens';

interface RematchOutcomeOverlayProps {
  type: 'agreed' | 'opted_out';
  onDismiss: () => void;
}

const RematchOutcomeOverlay: React.FC<RematchOutcomeOverlayProps> = ({ type, onDismiss }) => {
  // Capture onDismiss in a ref so the 3s timer doesn't hold a stale closure
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const isAgreed = type === 'agreed';
  const color    = isAgreed ? tokens.accent : tokens.textMuted;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(6,13,31,0.88)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, fontFamily: tokens.font,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        border: `1px solid ${isAgreed ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: tokens.glassRadius,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        padding: '40px 48px', textAlign: 'center',
        boxShadow: isAgreed
          ? `0 0 48px rgba(0,212,170,0.15), 0 8px 32px rgba(0,0,0,0.5)`
          : '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth: 340, width: 'calc(100% - 40px)',
        animation: 'mxSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>
          {isAgreed ? '🤝' : '👋'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color, marginBottom: 10 }}>
          {isAgreed ? 'Rematch agreed!' : 'Opponent opted out'}
        </div>
        <div style={{ fontSize: 14, color: tokens.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          {isAgreed
            ? 'Your opponent has agreed to a rematch.'
            : 'Your opponent opted out of a rematch.'}
        </div>
        <div style={{ fontSize: 12, color: tokens.textDim, fontWeight: 600 }}>
          {isAgreed ? 'Starting new game…' : 'Returning to menu…'}
        </div>
      </div>
    </div>
  );
};

export default RematchOutcomeOverlay;
