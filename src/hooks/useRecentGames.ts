import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface RecentGame {
  id: string;
  result: 'Win' | 'Loss' | 'Draw';
  opponentUsername: string;
  match_type: string;
}

export const useRecentGames = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<RecentGame[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('games')
      .select('id, winner, match_type, player_x_id, player_o_id')
      .or(`player_x_id.eq.${user.id},player_o_id.eq.${user.id}`)
      .eq('status', 'complete')
      .order('updated_at', { ascending: false })
      .limit(5)
      .then(async ({ data }) => {
        if (!data) return;
        const formatted = await Promise.all(data.map(async (g) => {
          const opponentId = (g.player_x_id === user.id ? g.player_o_id : g.player_x_id) ?? '';
          const { data: opp } = await supabase.from('profiles').select('username').eq('id', opponentId).single();
          const myMarker = g.player_x_id === user.id ? 'X' : 'O';
          const result: 'Win' | 'Loss' | 'Draw' =
            g.winner === 'draw' ? 'Draw' :
            g.winner === myMarker ? 'Win' : 'Loss';
          return { id: g.id, result, opponentUsername: opp?.username ?? 'Unknown', match_type: g.match_type };
        }));
        setGames(formatted);
      });
  }, [user]);

  return games;
};
