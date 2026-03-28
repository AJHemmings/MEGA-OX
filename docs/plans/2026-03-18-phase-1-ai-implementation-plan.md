# Phase 1 — AI Difficulty System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the random AI in single-player mode with three selectable difficulty levels (Easy, Medium, Hard), wired to the difficulty selector already built in MainMenu.

**Architecture:** A new pure TypeScript module `src/ai/aiPlayer.ts` exports one move function per difficulty. `TrainingRoute` in `App.tsx` reads the `?difficulty` query param and passes it as a prop to `GameWrapper`. `GameWrapper` swaps its inline `makeAiMove()` for a call to the imported module. Game flow is not touched.

**Tech Stack:** TypeScript, React (prop changes only), existing `Game` / `MicroBoard` / `Cell` / `Marker` classes from `src/models/Game.ts`.

**Note on testing:** No test framework is configured in this project. Verification steps use manual browser checks and console logging.

---

## Hard Constraint (repeat from design doc)

`Game.ts` and `useGameLogic.ts` are not modified at all.

In `GameWrapper.tsx`, only four things change:
1. Add `difficulty` prop
2. Remove inline `makeAiMove()`
3. Call imported AI function in its place
4. Adjust delay constants by difficulty

If the game breaks after these changes, the cause is in `aiPlayer.ts`, not in game logic.

---

## Task 1: Create `src/ai/aiPlayer.ts`

**Files:**
- Create: `src/ai/aiPlayer.ts`

This file is pure TypeScript with no React imports. It imports `Game`, `MicroBoard`, `Marker` from `../models/Game`.

---

### Step 1: Create the file and add the move type + clone utility

The clone utility is internal. Minimax must never mutate the live game — it clones, simulates on the clone, and discards it.

```ts
import { Game, MicroBoard, Marker } from '../models/Game';

export type Move = { microIndex: number; cellIndex: number };

// Deep clone a Game instance for use in minimax simulation.
// Only copies the state minimax needs — board markers, winners, fullness,
// current player, and next board constraint.
function cloneGame(game: Game): Game {
  const clone = new Game();
  clone.currentPlayerIndex = game.currentPlayerIndex;
  clone.nextMicroBoardIndex = game.nextMicroBoardIndex;

  game.macroBoard.microBoards.forEach((mb, mi) => {
    const cmb = clone.macroBoard.microBoards[mi];
    mb.cells.forEach((cell, ci) => {
      cmb.cells[ci].marker = cell.marker;
    });
    cmb.winner = mb.winner;
    cmb.isFull = mb.isFull;
  });

  clone.macroBoard.winner = game.macroBoard.winner;
  return clone;
}
```

---

### Step 2: Add the move collector utility

Both Easy and Medium need the list of legal moves. Extract it once.

```ts
// Returns all legal moves for the current game state.
function getLegalMoves(game: Game): Move[] {
  const moves: Move[] = [];

  if (game.nextMicroBoardIndex !== null) {
    const mb = game.macroBoard.microBoards[game.nextMicroBoardIndex];
    if (mb.winner === Marker.None && !mb.isFull) {
      mb.cells.forEach((cell, ci) => {
        if (cell.isEmpty()) moves.push({ microIndex: game.nextMicroBoardIndex!, cellIndex: ci });
      });
    }
  }

  if (moves.length === 0) {
    game.macroBoard.microBoards.forEach((mb, mi) => {
      if (mb.winner === Marker.None && !mb.isFull) {
        mb.cells.forEach((cell, ci) => {
          if (cell.isEmpty()) moves.push({ microIndex: mi, cellIndex: ci });
        });
      }
    });
  }

  return moves;
}
```

---

### Step 3: Add `easyMove`

Direct extraction of the current random logic in GameWrapper.

```ts
export function easyMove(game: Game): Move {
  const moves = getLegalMoves(game);
  return moves[Math.floor(Math.random() * moves.length)];
}
```

---

### Step 4: Add the Medium heuristic helpers

**Helper 1 — win filter:** returns moves that immediately win a micro board for the AI.

```ts
// Returns moves from candidates that immediately win a micro board for marker.
function winMoves(game: Game, candidates: Move[], marker: Marker): Move[] {
  return candidates.filter(({ microIndex, cellIndex }) => {
    const clone = cloneGame(game);
    const mb = clone.macroBoard.microBoards[microIndex];
    mb.cells[cellIndex].marker = marker;
    return mb.checkWinner() === marker;
  });
}
```

**Helper 2 — poison filter:** removes moves that send the opponent to a board where they can immediately win.

```ts
// Returns candidates with poison sends removed.
// A poison send: after our move, opponent is forced into a board where
// at least one of their moves would immediately win that micro board.
function filterPoisonSends(game: Game, candidates: Move[], opponentMarker: Marker): Move[] {
  const safe = candidates.filter(({ microIndex, cellIndex }) => {
    const targetBoardIndex = cellIndex; // board opponent is sent to
    const targetBoard = game.macroBoard.microBoards[targetBoardIndex];

    // If that board is already won or full, opponent gets free choice — not a forced poison
    if (targetBoard.winner !== Marker.None || targetBoard.isFull) return true;

    // Check if opponent can immediately win in targetBoard
    const opponentCanWin = targetBoard.cells.some((cell, ci) => {
      if (!cell.isEmpty()) return false;
      const clone = cloneGame(game);
      const mb = clone.macroBoard.microBoards[targetBoardIndex];
      mb.cells[ci].marker = opponentMarker;
      return mb.checkWinner() === opponentMarker;
    });

    return !opponentCanWin;
  });

  // If filtering removes all moves, return the original list (no choice)
  return safe.length > 0 ? safe : candidates;
}
```

---

### Step 5: Add the strength constants and `mediumMove`

```ts
// 0–100. The rule is followed this % of the time.
// Hardcoded now; admin dashboard wires these to a config table in Phase 7.
export const MEDIUM_WIN_RULE_STRENGTH = 80;
export const MEDIUM_POISON_RULE_STRENGTH = 70;

export function mediumMove(game: Game): Move {
  const aiMarker = game.currentPlayer.marker;
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;
  let candidates = getLegalMoves(game);

  // Rule 1: take a winning move if the dice roll falls within strength
  if (Math.random() * 100 < MEDIUM_WIN_RULE_STRENGTH) {
    const wins = winMoves(game, candidates, aiMarker);
    if (wins.length > 0) return wins[Math.floor(Math.random() * wins.length)];
  }

  // Rule 2: filter out poison sends if the dice roll falls within strength
  if (Math.random() * 100 < MEDIUM_POISON_RULE_STRENGTH) {
    candidates = filterPoisonSends(game, candidates, opponentMarker);
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
```

---

### Step 6: Add the Hard evaluation function and minimax

```ts
export const HARD_WIN_RULE_STRENGTH = 95;
export const HARD_POISON_RULE_STRENGTH = 90;
export const HARD_MINIMAX_DEPTH = 3;

const MACRO_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

// Score a position from aiMarker's perspective. Higher = better for AI.
function evaluate(game: Game, aiMarker: Marker): number {
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;
  const macroState = game.macroBoard.microBoards.map(mb => mb.winner);
  let score = 0;

  // Macro win line threats
  for (const [a, b, c] of MACRO_LINES) {
    const cells = [macroState[a], macroState[b], macroState[c]];
    const aiCount = cells.filter(m => m === aiMarker).length;
    const oppCount = cells.filter(m => m === opponentMarker).length;

    if (oppCount === 0 && aiCount === 2) score += 10;
    if (aiCount === 0 && oppCount === 2) score -= 10;
    if (oppCount === 0 && aiCount === 1) score += 1;
    if (aiCount === 0 && oppCount === 1) score -= 1;
  }

  // Centre board ownership
  if (macroState[4] === aiMarker) score += 5;
  if (macroState[4] === opponentMarker) score -= 5;

  // Micro boards won
  macroState.forEach(m => {
    if (m === aiMarker) score += 3;
    if (m === opponentMarker) score -= 3;
  });

  return score;
}

function minimax(
  game: Game,
  depth: number,
  alpha: number,
  beta: number,
  isMaximising: boolean,
  aiMarker: Marker
): number {
  // Terminal states
  if (game.macroBoard.winner === aiMarker) return 1000;
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;
  if (game.macroBoard.winner === opponentMarker) return -1000;
  if (game.isGameOver()) return 0;
  if (depth === 0) return evaluate(game, aiMarker);

  const moves = getLegalMoves(game);

  if (isMaximising) {
    let best = -Infinity;
    for (const { microIndex, cellIndex } of moves) {
      const clone = cloneGame(game);
      clone.placeMarker(microIndex, cellIndex);
      const val = minimax(clone, depth - 1, alpha, beta, false, aiMarker);
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break; // prune
    }
    return best;
  } else {
    let best = Infinity;
    for (const { microIndex, cellIndex } of moves) {
      const clone = cloneGame(game);
      clone.placeMarker(microIndex, cellIndex);
      const val = minimax(clone, depth - 1, alpha, beta, true, aiMarker);
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) break; // prune
    }
    return best;
  }
}

export function hardMove(game: Game): Move {
  const aiMarker = game.currentPlayer.marker;
  const opponentMarker = aiMarker === Marker.X ? Marker.O : Marker.X;
  let candidates = getLegalMoves(game);

  // Rule 1: immediate win
  if (Math.random() * 100 < HARD_WIN_RULE_STRENGTH) {
    const wins = winMoves(game, candidates, aiMarker);
    if (wins.length > 0) return wins[Math.floor(Math.random() * wins.length)];
  }

  // Rule 2: poison filter
  if (Math.random() * 100 < HARD_POISON_RULE_STRENGTH) {
    candidates = filterPoisonSends(game, candidates, opponentMarker);
  }

  // Minimax over remaining candidates
  let bestScore = -Infinity;
  let bestMove = candidates[0];

  for (const move of candidates) {
    const clone = cloneGame(game);
    clone.placeMarker(move.microIndex, move.cellIndex);
    const score = minimax(clone, HARD_MINIMAX_DEPTH - 1, -Infinity, Infinity, false, aiMarker);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
```

---

### Step 7: Verify the file compiles

Run from the project root:
```bash
npx tsc --noEmit
```
Expected: no errors. If TypeScript complains about `checkWinner` being called on a cloned MicroBoard, check that the clone correctly copies all cell markers before the call.

---

### Step 8: Commit

```bash
git add src/ai/aiPlayer.ts
git commit -m "feat: add aiPlayer module with Easy, Medium, Hard move functions"
```

---

## Task 2: Wire `difficulty` through `App.tsx` → `GameWrapper`

**Files:**
- Modify: `src/App.tsx` — `TrainingRoute` component (lines 23–26)
- Modify: `src/components/GameWrapper.tsx` — props interface and `makeAiMove` replacement

---

### Step 1: Add `difficulty` prop to `GameWrapper`

Open `src/components/GameWrapper.tsx`. Update the props interface:

```ts
// Before
interface GameWrapperProps {
  gameMode: "single" | "local";
  onBackToMenu: () => void;
  onGameOver?: (winner: string) => void;
  navExtra?: React.ReactNode;
}

// After
interface GameWrapperProps {
  gameMode: "single" | "local";
  difficulty?: "easy" | "medium" | "hard";
  onBackToMenu: () => void;
  onGameOver?: (winner: string) => void;
  navExtra?: React.ReactNode;
}
```

Destructure it in the component signature:
```ts
const GameWrapper: React.FC<GameWrapperProps> = ({
  gameMode,
  difficulty = "easy",
  onBackToMenu,
  onGameOver,
  navExtra,
}) => {
```

---

### Step 2: Replace delay constants with difficulty-aware values

Find the existing delay constants (around line 27–31) and replace:

```ts
// Before
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 6000;
const AI_THINKING_DELAY_MS =
  Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;

// After
const DELAY_RANGES = {
  easy:   { min: 500,  max: 1500 },
  medium: { min: 1000, max: 2500 },
  hard:   { min: 1500, max: 3000 },
};
const { min: MIN_DELAY_MS, max: MAX_DELAY_MS } = DELAY_RANGES[difficulty];
const AI_THINKING_DELAY_MS =
  Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
```

---

### Step 3: Replace `makeAiMove` with imported call

Add the import at the top of `GameWrapper.tsx`:
```ts
import { easyMove, mediumMove, hardMove } from '../ai/aiPlayer';
```

Delete the entire `makeAiMove` function (lines 62–100 in the original).

In the `useEffect` that calls `makeAiMove()`, replace that call:

```ts
// Before
makeAiMove();

// After
const moveMap = { easy: easyMove, medium: mediumMove, hard: hardMove };
const move = moveMap[difficulty](game);
onPlaceMarker(move.microIndex, move.cellIndex);
```

The `useEffect` structure, `isAiTurn` state, and `onPlaceMarker` are untouched.

---

### Step 4: Update `TrainingRoute` in `App.tsx` to read `?difficulty`

```ts
// Before
const TrainingRoute: React.FC = () => {
  const navigate = useNavigate();
  return <GameWrapper gameMode="single" onBackToMenu={() => navigate('/menu')} />;
};

// After
const TrainingRoute: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = (searchParams.get('difficulty') ?? 'easy') as 'easy' | 'medium' | 'hard';
  return <GameWrapper gameMode="single" difficulty={difficulty} onBackToMenu={() => navigate('/menu')} />;
};
```

Add `useSearchParams` to the react-router-dom import at the top of `App.tsx`:
```ts
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
```

---

### Step 5: Verify compilation

```bash
npx tsc --noEmit
```
Expected: no errors.

---

### Step 6: Manual browser verification

```bash
npm start
```

1. Log in and go to `/menu`
2. Click "Training (vs AI)" — the difficulty modal should open
3. Select **Easy** — game starts, AI makes random-looking moves after 0.5–1.5s
4. Play a full game to completion — game over modal/display appears normally
5. Click New Game — resets correctly
6. Go back to menu, select **Medium** — AI should now occasionally take winning micro board moves
7. Go back to menu, select **Hard** — AI delay is 1.5–3s, play should feel notably stronger
8. Try navigating directly to `/training?difficulty=hard` — should start on Hard without going through the menu

**Critical check:** confirm the game flow is identical to before — no regressions in turn switching, board constraint rule, game over detection, or New Game reset.

---

### Step 7: Commit

```bash
git add src/App.tsx src/components/GameWrapper.tsx
git commit -m "feat: wire difficulty prop through TrainingRoute and GameWrapper, replace makeAiMove"
```

---

## Done

Phase 1 is complete when:
- [ ] `/training?difficulty=easy` plays random AI
- [ ] `/training?difficulty=medium` plays heuristic AI (occasionally wins micro boards, mostly avoids poison sends)
- [ ] `/training?difficulty=hard` plays minimax AI with noticeably stronger macro positioning
- [ ] All three game modes (single, local, multiplayer) behave identically to before
- [ ] `npx tsc --noEmit` passes clean
