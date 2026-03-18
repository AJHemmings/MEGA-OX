// src/components/game/RPSScreen.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RPSPick } from '../../lib/rps';

interface RPSScreenProps {
  gameId: string;
  isCreator: boolean;  // true if this player is player_x_id (game creator)
  onResolved: () => void;  // called when both picks are in — triggers re-render
}

const PICKS: RPSPick[] = ['rock', 'paper', 'scissors'];
const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const RPSScreen: React.FC<RPSScreenProps> = ({ gameId, isCreator, onResolved }) => {
  const [myPick, setMyPick] = useState<RPSPick | null>(null);
  const [waiting, setWaiting] = useState(false);

  const submitPick = async (pick: RPSPick) => {
    setMyPick(pick);
    setWaiting(true);
    const column = isCreator ? 'rps_creator_pick' : 'rps_joiner_pick';
    await supabase.from('games').update({ [column]: pick }).eq('id', gameId);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`rps:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.rps_creator_pick && updated.rps_joiner_pick) {
          supabase.removeChannel(channel);
          onResolved();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, onResolved]);

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <h2 style={{ fontSize: '28px', margin: 0 }}>Rock Paper Scissors</h2>
      <p style={{ color: '#a0aec0', margin: 0 }}>
        {waiting ? 'Waiting for opponent...' : 'Pick to determine who goes first'}
      </p>
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
