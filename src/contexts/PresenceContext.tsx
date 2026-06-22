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

  useEffect(() => {
    let isMounted = true;

    async function join() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const channel = supabase.channel('presence:global', {
        config: { presence: { key: user.id } },
      });

      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresencePayload>();
          const map: Record<string, PresencePayload> = {};
          Object.entries(state).forEach(([key, presences]) => {
            if (presences.length > 0) map[key] = presences[0];
          });
          if (isMounted) setPresenceMap(map);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ userId: user.id, status: 'online' });
          }
          if (status === 'CHANNEL_ERROR') {
            setTimeout(join, 3000);
          }
        });
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') join();
      if (event === 'SIGNED_OUT') {
        channelRef.current?.unsubscribe();
        channelRef.current = null;
        if (isMounted) setPresenceMap({});
      }
    });

    join();

    return () => {
      isMounted = false;
      channelRef.current?.unsubscribe();
      listener.subscription.unsubscribe();
    };
  }, []);

  function broadcastStatus(status: OnlineStatus, gameId?: string) {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !channelRef.current) return;
      channelRef.current.track({ userId: user.id, status, ...(gameId ? { gameId } : {}) });
    });
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
