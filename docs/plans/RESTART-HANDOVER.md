# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Main is clean. Phase 1 (AI difficulty) is complete and merged.
>
> We were mid-brainstorm on Phase 2 (skin system refactor). There is one open question
> to answer before the brainstorm can continue — it is recorded below under
> 'Where we left off'.
>
> Ready to pick up the Phase 2 brainstorm, or would you like to review anything first?"

---

## Current state

**Branch:** `main` — everything merged, Phase 1 complete.
New feature work goes on a new `feat/` branch (create it before touching code).

**Important:** Local `main` is ahead of `origin/main`. This is intentional.
Do not push local main to origin/main without explicit instruction from the user.

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

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | Brief written (`docs/plans/phase-0-infrastructure-brief.md`) — awaiting AI model responses |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete** |
| 2 | Skin system code refactor (architecture only, no art) | Brainstorm in progress — see below |
| 3 | Player progression + achievements + virtual currency | Not started |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign (full pass once all screens exist) | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

**Why this order:** All backend systems are built before any visual redesign.
The visual redesign happens last so it can be designed with full knowledge of
every screen and every system.

---

## Where we left off — Phase 2 brainstorm

We were starting the brainstorm for Phase 2 (skin system code refactor). The first
clarifying question was asked and not yet answered.

**Context on current rendering:**
- `src/components/Cell.tsx` — renders `{value}` (plain string "X" or "O") inside a button. No skin concept.
- `src/components/MicroBoard.tsx` — won board is a background colour change (blue/red) + small "Winner: X" text. No large overlay symbol.

**Open question (answer this before continuing the brainstorm):**

When implementing the default skin as part of Phase 2, should it be:

**A) Functional placeholder** — wrap the plain text in a component so the architecture
is ready, but the visual stays roughly as it is now (plain X and O text). The nice
version comes in Phase 5 with the full visual redesign.

**B) Clean default** — as part of Phase 2, the default skin is a properly styled X and O
(SVG or styled component — simple, not art-directed, but looks intentional rather than
accidental). The won board gets a proper large X or O overlay. The game looks like a
finished product without waiting for Phase 5.

The roadmap deferred art direction to Phase 5, but a clean default isn't art direction —
it's the baseline that other skins are measured against. This is the tension to resolve.

---

## Key design decisions already made

- **Visual redesign is Phase 5, not Phase 0.** Designing the shop window before knowing
  what is in the shop leads to rework. All systems are built first.
- **Skin system is split:** the code refactor (markers become components) is Phase 2;
  the visual art direction is Phase 5.
- **Progression, achievements, and currency are one phase** (Phase 3) because they form
  a single reward economy and must be balanced together.
- **AI improvement (Phase 1) comes before progression** because achievements and XP rewards
  will reference AI difficulty levels.
- **Hand-coded AI only** (no external AI API) — minimax with alpha-beta pruning for Hard.
- **AI difficulty variables** (strength constants 0–100 per rule) are hardcoded in Phase 1
  and exposed via admin dashboard in Phase 7.

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
| `src/components/Cell.tsx` | Individual cell — renders plain string marker, no skin concept yet |
| `src/components/MicroBoard.tsx` | 3×3 grid + won board state — background colour only, no overlay |
| `src/components/MacroBoard.tsx` | 3×3 grid of MicroBoards |
| `src/components/GuestLandingPage.tsx` | Guest landing page (unauthenticated `/`) |
| `src/components/DemoGamePage.tsx` | Demo game - GameWrapper + Want More modal + post-game modal |
| `src/components/GameWrapper.tsx` | Game board + AI + nav bar (accepts `navExtra` prop) |
| `src/components/MainMenu.tsx` | Lobby-style main menu (authenticated users only) |
| `src/contexts/AuthContext.tsx` | Auth state - `user`, `loading`, `signOut` |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |
| `docs/plans/phase-0-infrastructure-brief.md` | Phase 0 cost modelling brief for AI models |
| `docs/plans/2026-03-18-phase-1-ai-difficulty-design.md` | Phase 1 design doc |
| `docs/plans/game-theory-evaluation-notes.md` | UTTT game theory notes + simulation harness ideas |

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
