# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. The RPS draw race condition fix is built and ready to deploy to private Vercel (not yet pushed).
>
> The fix moves `rpsResultPicks` capture into `useOnlineGame` using shadow refs so it happens synchronously inside event handlers — immune to the React 18 batching race. `rpsRound` as a `key` on RPSScreen ensures remount on each draw. No DB schema changes needed.
>
> Next step: push to private Vercel (`git push private HEAD:main --force` from the worktree), test the draw path on two browsers, then run the Section 6 regression checklist before merging to local main.
>
> Ready when you are."

---

## Current state

**Active worktree:**

| Worktree | Branch | Status |
| --- | --- | --- |
| `.worktrees/feat-disconnect-handling` | `feat/disconnect-handling` | RPS draw race fix committed — ready to push to private Vercel |

`feat/phase-2-skins` worktree has been removed. Its code is fully contained in `feat/disconnect-handling`.

**Private Vercel (testing):** `mega-ox-dev`
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy by running `git push private HEAD:main --force` from the `feat-disconnect-handling` worktree
— Deployment protection: **disabled** (for testing)
— Latest production: commit `d7c35b3` ("fix: Play Again broken when isCreator changed by RPS swap")
— Next deploy: RPS draw race fix (not yet pushed — run `git push private HEAD:main --force` from worktree)

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. Leave alone.

**Local `main` branch:** Still behind private `main` (pre-multiplayer). Do NOT push to `origin/main` without explicit instruction.

**Build status:** ✅ Clean build on worktree. Not yet deployed.

---

## Remaining work before merging local main

1. ~~**Fix RPS draw bug**~~ — **Done.** Fix committed on `feat/disconnect-handling`, clean build.
2. **Deploy to private Vercel** — `git push private HEAD:main --force` from the worktree, then test draw path on two browsers.
3. **Section 6 regression checklist** — `docs/plans/2026-03-19-testing-benchmarks.md`. Verifies non-multiplayer features weren't broken by broadcast sync changes.
4. **Merge to local main** — pull private/main into local main, then push to origin/main (user decides on public deploy).

---

## Bug to fix next session

### RPS draw — Browser 1 (creator) stuck on "Waiting for opponent"

**Symptom:** When both players pick the same option (draw), Browser 2 (joiner) correctly returns to the RPS pick screen. Browser 1 (creator) stays on the RPS pick screen but shows "Waiting for opponent..." with their previous pick displayed — never clearing to allow a fresh pick. Refreshing Browser 1 restores it to the pick screen correctly. The bug is intermittent — the second draw attempt in the same test session worked correctly both times.

**Root cause (likely):** A React state batching race on the creator's side. The creator writes the draw-clear to DB almost immediately after detecting both picks. The Realtime event for "picks cleared" can arrive back at Browser 1 very close to the "both picks in" event. If React 18 batches these two state updates together, `rpsCreatorPick` and `rpsJoinerPick` are already `null` by the time any render commits — so the snapshot that drives the result screen never gets captured, the result screen never shows, `RPSScreen` never unmounts, and the `waiting` / `myPick` state from the previous round persists.

**Files to look at first:**
- `src/hooks/useOnlineGame.ts` — RPS resolution logic, `rpsResolutionSentRef`, draw-clear path
- `src/components/game/OnlineGameView.tsx` — `resultPicks` snapshot logic, `handleRPSContinue`

**Note on Fix 14:** The previous fix addressed `handleRPSContinue` unconditionally setting `rpsResultShownRef=true` on draws. The current bug is distinct — it's about the result screen never showing at all on Browser 1, not about the continue logic after it shows.

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
