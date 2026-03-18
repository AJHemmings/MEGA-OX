export type RPSPick = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'p1' | 'p2' | 'draw';

const PICKS: RPSPick[] = ['rock', 'paper', 'scissors'];

/** Returns 'p1' if p1 wins, 'p2' if p2 wins, 'draw' if tied. */
export const resolveRPS = (p1Pick: RPSPick, p2Pick: RPSPick): RPSResult => {
  if (p1Pick === p2Pick) return 'draw';
  if (
    (p1Pick === 'rock'     && p2Pick === 'scissors') ||
    (p1Pick === 'scissors' && p2Pick === 'paper')    ||
    (p1Pick === 'paper'    && p2Pick === 'rock')
  ) return 'p1';
  return 'p2';
};

export const randomRPSPick = (): RPSPick =>
  PICKS[Math.floor(Math.random() * PICKS.length)];
