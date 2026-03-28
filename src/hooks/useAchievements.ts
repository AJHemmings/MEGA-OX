// src/hooks/useAchievements.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  condition_key: string;
  threshold: number;
  reward_xp: number;
  reward_credits: number;
  reward_skin_id: string | null;
  icon_url: string | null;
  unlocked: boolean;
  unlocked_at: string | null;
}

export function useAchievements(userId: string | undefined) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const [{ data: all }, { data: unlocked }] = await Promise.all([
        supabase.from('achievements').select('*').order('threshold'),
        supabase.from('player_achievements').select('achievement_id, unlocked_at').eq('user_id', userId)
      ]);

      const unlockedMap = new Map(
        (unlocked ?? []).map(r => [r.achievement_id, r.unlocked_at])
      );

      setAchievements(
        (all ?? []).map(a => ({
          ...a,
          unlocked: unlockedMap.has(a.id),
          unlocked_at: unlockedMap.get(a.id) ?? null
        }))
      );
      setLoading(false);
    }

    load();
  }, [userId]);

  return { achievements, loading };
}
