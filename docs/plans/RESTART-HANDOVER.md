# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Fix 11 deployed (commit `b39944c`, private Vercel `mega-ox-dev`). Two bugs fixed this session:
>
> 1. **URL cycling / both players stuck on different RPS games (Fix 11a)** — `myRematchIntent` and `opponentRematchIntent` are `useState`, so they survive a `gameId` change (React Router reuses the component). Both carry stale `'play_again'` into every new game mount. `rematchCreatedRef` just got reset to `false` and `myMarker` is still the old value before `fetchGameState` returns — so the creation effect fires, creates another game, navigates there, and repeats. Players end up on different game IDs and get stuck on RPS. Fixed: reset both intents to `null` in the main `useEffect` alongside the existing `rematchCreatedRef` reset.
>
> 2. **Resume Game toast always visible / clicking does nothing (Fix 11b)** — `ResumeGameToast` renders inside `ProtectedRoute` as a sibling of `<Outlet />`, so `useParams()` returns `{}` — no `:id` in scope at that level. The `isOnActiveGame` guard was always `false`. Fixed: compare `location.pathname` against `` /game/${activeGameId} `` directly instead.
>
> Fix 10 (same session, earlier) fixed a build failure: `database.types.ts` was missing `rematch_x_intent` and `rematch_o_intent` after the Fix 9 migration added those columns. Types manually updated; build is green.
>
> Play Again flow now needs a full live test — it was broken (URL cycling) and is now fixed. RPS draw path also still needs testing after Fix 7. Both are the top priority for this session.
>
> Ready when you are."

---

## Current state

**Active worktree:**

| Worktree | Branch | Status |
| --- | --- | --- |
| `.worktrees/feat-disconnect-handling` | `feat/disconnect-handling` | `b39944c` deployed — Fix 10 + Fix 11, awaiting Play Again live test |

`feat/phase-2-skins` worktree has been removed. Its code is fully contained in `feat/disconnect-handling`.

**Private Vercel (testing):** `mega-ox-dev`
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy by running `git push private HEAD:main --force` from the `feat-disconnect-handling` worktree
— Deployment protection: **disabled** (for testing)
— Latest production: commit `b39944c` (Fix 11 — URL cycling + toast guard)

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. Leave alone.

**Local `main` branch:** Still behind private `main` (pre-multiplayer). Do NOT push to `origin/main` without explicit instruction.

---

## Remaining work before merging local main

1. **Test Play Again (Fix 11)** — both players click Play Again → both dots go green → single consistent game ID → new RPS screen → both players can move in the new game. This is the primary test after Fix 11 fixed the URL cycling.
2. **Test RPS draw** — draw → both return to pick screen → pick again → win → game starts. Repeat 2–3 times. Not yet re-tested after Fix 7.
3. **Section 6 regression checklist** — `docs/plans/2026-03-19-testing-benchmarks.md`. Run before merge.
4. **Merge to local main** — pull private/main into local main, then push to origin/main (user decides on public deploy).

---

## This session's fixes

### Fix 11 — URL cycling + Resume Game toast (commit `b39944c`, 2026-03-25)

**Bug A — URL cycling / both players stuck on different RPS games:**

After Play Again, both players navigated to a new game. But `myRematchIntent` and `opponentRematchIntent` are `useState` — they survive a `gameId` prop change because React Router reuses the `OnlineGameView` component instance. Both carried stale `'play_again'` values into the new game. At that point, `rematchCreatedRef` had just been reset to `false` (in the main `useEffect`), and `myMarker` was still the old game's value (before `fetchGameState` returned with the new game's data). The creation effect saw both intents set, `myMarker === 'X'`, `rematchCreatedRef === false` — and created yet another game. This cascaded: each new game mount repeated the pattern, cycling through many game IDs. Players ended up on different IDs and each one's RPS polling watched a different `rps_picks` row — neither side ever saw both picks, both got stuck on "Waiting for opponent...".

Fix: two lines added to the main `useEffect` in `useOnlineGame.ts` (alongside the existing `rematchCreatedRef` reset):
```ts
setMyRematchIntent(null);
setOpponentRematchIntent(null);
```

**Bug B — Resume Game toast always visible / clicking did nothing:**

`ResumeGameToast` is rendered inside `ProtectedRoute` as a sibling of `<Outlet />`. That means it lives at the parent route level, not inside the `/game/:id` route context. `useParams<{ id? }>()` returned `{}` — there is no `:id` in scope. The `isOnActiveGame` guard was always `false`, so the toast appeared on every page including the game screen the user was already on. Clicking navigated to the same URL → no visible change.

Fix: replace `params.id === activeGameId` with `location.pathname === /game/${activeGameId}`. `useLocation()` works at any level of the component tree.

---

### Fix 10 — database.types.ts missing rematch columns (commit `3abdfa0`, 2026-03-25)

**Problem:** The Fix 9 migration added `rematch_x_intent` and `rematch_o_intent` columns to the `games` table. The generated `src/lib/database.types.ts` was never regenerated. TypeScript had no knowledge of those columns → build failed with `TS2339: Property 'rematch_x_intent' does not exist`.

**Fix:** Manually added `rematch_x_intent: string | null` and `rematch_o_intent: string | null` to `Row`, `Insert`, and `Update` in the `games` table definition. Type check clean, build green.

---

### Fix 9 — Play Again (commit `89fe317`, 2026-03-24)

Two independent bugs both blocked Play Again.

**Bug A — RLS blocked the INSERT:**
The games INSERT policy required `auth.uid() = player_x_id`. Rematch swaps who goes first: the creating player (current X) inserts a row with `player_x_id = opponentId` and `player_o_id = auth.uid()`. So `auth.uid() ≠ player_x_id` → 403.

Fix: `auth.uid() = player_x_id OR auth.uid() = player_o_id` (migration `20260324000001`).

**Bug B — Intent not delivered due to degraded WebSocket:**
The losing browser had a degraded WebSocket (`Realtime send() is automatically falling back to REST API`). Supabase's broadcast REST fallback doesn't reliably fan out to WebSocket subscribers, so one player's intent never reached the other player's `rematch_intent` handler. Same root cause as the old event-based RPS failures.

Fix: Write intent to `rematch_x_intent` / `rematch_o_intent` columns on the games row (migration `20260324000002`). `postgres_changes` delivers it via CDC — a separate, more reliable path than broadcasts. Broadcast and presence kept as fast paths. The `postgres_changes` handler and `fetchGameState` both read intent columns with null guards so move writes (which don't touch intent columns) don't wipe state.

---

### Fix 8a — Game-start bug (commit `2a3c3d7`)

**Problem:** After RPS win, joiner's `status` stayed `'rps'` forever. `dismissRPSResult(false)` cleared `rpsResultPicks` but never transitioned status. The joiner could see the board but couldn't click any cell.

**Fix:** Moved `dismissRPSResult` to after `fetchGameState` in `useOnlineGame.ts` (so it can safely depend on it), then added:
```ts
} else {
  fetchGameState(); // transitions joiner from 'rps' → 'active'
}
```

### Fix 8b — Game state polling (commits `5a95079`, `acd9eb7`)

**Problem:** After the RPS→active transition, O's moves weren't reaching X. The broadcast/CDC architecture is WebSocket-dependent and unreliable around status transitions. Same category of failure as the old event-based RPS system.

**Fix:** Added an independent game state polling effect — mirrors the `rps_picks` polling pattern that proved reliable for RPS. Runs every 1.5s while `status === 'active'`. Uses strict `>` so a locally-placed move that hasn't landed in the DB yet is never overwritten.

Also updated the broadcast move handler to track `localMoveCountRef` when applying a broadcast, preventing the poll from redundantly re-applying state already delivered by broadcast.

**RPS code is entirely untouched.**

```
RPS architecture:  polls rps_picks  (status === 'rps')   ← Fix 7, unchanged
Game architecture: polls games      (status === 'active') ← new, independent
```

---

## RPS draw bug — full history

### Symptom

When both players pick the same option (draw), one browser correctly shows the result screen and returns to the pick screen. The other browser stays frozen on "Waiting for opponent..." with the previous pick still displayed. It is not always the same browser. Refreshing restores it.

### Confirmed root cause (2026-03-23, session after fix 3)

Two delivery paths exist for RPS data:
- **`rps_pick` broadcast** — fast (~10–50ms, direct WebSocket)
- **`postgres_changes` CDC** — slower (~100–300ms, DB write → Supabase Realtime)

On a draw, the **creator's resolution effect** fires when both picks arrive in React *state* (via CDC). It then writes `rps_creator_pick = null, rps_joiner_pick = null` to the DB (the draw-clear). That null-clear CDC propagates to both clients.

**The race:** The null-clear CDC can reach the **joiner** before the creator's `rps_pick` broadcast does. When it arrives, the `postgres_changes` handler unconditionally overwrites `rpsCreatorPickRef` and `rpsJoinerPickRef` to null — including the joiner's own pick ref that `submitRPSPick` had correctly set. When the creator's broadcast finally arrived, `captureRPSResultIfReady(creatorPick, null)` silently failed because the joiner ref was now null.

Result: creator captures and shows the result screen (then remounts RPSScreen). Joiner never captures, stays stuck on "Waiting for opponent..." in their RPSScreen.

**Key files:**
- `src/hooks/useOnlineGame.ts` — `submitRPSPick`, `captureRPSResultIfReady`, `rpsCreatorPickRef`/`rpsJoinerPickRef`, `postgres_changes` handler, resolution effect
- `src/components/game/OnlineGameView.tsx` — `rpsResultPicks` render guard, `handleRPSContinue`, `rpsResultShownRef`

### Fix attempts

**Fix attempts 1–6:** Multiple attempts to fix the event-based RPS system (broadcast + CDC refs). All failed due to race conditions between broadcast delivery, CDC delivery, and draw-clear nulls. See git history (commits 4861d8d through a7eca80) for full detail.

**Fix 7 — Architectural redesign (commit 95d8a7f, 2026-03-24):**

The entire event-based RPS system was scrapped. Removed: `rpsCreatorPickRef`, `rpsJoinerPickRef`, `rpsResultCapturedRef`, `rpsResolutionSentRef`, `captureRPSResultIfReady`, the resolution effect, all `rps_pick` and `rps_resolved` broadcast handlers, and the `if (updated.status === 'rps')` block from `postgres_changes`. 226 lines removed, 75 added.

**New architecture:**
- Supabase `rps_picks` table: `(game_id UUID, user_id UUID, pick TEXT, PRIMARY KEY(game_id, user_id))`
- Both players upsert their pick — no broadcast, no WebSocket dependency
- Both clients poll `rps_picks` every 1s: when 2 rows appear, each resolves result independently
- Creator waits 2s, then: draw → delete picks → both see 0 rows → `rpsRound++` → new round; win → update game row + delete picks → joiner's `fetchGameState` syncs new status

---

## Deferred (not urgent)

- **Forfeit toast text** — always reads "You were forfeited from your last game after the reconnection window expired." regardless of whether the forfeit was intentional or due to disconnect. Fix: add `forfeit_reason` column (`'voluntary'` | `'disconnect'`) to `games`, set at forfeit, read in `useActiveGame`, branch toast text. Low user impact.

---

## Confirmed working — live testing

- Move sync (1.1–1.5) — instant, in sync, constraints, micro/macro wins ✅
- Intentional exit (3.1–3.3) — forfeit confirm/cancel modal ✅
- Browser back button interception + tab close prompt ✅
- Auto-forfeit on disconnect (90s countdown → forfeit fires → both screens update) ✅
- Countdown cancels when disconnected player reconnects ✅
- Resume toast appears correctly ✅
- Resume toast suppressed when already on that game ✅ (Fix 11b)
- Audio (4.1–4.8) — all sounds confirmed ✅
- RPS — both browsers submit picks successfully ✅ (Fix 7)
- RPS — result screen shows on both browsers before game starts ✅ (Fix 7)
- RPS — win case: result screen → game starts, both players can move ✅ (Fix 8a)
- Game generation — working ✅
- RPS — draw: result screen → both return to pick screen ⚠️ (not yet re-tested after Fix 7)
- Join with code — creator navigates correctly ✅
- Play Again — URL cycling fixed (Fix 11a), both navigate to same game ID ⚠️ (fix deployed, not yet live-tested)

---

## What is built and working

| Feature | Status |
| --- | --- |
| Guest landing page (`/`) | Done |
| Demo game (`/demo`) | Done |
| Auth flow | Done |
| Main menu (`/menu`) | Done |
| Tutorial — Beginner + Intermediate | Done |
| Single player vs AI (Easy / Medium / Hard) | Done — Phase 1 complete |
| Local 2-player | Done |
| Network multiplayer — core | Done |
| Skin system scaffolding | Done — Phase 2 |
| User profiles, leaderboard, stat tracking | Done |
| Disconnect handling | Done — Phase 2.5 |
| Broadcast move sync | Done — Phase 2.5 |
| Audio notifications | Done — Phase 2.5 |
| Play Again (readiness dots) | Done — Phase 2.5 |
| RPS sync | Fix 8 deployed and live-tested ✅ |
| Play Again | Fixes 9–11 deployed — awaiting live test |

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | Brief written (`docs/plans/phase-0-infrastructure-brief.md`) |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete and merged** |
| 2 | Skin system code refactor | **Complete — merged into private main** |
| 2.5 | Disconnect handling + broadcast sync + audio + Play Again | **Complete — merged into private main** |
| 3 | Player progression + achievements + virtual currency | Not started |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

---

## Key design decisions

- **Visual redesign is Phase 5**, not Phase 0.
- **Skin system is split:** code refactor is Phase 2; visual art direction is Phase 5.
- **Progression, achievements, and currency are one phase** (Phase 3).
- **AI improvement (Phase 1) comes before progression** because achievements reference difficulty levels.
- **Hand-coded AI only** — minimax with alpha-beta pruning for Hard.
- **Disconnect forfeit is written by the waiting player's client** (not a server function). Risk: double-disconnect leaves game stuck — cleanup deferred to Phase 7.
- **Grace period is 90 seconds** before auto-forfeit.
- **Intentional exits write forfeit immediately** (no grace period).

---

## Known issues / deferred

- **`useLoginStreak.ts` line 31** — swap `.single()` to `.maybeSingle()` to silence 406 errors. Low priority, no user-facing impact.
- **`p1GoesFirst` from `LocalRPSScreen`** — stored in `App.tsx` but not yet passed to `GameWrapper`. Phase 6.
- **Skins tables have no RLS policies** — fine for Phase 2, needed for Phase 3.
- **Double-disconnect edge case** — if both players disconnect simultaneously, game stays `active`. Cleanup job planned for Phase 7.
- **`isCreator` in `useOnlineGame`** — actually means "is player X". Renaming to `isPlayerX` deferred.
- **Play Again simultaneous click race** — two clients can both try to create a rematch. `rematchCreatedRef` prevents it per-client, not across clients. Acceptable.
- **`game_moves` table `move_number` is always 0** — full move history tracking deferred.
- **Play Again not shown on forfeit games** — by design.
- **Forfeit toast text** — see Deferred section above.

---

## Open questions (resolve at each phase's detail design)

- Currency name and branding
- EXP values and level curve shape
- Art direction for visual redesign
- Which profile items are free progression unlocks vs paid vs both
- Achievement trigger method (DB trigger vs edge function vs client + server validation)
- Admin access control: private API vs direct Supabase RLS
- Bug reports: email notifications to admin on new submission?

---

## Key files

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper, `{ ...game }` spread for re-renders |
| `src/hooks/useOnlineGame.ts` | Online game state — RPS polling (`rps_picks`, status=`'rps'`), game state polling (`games`, status=`'active'`), broadcast sync, `dismissRPSResult`, Presence, disconnect, Play Again |
| `src/hooks/useActiveGame.ts` | Active/forfeited game detection — re-queries on navigation |
| `src/lib/sounds.ts` | Web Audio API — `resumeAudio()` must be called on first user gesture |
| `src/lib/gameSerializer.ts` | `serializeGame` / `deserializeGame` |
| `src/components/ResumeGameToast.tsx` | Resume + forfeit toast |
| `src/components/game/OnlineGameView.tsx` | Online game UI — disconnect banner, forfeit modal, Play Again dots, audio |
| `src/components/game/RPSScreen.tsx` | RPS pick UI — accepts `onSubmitPick` callback; no direct Supabase writes |
| `src/components/game/RPSResultScreen.tsx` | RPS result screen — 3s auto-continue |
| `src/components/game/MatchmakingPage.tsx` | Create/join game — lobby channel + SUBSCRIBED fallback |
| `src/components/GameWrapper.tsx` | Local/AI game UI |
| `src/App.tsx` | React Router v7, all routes |
| `src/ai/aiPlayer.ts` | AI difficulty module (Phase 1) |
| `src/contexts/SkinContext.tsx` | Skin context (Phase 2) |
| `src/contexts/AuthContext.tsx` | Auth state |
| `src/lib/rps.ts` | RPS logic — pure functions |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |
| `docs/plans/2026-03-19-testing-benchmarks.md` | Live testing checklist — run before merge |

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

---

## ⚠️ Incidents / lessons

**rm -rf incident:** Claude used `rm -rf` on directories in the main project, deleting tracked files. All restored via `git restore`. **Never use `rm -rf` on directories in the main project. Delete files individually by name.**

**Kill by PID, not taskkill /F /IM node.exe:** When stopping the dev server, kill by PID (`taskkill //F //PID <pid>`) rather than killing all node processes.

**Deploy by push, not Vercel CLI:** Vercel CLI is not available in the shell. Deploy by pushing to `AJHemmings/MEGA-OX-private`. Use `git push private HEAD:main --force` from the worktree.
