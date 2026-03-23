# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. The RPS draw bug is still unresolved after two fix attempts. The root cause is now well understood — see the bug section below. The next session needs to implement the identified fix: update `submitRPSPick` to write `rpsCreatorPickRef`/`rpsJoinerPickRef` synchronously before the `await`, then call `captureRPSResultIfReady` after. Do NOT attempt other approaches first — read the diagnosis in full before writing any code.
>
> Ready when you are."

---

## Current state

**Active worktree:**

| Worktree | Branch | Status |
| --- | --- | --- |
| `.worktrees/feat-disconnect-handling` | `feat/disconnect-handling` | RPS draw bug still live — latest commit `bd66143`, deployed but insufficient |

`feat/phase-2-skins` worktree has been removed. Its code is fully contained in `feat/disconnect-handling`.

**Private Vercel (testing):** `mega-ox-dev`
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy by running `git push private HEAD:main --force` from the `feat-disconnect-handling` worktree
— Deployment protection: **disabled** (for testing)
— Latest production: commit `bd66143` ("fix: RPS draw race condition — capture result synchronously before React batch")
— Build: ✅ Clean. Deployed to private Vercel. Draw bug still reproduces — fix insufficient.

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. Leave alone.

**Local `main` branch:** Still behind private `main` (pre-multiplayer). Do NOT push to `origin/main` without explicit instruction.

---

## Remaining work before merging local main

1. **Fix RPS draw bug** — two attempts made, still failing. See bug section below for exact fix needed.
2. **Deploy to private Vercel** — after fix: `git push private HEAD:main --force` from the worktree, test draw path.
3. **Section 6 regression checklist** — `docs/plans/2026-03-19-testing-benchmarks.md`. Verifies non-multiplayer features weren't broken by broadcast sync changes.
4. **Merge to local main** — pull private/main into local main, then push to origin/main (user decides on public deploy).

---

## Bug to fix next session

### RPS draw — one browser stuck on "Waiting for opponent"

**Symptom:** When both players pick the same option (draw), one browser correctly shows the result screen then returns to the pick screen. The other browser stays frozen on "Waiting for opponent..." with the previous pick still displayed. Refreshing that browser restores it. It is not always the same browser — the creator was stuck in earlier testing; in the session on 2026-03-23 the joiner was stuck while the creator recovered.

---

### Fix attempts and why they failed

**Fix attempt 1 (pre-session fix, ~commit 4861d8d):**
- Addressed `handleRPSContinue` unconditionally setting `rpsResultShownRef=true` on draws, which prevented the re-pick screen from showing after the result screen dismissed.
- Did not fix the core issue: the result screen was not showing at all on one browser.

**Fix attempt 2 (commit bd66143, session 2026-03-23):**
- Added `rpsCreatorPickRef` and `rpsJoinerPickRef` shadow refs in `useOnlineGame`.
- Called `captureRPSResultIfReady()` inside `postgres_changes` and `rps_pick` broadcast handlers to capture `rpsResultPicks` synchronously before React renders.
- Added `rpsRound` counter as `key` on `RPSScreen` to force remount on each draw.
- Removed `prevHadBothPicksRef` edge-detection from `OnlineGameView`.
- **Why it still fails:** `submitRPSPick` does NOT update `rpsCreatorPickRef` or `rpsJoinerPickRef`. A player's own pick ref stays `null` until `postgres_changes` echoes back from DB (which can be 100–300ms). If the opponent's pick arrives via broadcast (which is faster than CDC) during that window, `captureRPSResultIfReady(null, opponentPick)` is called — one pick is null so nothing is captured. The window closes when the player's own `postgres_changes` eventually arrives, but by then the draw-clear `postgres_changes` may arrive in the same batch — reproducing the original race at the ref level instead of the state level.

---

### Identified fix for next session

**One change in `src/hooks/useOnlineGame.ts`, in `submitRPSPick`:**

Update the player's own ref **synchronously before the `await`**, then call `captureRPSResultIfReady` **after the DB write succeeds**. This closes the window entirely — the player's own pick is visible to `captureRPSResultIfReady` from the moment they submit, regardless of when `postgres_changes` arrives.

```ts
const submitRPSPick = useCallback(async (pick: RPSPick): Promise<boolean> => {
  if (!user || !gameId) return false;
  const column = isCreator ? 'rps_creator_pick' : 'rps_joiner_pick';

  // Update ref immediately — closes the window where captureRPSResultIfReady
  // would be called with our own pick still null (before postgres_changes echo)
  if (isCreator) rpsCreatorPickRef.current = pick;
  else rpsJoinerPickRef.current = pick;

  const { error } = await supabase.from('games').update({ [column]: pick }).eq('id', gameId);
  if (error) {
    // Revert ref on failure
    if (isCreator) rpsCreatorPickRef.current = null;
    else rpsJoinerPickRef.current = null;
    return false;
  }

  channelRef.current?.send({
    type: 'broadcast',
    event: 'rps_pick',
    payload: { column, pick },
  });

  // If opponent already picked (ref set by an earlier event), capture result now
  captureRPSResultIfReady(rpsCreatorPickRef.current, rpsJoinerPickRef.current);

  return true;
}, [user, gameId, isCreator, captureRPSResultIfReady]);
```

Add `captureRPSResultIfReady` to the `submitRPSPick` dependency array. Since `captureRPSResultIfReady` has `[]` deps it is a stable reference — no performance concern.

**Why this is sufficient:** After this change, `rpsCreatorPickRef` and `rpsJoinerPickRef` are always set the moment a player submits, before any async operations. Every subsequent call to `captureRPSResultIfReady` (from broadcast, `postgres_changes`, or the pick submission itself) will see both picks as soon as the second one arrives. No CDC timing or React batching can prevent capture.

**Files to change:**
- `src/hooks/useOnlineGame.ts` — `submitRPSPick` only (one function, ~10 lines)

**Do not change `OnlineGameView.tsx` or anything else** — the rest of the fix from bd66143 is correct.

---

## Deferred (not urgent)

- **Forfeit toast text** — always reads "You were forfeited from your last game after the reconnection window expired." regardless of whether the forfeit was intentional or due to disconnect. To fix properly: add a `forfeit_reason` column (`'voluntary'` | `'disconnect'`) to the `games` table, set it at the point of forfeit, read it in `useActiveGame`, and branch the toast text. Deferred — low user impact.

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
| RPS sync | Done — Phase 2.5 (draw intermittent bug remaining) |

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
| `src/hooks/useOnlineGame.ts` | Online game state — broadcast sync, RPS (inc. `submitRPSPick`), Presence, disconnect, Play Again |
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
