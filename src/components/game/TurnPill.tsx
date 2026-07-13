// src/components/game/TurnPill.tsx
// Shared turn indicator for all game screens: teal "play here" pill on the
// player's turn, red waiting pill otherwise.
import React from 'react';
import { tokens } from '../../styles/tokens';

export const BOARD_NAMES = ['Top-Left', 'Top', 'Top-Right', 'Left', 'Center', 'Right', 'Bottom-Left', 'Bottom', 'Bottom-Right'];

// Human-readable board constraint for the current move
export const boardConstraintLabel = (nextMicroBoardIndex: number | null) =>
  nextMicroBoardIndex !== null
    ? `PLAY IN ${BOARD_NAMES[nextMicroBoardIndex].toUpperCase()} BOARD`
    : 'FREE CHOICE';

const basePill: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: tokens.rPill,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.4,
};

const TurnPill: React.FC<{
  isMyTurn: boolean;
  nextMicroBoardIndex: number | null;
  waitingText: string;
}> = ({ isMyTurn, nextMicroBoardIndex, waitingText }) => (
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
    {isMyTurn
      ? <div style={{ ...basePill, background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.35)', color: tokens.accent }}>
          ▪ {boardConstraintLabel(nextMicroBoardIndex)}
        </div>
      : <div style={{ ...basePill, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: tokens.loss }}>
          {waitingText}
        </div>
    }
  </div>
);

export default TurnPill;
