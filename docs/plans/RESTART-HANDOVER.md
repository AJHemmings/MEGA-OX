# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. We are in **live testing** on `feat/disconnect-handling`.
>
> Audio is confirmed working. Several bugs were found and fixed this session. The latest build is deployed to private Vercel. The branch is ahead of remote `private/main`.
>
> The immediate next step is re-testing RPS sync and Play Again with the latest fixes. See the open test items below.
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

**Build status:** ✅ Passing — clean as of commit `c077252`.

---

## Testing status — what has been confirmed vs. what still needs testing

### ✅ Confirmed working this session
- Move sync (1.1–1.5) — moves instant, boards in sync, constraints, micro/macro wins
- Intentional exit (3.1–3.3) — forfeit confirm/cancel modal works
- Auto-forfeit on disconnect (disconnect → 90s countdown → forfeit fires → both screens update correctly)
- Countdown cancels when disconnected player reconnects (full close + reopen, not refresh)
- Resume toast appears correctly
- **Audio (4.1–4.8) — all sounds confirmed working** ✅

### ⚠️ Needs re-testing with latest fixes (deployed, not yet tested)
| # | What to check | Fix that was applied |
|---|---|---|
| RPS | Both browsers reach RPS screen when joining (creator no longer stuck on "Waiting for opponent") | `opponentId` now set via `postgres_changes`; result screen trigger no longer requires `status==='rps'`; dead `rps:gameId` channel removed |
| RPS | Result screen (rock/paper/scissors reveal) shows on both screens before game starts | `prevHadBothPicksRef` transition trigger instead of `status === 'rps'` |
| Complete screen | Both winner AND loser see the complete block simultaneously | `isOver`/`winner` now included in move broadcast; `placeMarker` sets status locally; no more waiting for `postgres_changes` |
| Play Again dots | Two dots appear under Play Again. Grey → green on click. Green + green → new game loads. | New `signalRematchIntent` / `rematch_intent` broadcast system |
| Play Again | Clicking Play Again actually does something (previously silently blocked) | `opponentId` was null for creator; now set correctly |
| Reconnect sync | After refresh, board state is correct without needing a second refresh | Broadcast on join (not DB fetch); `fetchGameState` move-count guard; leave handler checks `presenceState` before starting countdown |

### ⏭️ Regression tests (section 6) — not yet run
Run these after the above pass.

---

## Bugs found and fixed this session

### Fix 1 — Audio: AudioContext never started
`AudioContext` created without a user gesture starts in `suspended` state in modern browsers.
`playTone` never called `.resume()`, so no sound played.

**Fix:** Added `resumeAudio()` export to `sounds.ts`. Called on the game container's `onClick` in `OnlineGameView`. First click unlocks audio for the session.

### Fix 2 — Play Again hidden by race condition (`wonByForfeit`)
`wonByForfeit` was derived from `opponentConnected`. When a normal game ends, the opponent eventually navigates away — their presence leaves the channel, `opponentConnected` flips to `false`, and the effect `status === 'complete' && !opponentConnected` set `wonByForfeit = true`, hiding the Play Again button for the waiting player.

**Fix:** `wonByForfeit` now derived from `forfeitPlayerId !== null` (a DB field, not presence). `forfeitPlayerId` is set via `fetchGameState` and `postgres_changes`. No race condition.

### Fix 3 — Countdown not cancelling on quick reconnect (presence_ref race)
Supabase Presence tracks connections by a unique `presence_ref` per browser session. On refresh:
1. New session joins → A sees `join` for new B → countdown not started ✓
2. Old session times out and leaves → A sees `leave` for old B → **countdown starts even though new B is present** ✗

**Fix:** In the `leave` handler, call `channel.presenceState()` before starting the countdown. If the opponent still has any active presence entries (quick reconnect), skip the countdown entirely.

### Fix 4 — Board state unsynced on join (join handler called stale DB)
The `join` handler was calling `fetchGameState()` — a DB fetch. Moves are written to DB fire-and-forget, so the DB can be one move behind the local broadcast state. Player A was overwriting their own correct local state with a potentially stale DB snapshot.

**Fix:** The `join` handler now broadcasts `serializeGame(gameRef.current)` to the channel instead of fetching from DB. The reconnecting player receives the broadcast via the existing `move` handler and updates their state. `gameRef` (a ref synced via `useEffect`) gives the handler access to current game state without stale closure.

Also: `fetchGameState` now has a move-count guard — it won't overwrite a more recent broadcast state that landed before the fetch resolved.

### Fix 5 — `opponentId` null for creator (Play Again did nothing)
`opponentId` was only set in `fetchGameState`. The creator's initial `fetchGameState` runs when `player_o_id` is null (game is in `waiting` status). When the joiner joins and `player_o_id` is set in the DB, `postgres_changes` fired on the creator's client — but `opponentId` was NOT being updated there, only in `fetchGameState`. So `opponentId` stayed null for the creator's entire session, silently blocking `requestRematch`.

**Fix:** Added `setOpponentId(updated.player_x_id === user.id ? updated.player_o_id : updated.player_x_id)` to the `postgres_changes` handler.

### Fix 6 — Loser doesn't see complete screen (status not updated via broadcast)
The move broadcast only sent game state. The loser's `status` stayed `'active'` until a separate `postgres_changes` event arrived with `status: 'complete'`. If that event lagged, the `{status === 'complete' && ...}` block (containing Play Again) never showed on the loser's screen.

**Fix:** Move broadcast payload now includes `{ state, isOver, winner }`. Broadcast receiver updates `status` and `winner` immediately if `isOver`. `placeMarker` also sets status/winner locally for the winner — no waiting for postgres_changes.

### Fix 7 — RPS sync: joiner stuck on "Waiting for opponent"
The `resultPicks` effect required `status === 'rps'`. The creator resolves RPS (writes `status: 'active'`) almost immediately after both picks arrive. The joiner could receive the `status: 'active'` postgres_changes event before both picks were set locally — so `status === 'rps'` was already false when the trigger condition was evaluated. Result screen never showed; joiner stuck on RPSScreen "Waiting for opponent..." forever.

**Fix:** Replaced the `status === 'rps'` check with a `prevHadBothPicksRef` transition. `resultPicks` now fires when both picks **first become available** (transition from not-both-set → both-set), regardless of current status.

### Fix 8 — RPSScreen had a dead channel
`RPSScreen` had its own `rps:${gameId}` postgres_changes channel that called `onResolved()`. `onResolved` was already a noop (the comment even said so). The channel was creating a duplicate subscription and was never cleaned up on RPS resolution (only on draw).

**Fix:** Removed the channel and `useEffect` from `RPSScreen`. Removed `onResolved` prop entirely. State transitions are handled entirely by `useOnlineGame`'s `game:${gameId}` channel.

### Fix 9 — Play Again redesigned with readiness dots
Old design: first player to click "Play Again" immediately created a new game and broadcast the ID. If `opponentId` was null (fix 5), nothing happened at all.

**New design:** Both players signal intent via broadcast (`rematch_intent` event). Two dots show state: grey = undecided, green = play_again, red = back_to_menu. When both are green, the creator creates the game and broadcasts the game ID. Back to Menu signals `back_to_menu` intent then navigates. Play Again button shows "Waiting..." after click and disables.

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
| Play Again (readiness dots) | Implemented — awaiting live test |
| RPS sync fixes | Implemented — awaiting live test |

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
- **`isCreator` in `useOnlineGame`** — this variable actually means "is currently player X" (set from `player_x_id === user.id`), not "was the original game creator". Renaming to `isPlayerX` would make the codebase honest. Low priority, no user-facing impact.
- **Play Again — both players click simultaneously** — both clients are the `isCreator`, both try to create a game, results in two game rows. The `rematchCreatedRef` guard prevents double-creation on a single client, but two simultaneous clients can still race. Acceptable edge case for now.
- **`game_moves` table `move_number` is always 0** — full move history tracking deferred.
- **Play Again not shown on tournament/league games** — by design (not yet built). When tournaments are implemented, filter `!wonByForfeit && matchType === 'friendly'` in `OnlineGameView`.

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
| `src/hooks/useOnlineGame.ts` | Online game state — broadcast sync, RPS, Presence, disconnect, Play Again readiness |
| `src/hooks/useActiveGame.ts` | Active/forfeited game detection — re-queries on navigation |
| `src/lib/sounds.ts` | Web Audio API sound effects — `resumeAudio()` must be called on first user gesture |
| `src/lib/gameSerializer.ts` | `serializeGame` / `deserializeGame` + `SerializedState` type |
| `src/components/ResumeGameToast.tsx` | Resume + forfeit toast component |
| `src/components/game/OnlineGameView.tsx` | Online game UI — disconnect banner, forfeit modal, Play Again dots, audio |
| `src/components/game/RPSScreen.tsx` | RPS pick UI — no channel, no onResolved. State transitions handled by useOnlineGame |
| `src/components/GameWrapper.tsx` | Local/AI game UI — audio wired here |
| `src/App.tsx` | React Router v7. All routes. |
| `src/ai/aiPlayer.ts` | AI difficulty module (Phase 1) |
| `src/contexts/SkinContext.tsx` | Skin context (Phase 2) |
| `src/contexts/AuthContext.tsx` | Auth state |
| `src/lib/rps.ts` | RPS logic — pure functions |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap |
| `docs/plans/2026-03-19-testing-benchmarks.md` | Live testing checklist — run before merge |
| `docs/plans/2026-03-19-broadcast-sync-audio-rematch.md` | Implementation plan (completed) |
| `docs/plans/2026-03-19-disconnect-handling.md` | Disconnect handling implementation plan (completed) |

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
