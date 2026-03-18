// aiPlayer.ts — AI move selection for Mega OX (Ultimate Noughts and Crosses)
// Provides three difficulty levels: Easy (random), Medium (rule-based), Hard (minimax).
// No React imports — pure logic only.

import { Game, Marker, MacroBoard, MicroBoard, Cell } from "../models/Game";

// ─── Public types ────────────────────────────────────────────────────────────

export type Move = { microIndex: number; cellIndex: number };

// ─── Strength constants ───────────────────────────────────────────────────────

export const MEDIUM_WIN_RULE_STRENGTH = 80;
export const MEDIUM_POISON_RULE_STRENGTH = 70;
export const HARD_WIN_RULE_STRENGTH = 95;
export const HARD_POISON_RULE_STRENGTH = 90;
export const HARD_MINIMAX_DEPTH = 3;

// ─── Internal utilities ───────────────────────────────────────────────────────

/**
 * Deep-clones a Game instance so minimax can mutate without touching the live game.
 * Copies: all cell markers, microBoard winners, microBoard isFull flags,
 * macroBoard winner, currentPlayerIndex, nextMicroBoardIndex.
 */
function cloneGame(game: Game): Game {
  const cloned = new Game(game.players[0].name, game.players[1].name);

  // Copy macro-level winner
  cloned.macroBoard.winner = game.macroBoard.winner;

  // Copy each microboard
  for (let mbIdx = 0; mbIdx < 9; mbIdx++) {
    const srcMb = game.macroBoard.microBoards[mbIdx];
    const dstMb = cloned.macroBoard.microBoards[mbIdx];

    dstMb.winner = srcMb.winner;
    dstMb.isFull = srcMb.isFull;

    for (let cIdx = 0; cIdx < 9; cIdx++) {
      dstMb.cells[cIdx].marker = srcMb.cells[cIdx].marker;
    }
  }

  // Copy turn state
  cloned.currentPlayerIndex = game.currentPlayerIndex;
  cloned.nextMicroBoardIndex = game.nextMicroBoardIndex;

  // Copy win/draw counters
  cloned.winCounts = { ...game.winCounts };
  cloned.drawCount = game.drawCount;

  return cloned;
}

/**
 * Returns all legal moves given current game state.
 * Respects nextMicroBoardIndex: if set and that board is still playable,
 * only returns moves in that board. Otherwise returns all empty cells in all
 * non-won, non-full boards.
 */
function getLegalMoves(game: Game): Move[] {
  const moves: Move[] = [];
  const { microBoards } = game.macroBoard;

  const isAvailable = (mb: MicroBoard) =>
    mb.winner === Marker.None && !mb.isFull;

  if (
    game.nextMicroBoardIndex !== null &&
    isAvailable(microBoards[game.nextMicroBoardIndex])
  ) {
    // Constrained to one microboard
    const mb = microBoards[game.nextMicroBoardIndex];
    for (let cIdx = 0; cIdx < 9; cIdx++) {
      if (mb.cells[cIdx].isEmpty()) {
        moves.push({ microIndex: game.nextMicroBoardIndex, cellIndex: cIdx });
      }
    }
  } else {
    // Free choice across all available boards
    for (let mbIdx = 0; mbIdx < 9; mbIdx++) {
      const mb = microBoards[mbIdx];
      if (!isAvailable(mb)) continue;
      for (let cIdx = 0; cIdx < 9; cIdx++) {
        if (mb.cells[cIdx].isEmpty()) {
          moves.push({ microIndex: mbIdx, cellIndex: cIdx });
        }
      }
    }
  }

  return moves;
}

/**
 * Filters candidates down to moves that immediately win a micro board for marker.
 * Clones the game for each candidate to avoid mutating the live state.
 */
function winMoves(game: Game, candidates: Move[], marker: Marker): Move[] {
  return candidates.filter((move) => {
    const clone = cloneGame(game);
    const mb = clone.macroBoard.microBoards[move.microIndex];
    // Directly set the cell marker (bypasses Game.placeMarker turn-enforcement)
    mb.cells[move.cellIndex].marker = marker;
    const result = mb.checkWinner();
    return result === marker;
  });
}

/**
 * Removes moves that send the opponent to a board where they can immediately win.
 * "Target board" for a move is microBoards[move.cellIndex] (the board the opponent
 * is forced into next). If that board is won or full, it is safe (opponent gets
 * free choice anyway). Otherwise, if any empty cell there would let opponent win,
 * the move is considered poisonous and removed.
 * If filtering removes ALL candidates, returns the original list (no choice).
 */
function filterPoisonSends(
  game: Game,
  candidates: Move[],
  aiMarker: Marker,
  opponentMarker: Marker
): Move[] {
  const safe = candidates.filter(({ microIndex, cellIndex }) => {
    const targetBoardIndex = cellIndex;
    const targetBoard = game.macroBoard.microBoards[targetBoardIndex];

    if (targetBoard.winner !== Marker.None || targetBoard.isFull) return true;

    const opponentCanWin = targetBoard.cells.some((cell, ci) => {
      if (!cell.isEmpty()) return false;
      const clone = cloneGame(game);
      const clonedTarget = clone.macroBoard.microBoards[targetBoardIndex];

      // If the AI's move is in the same board it's sending the opponent to,
      // apply the AI's marker first so the threat check is accurate
      if (microIndex === targetBoardIndex) {
        clonedTarget.cells[cellIndex].marker = aiMarker; // AI's move already placed
      }

      clonedTarget.cells[ci].marker = opponentMarker;
      return clonedTarget.checkWinner() === opponentMarker;
    });

    return !opponentCanWin;
  });

  // Never leave the AI with zero moves
  return safe.length > 0 ? safe : candidates;
}

// ─── Heuristic evaluation for minimax ────────────────────────────────────────

const MACRO_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Static evaluation of a game position from aiMarker's perspective.
 * Higher is better for the AI.
 */
function evaluate(game: Game, aiMarker: Marker): number {
  const { microBoards } = game.macroBoard;
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;
  let score = 0;

  // Score each macro win line by how many micro boards each side owns in it
  for (const line of MACRO_LINES) {
    let aiCount = 0;
    let oppCount = 0;

    for (const idx of line) {
      if (microBoards[idx].winner === aiMarker) aiCount++;
      else if (microBoards[idx].winner === opponentMarker) oppCount++;
    }

    if (aiCount === 2 && oppCount === 0) score += 10;
    else if (oppCount === 2 && aiCount === 0) score -= 10;
    else if (aiCount === 1 && oppCount === 0) score += 1;
    else if (oppCount === 1 && aiCount === 0) score -= 1;
  }

  // Centre board control
  const centreMb = microBoards[4];
  if (centreMb.winner === aiMarker) score += 5;
  else if (centreMb.winner === opponentMarker) score -= 5;

  // Bonus/penalty for each micro board claimed
  for (const mb of microBoards) {
    if (mb.winner === aiMarker) score += 3;
    else if (mb.winner === opponentMarker) score -= 3;
  }

  return score;
}

/**
 * Alpha-beta minimax. Returns a numeric score for the position.
 */
function minimax(
  game: Game,
  depth: number,
  alpha: number,
  beta: number,
  isMaximising: boolean,
  aiMarker: Marker
): number {
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;

  // Terminal checks
  if (game.macroBoard.winner === aiMarker) return 1000;
  if (game.macroBoard.winner === opponentMarker) return -1000;
  if (game.isGameOver()) return 0;
  if (depth === 0) return evaluate(game, aiMarker);

  const moves = getLegalMoves(game);

  if (isMaximising) {
    let best = -Infinity;
    for (const move of moves) {
      const clone = cloneGame(game);
      clone.placeMarker(move.microIndex, move.cellIndex);
      const val = minimax(clone, depth - 1, alpha, beta, false, aiMarker);
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const clone = cloneGame(game);
      clone.placeMarker(move.microIndex, move.cellIndex);
      const val = minimax(clone, depth - 1, alpha, beta, true, aiMarker);
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ─── Helper: random pick from array ──────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Public difficulty functions ──────────────────────────────────────────────

/** Easy: purely random legal move. */
export function easyMove(game: Game): Move {
  const moves = getLegalMoves(game);
  if (moves.length === 0) throw new Error('AI called with no legal moves — game may already be over');
  return pickRandom(moves);
}

/**
 * Medium: rule-based.
 * 1. Probabilistically try to win a micro board.
 * 2. Probabilistically avoid sending opponent to a winning board.
 * 3. Random from remaining candidates.
 */
export function mediumMove(game: Game): Move {
  const aiMarker = game.currentPlayer.marker;
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;

  let candidates = getLegalMoves(game);
  if (candidates.length === 0) throw new Error('AI called with no legal moves — game may already be over');

  // Win rule
  if (Math.random() * 100 < MEDIUM_WIN_RULE_STRENGTH) {
    const winning = winMoves(game, candidates, aiMarker);
    if (winning.length > 0) return pickRandom(winning);
  }

  // Poison filter
  if (Math.random() * 100 < MEDIUM_POISON_RULE_STRENGTH) {
    candidates = filterPoisonSends(game, candidates, aiMarker, opponentMarker);
  }

  return pickRandom(candidates);
}

/**
 * Hard: rule-based pre-filtering + minimax.
 * 1. Probabilistically win a micro board immediately.
 * 2. Probabilistically filter out poison sends.
 * 3. Minimax over remaining candidates.
 */
export function hardMove(game: Game): Move {
  const aiMarker = game.currentPlayer.marker;
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;

  let candidates = getLegalMoves(game);
  if (candidates.length === 0) throw new Error('AI called with no legal moves — game may already be over');

  // Win rule
  if (Math.random() * 100 < HARD_WIN_RULE_STRENGTH) {
    const winning = winMoves(game, candidates, aiMarker);
    if (winning.length > 0) return pickRandom(winning);
  }

  // Poison filter
  if (Math.random() * 100 < HARD_POISON_RULE_STRENGTH) {
    candidates = filterPoisonSends(game, candidates, aiMarker, opponentMarker);
  }

  // Minimax: score each remaining candidate
  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const move of candidates) {
    const clone = cloneGame(game);
    clone.placeMarker(move.microIndex, move.cellIndex);
    // After AI places, it's opponent's turn → isMaximising = false
    const score = minimax(
      clone,
      HARD_MINIMAX_DEPTH - 1,
      -Infinity,
      Infinity,
      false,
      aiMarker
    );

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandom(bestMoves.length > 0 ? bestMoves : candidates);
}
