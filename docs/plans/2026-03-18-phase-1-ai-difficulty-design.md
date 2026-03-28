# Phase 1 — AI Difficulty System Design
**Date:** 2026-03-18
**Status:** Approved
**Depends on:** None

---

## Goal

Replace the current random-move AI with three selectable difficulty levels (Easy, Medium,
Hard) for single-player mode. Add a pre-game difficulty selector screen. Keep all existing
game flow untouched.

---

## Hard Constraint

**The game flow must not be affected in any way.**

`Game.ts` and `useGameLogic.ts` are not modified. In `GameWrapper.tsx`, the only
permitted changes are:
- Remove the inline `makeAiMove()` function
- Replace its call site with a call to the imported AI module — same location, same
  `onPlaceMarker` call at the end
- Add the `difficulty` prop
- Adjust delay timing constants

The `useEffect` that watches `game.currentPlayer`, the `isAiTurn` state, and the
`onPlaceMarker` hook are not touched. If the game stops working after these changes,
the cause is in the AI module — not in the game logic.

---

## Architecture

### New file: `src/ai/aiPlayer.ts`
Pure TypeScript. No React. No imports from React. Exports one move function per
difficulty and the strength constants. Receives the `Game` instance and returns
`{ microIndex, cellIndex }`.

```ts
export function easyMove(game: Game): { microIndex: number; cellIndex: number }
export function mediumMove(game: Game): { microIndex: number; cellIndex: number }
export function hardMove(game: Game): { microIndex: number; cellIndex: number }
```

### New file: `src/components/DifficultySelector.tsx`
Shown before `GameWrapper` mounts in single-player flow. Renders three buttons
(Easy / Medium / Hard) with short descriptions. On selection, calls a callback that
passes difficulty down and mounts `GameWrapper`.

### Modified: `src/components/GameWrapper.tsx`
- Accepts new prop: `difficulty: 'easy' | 'medium' | 'hard'`
- Imports the three move functions from `src/ai/aiPlayer.ts`
- Replaces inline `makeAiMove()` with a call to the right function based on prop
- Delay range tied to difficulty (see below)

### Entry point for single-player flow
The component or route that currently mounts `GameWrapper` directly for single-player
is updated to show `DifficultySelector` first. Once a difficulty is selected,
`GameWrapper` mounts with that prop.

---

## AI Behaviour Per Difficulty

### Easy
Current random move selection. Extracted from `GameWrapper` into `easyMove()` with
no logic changes. Serves as the baseline and as a reference implementation for the
other difficulty functions.

### Medium
Two heuristic rules applied in priority order. Each has a strength constant (0–100).
At each turn, a random number is rolled per rule — if it falls above the strength
value, the rule is skipped for that move (simulating human-like inconsistency).

**Rule 1 — Win the micro board (checked first):**
Scan available moves. If any move would give O a win on a micro board, prefer those
moves. Followed `MEDIUM_WIN_RULE_STRENGTH`% of the time.

**Rule 2 — Avoid the poison send (checked second):**
From the remaining candidate moves, filter out any that would send the opponent to a
micro board where they can immediately win on their next turn.
Followed `MEDIUM_POISON_RULE_STRENGTH`% of the time.

**Fallback:** Random selection from remaining legal moves.

```ts
// Adjustable in code now. Exposed via admin dashboard in Phase 7.
const MEDIUM_WIN_RULE_STRENGTH = 80    // follows rule 80% of the time
const MEDIUM_POISON_RULE_STRENGTH = 70 // follows rule 70% of the time
```

### Hard
Minimax with alpha-beta pruning at a fixed search depth. Same heuristic rules as
Medium are layered on top of the evaluation function, with higher strength values.

**Evaluation function scores a board position by:**
- Macro win lines where O has 2 and X has 0 (high weight — winning threat)
- Macro win lines where X has 2 and O has 0 (high weight — blocking urgency)
- Micro boards won by O vs won by X (medium weight)
- Ownership of the centre micro board (bonus — index 4 appears in 4 macro win lines)
- Poison send penalty (subtract score for moves that hand opponent a free micro win)

**Search depth:** Fixed constant, initially set to 3 plies. Tuned against the
simulation harness — increase until browser turn delay exceeds ~500ms, then step back.

```ts
// Adjustable in code now. Exposed via admin dashboard in Phase 7.
const HARD_WIN_RULE_STRENGTH = 95
const HARD_POISON_RULE_STRENGTH = 90
const HARD_MINIMAX_DEPTH = 3
```

**Note:** Minimax requires cloning game state at each node to avoid mutating the live
game. `Game.ts` mutates in place, so a deep clone utility is needed inside `aiPlayer.ts`.
This clone is internal to the AI module and does not affect the live `Game` instance.

---

## AI Delay Timing

Delay is a UX signal — shorter for Easy (clearly not thinking), longer for Hard
(feels like it's working).

| Difficulty | Min delay | Max delay |
|---|---|---|
| Easy | 500ms | 1500ms |
| Medium | 1000ms | 2500ms |
| Hard | 1500ms | 3000ms |

The existing random delay range pattern in `GameWrapper` is kept; only the min/max
constants change based on the `difficulty` prop.

---

## Admin Dashboard Integration (Phase 7)

The strength constants and minimax depth are hardcoded in Phase 1. In Phase 7, the
admin dashboard gains an "AI Difficulty Tuner" panel:

- Editable number inputs (0–100) per rule per difficulty
- Minimax depth input for Hard
- Values stored in a Supabase config table, read at game start
- No code deploy required to adjust AI behaviour

The AI module will be written to accept these values as parameters in Phase 7.
In Phase 1 the constants are the single source of truth.

---

## Files Changed

| File | Action | Notes |
|---|---|---|
| `src/ai/aiPlayer.ts` | Create | All AI logic lives here |
| `src/components/DifficultySelector.tsx` | Create | Pre-game difficulty screen |
| `src/components/GameWrapper.tsx` | Modify | Add `difficulty` prop, swap `makeAiMove` for import, adjust delays |
| Entry point for single-player | Modify | Show `DifficultySelector` before mounting `GameWrapper` |

---

## Out of Scope for Phase 1

- Multiplayer, local 2-player, tutorial — untouched
- XP or achievement hooks — referenced by difficulty in Phase 3, not needed yet
- Admin config table — Phase 7
- Art or visual changes to the game screen
