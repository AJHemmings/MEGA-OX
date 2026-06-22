import React from 'react';
import { Friend } from '../../hooks/useFriends';
import { usePresenceContext } from '../../contexts/PresenceContext';

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemove: (friendId: string) => Promise<void>;
}

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  online:   { color: '#22c55e', label: 'Online' },
  in_game:  { color: '#f59e0b', label: 'In game' },
  offline:  { color: '#6b7280', label: 'Offline' },
};

export function FriendsList({ friends, loading, onRemove }: FriendsListProps) {
  const { presenceMap } = usePresenceContext();

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading friends…</p>;
  }

  if (friends.length === 0) {
    return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No friends yet. Search above to add some!</p>;
  }

  const sorted = [...friends].sort((a, b) => {
    const order: Record<string, number> = { online: 0, in_game: 1, offline: 2 };
    const statusA = presenceMap[a.profile.id]?.status ?? 'offline';
    const statusB = presenceMap[b.profile.id]?.status ?? 'offline';
    return (order[statusA] ?? 2) - (order[statusB] ?? 2);
  });

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Friends ({friends.length})
      </p>
      {sorted.map(({ profile }) => {
        const presence = presenceMap[profile.id];
        const statusKey = presence?.status ?? 'offline';
        const dot = STATUS_DOT[statusKey] ?? STATUS_DOT.offline;

        return (
          <div
            key={profile.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: dot.color, flexShrink: 0,
            }} title={dot.label} />
            <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{profile.username}</span>
            {statusKey === 'in_game' && (
              <span style={{ fontSize: 11, color: '#f59e0b' }}>In game</span>
            )}
            <button
              onClick={() => onRemove(profile.id)}
              title="Remove friend"
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                fontSize: 12, cursor: 'pointer', padding: '2px 4px',
              }}
            >✕</button>
          </div>
        );
      })}
    </div>
  );
}
