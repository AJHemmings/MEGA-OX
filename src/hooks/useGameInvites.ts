import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { serializeGame } from '../lib/gameSerializer';
import { Game } from '../models/Game';
import type { Tables } from '../lib/database.types';

const INVITE_STATUSES = ['pending', 'accepted', 'declined'] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];
const isInviteStatus = (s: string): s is InviteStatus =>
  (INVITE_STATUSES as readonly string[]).includes(s);

// Column fields derive from the generated row type so a schema change is a
// compile error here instead of a silent runtime mismatch; status is narrowed
// to the known union by validation at fetch time.
export interface GameInvite extends Pick<Tables<'game_invites'>, 'id' | 'challenger_id' | 'challenged_id' | 'game_id'> {
  status: InviteStatus;
  created_at: string;
  challenger: { username: string } | null;
  challenged: { username: string } | null;
}

interface UseGameInvitesReturn {
  sentInvites: GameInvite[];
  receivedInvites: GameInvite[];
  loading: boolean;
  acceptedGameId: string | null;
  clearAcceptedGame: () => void;
  sendChallenge: (challengedId: string) => Promise<void>;
  respondToChallenge: (inviteId: string, accept: boolean) => Promise<string | null>;
  cancelChallenge: (inviteId: string) => Promise<void>;
}

export function useGameInvites(): UseGameInvitesReturn {
  const [sentInvites, setSentInvites] = useState<GameInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<GameInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedGameId, setAcceptedGameId] = useState<string | null>(null);
  const prevSentRef = useRef<GameInvite[]>([]);
  const channelIdRef = useRef(`game-invites-${Math.random().toString(36).slice(2)}`);

  const fetchInvites = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('game_invites')
      .select(`
        id, challenger_id, challenged_id, game_id, status, created_at,
        challenger:profiles!game_invites_challenger_id_fkey(username),
        challenged:profiles!game_invites_challenged_id_fkey(username)
      `)
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });

    if (error) { console.error('useGameInvites fetch error:', error); setLoading(false); return; }

    // Skip rows with a status outside the known union (e.g. a value added to
    // the DB before this code knows about it) rather than mislabelling them.
    const rows: GameInvite[] = (data ?? []).flatMap(r =>
      isInviteStatus(r.status)
        ? [{ ...r, status: r.status, created_at: r.created_at ?? '' }]
        : []
    );
    const sent = rows.filter(r => r.challenger_id === user.id);
    const received = rows.filter(r => r.challenged_id === user.id && r.status === 'pending');

    // When a sent invite transitions pending → accepted, surface the game_id for navigation
    const prevSent = prevSentRef.current;
    const newlyAccepted = sent.find(r =>
      r.status === 'accepted' &&
      prevSent.some(p => p.id === r.id && p.status === 'pending')
    );
    if (newlyAccepted?.game_id) {
      setAcceptedGameId(newlyAccepted.game_id);
    }
    prevSentRef.current = sent;

    setSentInvites(sent.filter(r => r.status === 'pending'));
    setReceivedInvites(received);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvites();
    const channel = supabase
      .channel(channelIdRef.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_invites' }, fetchInvites)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [fetchInvites]);

  async function sendChallenge(challengedId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const initialState = serializeGame(new Game());
    const { data: game, error: gameErr } = await supabase.from('games').insert({
      player_x_id: user.id,
      state: initialState,
      match_type: 'friendly',
      status: 'waiting',
    }).select('id').single();

    if (gameErr || !game) throw new Error('Could not create game');

    const { error: inviteErr } = await supabase.from('game_invites').insert({
      challenger_id: user.id,
      challenged_id: challengedId,
      game_id: game.id,
      status: 'pending',
    });

    if (inviteErr) throw new Error(inviteErr.message);
    await fetchInvites();
  }

  async function respondToChallenge(inviteId: string, accept: boolean): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const invite = receivedInvites.find(i => i.id === inviteId);
    if (!invite?.game_id) return null;

    if (accept) {
      await supabase.from('games').update({ player_o_id: user.id, status: 'rps' }).eq('id', invite.game_id);
      await supabase.from('game_invites').update({ status: 'accepted' }).eq('id', inviteId);
      await fetchInvites();
      return invite.game_id;
    } else {
      await supabase.from('game_invites').update({ status: 'declined' }).eq('id', inviteId);
      await supabase.from('games').delete().eq('id', invite.game_id).eq('status', 'waiting');
      await fetchInvites();
      return null;
    }
  }

  async function cancelChallenge(inviteId: string) {
    const invite = sentInvites.find(i => i.id === inviteId);
    await supabase.from('game_invites').delete().eq('id', inviteId);
    if (invite?.game_id) {
      await supabase.from('games').delete().eq('id', invite.game_id).eq('status', 'waiting');
    }
    await fetchInvites();
  }

  return {
    sentInvites,
    receivedInvites,
    loading,
    acceptedGameId,
    clearAcceptedGame: () => setAcceptedGameId(null),
    sendChallenge,
    respondToChallenge,
    cancelChallenge,
  };
}
