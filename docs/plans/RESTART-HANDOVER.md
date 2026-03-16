# Restart Handover — Read This First

## What you are doing

The **Intro.js tutorial system** is fully implemented and committed. All 8 tasks are done.

The next session is **manual smoke testing** (Task 9 of the plan) followed by branch completion.

## Current branch

`feat/network-multiplayer` — all work goes here. Main stays clean for portfolio.

---

## Intro.js tutorial system — task tracker

| Task | Status | What was done |
|---|---|---|
| Task 1: Install intro.js + leader-line-new | ✅ Done | `npm install intro.js leader-line-new` |
| Task 2: Add TS declaration for leader-line-new | ✅ Done | `src/types/leader-line-new.d.ts` |
| Task 3: Refactor useTutorial.ts | ✅ Done | `shouldAutoStart`, `markComplete` (upsert), `resetTutorial` (delete) |
| Task 4: Update MainMenu with Intro.js tour | ✅ Done | 5-step spotlight tour, `id` attributes on targets, TutorialOverlay removed from JSX, "How to Play" button added |
| Task 5: Add Replay Tutorial to SettingsPage | ✅ Done | `resetTutorial` hook + confirmation message |
| Task 6: Create tutorialScript.ts | ✅ Done | `src/components/game/tutorialScript.ts` — 8-step scripted game |
| Task 7: Create HowToPlayPage.tsx | ✅ Done | `src/components/game/HowToPlayPage.tsx` — Intro.js + Leader Line |
| Task 8: Add /how-to-play route | ✅ Done | `App.tsx` |
| Task 9: Manual smoke test | ⏳ Pending | See checklist below |

---

## Exact resume point

**Task 9 — smoke test.** Run `npm start`, login, and work through this checklist:

1. Login → main menu spotlight tour **auto-starts** (5 steps: Play, Recent Games, News, Leaderboard, Your Profile)
2. Walk all 5 steps — each spotlight targets the correct element
3. Refresh and login again → tour does **not** re-fire (row exists in `tutorial_progress`)
4. Settings → "Replay Home Tutorial" → confirmation message appears → go back to main menu → tour fires again
5. Main menu Play card → "How to Play" button → navigates to `/how-to-play`
6. Walk the How to Play tutorial game:
   - Intro.js spotlight highlights the correct element per step
   - On `requiresClick` steps: wrong cell click does nothing
   - On `requiresClick` steps: correct cell places marker and advances
   - Arrows appear on steps that have them, disappear on steps that don't
7. "← Exit Tutorial" button → returns to main menu

After smoke test passes, use `superpowers:finishing-a-development-branch` to complete the branch.

---

## One cleanup item outstanding

`src/components/layout/TutorialOverlay.tsx` still exists on disk. It is no longer imported anywhere (MainMenu was updated to remove it). It can be deleted:

```bash
git rm src/components/layout/TutorialOverlay.tsx
git commit -m "chore: remove TutorialOverlay — replaced by Intro.js"
```

Do this before or after the smoke test, doesn't matter.

---

## ESLint — now properly configured

`.eslintrc.json` was added this session. It:
- Extends `react-app` (makes CRA's plugin set visible to the IDE's ESLint)
- Explicitly sets `react-hooks/exhaustive-deps: warn`
- Ignores `_`-prefixed unused variables

One pre-existing warning remains in `GameWrapper.tsx` (the AI delay `useEffect` has missing deps). It's a warning not an error, and it's pre-existing code — flag with user before touching.

---

## How to start the new session

Tell Claude:

> I've started a fresh session. Read `docs/plans/RESTART-HANDOVER.md`. The Intro.js tutorial system is fully implemented. Next step is the manual smoke test (Task 9), then branch completion.

---

## What the full platform looks like (context)

All 22 tasks of the network multiplayer build are complete. The app currently:

- `localhost:3000` → redirects to `/login` if not authenticated
- `/login` and `/signup` functional — creates Supabase auth user + profile row
- After login → main menu lobby with profile header, last 5 games panel, live news slideshow
- First-time visitors see the **Intro.js 5-step spotlight tour** on the main menu
- Login streak detected on main menu mount; reward modal fires on milestones
- Training (vs AI) → difficulty modal → game
- Multiplayer → MultiplayerMenu → Local 2-Player + Host/Join Online Game → `/matchmaking`
- Online multiplayer works end-to-end via Supabase Realtime
- `/leaderboard` — public ranked player list
- `/profile/:username` — public profile with stats + match history
- `/settings` — change username, upload avatar, sign out, **Replay Home Tutorial**
- `/how-to-play` — 8-step interactive tutorial game with Intro.js + Leader Line arrows

---

## Credentials

`.env.local` and `.env.test.local` are written and gitignored. They contain:
- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## Key architectural decisions (do not re-litigate)

- Supabase is the entire backend — no Vercel API routes
- DB-authoritative realtime: both players subscribe to the `games` row
- Hidden MMR, visible rank tier — RLS blocks `mmr` from client reads
- `Game.ts` OOP engine stays client-side; Postgres is source of truth
- All styling is inline CSS — no CSS framework
- All work on `feat/network-multiplayer` — main stays clean for portfolio
- Difficulty buttons are placeholder UI — all use same random AI

---

## Key files

| File | Purpose |
|---|---|
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
| `docs/plans/2026-03-16-intro-tutorial-plan.md` | Full task-by-task build plan |
| `docs/plans/2026-03-16-intro-tutorial-design.md` | Design rationale for the Intro.js system |

---

## Parked for later (not this work)

- **Task 16 (MMR/Elo)** — skipped. No ranked matchmaking yet.
- **Cash shop** — design doc at `docs/plans/cash-shop-future-scope.md`.
- **Deploy to Vercel** — run `vercel` in project root when ready; add `REACT_APP_SUPABASE_URL` + `REACT_APP_SUPABASE_ANON_KEY` in Vercel dashboard.

---

## MCP plugins active
- Supabase MCP (needs user's access token to connect)
- Vercel
- GitHub
