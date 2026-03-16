# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mega OX** is an "Ultimate Naughts and Crosses" game — a 3×3 grid of micro tic-tac-toe boards. Winning a micro board claims that cell on the macro board; win 3 macro cells in a row to win the game. Your move's cell index determines which micro board your opponent must play in next.

## Commands

```bash
npm start          # Dev server at localhost:3000
npm run build      # Production build

# Docker dev environment (alternative)
docker-compose up  # Also runs on localhost:3000
```

No test suite is configured yet. `react-scripts test` is available from CRA but unused.

## Architecture

**State routing in `App.tsx`** — navigation is handled by a `currentState` string (`'menu'` | `'multiplayer-menu'` | `'game'`), not React Router. React Router is installed but unused.

**Game logic lives in two places:**
- `src/models/Game.ts` — Pure OOP classes (`Cell`, `MicroBoard`, `MacroBoard`, `Game`). All game rules live here. No React.
- `src/hooks/useGameLogic.ts` — Wraps `Game` instances in React state. Uses an object spread trick (`{ ...game }`) to force re-renders since `Game` mutates in place.

**Component tree:**
```
App → GameWrapper → MacroBoard → MicroBoard → Cell
                 → PlayerIndicator
                 → Modal
```

**AI** (in `GameWrapper.tsx`) is random-move selection with a 2–6s fake delay. It triggers via `useEffect` watching `game.getCurrentPlayer()`.

## Key Patterns

- **Board indexing:** Cells and micro boards are both stored as flat 9-element arrays (index 0–8), not 2D arrays. Row/column math uses `Math.floor(i/3)` and `i%3`.
- **Board constraint rule:** `game.nextMicroBoardIndex` — `null` means free choice; a number forces the opponent to play in that specific micro board. If that board is already won or full, it resets to `null`.
- **Immutability workaround:** `Game` mutates in place. After any state change, `useGameLogic` does `setGame({ ...game })` to trigger a React re-render.
- **All styling is inline CSS** — no CSS framework, no styled-components. Shared animations are in `src/components/animations.css`.

## Planned but Not Implemented

Online multiplayer is stubbed in the UI (disabled buttons in `MultiplayerMenu.tsx`) but has no backend. The plan is Supabase for auth/persistence and WebSockets for real-time sync. No Supabase code exists yet.
