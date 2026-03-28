// src/hooks/useProgression.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { xpToNextLevel, cumulativeXPToLevel } from '../lib/progression';

export interface ProgressionState {
  xp: number;
  level: number;
  totalCreditsEarned: number;
  credits: number;
  xpToNext: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  loading: boolean;
}

export function useProgression(userId: string | undefined): ProgressionState {
  const [state, setState] = useState<ProgressionState>({
    xp: 0, level: 1, totalCreditsEarned: 0, credits: 0,
    xpToNext: 100, xpIntoLevel: 0, xpNeededForLevel: 100, loading: true
  });

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const uid = userId as string;
      const [{ data: prog }, { data: balance }] = await Promise.all([
        supabase.from('player_progression').select('*').eq('user_id', uid).single(),
        supabase.from('currency_balance').select('coins').eq('player_id', uid).single()
      ]);

      const xp = prog?.xp ?? 0;
      const level = prog?.level ?? 1;
      const credits = balance?.coins ?? 0;
      const xpStart = cumulativeXPToLevel(level);
      const xpEnd = cumulativeXPToLevel(level + 1);

      setState({
        xp,
        level,
        totalCreditsEarned: prog?.total_credits_earned ?? 0,
        credits,
        xpToNext: xpToNextLevel(xp, level),
        xpIntoLevel: xp - xpStart,
        xpNeededForLevel: xpEnd - xpStart,
        loading: false
      });
    }

    load();
  }, [userId]);

  return state;
}
