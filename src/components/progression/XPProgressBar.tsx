// src/components/progression/XPProgressBar.tsx
import React from 'react';
import { MAX_LEVEL } from '../../lib/progression';

interface XPProgressBarProps {
  level: number;
  xpIntoLevel: number;       // XP earned within the current level
  xpNeededForLevel: number;  // Total XP span of the current level
  xpToNext: number;          // XP remaining until next level
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  level, xpIntoLevel, xpNeededForLevel, xpToNext
}) => {
  const isMaxLevel = level >= MAX_LEVEL;
  const fillPct = isMaxLevel ? 100 : Math.min(100, (xpIntoLevel / xpNeededForLevel) * 100);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#aaa' }}>
        <span>Level {level}</span>
        {!isMaxLevel && <span>{xpToNext.toLocaleString()} XP to Level {level + 1}</span>}
        {isMaxLevel && <span>Max Level</span>}
      </div>
      <div style={{
        height: 10,
        background: '#222',
        borderRadius: 5,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${fillPct}%`,
          background: '#4a4af4',
          borderRadius: 5,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
};
