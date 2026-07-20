// Client-side ranked constants and pure helpers. The ELO math itself lives in
// SQL (apply_ranked_result); anything here exists only for display and for the
// queue-tolerance schedule, which MUST stay in sync with the SQL formula in
// join_matchmaking_queue: tolerance = 150 + 100 * floor(waitSecs / 15), uncapped ≥ 60s.

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

// Thresholds are mirrored in rollover_season()'s tier-reward CASE
// (supabase/migrations/20260715000005_phase10_season_rollover.sql) — keep in sync.
export const TIERS: { tier: Tier; min: number }[] = [
  { tier: 'Bronze',   min: Number.NEGATIVE_INFINITY },
  { tier: 'Silver',   min: 900 },
  { tier: 'Gold',     min: 1100 },
  { tier: 'Platinum', min: 1300 },
  { tier: 'Diamond',  min: 1500 },
];

export const PLACEMENT_GAMES = 10;
export const K_PLACEMENT = 32;
export const K_STANDARD = 16;
export const DEFAULT_RATING = 1000;

export function tierForRating(rating: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (rating >= TIERS[i].min) return TIERS[i].tier;
  }
  return 'Bronze';
}

export function progressToNextTier(rating: number): { next: Tier | null; pointsNeeded: number } {
  const idx = TIERS.findIndex(t => t.tier === tierForRating(rating));
  const next = TIERS[idx + 1];
  if (!next) return { next: null, pointsNeeded: 0 };
  return { next: next.tier, pointsNeeded: next.min - rating };
}

export const TOLERANCE_SCHEDULE = [
  { afterSeconds: 0,  tolerance: 150 },
  { afterSeconds: 15, tolerance: 250 },
  { afterSeconds: 30, tolerance: 350 },
  { afterSeconds: 45, tolerance: 450 },
  { afterSeconds: 60, tolerance: Infinity },
] as const;

export function toleranceForWaitSeconds(waitSeconds: number): number {
  if (waitSeconds >= 60) return Infinity;
  return 150 + 100 * Math.floor(waitSeconds / 15);
}

// Display helper for the searching UI: "±250", or "±any" once the tolerance
// is uncapped (never print "Infinity" at a player).
export function formatTolerance(waitSeconds: number): string {
  const tolerance = toleranceForWaitSeconds(waitSeconds);
  return tolerance === Infinity ? '±any' : `±${tolerance}`;
}

// Sign-format a post-game rating delta for display: "+18", "−12", "0".
// Uses a true minus sign (U+2212), not a hyphen, to match the "+" glyph weight.
export function formatRatingDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}
