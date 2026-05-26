// src/components/game/RPSScreen.tsx
import React, { useState } from 'react';
import { RPSPick } from '../../lib/rps';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';

interface RPSScreenProps {
  onSubmitPick: (pick: RPSPick) => Promise<boolean>;
}

const PICKS: RPSPick[] = ['rock', 'paper', 'scissors'];
const EMOJI: Record<RPSPick, string>  = { rock: '🪨', paper: '📄', scissors: '✂️' };
const LABEL: Record<RPSPick, string>  = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };

const RPSScreen: React.FC<RPSScreenProps> = ({ onSubmitPick }) => {
  const [myPick, setMyPick]   = useState<RPSPick | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError]     = useState('');

  const submitPick = async (pick: RPSPick) => {
    setMyPick(pick);
    setWaiting(true);
    const ok = await onSubmitPick(pick);
    if (!ok) {
      setError('Failed to submit pick. Please try again.');
      setMyPick(null);
      setWaiting(false);
    }
  };

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px', gap: 0,
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Rock Paper Scissors</div>
            <div style={{ fontSize: 14, color: tokens.textMuted, fontWeight: 600 }}>
              {waiting ? 'Waiting for opponent…' : 'Pick to determine who goes first'}
            </div>
            {error && <div style={{ fontSize: 13, color: tokens.loss, marginTop: 8, fontWeight: 600 }}>{error}</div>}
          </div>

          {/* Pick buttons */}
          {!myPick && (
            <div style={{ display: 'flex', gap: 12 }}>
              {PICKS.map(pick => (
                <button
                  key={pick}
                  onClick={() => submitPick(pick)}
                  style={{
                    flex: 1, padding: '24px 12px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    cursor: 'pointer', fontFamily: tokens.font,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'transform 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `rgba(0,212,170,0.12)`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                >
                  <span style={{ fontSize: 44 }}>{EMOJI[pick]}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tokens.text }}>{LABEL[pick]}</span>
                </button>
              ))}
            </div>
          )}

          {/* Waiting state */}
          {myPick && (
            <Glass style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>{EMOJI[myPick]}</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>You picked {LABEL[myPick]}</div>
              <div style={{ fontSize: 13, color: tokens.textMuted }}>
                Waiting for your opponent
                <span style={{ animation: 'mxBlink 1.2s step-start infinite' }}>…</span>
              </div>
            </Glass>
          )}

        </div>
      </div>
    </PageBackground>
  );
};

export default RPSScreen;
