// Client-side ranked constants and pure helpers. The ELO math itself lives in
// SQL (apply_ranked_result); anything here exists only for display and for the
// queue-tolerance schedule, which MUST stay in sync with the SQL formula in
// join_matchmaking_queue: tolerance = 150 + 100 * floor(waitSecs / 15), uncapped ≥ 60s.

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

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
