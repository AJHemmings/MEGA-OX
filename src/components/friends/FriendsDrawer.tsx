import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '../../hooks/useFriends';
import { useGameInvites } from '../../hooks/useGameInvites';
import { FriendsList } from './FriendsList';
import { AddFriendSearch } from './AddFriendSearch';
import { PendingRequests } from './PendingRequests';
import { IncomingChallenges } from './IncomingChallenges';
import { FriendsLeaderboard } from './FriendsLeaderboard';

interface FriendsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab = 'friends' | 'leaderboard';

export function FriendsDrawer({ isOpen, onClose }: FriendsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('friends');
  const friends = useFriends();
  const invites = useGameInvites();
  const navigate = useNavigate();

  // Challenger: navigate when the challenged player accepts
  useEffect(() => {
    if (invites.acceptedGameId) {
      invites.clearAcceptedGame();
      onClose();
      navigate(`/game/${invites.acceptedGameId}`);
    }
  }, [invites.acceptedGameId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 320, zIndex: 50,
        background: 'rgba(15,15,25,0.97)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'inherit',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Friends</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
              fontSize: 20, cursor: 'pointer', padding: '4px 8px',
            }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['friends', 'leaderboard'] as DrawerTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '12px 0',
                background: 'none', border: 'none',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 14, cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #6c63ff' : '2px solid transparent',
              }}
            >
              {tab === 'friends' ? '👥 Friends' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'friends' && (
            <>
              <AddFriendSearch excludeIds={[
                ...friends.acceptedFriends.map(f => f.profile.id),
                ...friends.pendingIncoming.map(r => r.profile.id),
                ...friends.pendingOutgoing.map(r => r.profile.id),
              ]} />
              <IncomingChallenges
                invites={invites.receivedInvites}
                onRespond={invites.respondToChallenge}
                onNavigate={(gameId) => { onClose(); navigate(`/game/${gameId}`); }}
              />
              <PendingRequests
                requests={friends.pendingIncoming}
                onRespond={friends.respondToRequest}
              />
              <FriendsList
                friends={friends.acceptedFriends}
                loading={friends.loading}
                onRemove={friends.removeFriend}
                onBlock={friends.blockFriend}
                sentInvites={invites.sentInvites}
                onChallenge={invites.sendChallenge}
                onCancelChallenge={invites.cancelChallenge}
              />
            </>
          )}
          {activeTab === 'leaderboard' && <FriendsLeaderboard compact />}
        </div>
      </div>
    </>
  );
}
