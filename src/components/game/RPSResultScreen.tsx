// src/components/game/RPSResultScreen.tsx
import React, { useEffect } from 'react';
import { RPSPick, RPSResult } from '../../lib/rps';

interface RPSResultScreenProps {
  creatorPick: RPSPick;
  joinerPick: RPSPick;
  isCreator: boolean;
  result: RPSResult;   // 'p1' = creator wins, 'p2' = joiner wins, 'draw' (should re-pick)
  onContinue: () => void;
}

const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const RPSResultScreen: React.FC<RPSResultScreenProps> = ({
  creatorPick, joinerPick, isCreator, result, onContinue,
}) => {
  const iWin = (result === 'p1' && isCreator) || (result === 'p2' && !isCreator);
  const outcomeText = result === 'draw' ? "It's a draw — re-picking..." : iWin ? 'You go first!' : 'Opponent goes first — your board will be shown!';

  useEffect(() => {
    const t = setTimeout(onContinue, 3000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '48px', fontSize: '64px' }}>
        <div style={{ textAlign: 'center' }}>
          <div>{EMOJI[creatorPick]}</div>
          <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>
            {isCreator ? 'You' : 'Opponent'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '32px', color: '#a0aec0' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div>{EMOJI[joinerPick]}</div>
          <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>
            {isCreator ? 'Opponent' : 'You'}
          </div>
        </div>
      </div>
      <h3 style={{ fontSize: '24px', margin: 0, color: iWin ? '#00d4aa' : '#a0aec0' }}>
        {outcomeText}
      </h3>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Starting game...</p>
    </div>
  );
};

export default RPSResultScreen;
