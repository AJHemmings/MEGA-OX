// src/components/game/ScoreChip.tsx
// Round-wins score chip (X : O) shown between the two player cards.
import React from 'react';
import { tokens } from '../../styles/tokens';

const ScoreChip: React.FC<{ x: number; o: number; style?: React.CSSProperties }> = ({ x, o, style }) => (
  <div style={{
    padding: '4px 8px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    fontSize: 13, fontWeight: 900, fontFamily: 'monospace',
    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: tokens.text,
    ...style,
  }}>
    <span style={{ color: tokens.accent }}>{x}</span>
    <span style={{ color: tokens.textMuted }}>:</span>
    <span style={{ color: tokens.loss }}>{o}</span>
  </div>
);

export default ScoreChip;
