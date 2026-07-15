import {
  TIERS, tierForRating, progressToNextTier,
  toleranceForWaitSeconds, formatTolerance, TOLERANCE_SCHEDULE,
  PLACEMENT_GAMES, K_PLACEMENT, K_STANDARD, DEFAULT_RATING,
} from '../lib/ranked';

describe('tierForRating', () => {
  it.each([
    [0, 'Bronze'], [899, 'Bronze'],
    [900, 'Silver'], [1099, 'Silver'],
    [1100, 'Gold'], [1299, 'Gold'],
    [1300, 'Platinum'], [1499, 'Platinum'],
    [1500, 'Diamond'], [2400, 'Diamond'],
  ])('rating %i → %s', (rating, tier) => {
    expect(tierForRating(rating)).toBe(tier);
  });
  it('handles ratings below 0 (heavy losers stay Bronze)', () => {
    expect(tierForRating(-50)).toBe('Bronze');
  });
});

describe('progressToNextTier', () => {
  it('mid-Silver: 42 points to Gold', () => {
    expect(progressToNextTier(1058)).toEqual({ next: 'Gold', pointsNeeded: 42 });
  });
  it('Diamond has no next tier', () => {
    expect(progressToNextTier(1600)).toEqual({ next: null, pointsNeeded: 0 });
  });
});

describe('toleranceForWaitSeconds', () => {
  // Must match the SQL formula in join_matchmaking_queue:
  // 150 + 100 * floor(t / 15), uncapped from 60s
  it.each([
    [0, 150], [14, 150], [15, 250], [29, 250], [30, 350], [45, 450],
  ])('%is waited → ±%i', (secs, tol) => {
    expect(toleranceForWaitSeconds(secs)).toBe(tol);
  });
  it('is uncapped from 60s', () => {
    expect(toleranceForWaitSeconds(60)).toBe(Infinity);
    expect(toleranceForWaitSeconds(3600)).toBe(Infinity);
  });
});

describe('formatTolerance', () => {
  it.each([
    [0, '±150'], [15, '±250'], [30, '±350'], [45, '±450'],
  ])('%is waited → "%s"', (secs, label) => {
    expect(formatTolerance(secs)).toBe(label);
  });
  it('never prints "Infinity" — shows ±any once uncapped', () => {
    expect(formatTolerance(60)).toBe('±any');
    expect(formatTolerance(3600)).toBe('±any');
  });
});

describe('constants', () => {
  it('exposes the K schedule the SQL implements', () => {
    expect(PLACEMENT_GAMES).toBe(10);
    expect(K_PLACEMENT).toBe(32);
    expect(K_STANDARD).toBe(16);
    expect(DEFAULT_RATING).toBe(1000);
  });
  it('tolerance schedule table matches the function', () => {
    for (const { afterSeconds, tolerance } of TOLERANCE_SCHEDULE) {
      expect(toleranceForWaitSeconds(afterSeconds)).toBe(tolerance);
    }
  });
  it('has 5 ordered tiers', () => {
    expect(TIERS.map(t => t.tier)).toEqual(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']);
  });
});
