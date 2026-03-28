// src/components/progression/LevelBadge.tsx
import React from 'react';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 16, md: 20, lg: 28 };

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md' }) => {
  const fontSize = sizeMap[size];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#4a4af4',
      color: '#fff',
      borderRadius: '4px',
      padding: '1px 6px',
      fontSize,
      fontWeight: 700,
      lineHeight: 1.4,
      minWidth: fontSize * 1.6,
    }}>
      {level}
    </span>
  );
};
