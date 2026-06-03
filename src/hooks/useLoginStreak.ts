import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useLoginStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<{ current: number; reward: any | null } | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkStreak = async () => {
      const { data: streak } = await supabase.from('login_streaks').select('*').eq('player_id', user.id).maybeSingle();
      if (!streak) return;

      const today = new Date().toISOString().split('T')[0];
      const lastLogin = streak.last_login_date;

      if (lastLogin === today) return; // Already logged in today

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = lastLogin === yesterday ? streak.current_streak + 1 : 1;

      await supabase.from('login_streaks').update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak),
        last_login_date: today,
      }).eq('player_id', user.id);

      // Check for reward milestone
      const { data: reward } = await supabase.from('reward_catalog').select('*').eq('day_number', newStreak).maybeSingle();

      setStreakData({ current: newStreak, reward: reward ?? null });
    };

    checkStreak();
  }, [user]);

  return streakData;
};
