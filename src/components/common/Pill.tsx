import React from 'react';
import { tokens } from '../../styles/tokens';

export type PillVariant = 'teal' | 'purple' | 'gold' | 'red' | 'muted';

const variantStyles: Record<PillVariant, { background: string; border: string; color: string }> = {
  teal:   { background: 'rgba(0,212,170,0.15)',   border: '1px solid rgba(0,212,170,0.35)',   color: tokens.accent },
  purple: { background: 'rgba(124,77,255,0.18)',  border: '1px solid rgba(124,77,255,0.40)',  color: '#b39dff' },
  gold:   { background: 'rgba(249,168,37,0.15)',  border: '1px solid rgba(249,168,37,0.40)',  color: tokens.credits },
  red:    { background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: tokens.loss },
  muted:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: tokens.textMuted },
};

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const Pill: React.FC<PillProps> = ({ children, variant = 'muted', icon, style }) => {
  const v = variantStyles[variant];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: icon ? 6 : 0,
      background: v.background,
      border: v.border,
      color: v.color,
      borderRadius: tokens.rPill,
      padding: '5px 12px',
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: 0.3,
      ...style,
    }}>
      {icon}{children}
    </span>
  );
};

export default Pill;
