# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. We are in **live testing** on `feat/disconnect-handling`.
>
> Three new bugs were fixed this session (lobby join fallback, Play Again reliability, RPS screen flash-back, and RPS pick delivery). The latest build is deployed to private Vercel at commit `f982c6c`.
>
> The user was mid-testing when this session ended. The immediate next step is continuing live testing — check the test status table below to see what is confirmed vs pending.
>
> Ready when you are."

---

## Current state

**Active branch:** `feat/disconnect-handling`
**Worktree path:** `F:\Projects\MEGA-OX\.worktrees\feat-disconnect-handling`
**Parent branch:** `feat/phase-2-skins` (Phase 2 complete, not yet merged to local `main`)

**Private Vercel (testing):** `mega-ox-dev-git-feat-disconnect-8ee57f-adams-projects-ff804fb2.vercel.app`
— Project: `mega-ox-dev` (prj_ax0KSF6QTW1EMnAdtDa9HesZWCub), Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Deployment protection: **disabled** (turned off for testing)
— Connected to: `AJHemmings/MEGA-OX-private` — deploy by running `git push private HEAD:main --force` from the worktree

**Public Vercel (`mega-ox`):** Portfolio/CV version. Leave alone.

**`main` branch:** Do NOT push to `origin/main` without explicit instruction.

**Build status:** ✅ Passing — clean as of commit `f982c6c`.

---

## Testing status

### ✅ Confirmed working (prior session)
- Move sync (1.1–1.5) — moves instant, boards in sync, constraints, micro/macro wins
- Intentional exit (3.1–3.3) — forfeit confirm/cancel modal works
- Auto-forfeit on disconnect (disconnect → 90s countdown → forfeit fires → both screens update correctly)
- Countdown cancels when disconnected player reconnects (full close + reopen, not refresh)
- Resume toast appears correctly
- Audio (4.1–4.8) — all sounds confirmed working ✅
- First game (join with code) played cleanly ✅

### ⚠️ Needs testing — fixes applied this session, not yet confirmed
| # | What to check | Fix applied |
|---|---|---|
| RPS | Both browsers complete RPS and enter game without one getting stuck on "Waiting for opponent" | Picks now broadcast via `rps_pick` event in addition to postgres_changes; `submitRPSPick` in `useOnlineGame` handles both paths |
| RPS | Result screen shows on both browsers before game starts | `rpsResultShownRef` prevents RPSScreen flash-back during `rps → active` gap |
| RPS | No browser goes back to pick selection after game is won | `advanceStatus()` — status is now monotonic, cannot go backwards from late postgres_changes |
| Join | Creator navigates to game correctly even if joiner arrived before lobby subscription confirmed | SUBSCRIBED callback now checks DB status as fallback |
| Play Again | Both players click Play Again → new game loads | Intent now stored in presence (`channel.track`) as reliable fallback; broadcast is fast path |
| Play Again | Clicking "Back to Menu" from complete screen navigates cleanly | No change — was working |
| Regression | All section 6 regression tests (see testing benchmarks doc) | Not yet run |

---

## Bugs found and fixed this session (new — on top of prior 9 fixes)

### Fix 10 — Creator stuck on "Waiting for opponent" (lobby subscription race)
If the joiner entered the code before the creator's `lobby:${id}` postgres_changes subscription was confirmed by Supabase, the status-change event was missed and the creator never navigated to the game.

**Fix:** The lobby channel's `.subscribe()` callback now runs a DB status check immediately on SUBSCRIBED. If the game is already `rps` or `active`, it navigates straight to the game.

### Fix 11 — Play Again: both stuck at "Waiting..." forever
`rematch_intent` was signalled only via ephemeral broadcast. If the channel was in a degraded state after game completion, both broadcasts were dropped silently and neither player saw the other's intent.

**Fix:** `signalRematchIntent` now also calls `channel.track({ user_id, rematch_intent: intent })`, storing the intent in presence state. Presence persists for the connection lifetime. A `presence sync` handler and updated `presence join` handler pick up the intent from presence. Broadcast is kept as the fast path; presence is the reliable fallback.

### Fix 12 — RPS screen flashing back after game ends / after result screen
Two root causes:
1. **Out-of-order postgres_changes:** A late `status: 'rps'` event arriving after `status: 'complete'` would reset the game to the RPS pick screen.
2. **Result screen timer race:** `RPSResultScreen` auto-continues after 3s. If `status: 'active'` postgres_changes hadn't arrived yet, `resultPicks` cleared → `status === 'rps'` → RPSScreen showed.

**Fix 1:** Status is now monotonic. `advanceStatus()` only applies a status update if it's a forward transition (`loading → waiting → rps → active → complete`). Late/out-of-order events are ignored.

**Fix 2:** `rpsResultShownRef` is set when the result screen is dismissed. While true, the `status === 'rps'` RPSScreen render is blocked. Resets to false only when picks are cleared (draw re-pick).

### Fix 13 — Creator stuck on "Waiting for opponent" during RPS (postgres_changes missed)
The creator (browser one) would submit their RPS pick and wait, while the joiner (browser two) submitted theirs. If the joiner's `rps_joiner_pick` postgres_changes event was missed on the creator's client, `rpsJoinerPick` stayed null. The creator never detected both picks → no result screen → RPS resolution effect never fired → status stayed `rps` permanently. Joiner, who DID receive both picks, showed the result screen and bypassed to the game board via `rpsResultShownRef` — but couldn't move because status was still `rps`. Refresh fixed it by pulling both picks from DB.

**Fix:** RPS pick submission moved into `useOnlineGame` as `submitRPSPick`. After writing to DB, it also broadcasts an `rps_pick` event with `{ column, pick }`. A new broadcast listener applies the pick immediately on the other client. postgres_changes is still the authoritative path; broadcast is the fast/reliable fallback. `RPSScreen` now accepts an `onSubmitPick` callback prop instead of writing to Supabase directly.

---

## Prior bugs fixed (previous session — for reference)

| # | Summary |
|---|---|
| 1 | AudioContext never started — added `resumeAudio()`, called on first click |
| 2 | `wonByForfeit` race condition — derived from `forfeit_player_id` (DB), not presence |
| 3 | Countdown not cancelling on quick reconnect — check `presenceState()` before starting |
| 4 | Board state unsynced on join — broadcast current state on join instead of DB fetch |
| 5 | `opponentId` null for creator — set in `postgres_changes` handler, not just `fetchGameState` |
| 6 | Loser doesn't see complete screen — `isOver`/`winner` included in move broadcast payload |
| 7 | Joiner stuck on "Waiting for opponent" during RPS — `prevHadBothPicksRef` trigger instead of `status === 'rps'` check |
| 8 | RPSScreen had a dead channel — removed; state handled entirely by `useOnlineGame` |
| 9 | Play Again redesigned with readiness dots — `rematch_intent` broadcast, two-dot UI |

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
| Network multiplayer | Done |
| Skin system scaffolding (Phase 2) | Done |
| User profiles, leaderboard, stat tracking | Done |
| Disconnect handling | Done — Presence + grace period + forfeit |
| Broadcast move sync | Done |
| Audio notifications | Done — confirmed working |
| Play Again (readiness dots) | Implemented — fixes applied, awaiting re-test |
| RPS sync | Implemented — fixes applied, awaiting re-test |

---

## How to deploy

From the worktree:
```bash
git push private HEAD:main --force
```
Vercel auto-builds on push. Wait ~60s then test at the private URL.

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Infrastructure and cost planning | Brief written |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete and merged** |
| 2 | Skin system code refactor | **Complete — awaiting merge** |
| 2.5 | Disconnect handling + broadcast sync + audio + Play Again | **In progress — live testing** |
| 3 | Player progression + achievements + virtual currency | Not started |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

---

## Known issues / pending

- **`useLoginStreak.ts` line 31** — swap `.single()` to `.maybeSingle()` to silence 406 errors when no reward exists for streak day. Low priority, deferred.
- **`p1GoesFirst` from `LocalRPSScreen`** — stored in `App.tsx` state but not yet passed to `GameWrapper`. Phase 6 will wire this.
- **Skins tables in Supabase have no RLS policies** — fine for Phase 2, needed in Phase 3.
- **Double-disconnect edge case** — if both players disconnect simultaneously, game stays `active` indefinitely. Acceptable for this phase; cleanup job planned for Phase 7.
- **`isCreator` in `useOnlineGame`** — actually means "is currently player X" (set from `player_x_id === user.id`), not "was the original game creator". Renaming to `isPlayerX` would make the codebase honest. Low priority, no user-facing impact.
- **Play Again — both players click simultaneously** — both clients may try to create a game. `rematchCreatedRef` prevents double-creation on a single client but two simultaneous clients can still race. Acceptable edge case for now.
- **`game_moves` table `move_number` is always 0** — full move history tracking deferred.
- **Play Again not shown on forfeit games** — by design. `wonByForfeit` hides it and shows "Back to Menu" only.

---

## Merge order (when testing is done)

1. Merge `feat/disconnect-handling` → `feat/phase-2-skins` (it branched from there)
2. Merge `feat/phase-2-skins` → local `main`
3. Push local `main` → `private/main` (triggers production Vercel build)
4. Optionally push to `origin/main` (public portfolio) — user decides

---

## Key files

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper, `{ ...game }` spread for re-renders |
| `src/hooks/useOnlineGame.ts` | Online game state — broadcast sync, RPS (inc. `submitRPSPick`), Presence, disconnect, Play Again readiness |
| `src/hooks/useActiveGame.ts` | Active/forfeited game detection — re-queries on navigation |
| `src/lib/sounds.ts` | Web Audio API sound effects — `resumeAudio()` must be called on first user gesture |
| `src/lib/gameSerializer.ts` | `serializeGame` / `deserializeGame` + `SerializedState` type |
| `src/components/ResumeGameToast.tsx` | Resume + forfeit toast component |
| `src/components/game/OnlineGameView.tsx` | Online game UI — disconnect banner, forfeit modal, Play Again dots, audio |
| `src/components/game/RPSScreen.tsx` | RPS pick UI — accepts `onSubmitPick` callback; no direct Supabase writes |
| `src/components/game/MatchmakingPage.tsx` | Create/join game with code — lobby channel + SUBSCRIBED fallback |
| `src/components/GameWrapper.tsx` | Local/AI game UI — audio wired here |
| `src/App.tsx` | React Router v7. All routes. |
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

**rm -rf incident:** Claude used `rm -rf` on directories in the main project to clean up test copies, deleting tracked files. All restored via `git restore`. **Never use `rm -rf` on directories in the main project. Delete files individually by name.**

**Kill by PID, not taskkill /F /IM node.exe:** When stopping the dev server, kill by PID (`taskkill //F //PID <pid>`) rather than killing all node processes.

**Deploy by push, not Vercel CLI:** Vercel CLI is not available in the shell. Deploy by pushing to `AJHemmings/MEGA-OX-private` — Vercel watches that repo's main branch. Use `git push private HEAD:main --force` from the worktree.
