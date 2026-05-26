import React from 'react';
import { tokens } from '../../styles/tokens';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { width: 26,  fontSize: 11 },
  md: { width: 34,  fontSize: 13 },
  lg: { width: 44,  fontSize: 16 },
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md' }) => {
  const { width, fontSize } = sizeMap[size];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width,
      height: width,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${tokens.xp}, ${tokens.xpDark})`,
      color: tokens.text,
      fontWeight: 900,
      fontSize,
      border: '1.5px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 14px rgba(124,77,255,0.4)',
      flexShrink: 0,
    }}>
      {level}
    </span>
  );
};
