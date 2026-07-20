import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type OnlineStatus = 'online' | 'in_game';

interface PresencePayload {
  userId: string;
  status: OnlineStatus;
  gameId?: string;
}

interface PresenceContextType {
  presenceMap: Record<string, PresencePayload>;
  broadcastStatus: (status: OnlineStatus, gameId?: string) => void;
}

const PresenceContext = createContext<PresenceContextType>({
  presenceMap: {},
  broadcastStatus: () => {},
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresencePayload>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // `cancelled` is scoped to THIS effect invocation, not a shared ref — a stale
    // join() from a StrictMode-discarded mount must stay cancelled even after a
    // later mount resets its own flag. A shared isMountedRef would get flipped
    // back to true by the second mount, letting the stale call subscribe a
    // second 'presence:global' channel and collide with the live one (the
    // "cannot add presence callbacks after subscribe()" error).
    let cancelled = false;

    // Supabase fires BOTH 'INITIAL_SESSION' and 'SIGNED_IN' back-to-back for an
    // already-persisted session on page load — a second, distinct race from the
    // StrictMode one above, since both events belong to this same (non-cancelled)
    // effect run. `joining` is set synchronously, before the first await, so a
    // second concurrent join() call sees the lock immediately and bails — there's
    // no gap for both calls to pass a "should I create a channel" check together.
    let joining = false;
    let joinedUserId: string | null = null;

    async function join() {
      if (joining || cancelled) return;
      joining = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Already have a channel for this user (live or mid-subscribe) — the
        // event that called us is redundant, not a real re-auth.
        if (channelRef.current && joinedUserId === user.id) return;

        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        joinedUserId = user.id;

        const channel = supabase.channel('presence:global', {
          config: { presence: { key: user.id } },
        });

        channelRef.current = channel;

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<PresencePayload>();
            const map: Record<string, PresencePayload> = {};
            Object.entries(state).forEach(([key, presences]) => {
              if (presences.length > 0) {
                const p = presences[0];
                if (p.userId && p.status) map[key] = p;
              }
            });
            if (!cancelled) setPresenceMap(map);
          })
          .subscribe(async (status) => {
            if (cancelled) return;
            if (status === 'SUBSCRIBED') {
              await channel.track({ userId: user.id, status: 'online' });
            }
            if (status === 'CHANNEL_ERROR') {
              if (channelRef.current) await supabase.removeChannel(channelRef.current);
              channelRef.current = null;
              joinedUserId = null;
              retryTimerRef.current = setTimeout(join, 3000);
            }
          });
      } finally {
        joining = false;
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        join();
      }
      if (event === 'SIGNED_OUT') {
        if (channelRef.current) await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        joinedUserId = null;
        setPresenceMap({});
      }
    });

    return () => {
      cancelled = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function broadcastStatus(status: OnlineStatus, gameId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !channelRef.current) return;
      await channelRef.current.track({ userId: user.id, status, ...(gameId ? { gameId } : {}) });
    } catch (err) {
      console.error('broadcastStatus failed:', err);
    }
  }

  return (
    <PresenceContext.Provider value={{ presenceMap, broadcastStatus }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  return useContext(PresenceContext);
}
