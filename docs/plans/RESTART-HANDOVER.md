# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. The current priority is fixing the **persistent resume toast bug** — on every login, both users see 'You have an active game. Resume Game.' pointing to a game that has already been won. Clicking it navigates to the completed game.
>
> Three fixes have been attempted in the current session (commits e862eb8 and 8a7f740, deployed) — none resolved it. The full fix history is in the Known Issues section.
>
> The most likely remaining root cause: there are **stale game rows in the DB with status='active' or 'rps'** from games that ended without their status being written to 'complete' (e.g. abandoned Play Again rematch games, or games from before the DB-write-before-broadcast fix). The `useActiveGame` query finds these rows and shows the toast. These rows will never self-clear — they need to be cleaned up manually in Supabase, or the query needs a smarter filter.
>
> Before writing any more code, check the `games` table in Supabase directly: look for rows with status='active' or status='rps' and inspect their `winner`, `updated_at`, and `state`. If you find rows that clearly completed (winner set, board full) but still show 'active', that confirms DB corruption as the cause.
>
> Ready when you are."

---

## Current state

**Active worktree:**

| Worktree                              | Branch                     | Status                                                                              |
| ------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| `.worktrees/feat-disconnect-handling` | `feat/disconnect-handling` | Fix 7 deployed (95d8a7f) — RPS architectural rewrite, new game-start bug discovered |

`feat/phase-2-skins` worktree has been removed. Its code is fully contained in `feat/disconnect-handling`.

**Private Vercel (testing):** `mega-ox-dev`
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy by running `git push private HEAD:main --force` from the `feat-disconnect-handling` worktree
— Deployment protection: **disabled** (for testing)
— Latest production: commit `95d8a7f` (fix 7 — new rps_picks table + polling architecture, RPS picks working, game-start bug to fix)

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. Leave alone.

**Local `main` branch:** Still behind private `main` (pre-multiplayer). Do NOT push to `origin/main` without explicit instruction.

---

## Remaining work before merging local main

1. **Fix game-start bug** — After RPS win, joiner's `status` stays `'rps'`. Fix: call `fetchGameState()` in `dismissRPSResult` when `!wasDraw`. One line. Do not touch pick submission or polling logic.
2. **Test draw rounds** — Draws cycle back to pick screen correctly (not yet confirmed after the architectural rewrite). Test at least 2 consecutive draws then a win.
3. **Re-test Play Again** — Still needs validation after all changes.
4. **Section 6 regression checklist** — `docs/plans/2026-03-19-testing-benchmarks.md`. Run before merge.
5. **Merge to local main** — pull private/main into local main, then push to origin/main (user decides on public deploy).

---

## RPS draw bug — full history

### Symptom

When both players pick the same option (draw), one browser correctly shows the result screen and returns to the pick screen. The other browser stays frozen on "Waiting for opponent..." with the previous pick still displayed. It is not always the same browser. Refreshing restores it.

### Confirmed root cause (2026-03-23, session after fix 3)

Two delivery paths exist for RPS data:

- **`rps_pick` broadcast** — fast (~10–50ms, direct WebSocket)
- **`postgres_changes` CDC** — slower (~100–300ms, DB write → Supabase Realtime)

On a draw, the **creator's resolution effect** fires when both picks arrive in React _state_ (via CDC). It then writes `rps_creator_pick = null, rps_joiner_pick = null` to the DB (the draw-clear). That null-clear CDC propagates to both clients.

**The race:** The null-clear CDC can reach the **joiner** before the creator's `rps_pick` broadcast does. When it arrives, the `postgres_changes` handler unconditionally overwrites `rpsCreatorPickRef` and `rpsJoinerPickRef` to null — including the joiner's own pick ref that `submitRPSPick` had correctly set. When the creator's broadcast finally arrives, `captureRPSResultIfReady(creatorPick, null)` silently fails because the joiner ref is now null.

Result: creator captures and shows the result screen (then remounts RPSScreen). Joiner never captures, stays stuck on "Waiting for opponent..." in their RPSScreen.

**Key files:**

- `src/hooks/useOnlineGame.ts` — `submitRPSPick`, `captureRPSResultIfReady`, `rpsCreatorPickRef`/`rpsJoinerPickRef`, `postgres_changes` handler, resolution effect
- `src/components/game/OnlineGameView.tsx` — `rpsResultPicks` render guard, `handleRPSContinue`, `rpsResultShownRef`

### Fix attempts

**Fix attempt 1 (~commit 4861d8d):**

- `handleRPSContinue` was unconditionally setting `rpsResultShownRef=true` on draws, preventing the re-pick screen from showing after the result screen dismissed.
- Fixed that guard. Did not fix the core issue: the result screen was not showing at all.

**Fix attempt 2 (commit bd66143, 2026-03-23):**

- Added `rpsCreatorPickRef` / `rpsJoinerPickRef` shadow refs alongside state.
- Added `captureRPSResultIfReady()` called synchronously inside `postgres_changes`, `rps_pick` broadcast, and `fetchGameState`.
- Added `rpsRound` counter as `key` on `RPSScreen` to force remount on each draw round.
- **Why it still failed:** `submitRPSPick` still did not write the player's own pick to the ref. The broadcast from the opponent arrived before the CDC echo, `captureRPSResultIfReady(null, opponentPick)` fired and failed.

**Fix attempt 3 (commit 3a358d8, 2026-03-23):**

- In `submitRPSPick`, immediately set the own pick ref after a successful DB write (before sending the broadcast).
- Addressed the "own ref null when opponent broadcast arrives" scenario.
- **Why it still failed:** The null-clear CDC (from creator's draw resolution) arrives at the joiner BEFORE the creator's broadcast. The `postgres_changes` handler unconditionally set `rpsJoinerPickRef = null`, wiping the pick that `submitRPSPick` had just set. When the creator's broadcast finally arrived, the joiner ref was null and capture failed.

**Fix attempt 4 (this commit):**

- In the `postgres_changes` handler, guard null-clear (null) values with `rpsResultCapturedRef.current`.
- `const nullClearAllowed = rpsResultCapturedRef.current` — only apply null from DB once the result has already been captured.
- If the result hasn't been captured yet, preserve the locally-set refs. The broadcast will arrive eventually and trigger the capture with both refs intact.
- Once captured, the null-clear is applied normally so the next draw round starts clean.
- **Changed:** 5 lines in the `postgres_changes` handler in `useOnlineGame.ts`. Nothing else.

**If fix attempt 4 still fails — where to look:**

- Check whether `rpsResultCapturedRef.current` is somehow `true` when it shouldn't be (stuck from a previous round). Trace resets: `dismissRPSResult` and the setup effect in `useOnlineGame`.
- Add `console.log` to `captureRPSResultIfReady` and both the `postgres_changes` and `rps_pick` handlers. Log ref values and `rpsResultCapturedRef.current` at each call. Confirm the call order matches the expected sequence.
- If the null-clear guard is working but capture still fails, the issue is that the creator's broadcast is never arriving. Check whether `channelRef.current` is null when `submitRPSPick` tries to send.

---

**Fix attempt 5a (commit fe519a8, 2026-03-23):**

- **New bug discovered this session:** After a non-draw RPS win, `rps_creator_pick`/`rps_joiner_pick` stay populated in the DB. Any later `postgres_changes` event (move write, forfeit) carries those stale picks. Fix 4's null-clear guard only blocked _null_ overwrites — non-null stale values still triggered `captureRPSResultIfReady`, showing the RPS result screen mid-game or after a forfeit.
- Fix: wrap the entire RPS pick block in `if (updated.status === 'rps')` in the `postgres_changes` handler. Same guard added to `fetchGameState`. Fix 4's draw-clear null guard preserved inside the block.
- **Outcome:** Forfeit-during-game bug confirmed fixed. Draw path still broken (see below).

**Fix attempt 5b (commit fe519a8, same commit as 5a):**

- Added `useEffect([gameId])` in `OnlineGameView` to reset `rpsResultShownRef.current = false` when `gameId` changes.
- Intended to fix Play Again: React Router reuses the component across `/game/:id` navigations, so the ref persisted `true` from the old game into the new game's RPS phase, causing one browser to skip RPSScreen.
- **Why it failed:** `useRef` resets are silent — changing `.current` doesn't trigger a re-render. The ref was reset but the component never re-rendered to apply it, so RPSScreen was still blocked.

**Fix attempt 5c (commit 343ca41, 2026-03-23):**

- Converted `rpsResultShownRef` from `useRef(false)` to `useState(false)` in `OnlineGameView`.
- `setRpsResultShown(false)` in `useEffect([gameId])` now triggers a re-render, so the RPSScreen correctly reappears for the new game.
- React 18 batches `setRpsResultShown(true)` and `setRpsResultPicks(null)` in `handleRPSContinue`, preserving the flash-back protection.
- **Outcome:** Play Again routing fix deployed. Draw path still broken — see current symptom below.

**Current symptom after Fix 5 (2026-03-23):**

- On a draw: Browser 1 (joiner) stuck on "Waiting for opponent..." — pick submitted, result screen never shown.
- Browser 2 (creator) correctly saw the draw result screen and returned to the pick screen.
- This is the same joiner-misses-capture symptom as before Fix 4, suggesting Fix 5's `status === 'rps'` scope may have altered the timing of the null-clear guard or exposed a new ordering edge case.

**Fix attempt 6 (commit a7eca80, 2026-03-23):**

- **Root cause identified (suspected):** `submitRPSPick` sets the own pick ref but never calls `captureRPSResultIfReady`. If the opponent's `rps_pick` broadcast arrives **before** the local player submits, the broadcast handler calls `captureRPSResultIfReady(opponentPick, null)` — fails (own ref null). When the player submits, the own ref is set but nothing attempts to capture. The only remaining path is the own CDC echo, which could race the draw-clear CDC.
- **Fix:** Added `captureRPSResultIfReady(rpsCreatorPickRef.current, rpsJoinerPickRef.current)` at the end of `submitRPSPick`, after setting the own ref. If the opponent's pick is already in the ref, capture fires immediately without needing the CDC.
- **Diagnostic logs added** (prefix `[RPS ...]`) to: `captureRPSResultIfReady`, `postgres_changes` handler, `rps_pick` broadcast handler, `submitRPSPick`, and the resolution effect. Open both browser DevTools before testing to record the full event sequence.
- **Outcome:** Tested — still broken. User declared the entire event-based approach fundamentally unreliable. Required a complete architectural redesign.

---

**Fix 7 — Architectural redesign (commit 95d8a7f, 2026-03-24):**

The entire event-based RPS system was scrapped. Removed: `rpsCreatorPickRef`, `rpsJoinerPickRef`, `rpsResultCapturedRef`, `rpsResolutionSentRef`, `captureRPSResultIfReady`, the resolution effect, all `rps_pick` and `rps_resolved` broadcast handlers, and the `if (updated.status === 'rps')` block from `postgres_changes`. 226 lines removed, 75 added.

**New architecture:**

- Supabase `rps_picks` table created: `(game_id UUID, user_id UUID, pick TEXT, PRIMARY KEY(game_id, user_id))`
- Both players upsert their pick: `submitRPSPick` does an upsert to `rps_picks` — no broadcast, no WebSocket dependency
- Both clients poll `rps_picks` every 1s: when 2 rows appear, each client resolves the result independently (deterministic — same `resolveRPS` logic)
- After both picks visible: `setRpsResultPicks({creator, joiner})` shown to the user
- Creator waits 2s (gives joiner's poll one cycle to see both rows), then:
  - **Draw:** deletes all picks for the game → both clients see 0 rows → `dismissRPSResult(true)` → `rpsRound++` → polling effect re-runs fresh
  - **Win:** updates game row (status → active, player_x/o IDs if needed), then deletes picks → joiner's next poll sees 0 rows → `fetchGameState` syncs the new status
- Creator advances own status immediately via `setStatus('active')`. Joiner relies on `fetchGameState` after seeing 0 picks post-capture.

**New bug discovered after Fix 7:**

- RPS picks work correctly — both browsers see picks and the result screen
- After result screen auto-dismisses (win case), the joiner cannot play — cells are unclickable
- **Root cause:** `dismissRPSResult(false)` clears `rpsResultPicks` but does not call `fetchGameState`. The joiner's `status` remains `'rps'`. The polling effect is still alive, but `capturedThisRound = true` so every poll returns early. The joiner is frozen.
- **Fix (not yet applied):** In `dismissRPSResult`, call `fetchGameState()` when `!wasDraw`. This transitions the joiner to `'active'`. The creator calling it too is a harmless re-confirm of their already-active status.

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
- Audio (4.1–4.8) — all sounds confirmed ✅
- RPS — both browsers submit picks successfully ✅ (Fix 7)
- RPS — result screen shows on both browsers before game starts ✅ (Fix 7)
- RPS — win case: result screen shows, but joiner cannot play after (game-start bug, Fix 7 pending) ⚠️
- RPS — draw: result screen shows, both return to pick screen — not yet re-tested after Fix 7 ⚠️
- Join with code — creator navigates correctly ✅
- Play Again — both players → new RPS → new game ✅

---

## What is built and working

| Feature                                    | Status                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Guest landing page (`/`)                   | Done                                                                            |
| Demo game (`/demo`)                        | Done                                                                            |
| Auth flow                                  | Done                                                                            |
| Main menu (`/menu`)                        | Done                                                                            |
| Tutorial — Beginner + Intermediate         | Done                                                                            |
| Single player vs AI (Easy / Medium / Hard) | Done — Phase 1 complete                                                         |
| Local 2-player                             | Done                                                                            |
| Network multiplayer — core                 | Done                                                                            |
| Skin system scaffolding                    | Done — Phase 2                                                                  |
| User profiles, leaderboard, stat tracking  | Done                                                                            |
| Disconnect handling                        | Done — Phase 2.5                                                                |
| Broadcast move sync                        | Done — Phase 2.5                                                                |
| Audio notifications                        | Done — Phase 2.5                                                                |
| Play Again (readiness dots)                | Done — Phase 2.5                                                                |
| RPS sync                                   | In progress — Fix 7 (rps_picks table + polling) deployed; game-start bug to fix |

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area                                                      | Status                                                       |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------ |
| 0     | Infrastructure and cost planning                          | Brief written (`docs/plans/phase-0-infrastructure-brief.md`) |
| 1     | AI improvement (Easy / Medium / Hard)                     | **Complete and merged**                                      |
| 2     | Skin system code refactor                                 | **Complete — merged into private main**                      |
| 2.5   | Disconnect handling + broadcast sync + audio + Play Again | **Complete — merged into private main**                      |
| 3     | Player progression + achievements + virtual currency      | Not started                                                  |
| 4     | Profile customisation + emoji communication               | Not started                                                  |
| 5     | Visual redesign                                           | Not started                                                  |
| 6     | Cash shop                                                 | Not started                                                  |
| 7     | Admin dashboard                                           | Not started                                                  |
| 8     | Bug report system                                         | Not started                                                  |

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

### 🔴 PRIORITY — Resume toast showing on login for already-won games

**Symptom:** On every login, both users immediately see "You have an active game. Resume Game." Clicking it navigates to a game that shows as already won.

**What this means:** `useActiveGame` is finding a game row in the DB with `status='active'` or `status='rps'` that actually represents a completed game. The toast correctly fires (it found a real row), but the game it points to is stale.

**Fix attempts — all failed:**

1. **`useParams()` → `location.pathname` comparison** (commit e862eb8) — `ResumeGameToast` is rendered inside `ProtectedRoute`, which is above the `/game/:id` route, so `useParams()` always returned `undefined`. Fixed to `location.pathname === '/game/${activeGameId}'`. Did not resolve: toast still fires on `/menu`, where the path comparison correctly evaluates to false (not a game route) but `activeGameId` is still set.

2. **Suppress on any `/game/` route** (commit e862eb8) — Changed check to `location.pathname.startsWith('/game/')`. Resolves the "toast on RPS screen" case, but does nothing for the "toast on login/menu" case since users are on `/menu`.

3. **Await DB write before broadcast on winning move** (commit 8a7f740) — The broadcast in `placeMarker` was firing before the DB write, so the opponent could navigate to `/menu` during the window when the DB still showed `active`. Fixed by awaiting the DB write for `isOver=true` only. Did NOT resolve the issue — users still see the toast on fresh login.

**Most likely remaining root cause:** Stale game rows in the DB. Either:
- Abandoned Play Again rematch games — when both players click Play Again, Player X creates a new game in `rps` status. If they then navigate to menu instead of the game (e.g. the "opted out" flow fires), that `rps` game row sits in the DB permanently since no one ever sets it to `complete`.
- Games from before the DB-write-before-broadcast fix where the winning move's DB write never landed.

**Recommended next step:** Query the `games` table directly in Supabase. Filter by `status IN ('active', 'rps')`. Look for rows where `winner` is set or `updated_at` is old. Manually set those to `status='complete'` to unblock testing. Then add cleanup logic so abandoned rematch games don't accumulate.

---

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

| File                                              | Purpose                                                                                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/models/Game.ts`                              | Core game logic — OOP, no React                                                                                                                             |
| `src/hooks/useGameLogic.ts`                       | React wrapper, `{ ...game }` spread for re-renders                                                                                                          |
| `src/hooks/useOnlineGame.ts`                      | Online game state — broadcast sync, RPS (new: `submitRPSPick` upserts to `rps_picks`, polling effect, `dismissRPSResult`), Presence, disconnect, Play Again |
| /mcp                                              | `src/hooks/useActiveGame.ts`                                                                                                                                | Active/forfeited game detection — re-queries on navigation |
| `src/lib/sounds.ts`                               | Web Audio API — `resumeAudio()` must be called on first user gesture                                                                                        |
| `src/lib/gameSerializer.ts`                       | `serializeGame` / `deserializeGame`                                                                                                                         |
| `src/components/ResumeGameToast.tsx`              | Resume + forfeit toast                                                                                                                                      |
| `src/components/game/OnlineGameView.tsx`          | Online game UI — disconnect banner, forfeit modal, Play Again dots, audio                                                                                   |
| `src/components/game/RPSScreen.tsx`               | RPS pick UI — accepts `onSubmitPick` callback; no direct Supabase writes                                                                                    |
| `src/components/game/RPSResultScreen.tsx`         | RPS result screen — 3s auto-continue                                                                                                                        |
| `src/components/game/MatchmakingPage.tsx`         | Create/join game — lobby channel + SUBSCRIBED fallback                                                                                                      |
| `src/components/GameWrapper.tsx`                  | Local/AI game UI                                                                                                                                            |
| `src/App.tsx`                                     | React Router v7, all routes                                                                                                                                 |
| `src/ai/aiPlayer.ts`                              | AI difficulty module (Phase 1)                                                                                                                              |
| `src/contexts/SkinContext.tsx`                    | Skin context (Phase 2)                                                                                                                                      |
| `src/contexts/AuthContext.tsx`                    | Auth state                                                                                                                                                  |
| `src/lib/rps.ts`                                  | RPS logic — pure functions                                                                                                                                  |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap                                                                                                                               |
| `docs/plans/2026-03-19-testing-benchmarks.md`     | Live testing checklist — run before merge                                                                                                                   |

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

● Deployed. Here's what was shipped:  
 Commit e530225 — two changes to useOnlineGame.ts:

1. Error logging on the rematch_game_id DB write — if Supabase RLS blocks Player X's write, you'll now see [createRematch]  
   rematch_game_id write failed: ... in the console.
2. Polling fallback — while Player O is on the complete screen with Play Again clicked but no rematchGameId yet, it calls
   fetchGameState every 2 seconds. The moment rematch_game_id lands in the DB (written by Player X), the next poll picks it up and
   navigation fires.

How to test:

- Play a full game to completion
- Both players click Play Again
- Browser 1 (Player O / winner) should now navigate to RPS within 2 seconds of Browser 2 clicking Play Again
- If it still sticks, open Browser 1's console — the error log will tell you exactly what's failing
