import React from 'react';
import { GameInvite } from '../../hooks/useGameInvites';

interface IncomingChallengesProps {
  invites: GameInvite[];
  onRespond: (inviteId: string, accept: boolean) => Promise<string | null>;
  onNavigate: (gameId: string) => void;
}

export function IncomingChallenges({ invites, onRespond, onNavigate }: IncomingChallengesProps) {
  if (invites.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Game Invites ({invites.length})
      </p>
      {invites.map(invite => (
        <div
          key={invite.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚔️</span>
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>
            <strong>{invite.challenger?.username ?? 'Someone'}</strong> challenged you
          </span>
          <button
            onClick={async () => {
              const gameId = await onRespond(invite.id, true);
              if (gameId) onNavigate(gameId);
            }}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >Accept</button>
          <button
            onClick={() => onRespond(invite.id, false)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
              border: 'none', cursor: 'pointer',
            }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}
