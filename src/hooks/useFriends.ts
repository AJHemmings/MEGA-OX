import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface FriendRequest {
  profile: FriendProfile;
  requesterId: string;
}

export interface Friend {
  profile: FriendProfile;
}

interface UseFriendsReturn {
  acceptedFriends: Friend[];
  pendingIncoming: FriendRequest[];
  pendingOutgoing: FriendRequest[];
  loading: boolean;
  sendFriendRequest: (addresseeId: string) => Promise<void>;
  respondToRequest: (requesterId: string, action: 'accept' | 'decline' | 'block') => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
  const [acceptedFriends, setAcceptedFriends] = useState<Friend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<FriendRequest[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Cast to `any` because `friendships` was added to the DB after the last
    // type generation run. Types will be regenerated in a later Phase 9 task.
    const { data, error } = await (supabase as any)
      .from('friendships')
      .select(`
        requester_id,
        addressee_id,
        status,
        requester:profiles!friendships_requester_id_fkey(id, username, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .neq('status', 'blocked');

    if (error) { console.error('useFriends fetch error:', error); return; }

    const accepted: Friend[] = [];
    const incoming: FriendRequest[] = [];
    const outgoing: FriendRequest[] = [];

    (data ?? []).forEach((row: any) => {
      const isSender = row.requester_id === user.id;
      const otherProfile = isSender ? row.addressee : row.requester;
      const otherId = isSender ? row.addressee_id : row.requester_id;

      if (row.status === 'accepted') {
        accepted.push({ profile: { ...otherProfile, id: otherId } });
      } else if (row.status === 'pending') {
        if (isSender) {
          outgoing.push({ profile: { ...otherProfile, id: otherId }, requesterId: user.id });
        } else {
          incoming.push({ profile: { ...otherProfile, id: otherId }, requesterId: row.requester_id });
        }
      }
    });

    setAcceptedFriends(accepted);
    setPendingIncoming(incoming);
    setPendingOutgoing(outgoing);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFriends();

    const channel = supabase
      .channel('friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, fetchFriends)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchFriends]);

  async function sendFriendRequest(addresseeId: string) {
    // RPCs added after last type generation — cast to `any` until types are regenerated.
    const { error } = await (supabase as any).rpc('send_friend_request', { p_addressee_id: addresseeId });
    if (error) throw new Error(error.message);
  }

  async function respondToRequest(requesterId: string, action: 'accept' | 'decline' | 'block') {
    const { error } = await (supabase as any).rpc('respond_to_friend_request', {
      p_requester_id: requesterId,
      p_action: action,
    });
    if (error) throw new Error(error.message);
  }

  async function removeFriend(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any)
      .from('friendships')
      .delete()
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
      );
    if (error) { console.error('removeFriend error:', error); return; }
    await fetchFriends();
  }

  return {
    acceptedFriends,
    pendingIncoming,
    pendingOutgoing,
    loading,
    sendFriendRequest,
    respondToRequest,
    removeFriend,
    refetch: fetchFriends,
  };
}
