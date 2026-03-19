import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ActiveGameResult {
  activeGameId: string | null;
  forfeitedGameId: string | null;
}

export const useActiveGame = (userId: string | null): ActiveGameResult => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [forfeitedGameId, setForfeitedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      // Active or in-RPS game
      const { data: active } = await supabase
        .from('games')
        .select('id')
        .or(`player_x_id.eq.${userId},player_o_id.eq.${userId}`)
        .in('status', ['active', 'rps'])
        .limit(1)
        .maybeSingle();

      if (active) {
        setActiveGameId(active.id);
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

      if (forfeited) {
        setForfeitedGameId(forfeited.id);
      }
    };

    check();
  }, [userId]);

  return { activeGameId, forfeitedGameId };
};
