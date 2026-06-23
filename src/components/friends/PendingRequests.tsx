import React from 'react';
import { FriendRequest } from '../../hooks/useFriends';

interface PendingRequestsProps {
  requests: FriendRequest[];
  onRespond: (requesterId: string, action: 'accept' | 'decline' | 'block') => Promise<void>;
}

export function PendingRequests({ requests, onRespond }: PendingRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Requests ({requests.length})
      </p>
      {requests.map(({ profile, requesterId }) => (
        <div
          key={requesterId}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{profile.username}</span>
          <button
            onClick={() => onRespond(requesterId, 'accept')}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >Accept</button>
          <button
            onClick={() => onRespond(requesterId, 'decline')}
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
