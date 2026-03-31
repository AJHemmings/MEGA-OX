// src/__tests__/progression.test.ts
import { xpForLevel, cumulativeXPToLevel, levelFromXP, xpToNextLevel } from '../lib/progression';

// NOTE: The spec reference table was illustrative/approximate. Use the formula output as source of truth.
// xpForLevel(n) = Math.round(100 * n^1.5)
// Values: (1)=100, (2)=283, (3)=520, (4)=800
// cumulativeXPToLevel(5) = 100+283+520+800 = 1703

describe('xpForLevel', () => {
  test('level 1 requires 100 XP', () => {
    expect(xpForLevel(1)).toBe(100);
  });
  test('level 2 requires 283 XP', () => {
    expect(xpForLevel(2)).toBe(283); // Math.round(100 * 2^1.5) = 283
  });
  test('level 10 requires 3162 XP', () => {
    expect(xpForLevel(10)).toBe(3162); // Math.round(100 * 10^1.5)
  });
});

describe('cumulativeXPToLevel', () => {
  test('level 1 requires 0 cumulative XP', () => {
    expect(cumulativeXPToLevel(1)).toBe(0);
  });
  test('level 2 requires 100 cumulative XP', () => {
    expect(cumulativeXPToLevel(2)).toBe(100);
  });
  test('level 5 requires 1703 cumulative XP', () => {
    // xpForLevel(1)=100, (2)=283, (3)=520, (4)=800 → sum = 1703
    expect(cumulativeXPToLevel(5)).toBe(1703);
  });
});

describe('levelFromXP', () => {
  test('0 XP = level 1', () => {
    expect(levelFromXP(0)).toBe(1);
  });
  test('exactly enough XP for level 2 = level 2', () => {
    const threshold = cumulativeXPToLevel(2);
    expect(levelFromXP(threshold)).toBe(2);
  });
  test('1 XP less than level 2 threshold stays at level 1', () => {
    const threshold = cumulativeXPToLevel(2);
    expect(levelFromXP(threshold - 1)).toBe(1);
  });
  test('caps at MAX_LEVEL even with extreme XP', () => {
    expect(levelFromXP(999999999)).toBe(250);
  });
  test('respects custom maxLevel', () => {
    expect(levelFromXP(999999999, 10)).toBe(10);
  });
});

describe('xpToNextLevel', () => {
  test('at level 1 with 50 XP shows correct remaining', () => {
    const remaining = xpToNextLevel(50, 1);
    expect(remaining).toBe(cumulativeXPToLevel(2) - 50);
  });
  test('at max level returns 0', () => {
    expect(xpToNextLevel(999999, 250)).toBe(0);
  });
});
