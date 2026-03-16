# Restart Handover — Read This First

## What you are doing
The implementation plan is complete. Next session is **UI, UX, and frontend polish** — no new backend work.

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
| RLS fix | ✅ Done | Migration `20260316000002` — added policy allowing authenticated users to join waiting games |
| Task 17 | ✅ Done | Rewrote `src/components/leaderboard/LeaderboardPage.tsx` — pulls from `leaderboard` view, shows rank tier, W/L/D, links to profile |
| Task 18 | ✅ Done | Rewrote `src/components/layout/NewsSlideshow.tsx` — auto-rotates every 5s, category colour badges, dot indicators, manual prev/next |
| Task 19 | ✅ Done | Rewrote `src/components/profile/ProfilePage.tsx` and `SettingsPage.tsx` — profile shows avatar/stats/match history/leaderboard pos; settings allows username change + avatar upload to Supabase Storage |
| Task 20 | ✅ Done | Created `src/components/layout/TutorialOverlay.tsx` + `src/hooks/useTutorial.ts` — stepped overlay, tracks completion in `tutorial_progress` table, wired into main menu |
| Task 21 | ✅ Done | Created `src/hooks/useLoginStreak.ts` — detects daily login, updates streak, checks `reward_catalog` for milestones, shows reward modal in main menu |
| Task 22 | ✅ Done | All 4 tests pass, production build clean |

## Current app state
- `localhost:3000` → redirects to `/login` if not authenticated
- `/login` and `/signup` fully functional — creates Supabase auth user + profile row
- After login → main menu lobby with profile header, last 5 games panel, live news slideshow
- First-time visitors see a 3-step tutorial overlay on the main menu
- Login streak is detected on main menu mount; reward modal fires if a milestone is hit
- Training (vs AI) → difficulty modal (Easy/Medium/Hard) → game (all same random AI for now)
- Multiplayer → MultiplayerMenu → Local 2-Player works; Host/Join Online Game → `/matchmaking`
- Online multiplayer works end-to-end: create game → get code → opponent joins → both redirect to live game
- `/leaderboard` → shows ranked player list (publicly accessible, no auth required)
- `/profile/:username` → public profile with stats + match history
- `/settings` → change username, upload avatar, sign out
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

## Next session: UI/UX polish

**This is a design and polish session, not a backend session.**

Use the `frontend-design` skill for this work. Things to tackle:

### Tutorial (start here)
The tutorial overlay exists but needs real thought. Questions to explore:
- Does the slide-up-from-bottom approach feel right, or would a spotlight/highlight style work better for a game?
- Are the 3 steps the right content? Too few? Too many?
- Should it trigger differently — e.g. only for brand new users, not just anyone who hasn't seen it?
- Should there be tutorials on other pages (matchmaking, game board)?

### Broader UI/UX areas
- **Login / Sign-up pages** — currently functional but plain. Need proper game branding.
- **Main menu** — layout works but visual polish needed (typography, spacing, visual hierarchy).
- **Game board** — the original local game has inline styles throughout. Worth reviewing for visual consistency.
- **Matchmaking page** — very utilitarian; could use more personality.
- **Profile page** — avatar placeholder and stats cards could look much better.
- **Loading states** — most pages show plain text "Loading..." — could use spinners or skeletons.
- **Empty states** — "No games yet" and similar are bare.
- **Colour system** — currently ad-hoc (`#1a2332`, `#2a3441`, `#00d4aa`, etc.). Consider formalising into CSS variables.

### How to start the session
Tell Claude:
> I've started a fresh session. Read `docs/plans/RESTART-HANDOVER.md`. We're on `feat/network-multiplayer`. This session is UI/UX polish — use the `frontend-design` skill. Let's start with the tutorial overlay.

## Parked for later (not this session)
- **Task 16 (MMR/Elo)** — skipped intentionally. No ranked matchmaking exists yet; revisit when ranked mode is built.
- **Cash shop** — design doc at `docs/plans/cash-shop-future-scope.md`. Build after UI polish is shipped.
- **Deploy to Vercel** — deferred. Run `vercel` in project root when ready; env vars (`REACT_APP_SUPABASE_URL` + `REACT_APP_SUPABASE_ANON_KEY`) must be added in Vercel dashboard.

## Where everything lives

| Document | What it is |
|---|---|
| `docs/plans/2026-03-16-implementation-plan.md` | Step-by-step build instructions — 22 tasks (all done) |
| `docs/plans/2026-03-16-network-multiplayer-design.md` | Full system design and all DB tables |
| `docs/plans/2026-03-16-handover.md` | Full context on every decision made in the design session |
| `docs/plans/cash-shop-future-scope.md` | Cash shop architecture decision and build order |
| `docs/design-log.md` | Running log of major design decisions |

## Key architectural decisions (don't re-litigate these)

- Supabase is the entire backend — no Vercel API routes
- DB-authoritative realtime: both players subscribe to the `games` row via Supabase Realtime
- Hidden MMR, visible rank tier — RLS blocks `mmr` column from client reads
- `Game.ts` OOP engine stays client-side for rendering; Postgres is source of truth
- All work on `feat/network-multiplayer` branch — main stays clean for portfolio
- Difficulty buttons are placeholder UI — all use same random AI until AI work is scoped separately
- All styling is currently inline CSS — no CSS framework. If introducing CSS variables, do it incrementally

## MCP plugins active
- Supabase MCP (needs access token to connect — user has it)
- Vercel
- GitHub
