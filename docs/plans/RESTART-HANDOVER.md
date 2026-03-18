# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Phase 2 (skin system) is complete on `feat/phase-2-skins` — not yet merged.
>
> The branch is ready for review and merge, or we can move directly to Phase 3 planning.
>
> What would you like to do next?"

---

## Current state

**Branch:** `feat/phase-2-skins` (worktree at `.worktrees/feat-phase-2-skins`) — Phase 2 complete, not yet merged.
`main` is clean — Phase 1 merged, Phase 2 branch diverges from it.

**Important:** Local `main` is ahead of `origin/main`. This is intentional.
Do not push to origin/main without explicit instruction from the user.

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
| 2 | Skin system code refactor (architecture only, no art) | **Complete** — on `feat/phase-2-skins`, awaiting merge |
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

## Where we left off — Phase 2 complete

**Phase 2 implementation is complete.** The branch `feat/phase-2-skins` is ready to merge.

Design doc: `docs/plans/2026-03-18-phase-2-skin-system-design.md`
Implementation plan: `docs/plans/2026-03-18-phase-2-skin-system-implementation.md`

### What Phase 2 built

**Skin data layer** (`src/skins/`):
- `types.ts` — `Skin`, `GameSkins`, `EquippedSkins`, `SkinType`, `SkinEvent`
- `defaults.ts` — 5 default placeholder skins (board, marker_x, marker_o, won_board_x, won_board_o)
- `registry.ts` — module-level Map, `getSkin(id, fallback)`, `registerSkin()` stub
- `resolver.ts` — `resolveGameSkins(p1, p2)` — board always from p2 (loser of RPS)

**Skin context** (`src/contexts/SkinContext.tsx`):
- `SkinProvider` + `useSkins()` hook — wraps GameWrapper and OnlineGameView

**Skin render components** (`src/components/skins/`):
- `MarkerSkin.tsx` — renders X/O marker; placeholder = coloured span, Lottie = `path` prop
- `WonBoardSkin.tsx` — absolutely-positioned overlay; placeholder = tinted bg + symbol
- `BoardSkin.tsx` — wraps board children; placeholder = transparent, Lottie = behind via z-index

**Game component wiring:**
- `Cell.tsx` → `MarkerSkin`
- `MicroBoard.tsx` → `WonBoardSkin` overlay (removed winner background colour)
- `MacroBoard.tsx` → wrapped in `BoardSkin`
- `GameWrapper.tsx` + `OnlineGameView.tsx` → wrapped in `SkinProvider`

**RPS turn-order mechanic** (`src/lib/rps.ts`, tests, UI):
- `resolveRPS()` + `randomRPSPick()` — pure functions, 8/8 tests green
- `RPSScreen.tsx` — multiplayer pick screen, Supabase write + Realtime subscription
- `RPSResultScreen.tsx` — shows both picks, outcome text, auto-advances after 3s
- `LocalRPSScreen.tsx` — local 2-player: random pick for both, result shown, "Start Game" button

**Online game flow:**
- `MatchmakingPage.tsx` — joiner sets `status: 'rps'`; creator navigates on `'rps'` or `'active'`
- `useOnlineGame.ts` — exposes `rpsCreatorPick`, `rpsJoinerPick`, `isCreator`; creator-only resolution effect handles draw re-pick and p2-wins swap
- `OnlineGameView.tsx` — RPSScreen/RPSResultScreen branches before loading/waiting checks

**Local game flow:**
- `App.tsx` — `LocalGameRoute` gates `GameWrapper` behind `LocalRPSScreen`

**Supabase migrations** (run manually in SQL editor):
- `supabase/migrations/20260318000001_skins.sql` — `skins`, `user_skins`, `user_equipped_skins` tables + 5 default seeds
- `supabase/migrations/20260318000002_games_rps.sql` — `rps_creator_pick`, `rps_joiner_pick` columns on `games`

### Known Phase 2 limitations (by design)
- All skins are `assetUrl: 'placeholder'` — real Lottie URLs drop in during Phase 5 with zero code changes
- `p1GoesFirst` from local RPS is stored but not yet passed to `GameWrapper` — wired in Phase 6
- `myMarker` in online game may briefly show old value after RPS swap until next game load — acceptable for Phase 2

### Next step
Merge `feat/phase-2-skins` into `main`, then begin Phase 3 (player progression + achievements + currency).

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
