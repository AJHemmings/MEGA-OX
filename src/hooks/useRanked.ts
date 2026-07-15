import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { tierForRating, Tier } from '../lib/ranked';
import type { Database } from '../lib/database.types';

export type Season = Database['public']['Tables']['seasons']['Row'];
export type PlayerRating = Database['public']['Tables']['player_ratings']['Row'];

export interface UseRankedResult {
  season: Season | null;
  rating: PlayerRating | null;
  tier: Tier;
  loading: boolean;
  refresh: () => void;
}

// Fetches the active season and the current user's rating row for it (may not
// exist yet — `join_matchmaking_queue` creates it lazily on first ranked queue).
// `refresh()` re-runs the fetch; a later task calls it after a ranked game ends
// so the rating/tier update without a full page reload.
export const useRanked = (): UseRankedResult => {
  const { user } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  // Reset mountedRef on every (re)mount; React StrictMode runs effects twice in
  // dev, so the body must run too — not just the cleanup.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!user?.id) {
      setSeason(null);
      setRating(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

      if (!mountedRef.current) return;
      setSeason(seasonData ?? null);

      if (!seasonData) {
        setRating(null);
        setLoading(false);
        return;
      }

      const { data: ratingData } = await supabase
        .from('player_ratings')
        .select('*')
        .eq('season_id', seasonData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mountedRef.current) return;
      setRating(ratingData ?? null);
      setLoading(false);
    })();
  }, [user?.id, refreshKey]);

  const tier = tierForRating(rating?.rating ?? 1000);

  return { season, rating, tier, loading, refresh };
};
