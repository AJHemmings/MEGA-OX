// src/components/game/RPSResultScreen.tsx
import React, { useEffect } from 'react';
import { RPSPick, RPSResult } from '../../lib/rps';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';

interface RPSResultScreenProps {
  creatorPick: RPSPick;
  joinerPick:  RPSPick;
  isPlayerX:   boolean;
  result:      RPSResult;
  onContinue:  () => void;
}

const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const RPSResultScreen: React.FC<RPSResultScreenProps> = ({
  creatorPick, joinerPick, isPlayerX, result, onContinue,
}) => {
  const iWin = (result === 'p1' && isPlayerX) || (result === 'p2' && !isPlayerX);
  const outcomeText = result === 'draw'
    ? "It's a draw — re-picking…"
    : iWin ? 'You go first!' : 'Opponent goes first!';

  // Caller must pass a stable onContinue (useCallback or top-level fn)
  useEffect(() => {
    const t = setTimeout(onContinue, 3000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Glass style={{ textAlign: 'center' }}>

            {/* VS row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>{EMOJI[creatorPick]}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4 }}>
                  {isPlayerX ? 'YOU' : 'OPPONENT'}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: tokens.textDim }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>{EMOJI[joinerPick]}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4 }}>
                  {isPlayerX ? 'OPPONENT' : 'YOU'}
                </div>
              </div>
            </div>

            {/* Outcome */}
            <div style={{
              fontSize: 22, fontWeight: 900, marginBottom: 8,
              color: result === 'draw' ? tokens.textMuted : iWin ? tokens.accent : tokens.loss,
            }}>
              {outcomeText}
            </div>
            <div style={{ fontSize: 13, color: tokens.textDim, fontWeight: 600 }}>
              Starting game…
            </div>

          </Glass>
        </div>
      </div>
    </PageBackground>
  );
};

export default RPSResultScreen;
