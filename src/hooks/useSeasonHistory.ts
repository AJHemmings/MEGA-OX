import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SeasonHistoryEntry {
  seasonNumber: number | null;
  seasonName: string;
  isActive: boolean;
  rating: number;
  peakRating: number;
  wins: number;
  losses: number;
  draws: number;
}

// Read-only per-season ranked history for one player. player_ratings rows are
// permanent (rollover never deletes), so this is a plain join ordered newest first.
export function useSeasonHistory(userId: string | undefined) {
  const [entries, setEntries] = useState<SeasonHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setEntries([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: err } = await supabase
        .from('player_ratings')
        .select('rating, peak_rating, wins, losses, draws, seasons(number, name, status)')
        .eq('user_id', userId);
      if (cancelled) return;
      if (err) {
        console.error('useSeasonHistory: fetch failed:', err);
        setError("Couldn't load season history.");
        setEntries([]);
        setLoading(false);
        return;
      }
      const rows: SeasonHistoryEntry[] = (data ?? [])
        .map(r => ({
          seasonNumber: r.seasons?.number ?? null,
          seasonName:   r.seasons?.name ?? '',
          isActive:     r.seasons?.status === 'active',
          rating:       r.rating,
          peakRating:   r.peak_rating,
          wins:         r.wins,
          losses:       r.losses,
          draws:        r.draws,
        }))
        .sort((a, b) => (b.seasonNumber ?? 0) - (a.seasonNumber ?? 0));
      setEntries(rows);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return { entries, loading, error };
}
