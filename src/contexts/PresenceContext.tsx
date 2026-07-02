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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function join() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMountedRef.current) return;

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
          if (isMountedRef.current) setPresenceMap(map);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ userId: user.id, status: 'online' });
          }
          if (status === 'CHANNEL_ERROR') {
            if (channelRef.current) await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
            retryTimerRef.current = setTimeout(join, 3000);
          }
        });
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        if (channelRef.current) await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        join();
      }
      if (event === 'SIGNED_OUT') {
        if (channelRef.current) await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        if (isMountedRef.current) setPresenceMap({});
      }
    });

    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
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
