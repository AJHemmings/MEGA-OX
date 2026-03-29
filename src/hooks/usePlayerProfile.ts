import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface PlayerProfile {
  username: string;
  avatar_url: string | null;
  rank_tier: string;
  wins: number;
  losses: number;
  draws: number;
  level: number;
}

export const usePlayerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase
        .from('profiles')
        .select('username, avatar_url, player_stats(rank_tier, wins, losses, draws)')
        .eq('id', user.id)
        .single(),
      supabase
        .from('player_progression')
        .select('level')
        .eq('user_id', user.id)
        .single(),
    ]).then(([{ data }, { data: prog }]) => {
      if (data) {
        const stats = (data as any).player_stats;
        setProfile({
          username: data.username,
          avatar_url: data.avatar_url,
          rank_tier: stats?.rank_tier ?? 'Challenger',
          wins: stats?.wins ?? 0,
          losses: stats?.losses ?? 0,
          draws: stats?.draws ?? 0,
          level: (prog as any)?.level ?? 1,
        });
      }
    });
  }, [user]);

  return profile;
};
