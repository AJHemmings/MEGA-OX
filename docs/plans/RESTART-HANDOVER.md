# Restart Handover — Read This First

## What you are doing
Implementing the MEGA-OX network multiplayer platform. You are continuing from where the previous session left off.

## Current branch
`feat/network-multiplayer` — all work goes here. Main stays clean for portfolio.

## What has been completed

| Task | Status | What was done |
|---|---|---|
| Task 1 | ✅ Done | Removed `@types/react-router-dom` v5, installed `@supabase/supabase-js` |
| Task 2 | ✅ Done | Created `src/lib/supabase.ts` client, `src/lib/database.types.ts`, test in `src/__tests__/supabase.test.ts` |
| Task 3 | ✅ Done | Rewired `src/index.tsx` + `src/App.tsx` to React Router v7. Created all stub components |
| Nav fix | ✅ Done | Restored navigation, difficulty sub-menu, `/training`, `/local`, `/multiplayer` routes |
| Task 4 | ✅ Done | `supabase init`, linked project, created + pushed `20260316000000_initial_schema.sql` (18 tables, leaderboard view, 4 triggers). Generated real TypeScript types into `src/lib/database.types.ts` |
| Task 5 | ✅ Done | Created + pushed `20260316000001_rls_policies.sql` — RLS on all 20 tables. MMR server-only, auth-gated writes, admin-only news |
| Task 6 | ✅ Done | Email auth enabled in Supabase dashboard. Confirm email OFF for dev. Site URL set to `http://localhost:3000` |
| Task 7 | ✅ Done | Implemented `src/contexts/AuthContext.tsx` — session restore on mount, auth state listener, `signUp/signIn/signInWithGoogle/signOut`. Test passes. Also added `@testing-library/react`, `@testing-library/jest-dom`, and `src/setupTests.ts` |
| Task 8 | ✅ Done | Implemented `src/components/layout/ProtectedRoute.tsx` — redirects unauthenticated users to `/login`, shows loading screen while auth resolves |
| Task 9 | ✅ Done | Implemented `src/components/auth/LoginPage.tsx` and `SignUpPage.tsx` |
| Task 10 | ✅ Done | Implemented `src/components/auth/OnboardingPage.tsx` — for Google OAuth users who need to pick a username |
| Task 11 | ✅ Done | Rewrote `src/components/MainMenu.tsx` as lobby layout. Created `src/hooks/usePlayerProfile.ts`, `src/hooks/useRecentGames.ts`, `src/components/layout/NewsSlideshow.tsx` (stub) |
| Menu fix | ✅ Done | Training (vs AI) now opens a difficulty modal (Easy/Medium/Hard). Multiplayer navigates to `/multiplayer` screen instead of expanding inline |
| Task 12 | ✅ Done | Created `src/lib/gameSerializer.ts` + `src/__tests__/gameSerializer.test.ts` — serialise/deserialise `Game` OOP object to/from plain JSON for Postgres storage. Both tests pass |
| Task 13 | ✅ Done | Created `src/hooks/useOnlineGame.ts` — Realtime hook: loads game from Supabase, subscribes to live updates, exposes `placeMarker()` with turn validation |
| Task 14 | ✅ Done | Rewrote `src/components/game/MatchmakingPage.tsx` — create game (get a code) + join by code flow with Realtime waiting room |
| Task 15 | ✅ Done | Created `src/components/game/OnlineGameView.tsx`, updated `App.tsx` `/game/:id` route to render it. Online multiplayer fully wired. |
| Multiplayer fix | ✅ Done | Enabled Host/Join Online Game buttons in `MultiplayerMenu.tsx` — navigate to `/matchmaking` |
| RLS fix | ✅ Done | Migration `20260316000002` — added policy allowing authenticated users to join waiting games (the existing update policy blocked joining since `player_o_id` was NULL at join time). Pushed via Supabase CLI. |
| Task 17 | ✅ Done | Rewrote `src/components/leaderboard/LeaderboardPage.tsx` — pulls from `leaderboard` view, shows rank tier, W/L/D, links to profile |
| Task 18 | ✅ Done | Rewrote `src/components/layout/NewsSlideshow.tsx` — auto-rotates every 5s, category colour badges, dot indicators, manual prev/next |

## Current app state
- `localhost:3000` → redirects to `/login` if not authenticated
- `/login` and `/signup` fully functional — creates Supabase auth user + profile row
- Sign up triggers auto-creation of `player_stats`, `currency_balance`, `login_streaks` rows
- After login → main menu lobby with profile header, last 5 games panel, live news slideshow
- Training (vs AI) → difficulty modal (Easy/Medium/Hard) → game (all same random AI for now)
- Multiplayer → MultiplayerMenu → Local 2-Player works; Host/Join Online Game → `/matchmaking`
- Online multiplayer works end-to-end: create game → get code → opponent joins → both redirect to live game
- `/leaderboard` → shows ranked player list (publicly accessible, no auth required)
- Back navigation works throughout

## Credentials already configured
`.env.local` and `.env.test.local` are both written (gitignored). They contain:
- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

The Supabase CLI is already linked (`supabase link` was run). If it needs re-linking in a new shell, run:
```bash
supabase login --token <user's access token>
supabase link --project-ref qioxtkcjtvvkzcoupdfk
```

## Next task: Task 19

**Start here.** Read the implementation plan, begin at Task 19.

Remaining tasks:
- **Task 19**: Settings page — update username, avatar, preferences
- **Task 20**: Season page — current season standings
- **Task 21**: E2E flow test
- **Task 22**: Deploy to Vercel

Note: **Task 16 (MMR/Elo)** was intentionally skipped — no ranked matchmaking exists yet, so MMR has nothing to update. Revisit when ranked mode is built.

## Parked for later
- **Cash shop** — design doc at `docs/plans/cash-shop-future-scope.md`. Architecture decided: backend API (private repo) + shop UI page in main app. Build after Tasks 19–22 are shipped.

## First message to send Claude Code

Paste this exactly:

> I've started a fresh session. Please read `docs/plans/RESTART-HANDOVER.md` and `docs/plans/2026-03-16-implementation-plan.md`, then continue executing from Task 19 using the `superpowers:executing-plans` skill. We're on branch `feat/network-multiplayer`.

## Where everything lives

| Document | What it is |
|---|---|
| `docs/plans/2026-03-16-implementation-plan.md` | Step-by-step build instructions — 22 tasks |
| `docs/plans/2026-03-16-network-multiplayer-design.md` | Full system design and all DB tables |
| `docs/plans/2026-03-16-handover.md` | Full context on every decision made in the design session |
| `docs/plans/cash-shop-future-scope.md` | Cash shop architecture decision and build order |
| `docs/design-log.md` | Running log of major design decisions |

## Key architectural decisions (don't re-litigate these)

- Supabase is the entire backend — no Vercel API routes
- DB-authoritative realtime: both players subscribe to the `games` row via Supabase Realtime. When a move is made, the game state in Postgres is updated, and both clients reconstruct the `Game` object from the serialized state using `deserializeGame`
- Hidden MMR, visible rank tier — RLS blocks `mmr` column from client reads
- `Game.ts` OOP engine stays client-side for rendering; Postgres is source of truth
- All work on `feat/network-multiplayer` branch — main stays playable
- Difficulty buttons are placeholder UI — all use same random AI until AI work is scoped separately
- `signUp` in AuthContext has a two-step flow: create auth user → insert profile row → trigger fires → supporting rows created
- Supabase Realtime requires tables to be in the `supabase_realtime` publication — `games` table was added manually via SQL editor (already done)
- RLS UPDATE policies use `using()` clause which checks the row's state BEFORE the update — joining players must have a separate policy since they aren't in `player_o_id` yet

## MCP plugins active
- Supabase MCP (needs access token to connect — user has it)
- Vercel
- GitHub
