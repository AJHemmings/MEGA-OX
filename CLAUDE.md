# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Exploration Policy

Always use jCodemunch-MCP tools — never fall back to Read, Grep, Glob, or Bash for code exploration.

- Before reading a file: use get_file_outline or get_file_content
- Before searching: use search_symbols or search_text
- Before exploring structure: use get_file_tree or get_repo_outline
- Call list_repos first; if the project is not indexed, call index_folder with the current directory.

## Project Overview

**Mega OX** is an "Ultimate Naughts and Crosses" game — a 3×3 grid of micro tic-tac-toe boards. Winning a micro board claims that cell on the macro board; win 3 macro cells in a row to win the game. Your move's cell index determines which micro board your opponent must play in next.

Live online multiplayer app (CRA + Supabase), deployed on Vercel. Public repo is a portfolio piece — `main` must always stay playable.

## Commands

```bash
npm start          # Dev server at localhost:3000
npm run build      # Production build

# Tests (6 suites in src/__tests__/, CRA/Jest)
CI=true npx react-scripts test --watchAll=false

# Docker dev environment (alternative)
docker-compose up  # Also runs on localhost:3000
```

**Env setup:** `.env.local` (dev server) AND `.env.test.local` (tests — CRA does not load `.env.local` when `NODE_ENV=test`). Both need `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`. Both are gitignored — copy them manually into any new git worktree.

**Worktree gotcha (Windows):** Jest can't glob tests under `.worktrees/` (the `\.` path segment breaks the glob). Run worktree tests with:
`CI=true npx react-scripts test --watchAll=false --testMatch "**/__tests__/**/*.test.{ts,tsx}"`

## Architecture

**Routing** — React Router (`App.tsx`): ~25 routes. Public (`/`, `/demo`, `/login`, `/leaderboard`…), game modes (`/training`, `/local`, `/game/:id`), protected routes behind `<ProtectedRoute>` (`/menu`, `/matchmaking`, `/shop`…), and admin routes behind `<AdminRoute>` with role checks (`/admin/*`).

**Provider nesting** (in `App.tsx`): `AuthProvider → ProgressionProvider → AppShell → PresenceProvider → Routes`. Other contexts: `SkinContext` (per-game skin loadout).

**Layers:**

- `src/models/Game.ts` — pure OOP game rules (`Cell`, `MicroBoard`, `MacroBoard`, `Game`), no React. Shared `WIN_LINES` + `findLineWinner()` used by boards and the AI.
- `src/ai/aiPlayer.ts` — easy/medium/hard AI. Hard uses minimax with a heuristic evaluator; strengths and depth are tuned live from `/admin/ai-tuner` via the `useAiConfig` hook (DB-backed).
- `src/hooks/` — one hook per data concern (`usePlayerProfile`, `useShop`, `useFriends`, …). Mostly hand-rolled fetch-in-effect + Supabase.
- `src/hooks/useOnlineGame.ts` — ALL online sync logic (moves, RPS, status, rematch, presence/forfeit). **Fragile by design — see warning below.**
- `src/lib/supabase.ts` — typed client from generated `src/lib/database.types.ts`. Regenerate types after schema changes; do NOT re-introduce `(supabase as any)` casts.
- `src/components/game/` — game screens plus shared chrome (`TurnPill`, `ScoreChip`, `BoardCanvas`).
- `supabase/` — migrations (source of truth for schema), `functions/post-game-handler` edge function (XP/credits/stats rewards after each game).

**Two game screens share chrome but not logic:** `GameWrapper.tsx` (local + vs-AI) and `components/game/OnlineGameView.tsx` (online, split into Mobile/Desktop layout components). Presentational pieces are shared via `components/game/`; player cards and sound logic intentionally differ.

## ⚠️ Online Sync — Do Not Refactor Casually

`useOnlineGame.ts` implements a battle-tested 3-layer sync (local-first apply → Realtime broadcast fast path → 1.5s DB polling fallback), RPS via `rps_picks` table polling, and rematch via DB intent columns. Many refs/flags exist to kill specific races (`localMoveCountRef`, `rpsRound` remount key, intent reset on gameId change). Before touching it, read the "Working sync architecture" memory / design docs. Presentation changes are fine; effect/state changes need two-browser live testing.

## Key Patterns

- **Board indexing:** cells and micro boards are flat 9-element arrays (index 0–8). Row/column math uses `Math.floor(i/3)` and `i%3`.
- **Board constraint rule:** `game.nextMicroBoardIndex` — `null` means free choice; if the target board is won/full it resets to `null`.
- **Immutability workaround:** `Game` mutates in place; `useGameLogic` does `setGame({ ...game })` to force re-renders.
- **Styling:** all inline CSS driven by `src/styles/tokens.ts` (dark glassmorphism theme). No CSS framework. Shared animations in `src/components/animations.css`. Native `<select>` needs `colorScheme: 'dark'` or the popup renders unreadable.
- **Mobile/desktop:** `useIsMobile()` picks between sibling `MobileLayout`/`DesktopLayout` components (pattern in `MainMenu`, `OnlineGameView`).
- **StrictMode gotchas:** effects double-invoke in dev. `mountedRef` effects must reset `mountedRef.current = true` in the body (not cleanup-only). A benign Supabase Realtime Web-Locks AbortError is suppressed in `public/index.html`.
- **Countdown timers:** use the two-effect pattern (interval driver + fresh-state reader at expiry) to avoid stale closures.

## Workflow

- **Branches:** `main` stays playable/deployable; all work on `feat/*` branches, usually in a git worktree under `.worktrees/` (gitignored).
- **Remotes:** `origin` = public repo (Vercel watches `main` → production deploy on push), `private` = private mirror. Push both after merging.
- **Deploys:** by `git push origin main` only — never via Vercel CLI.
- **DB changes:** SQL in `supabase/migrations/`, applied via Supabase MCP `apply_migration` from the main session (never a subagent), then regenerate `database.types.ts`.
- **Commits:** authored as Adam Hemmings; Claude only in `Co-Authored-By` trailers.
