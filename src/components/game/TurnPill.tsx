// src/components/game/TurnPill.tsx
// Shared turn indicator for all game screens: teal "play here" pill on the
// player's turn, red waiting pill otherwise.
import React from 'react';
import Pill from '../common/Pill';

export const BOARD_NAMES = ['Top-Left', 'Top', 'Top-Right', 'Left', 'Center', 'Right', 'Bottom-Left', 'Bottom', 'Bottom-Right'];

// Human-readable board constraint for the current move. Online games read
// nextMicroBoardIndex straight from the DB row, so an out-of-range value must
// degrade to FREE CHOICE rather than crash the game view.
export const boardConstraintLabel = (nextMicroBoardIndex: number | null) => {
  const name = nextMicroBoardIndex !== null ? BOARD_NAMES[nextMicroBoardIndex] : undefined;
  return name ? `PLAY IN ${name.toUpperCase()} BOARD` : 'FREE CHOICE';
};

const pillStyle: React.CSSProperties = {
  padding: '6px 14px',
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
      ? <Pill variant="teal" style={pillStyle}>▪ {boardConstraintLabel(nextMicroBoardIndex)}</Pill>
      : <Pill variant="red" style={pillStyle}>{waitingText}</Pill>
    }
  </div>
);

export default TurnPill;
