import React, { useEffect, useRef } from 'react';

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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        // Agreed: nearly-opaque cover screen. Opted-out: modal overlay.
        background: isAgreed ? 'rgba(10, 16, 26, 0.96)' : 'rgba(10, 16, 26, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
    >
      <div
        style={{
          background: '#2a3441',
          borderRadius: '20px',
          padding: '40px 48px',
          textAlign: 'center',
          border: `2px solid ${isAgreed ? '#00d4aa' : '#3a4a5a'}`,
          boxShadow: isAgreed
            ? '0 0 60px rgba(0, 212, 170, 0.15), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 340,
          width: '90%',
        }}
      >
        <h2
          style={{
            color: isAgreed ? '#00d4aa' : '#ffffff',
            margin: '0 0 12px',
            fontSize: 22,
            fontWeight: 'bold',
          }}
        >
          {isAgreed ? 'Rematch agreed!' : 'Opponent opted out'}
        </h2>
        <p style={{ color: '#a0aec0', margin: '0 0 20px', fontSize: 15, lineHeight: 1.5 }}>
          {isAgreed
            ? 'Your opponent has agreed to a rematch.'
            : 'Your opponent opted out of a rematch.'}
        </p>
        <p style={{ color: '#4a5568', fontSize: 13, margin: 0 }}>
          {isAgreed ? 'Starting new game...' : 'Returning to menu...'}
        </p>
      </div>
    </div>
  );
};

export default RematchOutcomeOverlay;
