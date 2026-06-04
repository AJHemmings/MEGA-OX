import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminAchievement {
  id: string;
  key: string;
  name: string;
  description: string;
  condition_key: string;
  threshold: number;
  reward_xp: number;
  reward_credits: number;
}

export interface AchievementFormData {
  key: string;
  name: string;
  description: string;
  condition_key: string;
  threshold: number;
  reward_xp: number;
  reward_credits: number;
}

export const CONDITION_TYPES = ['wins', 'games_played', 'win_streak', 'draws', 'losses'];

export function useAdminAchievements() {
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('achievements')
      .select('id,key,name,description,condition_key,threshold,reward_xp,reward_credits')
      .order('name');
    if (err) { setError('Failed to load achievements.'); setLoading(false); return; }
    setAchievements((data ?? []) as unknown as AdminAchievement[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const add = useCallback(async (form: AchievementFormData): Promise<string | null> => {
    const { error: err } = await supabase.from('achievements').insert(form as any);
    if (err) return err.message;
    await fetchAll();
    return null;
  }, [fetchAll]);

  const update = useCallback(async (id: string, form: AchievementFormData): Promise<string | null> => {
    const { error: err } = await supabase.from('achievements').update(form as any).eq('id', id);
    if (err) return err.message;
    await fetchAll();
    return null;
  }, [fetchAll]);

  return { achievements, loading, error, add, update };
}
