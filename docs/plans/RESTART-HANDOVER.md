# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Main is clean. The product roadmap has been designed and approved —
> 8 phases from infrastructure planning through to admin tools.
>
> The next session should pick a phase to start on. Phase 0 (infrastructure and cost planning)
> and Phase 1 (AI improvement) are both good starting points as they have no dependencies.
>
> Ready to begin, or would you like to review the roadmap first?"

---

## Current state

**Branch:** `main` — everything merged, README updated and pushed live.
New feature work goes on a new `feat/` branch (create it before touching code).

**Important:** Local `main` is 73 commits ahead of `origin/main`. This is intentional.
The live repo has only the README updates pushed to it. Do not push local main to origin/main
without explicit instruction from the user.

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
| Network multiplayer | Alpha - working locally across two browsers |
| User profiles (initial) | Done |
| Leaderboard | Done |
| Stat tracking | Done |

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Key dependency |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | None — brief written, awaiting AI model responses |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete** |
| 2 | Skin system code refactor (architecture only, no art) | Phase 1 |
| 3 | Player progression + achievements + virtual currency | Phase 2 |
| 4 | Profile customisation + emoji communication | Phase 3 |
| 5 | Visual redesign (full pass once all screens exist) | Phase 4 |
| 6 | Cash shop | Phase 5 |
| 7 | Admin dashboard | Phase 6 |
| 8 | Bug report system | Phase 6 |

**Why this order:** All backend systems are built before any visual redesign.
The visual redesign happens last so it can be designed with full knowledge of
every screen and every system. The skin system code refactor (Phase 2) is
architectural groundwork only - no art direction until Phase 5.

---

## Key design decisions made this session

- **Visual redesign is Phase 5, not Phase 0.** Designing the shop window before knowing
  what is in the shop leads to rework. All systems are built first.
- **Skin system is split:** the code refactor (markers become components) is Phase 2;
  the visual art direction is Phase 5.
- **Progression, achievements, and currency are one phase** (Phase 3) because they form
  a single reward economy and must be balanced together.
- **AI improvement (Phase 1) comes before progression** because achievements and XP rewards
  will reference AI difficulty levels - designing those before difficulty levels exist
  creates assumptions.
- **Hand-coded AI only** (no external AI API) - cost, latency, and complexity are not
  justified for a casual game. Minimax with alpha-beta pruning for Hard difficulty.

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
| `src/components/GuestLandingPage.tsx` | Guest landing page (unauthenticated `/`) |
| `src/components/DemoGamePage.tsx` | Demo game - GameWrapper + Want More modal + post-game modal |
| `src/components/guestUnlockFeatures.ts` | Shared unlock features constant |
| `src/components/GameWrapper.tsx` | Game board + AI logic + nav bar (accepts `navExtra` prop) |
| `src/components/MainMenu.tsx` | Lobby-style main menu (authenticated users only) |
| `src/contexts/AuthContext.tsx` | Auth state - `user`, `loading`, `signOut` |
| `src/components/layout/ProtectedRoute.tsx` | Redirects unauthed users to `/login` |
| `src/components/game/tutorialScript.ts` | Tutorial step content |
| `src/components/game/HowToPlayPage.tsx` | `/how-to-play/:mode` interactive tutorial |
| `docs/plans/cash-shop-future-scope.md` | Cash shop architecture and build order |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |

---

## Credentials

`.env.local` and `.env.test.local` are gitignored. They contain:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect)
- Vercel
- GitHub
