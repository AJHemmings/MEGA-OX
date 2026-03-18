// src/components/game/RPSScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { RPSPick } from '../../lib/rps';

interface RPSScreenProps {
  gameId: string;
  isCreator: boolean;  // true if this player is player_x_id (game creator)
  onResolved: () => void;  // called when both picks are in — must be stable (useCallback or top-level fn)
}

const PICKS: RPSPick[] = ['rock', 'paper', 'scissors'];
const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const RPSScreen: React.FC<RPSScreenProps> = ({ gameId, isCreator, onResolved }) => {
  const [myPick, setMyPick] = useState<RPSPick | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');

  const submitPick = async (pick: RPSPick) => {
    setMyPick(pick);
    setWaiting(true);
    const column = isCreator ? 'rps_creator_pick' : 'rps_joiner_pick';
    const { error: writeError } = await supabase.from('games').update({ [column]: pick }).eq('id', gameId);
    if (writeError) {
      setError('Failed to submit pick. Please try again.');
      setMyPick(null);
      setWaiting(false);
    }
  };

  useEffect(() => {
    // Guard prevents double removeChannel if onResolved unmounts this component synchronously
    const resolved = { current: false };
    const channel = supabase
      .channel(`rps:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.rps_creator_pick && updated.rps_joiner_pick && !resolved.current) {
          resolved.current = true;
          supabase.removeChannel(channel);
          onResolved();
        }
      })
      .subscribe();

    return () => {
      if (!resolved.current) supabase.removeChannel(channel);
    };
  }, [gameId, onResolved]);

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <h2 style={{ fontSize: '28px', margin: 0 }}>Rock Paper Scissors</h2>
      <p style={{ color: '#a0aec0', margin: 0 }}>
        {waiting ? 'Waiting for opponent...' : 'Pick to determine who goes first'}
      </p>
      {error && <p style={{ color: '#ff6b35', margin: 0, fontSize: '14px' }}>{error}</p>}
      {!myPick && (
        <div style={{ display: 'flex', gap: '16px' }}>
          {PICKS.map(pick => (
            <button
              key={pick}
              onClick={() => submitPick(pick)}
              style={{ fontSize: '48px', background: '#2a3441', border: '2px solid #3a4a5a', borderRadius: '12px', padding: '16px 24px', cursor: 'pointer' }}
            >
              {EMOJI[pick]}
            </button>
          ))}
        </div>
      )}
      {myPick && (
        <div style={{ fontSize: '48px' }}>{EMOJI[myPick]}</div>
      )}
    </div>
  );
};

export default RPSScreen;
