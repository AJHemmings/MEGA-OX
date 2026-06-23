import React, { useState } from 'react';
import { Friend } from '../../hooks/useFriends';
import { GameInvite } from '../../hooks/useGameInvites';
import { usePresenceContext } from '../../contexts/PresenceContext';

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemove: (friendId: string) => Promise<void>;
  onBlock: (friendId: string) => Promise<void>;
  sentInvites: GameInvite[];
  onChallenge: (friendId: string) => Promise<void>;
  onCancelChallenge: (inviteId: string) => Promise<void>;
}

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  online:  { color: '#22c55e', label: 'Online' },
  in_game: { color: '#f59e0b', label: 'In game' },
  offline: { color: '#6b7280', label: 'Offline' },
};

export function FriendsList({ friends, loading, onRemove, onBlock, sentInvites, onChallenge, onCancelChallenge }: FriendsListProps) {
  const { presenceMap } = usePresenceContext();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading friends…</p>;
  if (friends.length === 0) return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No friends yet. Search above to add some!</p>;

  const sorted = [...friends].sort((a, b) => {
    const order: Record<string, number> = { online: 0, in_game: 1, offline: 2 };
    const statusA = presenceMap[a.profile.id]?.status ?? 'offline';
    const statusB = presenceMap[b.profile.id]?.status ?? 'offline';
    return (order[statusA] ?? 2) - (order[statusB] ?? 2);
  });

  const menuItems = (profileId: string): { label: string; color: string; disabled?: boolean; action: () => void }[] => {
    const pendingInvite = sentInvites.find(inv => inv.challenged_id === profileId);
    const challengeItem = pendingInvite
      ? { label: '⏳  Cancel invite', color: 'rgba(255,255,255,0.5)', action: () => { onCancelChallenge(pendingInvite.id); setOpenMenuId(null); } }
      : { label: '⚔️  Challenge', color: '#fff', action: () => { onChallenge(profileId); setOpenMenuId(null); } };
    return [
    challengeItem,
    {
      label: '👥  Remove',
      color: '#f87171',
      action: () => { onRemove(profileId); setOpenMenuId(null); },
    },
    {
      label: '🚫  Block',
      color: '#f87171',
      action: () => { onBlock(profileId); setOpenMenuId(null); },
    },
    {
      label: '🚩  Report',
      color: 'rgba(255,255,255,0.25)',
      disabled: true,
      action: () => {},
    },
  ];
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Invisible overlay to close menu on outside click */}
      {openMenuId && (
        <div
          onClick={() => setOpenMenuId(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 55 }}
        />
      )}

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Friends ({friends.length})
      </p>

      {sorted.map(({ profile }) => {
        const presence = presenceMap[profile.id];
        const statusKey = presence?.status ?? 'offline';
        const dot = STATUS_DOT[statusKey] ?? STATUS_DOT.offline;
        const isMenuOpen = openMenuId === profile.id;

        return (
          <div key={profile.id} style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: dot.color, flexShrink: 0 }}
                title={dot.label}
              />
              <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{profile.username}</span>
              {statusKey === 'in_game' && (
                <span style={{ fontSize: 11, color: '#f59e0b' }}>In game</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : profile.id); }}
                title="Options"
                style={{
                  background: 'none', border: 'none',
                  color: isMenuOpen ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: 20, cursor: 'pointer', padding: '2px 6px', lineHeight: 1,
                  zIndex: 60, position: 'relative',
                }}
              >⋮</button>
            </div>

            {isMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 60,
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, overflow: 'hidden', minWidth: 170,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
                {menuItems(profile.id).map(item => (
                  <button
                    key={item.label}
                    onClick={item.disabled ? undefined : item.action}
                    disabled={item.disabled}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', background: 'none', border: 'none',
                      color: item.color, fontSize: 13,
                      cursor: item.disabled ? 'default' : 'pointer',
                      fontFamily: 'inherit', opacity: item.disabled ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
