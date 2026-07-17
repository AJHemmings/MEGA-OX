import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type SeasonStatus = 'upcoming' | 'active' | 'complete';

export interface AdminSeason {
  id: string;
  number: number | null;
  name: string;
  start_date: string;
  end_date: string;
  status: SeasonStatus;
  reward_skin_id: string | null;
  reward_skin_name: string | null;
}

export interface AdminSkinOption {
  id: string;
  name: string;
  type: string;
}

export function useAdminSeasons() {
  const [seasons, setSeasons] = useState<AdminSeason[]>([]);
  const [skins, setSkins]     = useState<AdminSkinOption[]>([]);
  // null = flag state unknown (fetch failed) — the admin panel must not guess.
  const [rankedEnabled, setRankedEnabledState] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // silent = refresh data without unmounting the table to the loading state
  // (used after a save so the page doesn't flash "Loading…").
  const loadSeasons = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const [seasonsRes, skinsRes, cfgRes] = await Promise.all([
      supabase
        .from('seasons')
        .select('id, number, name, start_date, end_date, status, reward_skin_id, skins(name)')
        .order('number', { ascending: false }),
      supabase
        .from('skins')
        .select('id, name, type')
        .order('type').order('name'),
      supabase
        .from('app_config')
        .select('value')
        .eq('key', 'ranked_enabled')
        .maybeSingle(),
    ]);

    if (seasonsRes.error || skinsRes.error) {
      setError('Failed to load seasons.');
      setLoading(false);
      return;
    }

    // Missing row = enabled (fail open, matches the server default), but a fetch
    // error means the real state is unknown — surface that, don't report "ON".
    setRankedEnabledState(
      cfgRes.error ? null : cfgRes.data ? cfgRes.data.value === true : true
    );

    const mapped: AdminSeason[] = (seasonsRes.data ?? []).map(s => ({
      id:                s.id,
      number:            s.number,
      name:              s.name,
      start_date:        s.start_date,
      end_date:          s.end_date,
      status:            s.status as SeasonStatus,
      reward_skin_id:    s.reward_skin_id,
      reward_skin_name:  s.skins?.name ?? null,
    }));

    setSeasons(mapped);
    setSkins(skinsRes.data ?? []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { loadSeasons(); }, [loadSeasons]);

  const setSeasonReward = useCallback(async (seasonId: string, skinId: string | null): Promise<string | null> => {
    // Omitting p_skin_id falls back to the SQL DEFAULT NULL, which clears the reward.
    const { error: err } = await supabase.rpc('admin_set_season_reward', {
      p_season_id: seasonId,
      ...(skinId ? { p_skin_id: skinId } : {}),
    });
    if (err) return err.message;
    await loadSeasons(true);
    return null;
  }, [loadSeasons]);

  const setRankedEnabled = useCallback(async (next: boolean): Promise<string | null> => {
    const { error: err } = await supabase.rpc('admin_set_config', {
      p_key: 'ranked_enabled',
      p_value: next,
    });
    if (err) return err.message;
    await loadSeasons(true);
    return null;
  }, [loadSeasons]);

  const endSeason = useCallback(async (): Promise<string | null> => {
    const { error: err } = await supabase.rpc('admin_end_season');
    if (err) return err.message;
    await loadSeasons(true);
    return null;
  }, [loadSeasons]);

  return {
    seasons, skins, rankedEnabled, loading, error,
    refetch: loadSeasons, setSeasonReward, setRankedEnabled, endSeason,
  };
}
