// src/components/game/LocalRPSScreen.tsx
import React, { useState } from 'react';
import { randomRPSPick, resolveRPS, RPSPick, RPSResult } from '../../lib/rps';

interface LocalRPSScreenProps {
  onResult: (p1GoesFirst: boolean) => void;
}

const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const LocalRPSScreen: React.FC<LocalRPSScreenProps> = ({ onResult }) => {
  const [result, setResult] = useState<{ p1Pick: RPSPick; p2Pick: RPSPick; outcome: RPSResult } | null>(null);

  const play = () => {
    const p1Pick = randomRPSPick();
    const p2Pick = randomRPSPick();
    const outcome = resolveRPS(p1Pick, p2Pick);
    if (outcome === 'draw') {
      play();
      return;
    }
    setResult({ p1Pick, p2Pick, outcome });
  };

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '48px', fontSize: '64px' }}>
          <div style={{ textAlign: 'center' }}>
            <div>{EMOJI[result.p1Pick]}</div>
            <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>Player 1</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '32px', color: '#a0aec0' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div>{EMOJI[result.p2Pick]}</div>
            <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>Player 2</div>
          </div>
        </div>
        <h3 style={{ fontSize: '24px', margin: 0, color: '#00d4aa' }}>
          {result.outcome === 'p1' ? 'Player 1 goes first!' : 'Player 2 goes first!'}
        </h3>
        <button
          onClick={() => onResult(result.outcome === 'p1')}
          style={{ padding: '14px 32px', fontSize: '16px', background: '#00d4aa', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <h2 style={{ fontSize: '28px', margin: 0 }}>Rock Paper Scissors</h2>
      <p style={{ color: '#a0aec0' }}>Determines who goes first</p>
      <button
        onClick={play}
        style={{ padding: '20px 48px', fontSize: '18px', background: '#2a3441', border: '2px solid #00d4aa', color: '#00d4aa', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Rock Paper Scissors
      </button>
    </div>
  );
};

export default LocalRPSScreen;
