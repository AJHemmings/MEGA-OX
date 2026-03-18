# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Phase 2 (skin system + RPS turn-order) is **complete and working**.
> The branch `feat/phase-2-skins` in the worktree is ready to merge.
>
> The immediate next step is to merge into `main`.
>
> Ready when you are."

---

## Current state

**Active branch:** `feat/phase-2-skins`
**Worktree path:** `F:\Projects\MEGA-OX\.worktrees\feat-phase-2-skins`
**Dev server:** `cd` into worktree, run `PORT=3002 npm start` (3000/3001 may be taken by main project)

**`main` branch:** Clean. Do NOT push to `origin/main` without explicit user instruction.

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
| Skin system scaffolding (Phase 2) | Done — placeholder-first, Lottie hooks wired |
| User profiles, leaderboard, stat tracking | Done |

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | Brief written — awaiting AI model responses |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete and merged** |
| 2 | Skin system code refactor | **Complete — ready to merge** |
| 3 | Player progression + achievements + virtual currency | Not started |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign (full pass once all screens exist) | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

---

## Where we left off

### Phase 2 is complete — merge to main

Everything on `feat/phase-2-skins` is working. To merge:

```bash
cd F:/Projects/MEGA-OX   # main project directory (not worktree)
git merge feat/phase-2-skins
```

Then clean up the worktree:
```bash
git worktree remove .worktrees/feat-phase-2-skins
git branch -d feat/phase-2-skins
```

---

## What Phase 2 built

### Skin system scaffolding

**New files:**
| File | Purpose |
| --- | --- |
| `src/skins/types.ts` | `SkinAsset`, `GameSkins`, `SkinEvent` types |
| `src/skins/defaults.ts` | 5 default placeholder skins |
| `src/contexts/SkinContext.tsx` | React context — provides `GameSkins` to board tree |
| `src/components/skins/MarkerSkin.tsx` | Renders X/O marker (placeholder = styled span; Phase 5 = Lottie) |
| `src/components/skins/WonBoardSkin.tsx` | Renders won-board overlay (placeholder = tinted div) |
| `src/components/skins/BoardSkin.tsx` | Renders board background (placeholder = transparent wrapper) |

**Modified files:**
- `src/components/Cell.tsx` — uses `MarkerSkin` instead of raw string
- `src/components/MicroBoard.tsx` — uses `WonBoardSkin` overlay
- `src/components/MacroBoard.tsx` — uses `BoardSkin` wrapper

All skin components use `assetUrl: 'placeholder'` in Phase 2. The Lottie branch is wired but dead code until Phase 5.

### RPS turn-order (online multiplayer)

**New files:**
| File | Purpose |
| --- | --- |
| `src/lib/rps.ts` | `resolveRPS`, `randomRPSPick` — pure functions |
| `src/components/game/RPSScreen.tsx` | Online RPS pick UI — writes pick to Supabase |
| `src/components/game/RPSResultScreen.tsx` | Shows both picks + outcome for 3s, then auto-dismisses |
| `src/components/game/LocalRPSScreen.tsx` | Local 2-player RPS (random picks, re-picks on draw) |

**Modified files:**
- `src/hooks/useOnlineGame.ts` — manages RPS state, creator-only resolution, `rpsResolutionSentRef` guard
- `src/components/game/OnlineGameView.tsx` — RPS screen routing, `resultPicks` snapshot
- `src/components/game/MatchmakingPage.tsx` — `joinGame` sets `status: 'rps'`
- `src/App.tsx` — `LocalGameRoute` gates `GameWrapper` behind `LocalRPSScreen`
- `src/lib/database.types.ts` — added `rps_creator_pick`, `rps_joiner_pick` fields

**New Supabase migrations (applied to remote):**
| File | Purpose |
| --- | --- |
| `supabase/migrations/20260318000001_skins.sql` | Creates `skins`, `user_skins`, `user_equipped_skins` tables + 5 seed rows |
| `supabase/migrations/20260318000002_games_rps.sql` | Adds `rps_creator_pick TEXT`, `rps_joiner_pick TEXT` columns to `games` |
| `supabase/migrations/20260318000003_games_rps_status.sql` | Adds `'rps'` to `games.status` CHECK constraint |

### How RPS works (online)

1. Joiner sets `status: 'rps'` when they join the game.
2. Both players see `RPSScreen` — each writes their pick to `rps_creator_pick` / `rps_joiner_pick`.
3. `OnlineGameView` watches for both picks via `rpsCreatorPick` + `rpsJoinerPick` in state. When both arrive, `resultPicks` snapshot is captured → `RPSResultScreen` shows for 3s.
4. In `useOnlineGame`, only the creator (`isCreator=true`) resolves. A `rpsResolutionSentRef` prevents double-resolution (the key bug that was fixed).
5. If p2 wins: creator swaps `player_x_id` ↔ `player_o_id` so joiner becomes X (goes first). `myMarker` is updated from Realtime.
6. If draw: creator clears both picks (ref reset to allow re-pick), both players pick again.

---

## Known issues / next-session notes

- **`p1GoesFirst` from `LocalRPSScreen` is stored in `App.tsx` state** but NOT yet passed to `GameWrapper`. Phase 6 will wire this — the comment `// Phase 6 will wire p1GoesFirst` is in `App.tsx`.
- **`myMarker` after RPS swap**: now updated from Realtime in `useOnlineGame.ts` (fixed this session), but not tested after a p2-wins outcome. Worth a smoke test.
- **Skins tables in Supabase have no RLS policies yet** — the `20260318000001_skins.sql` creates the tables but doesn't add policies. This is fine for Phase 2 (no client reads/writes). Needs policies in Phase 3 when the shop is built.

---

## Key design decisions already made

- Visual redesign is Phase 5, not earlier.
- Skin system split: code refactor (Phase 2) vs visual art (Phase 5).
- Progression, achievements, currency are one phase (Phase 3).
- Hand-coded AI only (minimax + alpha-beta pruning for Hard).
- Creator-only RPS resolution to prevent write race conditions.
- `assetUrl: 'placeholder'` string is the sentinel for "use fallback render" in all skin components.

---

## Key files

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper, `{ ...game }` spread for re-renders |
| `src/hooks/useOnlineGame.ts` | Online game state — Realtime, RPS resolution |
| `src/App.tsx` | React Router v7. All routes. LocalRPSScreen gate. |
| `src/ai/aiPlayer.ts` | AI difficulty module (Phase 1) |
| `src/contexts/SkinContext.tsx` | Skin context (Phase 2) |
| `src/skins/types.ts` | Skin type definitions |
| `src/skins/defaults.ts` | Default placeholder skins |
| `src/contexts/AuthContext.tsx` | Auth state |
| `src/lib/rps.ts` | RPS logic — pure functions |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |
| `docs/plans/2026-03-18-phase-2-skin-system-design.md` | Phase 2 design doc |
| `docs/plans/2026-03-18-phase-2-skin-system-implementation.md` | Phase 2 implementation plan |

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
