import { resolveRPS, randomRPSPick } from '../lib/rps';

describe('resolveRPS', () => {
  it('returns "draw" on matching picks', () => {
    expect(resolveRPS('rock', 'rock')).toBe('draw');
    expect(resolveRPS('paper', 'paper')).toBe('draw');
  });

  it('rock beats scissors', () => {
    expect(resolveRPS('rock', 'scissors')).toBe('p1');
    expect(resolveRPS('scissors', 'rock')).toBe('p2');
  });

  it('scissors beats paper', () => {
    expect(resolveRPS('scissors', 'paper')).toBe('p1');
    expect(resolveRPS('paper', 'scissors')).toBe('p2');
  });

  it('paper beats rock', () => {
    expect(resolveRPS('paper', 'rock')).toBe('p1');
    expect(resolveRPS('rock', 'paper')).toBe('p2');
  });
});

describe('randomRPSPick', () => {
  it('returns rock, paper, or scissors', () => {
    const valid = new Set(['rock', 'paper', 'scissors']);
    for (let i = 0; i < 20; i++) {
      expect(valid.has(randomRPSPick())).toBe(true);
    }
  });
});
