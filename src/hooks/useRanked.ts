import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { tierForRating, Tier, DEFAULT_RATING } from '../lib/ranked';
import type { Database } from '../lib/database.types';

export type Season = Database['public']['Tables']['seasons']['Row'];
export type PlayerRating = Database['public']['Tables']['player_ratings']['Row'];

export interface UseRankedResult {
  season: Season | null;
  rating: PlayerRating | null;
  /** null while the user has no rating row yet — render as "Unranked". */
  tier: Tier | null;
  loading: boolean;
  /** Set on query failure so consumers can tell "no active season" from "fetch failed". */
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!user?.id) {
      setSeason(null);
      setRating(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Effect-local cancellation: covers unmount AND re-runs (sign-out
    // mid-flight, overlapping refresh()) — a stale fetch chain can never
    // write state after a newer effect run has started.
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      const { data: seasonData, error: seasonErr } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

      if (cancelled) return;

      if (seasonErr) {
        console.error('useRanked: failed to fetch active season:', seasonErr);
        setSeason(null);
        setRating(null);
        setError('Could not load ranked season.');
        setLoading(false);
        return;
      }

      setSeason(seasonData ?? null);

      if (!seasonData) {
        // Genuinely no active season (not an error).
        setRating(null);
        setLoading(false);
        return;
      }

      const { data: ratingData, error: ratingErr } = await supabase
        .from('player_ratings')
        .select('*')
        .eq('season_id', seasonData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (ratingErr) {
        console.error('useRanked: failed to fetch player rating:', ratingErr);
        setRating(null);
        setError('Could not load your rating.');
        setLoading(false);
        return;
      }

      setRating(ratingData ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshKey]);

  const tier = rating ? tierForRating(rating.rating ?? DEFAULT_RATING) : null;

  return { season, rating, tier, loading, error, refresh };
};
