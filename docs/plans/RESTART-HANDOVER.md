# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Fix attempt 4 for the RPS draw bug is committed and deployed to private Vercel. Root cause is confirmed: the draw-clear CDC reaches the joiner before the creator's broadcast, wiping the joiner's own pick ref and preventing the result screen from showing. The fix guards null-clear updates in the `postgres_changes` handler with `rpsResultCapturedRef.current`.
>
> Start by testing the draw path on two browsers. If it passes, move to the Section 6 regression checklist before merging to local main.
>
> Ready when you are."

---

## Current state

**Active worktree:**

| Worktree | Branch | Status |
| --- | --- | --- |
| `.worktrees/feat-disconnect-handling` | `feat/disconnect-handling` | Fix attempt 4 deployed — draw path needs live testing |

`feat/phase-2-skins` worktree has been removed. Its code is fully contained in `feat/disconnect-handling`.

**Private Vercel (testing):** `mega-ox-dev`
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy by running `git push private HEAD:main --force` from the `feat-disconnect-handling` worktree
— Deployment protection: **disabled** (for testing)
— Latest production: fix attempt 4 commit (see `git log --oneline -1` in worktree)

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. Leave alone.

**Local `main` branch:** Still behind private `main` (pre-multiplayer). Do NOT push to `origin/main` without explicit instruction.

---

## Remaining work before merging local main

1. **Test RPS draw fix** — fix attempt 4 is deployed. Both players pick the same option. Confirm both browsers show the result screen, then both return to the pick screen cleanly. Repeat 3–5 times.
2. **Section 6 regression checklist** — `docs/plans/2026-03-19-testing-benchmarks.md`. Verifies non-multiplayer features weren't broken by broadcast sync changes.
3. **Merge to local main** — pull private/main into local main, then push to origin/main (user decides on public deploy).

---

## RPS draw bug — full history

### Symptom

When both players pick the same option (draw), one browser correctly shows the result screen and returns to the pick screen. The other browser stays frozen on "Waiting for opponent..." with the previous pick still displayed. It is not always the same browser. Refreshing restores it.

### Confirmed root cause (2026-03-23, session after fix 3)

Two delivery paths exist for RPS data:
- **`rps_pick` broadcast** — fast (~10–50ms, direct WebSocket)
- **`postgres_changes` CDC** — slower (~100–300ms, DB write → Supabase Realtime)

On a draw, the **creator's resolution effect** fires when both picks arrive in React *state* (via CDC). It then writes `rps_creator_pick = null, rps_joiner_pick = null` to the DB (the draw-clear). That null-clear CDC propagates to both clients.

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
- RPS — both browsers complete RPS and enter game ✅
- RPS — result screen shows on both browsers before game starts ✅
- RPS — win case: both browsers taken to loading screen then game ✅
- RPS — draw (second attempt): both browsers return to pick screen correctly ✅
- Join with code — creator navigates correctly ✅
- Play Again — both players → new RPS → new game ✅

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
| RPS sync | Done — Phase 2.5 (draw fix attempt 4 deployed, needs live test) |

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
| `src/hooks/useOnlineGame.ts` | Online game state — broadcast sync, RPS (inc. `submitRPSPick`, `postgres_changes` null-clear guard), Presence, disconnect, Play Again |
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
