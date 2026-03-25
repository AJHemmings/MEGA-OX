import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ActiveGameResult {
  activeGameId: string | null;
  forfeitedGameId: string | null;
}

export const useActiveGame = (userId: string | null, pathname: string): ActiveGameResult => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [forfeitedGameId, setForfeitedGameId] = useState<string | null>(null);

  // Re-query on every navigation so forfeit/active state is always fresh
  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      // Active or in-RPS game
      const { data: active } = await supabase
        .from('games')
        .select('id')
        .or(`player_x_id.eq.${userId},player_o_id.eq.${userId}`)
        .in('status', ['active', 'rps'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveGameId(active ? active.id : null);

      if (active) {
        setForfeitedGameId(null);
        return;
      }

      // Recently forfeited (last 30 minutes)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: forfeited } = await supabase
        .from('games')
        .select('id')
        .eq('forfeit_player_id', userId)
        .eq('status', 'complete')
        .gte('updated_at', thirtyMinAgo)
        .limit(1)
        .maybeSingle();

      setForfeitedGameId(forfeited ? forfeited.id : null);
    };

    check();
  }, [userId, pathname]);

  // If we have an active game, subscribe to it and clear when it completes
  useEffect(() => {
    if (!activeGameId) return;

    const channel = supabase
      .channel(`active-game-watch:${activeGameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${activeGameId}`,
      }, (payload) => {
        if ((payload.new as any).status === 'complete') {
          setActiveGameId(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeGameId]);

  return { activeGameId, forfeitedGameId };
};
