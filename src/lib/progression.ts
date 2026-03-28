// src/lib/progression.ts

export const MAX_LEVEL = 250;

/** XP required to complete level n (i.e. to go from level n to level n+1) */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/** Total XP a player needs to have accumulated to reach `targetLevel` */
export function cumulativeXPToLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += xpForLevel(l);
  }
  return total;
}

/** Given a total accumulated XP value, return the player's current level */
export function levelFromXP(totalXP: number, maxLevel = MAX_LEVEL): number {
  let level = 1;
  while (level < maxLevel) {
    const nextThreshold = cumulativeXPToLevel(level + 1);
    if (totalXP < nextThreshold) break;
    level++;
  }
  return level;
}

/** XP remaining until the next level (returns 0 at max level) */
export function xpToNextLevel(totalXP: number, currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return cumulativeXPToLevel(currentLevel + 1) - totalXP;
}
