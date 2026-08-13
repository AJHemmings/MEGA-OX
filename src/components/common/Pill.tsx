import React from 'react';
import { tokens } from '../../styles/tokens';
import { CLASSIC_THEME } from '../../theme/defaults';
import { ThemePillStyles } from '../../theme/types';

export type PillVariant = keyof ThemePillStyles;

const variantStyles = CLASSIC_THEME.pills;

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
