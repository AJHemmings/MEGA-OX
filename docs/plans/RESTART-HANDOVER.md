# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Disconnect handling is **implemented and in live testing** on the private Vercel deployment.
>
> The branch `feat/disconnect-handling` is in the worktree. Tasks 1–6 are complete. Task 7 (this doc) is done.
>
> The immediate next step depends on testing results — fix any bugs reported, then merge.
>
> Ready when you are."

---

## Current state

**Active branch:** `feat/disconnect-handling`
**Worktree path:** `F:\Projects\MEGA-OX\.worktrees\feat-disconnect-handling`
**Parent branch:** `feat/phase-2-skins` (Phase 2 complete, not yet merged to local `main`)

**Private Vercel (testing):** `mega-ox-dev-git-feat-disconnect-8ee57f-adams-projects-ff804fb2.vercel.app`
— Project: `mega-ox-dev` (prj_ax0KSF6QTW1EMnAdtDa9HesZWCub), Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Deployment protection: **disabled** (turned off for testing)
— Connected to: `AJHemmings/MEGA-OX-private`, branch `feat/disconnect-handling`

**Public Vercel (`mega-ox`):** Portfolio/CV version. Leave alone.

**`main` branch:** Do NOT push to `origin/main` without explicit instruction.

---

## What is built and working

| Feature | Status |
| --- | --- |
| Guest landing page (`/`) | Done |
| Demo game (`/demo`) | Done |
| Auth flow | Done |
| Main menu (`/menu`) | Done |
| Tutorial - Beginner + Intermediate | Done |
| Single player vs AI (Easy / Medium / Hard) | Done — Phase 1 complete |
| Local 2-player | Done |
| Network multiplayer | Working — RPS turn-order fully debugged |
| Skin system scaffolding (Phase 2) | Done |
| User profiles, leaderboard, stat tracking | Done |
| Disconnect handling (Phase 3 prereq) | **Implemented — in live testing** |

---

## Disconnect handling — what was built

### DB change
- `forfeit_player_id uuid REFERENCES auth.users(id)` added to `games` table
- Migration applied to Supabase (`supabase/migrations/20260319000001_disconnect_forfeit.sql`)
- `src/lib/database.types.ts` updated with `forfeit_player_id: string | null`

### New files
| File | Purpose |
| --- | --- |
| `src/hooks/useActiveGame.ts` | Queries for active/forfeited games on every navigation. Re-queries on pathname change so state is always fresh. |
| `src/components/ResumeGameToast.tsx` | Fixed-position toast — "Resume Game" for active games (all protected routes), forfeit notification only on `/menu`. |

### Modified files
| File | Change |
| --- | --- |
| `src/hooks/useOnlineGame.ts` | Added Supabase Presence tracking, 90s countdown, forfeit write on expiry. Exposes `opponentConnected`, `disconnectCountdown`, `opponentId`. |
| `src/components/game/OnlineGameView.tsx` | Disconnect banner, forfeit win modal, forfeit confirmation modal, `popstate` browser-back interception, `beforeunload` handler. |
| `src/components/layout/ProtectedRoute.tsx` | Renders `<ResumeGameToast />` alongside `<Outlet />`. |

### How it works
- **Presence:** Both players track via Supabase Realtime Presence on the same `game:${gameId}` channel. Leave event starts 90s countdown. Join event cancels it.
- **Auto-forfeit:** Waiting player's client writes forfeit on countdown expiry (`status: complete`, `winner: myMarker`, `forfeit_player_id: opponentId`).
- **Intentional exit:** `← Menu` button + browser back (`popstate`) both show a confirmation modal. Confirmed → immediate forfeit write + navigate.
- **Tab close:** `beforeunload` shows native browser prompt. If closed, Presence handles it (90s timer on opponent's side).
- **Resume toast:** `useActiveGame` queries on every navigation. Active game → "Resume Game" toast on all protected screens. Dismissed when user is already on that game screen.
- **Forfeit notification:** Shows once on `/menu` per forfeit game ID (tracked in `sessionStorage`). Auto-dismisses after 5s.
- **Winner's toast clears:** `useActiveGame` subscribes to the active game via Realtime. When forfeit flips status to `complete`, `activeGameId` is cleared immediately.

### Key decisions
- `useBlocker` (React Router) is NOT used — app uses `<BrowserRouter>`, not a data router. `popstate` used instead.
- Forfeit is written by the **waiting player's client**, not a server function.
- Forfeit notification uses `sessionStorage` (not DB) to track "shown" state — no extra writes.

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | Brief written |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete and merged** |
| 2 | Skin system code refactor | **Complete — awaiting merge** |
| 3 | Player progression + achievements + virtual currency | Not started |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

---

## Known issues / pending

- **`useLoginStreak.ts` line 31** — swap `.single()` to `.maybeSingle()` to silence 406 errors when no reward exists for streak day. Low priority, deferred.
- **`p1GoesFirst` from `LocalRPSScreen`** — stored in `App.tsx` state but not yet passed to `GameWrapper`. Phase 6 will wire this.
- **Skins tables in Supabase have no RLS policies** — fine for Phase 2, needed in Phase 3.
- **Double-disconnect edge case** — if both players disconnect simultaneously, game stays `active` indefinitely. Acceptable for this phase; cleanup job planned for Phase 7.

---

## Merge order (when testing is done)

1. Merge `feat/disconnect-handling` → `feat/phase-2-skins` (it branched from there)
2. Merge `feat/phase-2-skins` → local `main`
3. Push local `main` → `private/main` (triggers production Vercel build)
4. Optionally push to `origin/main` (public portfolio) — user decides

---

## Key files

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper, `{ ...game }` spread for re-renders |
| `src/hooks/useOnlineGame.ts` | Online game state — Realtime, RPS, Presence, disconnect |
| `src/hooks/useActiveGame.ts` | Active/forfeited game detection — re-queries on navigation |
| `src/components/ResumeGameToast.tsx` | Resume + forfeit toast component |
| `src/components/game/OnlineGameView.tsx` | Online game UI — disconnect banner, forfeit modal |
| `src/App.tsx` | React Router v7. All routes. |
| `src/ai/aiPlayer.ts` | AI difficulty module (Phase 1) |
| `src/contexts/SkinContext.tsx` | Skin context (Phase 2) |
| `src/contexts/AuthContext.tsx` | Auth state |
| `src/lib/rps.ts` | RPS logic — pure functions |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |

---

## Credentials

`.env.local` is gitignored. It contains:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect)
- Vercel
- GitHub
