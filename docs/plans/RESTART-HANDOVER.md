# Restart Handover — Read This First

## What you are doing
Implementing the MEGA-OX network multiplayer platform. You are continuing from where the previous session left off.

## Current branch
`feat/network-multiplayer` — all work goes here. Main stays clean for portfolio.

## What has been completed

### Tasks 1–3 done + navigation hotfix

| Task | Status | What was done |
|---|---|---|
| Task 1 | ✅ Done | Removed `@types/react-router-dom` v5 (conflicted with RR v7), installed `@supabase/supabase-js` |
| Task 2 | ✅ Done | Created `src/lib/supabase.ts` client, `src/lib/database.types.ts` placeholder, test in `src/__tests__/supabase.test.ts`. Added `test` script to package.json, installed `@types/jest`, created `.env.local` and `.env.test.local` (both gitignored) |
| Task 3 | ✅ Done | Rewired `src/index.tsx` + `src/App.tsx` to React Router v7. Created stub components for all future pages/routes |
| Nav fix | ✅ Done | Restored working navigation: MainMenu and MultiplayerMenu now use `useNavigate`. Added inline difficulty sub-menu (Easy/Medium/Hard — all placeholder, same random AI). Removed dead Profile modal. Added `/training`, `/local`, `/multiplayer` routes. |

### Current app state
- `localhost:3000` → main menu, fully navigable
- "Player vs AI" → difficulty select → game (all difficulties same random AI for now)
- "Multiplayer" → multiplayer menu → "Local 2-Player" → local game
- Back navigation works throughout
- All other routes are stubs ("Coming soon")

## Credentials already configured

`.env.local` and `.env.test.local` are both written (gitignored). They contain:
- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`** (needed for `supabase link`)

The user also has their Supabase **access token** — they'll need to paste it when `supabase login` prompts for it.

## Next task: Task 4

**Start here.** Read the implementation plan, begin at Task 4.

Task 4 requires:
1. `supabase init` (in project root)
2. `supabase login` — will prompt for access token (user pastes it)
3. `supabase link --project-ref qioxtkcjtvvkzcoupdfk`
4. Create migration file `supabase/migrations/20260316000000_initial_schema.sql` (full SQL is in the plan)
5. `supabase db push`
6. `supabase gen types typescript --linked > src/lib/database.types.ts`

## First message to send Claude Code

Paste this exactly:

> I've started a fresh session. Please read `docs/plans/RESTART-HANDOVER.md` and `docs/plans/2026-03-16-implementation-plan.md`, then continue executing from Task 4 using the `superpowers:executing-plans` skill. We're on branch `feat/network-multiplayer`.

Then when Claude asks you to run `supabase login`, paste your Supabase access token when prompted.

## Where everything lives

| Document | What it is |
|---|---|
| `docs/plans/2026-03-16-implementation-plan.md` | Step-by-step build instructions — 22 tasks |
| `docs/plans/2026-03-16-network-multiplayer-design.md` | Full system design and all DB tables |
| `docs/plans/2026-03-16-handover.md` | Full context on every decision made in the design session |
| `docs/design-log.md` | Running log of major design decisions |

## Key architectural decisions (don't re-litigate these)

- Supabase is the entire backend — no Vercel API routes
- DB-authoritative realtime (both players subscribe to game row changes)
- Hidden MMR, visible rank tier (RLS blocks mmr column from client)
- All work on `feat/network-multiplayer` branch — main stays playable
- Difficulty buttons are placeholder UI — all use same random AI until AI work is scoped separately

## MCP plugins active
- Supabase MCP (needs access token to connect — user has it)
- Vercel
- GitHub
