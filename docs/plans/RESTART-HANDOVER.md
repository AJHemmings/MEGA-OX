# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. We are mid-implementation on the disconnect handling feature (`feat/disconnect-handling` worktree).
>
> Task 1 (DB migration) is complete and applied to Supabase. Tasks 2–7 are pending.
>
> Ready to continue with Task 2, or would you like to do something else first?"

---

## Current state

**Active branch:** `feat/disconnect-handling` (worktree at `.worktrees/feat-disconnect-handling`) — disconnect handling feature, Task 1 complete, Tasks 2–7 pending.

**Parent branch:** `feat/phase-2-skins` (worktree at `.worktrees/feat-phase-2-skins`) — Phase 2 complete, tested on Vercel (private repo). Not yet merged to local `main`.

**Private Vercel deployment:** Connected to `AJHemmings/MEGA-OX-private`, deployed from `main` of that repo (which has Phase 2 merged). Used for network testing with friends.

**Public Vercel deployment:** Connected to `AJHemmings/MEGA-OX` (public repo). Leave this alone — it is the portfolio/CV version and is intentionally behind.

**Important:** Local `main` is ahead of `origin/main`. This is intentional.
Do not push to origin/main without explicit instruction from the user.

---

## Disconnect handling feature — current status

**Design doc:** `docs/plans/2026-03-19-disconnect-handling-design.md`
**Implementation plan:** `docs/plans/2026-03-19-disconnect-handling.md`

| Task | Description | Status |
| --- | --- | --- |
| 1 | Supabase migration + database types (`forfeit_player_id`) | **Complete — migration applied to Supabase** |
| 2 | `useActiveGame` hook | Pending |
| 3 | `ResumeGameToast` component + wire into ProtectedRoute | Pending |
| 4 | Presence + grace period + forfeit write in `useOnlineGame` | Pending |
| 5 | Disconnect UI in `OnlineGameView` (countdown banner + win modal) | Pending |
| 6 | Intentional exit — forfeit confirmation modal + `useBlocker` + `beforeunload` | Pending |
| 7 | Update RESTART-HANDOVER.md | Pending |

### What was done this session

- Tested Phase 2 (RPS + skins) on local dev server — multiplayer works, RPS confirmed
- Fixed ESLint errors blocking Vercel CI build (3 files)
- Created private Vercel deployment for `MEGA-OX-private` (Phase 2 code)
- Diagnosed `useLoginStreak` 406 error — login streak queries `reward_catalog` for `day_number=4` which has no seed data. Not a multiplayer issue. Fix: swap `.single()` to `.maybeSingle()` in `src/hooks/useLoginStreak.ts` (deferred, low priority)
- Designed and planned disconnect handling feature (design doc + implementation plan committed to `main`)
- Created `feat/disconnect-handling` worktree from `feat/phase-2-skins`
- Completed Task 1: `forfeit_player_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL` column added to `games` table — migration file committed and applied to Supabase via CLI

### Supabase migration applied

`supabase/migrations/20260319000001_disconnect_forfeit.sql` — already pushed to remote DB via `supabase db push`. Do NOT run this again.

---

## What is built and working

| Feature | Status |
| --- | --- |
| Guest landing page (`/`) | Done |
| Demo game (`/demo`) - vs AI, Want More modal, post-game modal | Done |
| Auth flow - login, signup, sign out, protected routes | Done |
| Main menu (`/menu`) - authenticated users only | Done |
| Tutorial - Beginner (7 steps) + Intermediate (14 steps) | Done |
| Single player vs AI (Easy / Medium / Hard difficulty) | Done — Phase 1 complete |
| Local 2-player | Done |
| Network multiplayer | Alpha - working, tested with Vercel private deployment |
| User profiles (initial) | Done |
| Leaderboard | Done |
| Stat tracking | Done |
| Skin system (architecture) | Done — Phase 2, on feat/phase-2-skins |
| RPS turn-order mechanic | Done — Phase 2, on feat/phase-2-skins |

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | Brief written (`docs/plans/phase-0-infrastructure-brief.md`) — awaiting AI model responses |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete** |
| 2 | Skin system code refactor (architecture only, no art) | **Complete** — on `feat/phase-2-skins`, deployed to private Vercel, awaiting merge to local main |
| 2.5 | Disconnect handling (multiplayer quality) | **In progress** — `feat/disconnect-handling`, Task 1 done |
| 3 | Player progression + achievements + virtual currency | Not started |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign (full pass once all screens exist) | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

---

## Key design decisions already made

- **Visual redesign is Phase 5, not Phase 0.**
- **Skin system is split:** code refactor is Phase 2; visual art direction is Phase 5.
- **Progression, achievements, and currency are one phase** (Phase 3).
- **AI improvement (Phase 1) comes before progression** because achievements reference difficulty levels.
- **Hand-coded AI only** — minimax with alpha-beta pruning for Hard.
- **Disconnect forfeit is written by the waiting player's client** (not a server function). Risk: double-disconnect leaves game stuck in `active` — cleanup deferred to Phase 7.
- **Grace period is 90 seconds** before auto-forfeit.
- **Intentional exits write forfeit immediately** (no grace period).

---

## Pending minor fix (deferred)

`src/hooks/useLoginStreak.ts` line 31 — swap `.single()` to `.maybeSingle()` to silence 406 errors in Supabase observability when no reward exists for the current streak day. Low priority, no user-facing impact.

---

## Phase 1 AI — key files

| File | Purpose |
| --- | --- |
| `src/ai/aiPlayer.ts` | Pure TS AI module. easyMove, mediumMove, hardMove + strength constants |
| `src/components/GameWrapper.tsx` | Accepts `difficulty` prop, calls aiPlayer, delay ranges keyed by difficulty |
| `src/App.tsx` | TrainingRoute reads `?difficulty` query param and passes to GameWrapper |

---

## Open questions (resolve at each phase's detail design)

- Currency name and branding
- EXP values and level curve shape
- Art direction for visual redesign (dark/neon vs clean/minimal vs other)
- Which profile items are free progression unlocks vs paid vs both
- Achievement trigger method (DB trigger vs edge function vs client + server validation)
- Admin access control: private API vs direct Supabase RLS
- Single admin or role-based admin permissions
- Bug reports: email notifications to admin on new submission?
- Bug reports: should resolved reports be visible to the filing player?

---

## Key files

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic - OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper. Uses `{ ...game }` spread to trigger re-renders |
| `src/App.tsx` | React Router v7. All routes defined here |
| `src/ai/aiPlayer.ts` | AI difficulty module (Phase 1) |
| `src/skins/` | Skin data layer — types, defaults, registry, resolver |
| `src/contexts/SkinContext.tsx` | SkinProvider + useSkins() hook |
| `src/components/skins/` | MarkerSkin, WonBoardSkin, BoardSkin render components |
| `src/lib/rps.ts` | RPS pure logic — resolveRPS, randomRPSPick |
| `src/components/game/RPSScreen.tsx` | Online RPS pick screen |
| `src/components/game/RPSResultScreen.tsx` | Online RPS result screen |
| `src/components/game/LocalRPSScreen.tsx` | Local 2-player RPS screen |
| `src/components/Cell.tsx` | Renders MarkerSkin |
| `src/components/MicroBoard.tsx` | 3×3 grid + WonBoardSkin overlay |
| `src/components/MacroBoard.tsx` | 3×3 grid of MicroBoards, wrapped in BoardSkin |
| `src/components/GuestLandingPage.tsx` | Guest landing page (unauthenticated `/`) |
| `src/components/DemoGamePage.tsx` | Demo game - GameWrapper + Want More modal + post-game modal |
| `src/components/GameWrapper.tsx` | Game board + AI + nav bar (accepts `navExtra` prop) |
| `src/components/MainMenu.tsx` | Lobby-style main menu (authenticated users only) |
| `src/contexts/AuthContext.tsx` | Auth state - `user`, `loading`, `signOut` |
| `src/hooks/useOnlineGame.ts` | Online game state — Realtime, RPS, Presence (Tasks 4–5 will modify this) |
| `src/components/game/OnlineGameView.tsx` | Online game UI (Tasks 5–6 will modify this) |
| `src/components/layout/ProtectedRoute.tsx` | Auth gate + Outlet (Task 3 will add ResumeGameToast here) |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |
| `docs/plans/2026-03-19-disconnect-handling-design.md` | Disconnect handling design doc |
| `docs/plans/2026-03-19-disconnect-handling.md` | Disconnect handling implementation plan |

---

## Credentials

`.env.local` and `.env.test.local` are gitignored. They contain:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect) — Supabase CLI (`supabase` v2.75.0) is available as an alternative for migrations
- Vercel
- GitHub

---

## ⚠️ Incidents / lessons

**rm -rf incident (earlier session):** Claude used `rm -rf` on directories in the main project to clean up test copies, deleting tracked files. All restored via `git restore`. **Never use `rm -rf` on directories in the main project. Delete files individually by name.**

**Kill by PID, not taskkill /F /IM node.exe:** When stopping the dev server, kill by PID (`taskkill //F //PID <pid>`) rather than killing all node processes.
