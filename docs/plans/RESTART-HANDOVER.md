# Restart Handover — Read This First

## What you are doing

The `/how-to-play` tutorial is complete and split into two levels. No outstanding bugs. Next work is network multiplayer.

## Current branch

`feat/network-multiplayer` — all work goes here. Main stays clean for portfolio.

---

## Tutorial state (complete, two levels)

**Routes:**
- `/how-to-play` → `HowToPlaySelectPage` (mode picker: Beginner / Intermediate)
- `/how-to-play/beginner` → 7 steps (chain rule only, idx 0–6)
- `/how-to-play/intermediate` → 14 steps (full tutorial including endgame, idx 0–13)

**BEGINNER_STEPS (idx 0–6):**
- 0: Welcome — macro board
- 1: Key rule — Board E spotlight
- 2: **CLICK** — X plays Board E Cell 1; AI plays Board A Cell 5 sync
- 3: Spotlight AI marker at Board A Cell 5
- 4: Chain explanation — arrow Board A Cell 5 → Board E
- 5: **CLICK** — X plays Board E Cell 5
- 6: Bridge — "Core rule complete!"

**INTERMEDIATE_STEPS adds (idx 7–13):**
- 7: Preload (O's turn, free choice) — endgame overview
- 8: **CLICK** — player plays AS O: Board D Cell 2 → sends X to won Board B → free choice
- 9: Board B spotlit — "X gets free choice"
- 10: **CLICK** — X plays Board E Cell 4 (centre, diagonal win); AI plays Board I Cell 7 sync
- 11: "Circle's free pick" explanation — arrow Board I → Board H
- 12: **CLICK** — X plays Board H Cell 2 — wins Board H — wins macro game
- 13: Win celebration

---

## Bug 1 — Abrupt transition between sections (NOT YET FIXED)

**Expected:** After the player clicks on Step 5 (Board E Cell 5), there should be a plain bridging step saying something like "Good work — you've learned the core rule. Now let's see how an endgame plays out." The player clicks Next, and only THEN does the board replace itself with the endgame preload.

**What's happening:** After Step 5's click, advancing goes straight to Step 6, which fires the preload immediately and replaces the board without warning. The transition is jarring.

**Root cause:** There is no bridging step between the first section and the preload step. The preload fires in `onafterchange` when Step 6 is entered.

**Fix to apply:** Insert a new non-click, non-preload step between current Step 5 and Step 6. This step uses `targetSelector: '#tutorial-macro-board'`, says something like "Great — you understand the chain rule. Let's jump to an endgame situation and see it pay off." No `preloadState` on this step. The preload should stay on the *next* step (what is currently Step 6, which becomes Step 7 after insertion). All subsequent step indices shift by 1.

---

## Bug 2 — Player cannot click the centre cell on the free choice step (NOT YET FIXED)

**Expected:** On the free choice step (currently Step 7, idx 7), the player should be able to freely click Board E Cell 5 (idx 4).

**What's happening:** The click is silently ignored. The cell appears, but clicking it does nothing.

**Root cause (verified by reading `Game.ts` `placeMarker`):**

`ENDGAME_PRELOAD` sets `nextMicroBoardIndex: 1` (Board B). `Game.ts` `placeMarker` enforces this strictly:

```ts
if (this.nextMicroBoardIndex !== null && microBoardIndex !== this.nextMicroBoardIndex) {
  return false; // ← blocks ALL boards except board 1
}
```

The engine does NOT automatically convert a won board's `nextMicroBoardIndex` to free choice — that only happens *after* you successfully place a marker that would point there. Since the preload bypasses `placeMarker` and directly sets `nextMicroBoardIndex = 1`, the constraint stays in force. Board E (index 4) ≠ 1, so every click on Board E is rejected silently.

**Fix to apply:** Change `ENDGAME_PRELOAD.nextMicroBoardIndex` from `1` to `null` in `tutorialScript.ts`. `null` is the actual free-choice state in `Game.ts`. The board will visually highlight all available boards (which is correct — that IS what free choice looks like). The tutorial text still explains conceptually why free choice is being granted ("Board B is won").

**File:** `src/components/game/tutorialScript.ts`, line ~105:
```ts
const ENDGAME_PRELOAD: PreloadState = {
  ...
  nextMicroBoardIndex: null,  // ← change from 1 to null
  ...
};
```

---

## What was done in the last two sessions

| Work | Status |
| --- | --- |
| Bug: Next button hiding on requiresClick steps | ✅ Fixed — CSS body class instead of inline style |
| Bug: Stale step index in handlePlaceMarker | ✅ Fixed — replaced useState with useRef |
| Bug: Race condition — AI move 300ms after step advance | ✅ Fixed — AI fires synchronously in handlePlaceMarker |
| New step: spotlight AI's marker between click and chain explanation | ✅ Done |
| New endgame section (preload + 3 interactive steps + win) | ✅ Done — but Bug 1 and Bug 2 remain |
| TutorialOverlay.tsx deleted (was unused) | ✅ Done, committed |

---

## Key files

| File | Purpose |
| ---- | ------- |
| `src/components/game/HowToPlayPage.tsx` | Tutorial page — Intro.js init, `handlePlaceMarker`, `onafterchange` |
| `src/components/game/tutorialScript.ts` | 11-step script. Edit this to change steps. Has game state trace at top. |

---

## Architecture of HowToPlayPage.tsx (important to understand before touching)

- `gameRef` — holds the `Game` instance. Direct mutations happen here.
- `currentStepIndexRef` — **useRef, not useState**. Sync, no re-renders. `handlePlaceMarker` reads this to know which step is active. `onafterchange` writes it.
- `handlePlaceMarker` — called when a cell is clicked. Guards: `!step.requiresClick`, wrong board/cell index. Fires AI move synchronously. Then `refreshGame()`, then `advanceStep()`.
- `onafterchange` — fires on every step transition. Syncs `currentStepIndexRef`, applies `preloadState` if present, toggles `tutorial-requires-click` body class (hides Next button via CSS).
- `advanceStep` — sets `currentStepIndexRef.current = nextIndex`, then calls `intro.goToStepNumber(nextIndex + 1)` (1-indexed).
- Next button hiding — CSS rule in JSX: `body.tutorial-requires-click .introjs-nextbutton { display: none !important; }`. Body class toggled in `onafterchange`.

---

## The preload mechanism (how it works, and where Bug 2 lives)

When a step has `preloadState`, `onafterchange` creates a brand new `Game` instance, manually sets cell markers and board winners, calls `checkFull()` and `checkWinner()` on each board, then replaces `gameRef.current` and calls `refreshGame()`.

The bug is that `nextMicroBoardIndex: 1` was set in the preload to "demonstrate" the forced-board-won situation, but `Game.placeMarker` still enforces it as a hard constraint. The fix is `nextMicroBoardIndex: null`.

---

## The game's cell → board constraint rule

Boards are A–I (indices 0–8). Cells inside each board are 1–9 (indices 0–8).
**The cell index you play = the next active board index.**
Play Cell 5 (idx 4) → nextMicroBoardIndex = 4 (Board E).
Play Cell 1 (idx 0) → nextMicroBoardIndex = 0 (Board A).

When `nextMicroBoardIndex` points to a won or full board, `Game.placeMarker` sets it to `null` (free choice) — but **only after a valid move**. Directly assigning `nextMicroBoardIndex = N` in the preload bypasses this check.

---

## Endgame board state (ENDGAME_PRELOAD)

```
Macro:  .  | B(X) |  .
        .  |  E   |  .
        .  |  H   |  .
```

- Board B (1): X won — cells 0, 3, 6 (left column). `winner: 'X'`
- Board E (4): X at cells 0 and 8 (diagonal corners). One click on cell 4 (centre) = diagonal win.
- Board H (7): X at cells 0 and 1 (top row). One click on cell 2 (top-right) = top row win.
- After Bug 2 fix: `nextMicroBoardIndex: null` (free choice)

**Win chain:**
- Player clicks Board E Cell 4 → X wins Board E → AI plays Board I Cell 7 (idx 7) → nextMicroBoardIndex = 7
- Player clicks Board H Cell 2 → X wins Board H → macroBoard.winner = X (B + E + H = middle column) ✓

---

## After both bugs are fixed — smoke test checklist

1. Walk steps 0–5 (first section): Next button visible on non-click steps, hidden on click steps
2. Step 2 (idx 2): clicking Board E Cell 1 places X, AI immediately plays Board A Cell 5
3. Step 3 (idx 3): spotlight is on the O marker in Board A Cell 5
4. Step 5 (idx 5): clicking Board E Cell 5 works; Next appears on step 6 (new bridge step)
5. **NEW bridge step:** plain explanation, no board change, Next → proceeds to preload step
6. Step 6 (idx 6, now shifted): board REPLACES to endgame state; Board B is spotlit with its X win
7. Step 7 (idx 7): **Next button hidden**; player can click Board E Cell 4 (any click on wrong cell/board is silently ignored)
8. After Board E click: AI plays Board I; step advances to Board H explanation
9. Step 9: **Next button hidden**; player clicks Board H Cell 2; X wins macro game
10. Step 10: celebration; Done button → navigates to `/`

---

## Key architectural decisions (do not re-litigate)

- Supabase is the entire backend — no Vercel API routes
- DB-authoritative realtime: both players subscribe to the `games` row
- `Game.ts` OOP engine stays client-side; Postgres is source of truth
- All styling is inline CSS — no CSS framework
- All work on `feat/network-multiplayer` — main stays clean for portfolio

---

## All key files

| File | Purpose |
| ---- | ------- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper. Uses `{ ...game }` spread to trigger re-renders |
| `src/App.tsx` | React Router v7. All routes defined here |
| `src/components/GameWrapper.tsx` | Game board + AI logic |
| `src/components/MainMenu.tsx` | Lobby-style main menu + Intro.js tour |
| `src/hooks/useTutorial.ts` | Tutorial tracking — `shouldAutoStart`, `markComplete`, `resetTutorial` |
| `src/components/game/tutorialScript.ts` | **Edit this** to change tutorial content/steps |
| `src/components/game/HowToPlayPage.tsx` | `/how-to-play` — interactive tutorial game |
| `src/components/profile/SettingsPage.tsx` | Settings including Replay Tutorial button |
| `src/types/leader-line-new.d.ts` | Manual TS declaration for leader-line-new |
| `.eslintrc.json` | ESLint config — extends react-app, adds exhaustive-deps rule |

---

## Credentials

`.env.local` and `.env.test.local` are written and gitignored. They contain:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect)
- Vercel
- GitHub
