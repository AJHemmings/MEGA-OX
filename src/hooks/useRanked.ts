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
  /**
   * false only when an admin turned ranked off (app_config.ranked_enabled).
   * Defaults true while loading / on error — fail open, the server enforces.
   */
  rankedEnabled: boolean;
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
  const [rankedEnabled, setRankedEnabled] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Flip loading synchronously (not just in the effect) so consumers gating on
  // `!loading` never see one render of stale pre-refresh data between the
  // refresh() call and the effect re-running.
  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setSeason(null);
      setRating(null);
      setError(null);
      setRankedEnabled(true);
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
      // Flag fetched in parallel with the season — independent queries, one round-trip.
      const [seasonRes, flagRes] = await Promise.all([
        supabase.from('seasons').select('*').eq('status', 'active').maybeSingle(),
        supabase.from('app_config').select('value').eq('key', 'ranked_enabled').maybeSingle(),
      ]);
      const { data: seasonData, error: seasonErr } = seasonRes;

      if (cancelled) return;

      // Missing row or fetch error = enabled (kill switch fails open; the
      // server-side check in join_matchmaking_queue is the enforcement point).
      setRankedEnabled(flagRes.data ? flagRes.data.value === true : true);

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

  return { season, rating, tier, loading, error, rankedEnabled, refresh };
};
