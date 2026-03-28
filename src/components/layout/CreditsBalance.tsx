// src/components/layout/CreditsBalance.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProgression } from '../../hooks/useProgression';

interface CreditsBalanceProps {
  /** Called when the user clicks the balance — navigate to shop (Phase 6) */
  onClick?: () => void;
}

export const CreditsBalance: React.FC<CreditsBalanceProps> = ({ onClick }) => {
  const { user } = useAuth();
  const { credits, loading } = useProgression(user?.id);

  if (!user || loading) return null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: onClick ? 'pointer' : 'default',
        padding: '4px 12px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        userSelect: 'none',
      }}
    >
      <span>💳</span>
      <span>{credits.toLocaleString()}</span>
    </div>
  );
};
