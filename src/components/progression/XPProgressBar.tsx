import React from 'react';
import { MAX_LEVEL } from '../../lib/progression';
import { tokens } from '../../styles/tokens';

interface XPProgressBarProps {
  level: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  xpToNext: number;
  height?: number;
  showLabel?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  level, xpIntoLevel, xpNeededForLevel, xpToNext, height = 8, showLabel = true,
}) => {
  const isMaxLevel = level >= MAX_LEVEL;
  const fillPct = isMaxLevel ? 100 : Math.min(100, (xpIntoLevel / xpNeededForLevel) * 100);

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: 11,
          fontWeight: 700,
          color: tokens.textMuted,
          letterSpacing: 0.4,
        }}>
          <span>LVL {level} · {xpIntoLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP</span>
          {!isMaxLevel && <span>{xpToNext.toLocaleString()} to go</span>}
          {isMaxLevel && <span>Max Level</span>}
        </div>
      )}
      <div style={{
        height,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: tokens.rPill,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${fillPct}%`,
          background: `linear-gradient(90deg, ${tokens.accent}, ${tokens.xp})`,
          borderRadius: tokens.rPill,
          boxShadow: '0 0 8px rgba(0,212,170,0.45)',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
};
