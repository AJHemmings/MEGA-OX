# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. Phase 2.5 is complete and merged into local `main`. The latest deployed commit is `d4b94b5` on private Vercel (`mega-ox-dev`).
>
> Play Again is working on two browsers locally — full two-device live test still pending.
>
> **Phase 3 design is complete.** The full spec is at `docs/superpowers/specs/2026-03-28-phase3-progression-design.md`. Read it before we write the implementation plan."

---

## Phase 3 design — completed 2026-03-28

**Design doc:** `docs/superpowers/specs/2026-03-28-phase3-progression-design.md`

All clarifying questions answered. Key decisions:

| Question | Decision |
|---|---|
| Currency name | Credits |
| XP visibility | Private (profile only) |
| Level visibility | Public (shown to other players) |
| Level-up experience | Modal with full rewards summary |
| Achievements reset | Permanent — never reset on same account |
| Achievement trigger | Supabase edge function (security priority) |
| Level cap | 250 (MAX_LEVEL constant, extensible) |
| Shop / credits access | Persistent nav header + main menu + profile |
| Award values | Stored in `reward_config` table — admin-tunable, no code deploy |

**Next step:** invoke the `writing-plans` skill to create the Phase 3 implementation plan.

---

## Current state

All multiplayer work is now on local `main`. No active worktrees.

**Private Vercel (`mega-ox-dev`):** Testing environment
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy: `git push private main` from project root
— Deployment protection: **disabled** (for testing)
— Latest production: commit `d4b94b5` (Fix 12 — chained rematch stale ref)

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. Leave alone. Do NOT push to `origin/main` without explicit instruction.

---

## What needs live testing before Phase 3 is fully closed

1. **Play Again (Fix 11a)** — working on two browsers locally against the deployed build. Full two-device test (separate real devices) still pending. Use `docs/plans/2026-03-19-testing-benchmarks.md` Section 6 as the checklist.

RPS draw ✅ confirmed working 2026-03-28. This is not blocking Phase 3.

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
- Join with code — creator navigates correctly ✅
- RPS draw — result screen → both return to pick screen ✅ (confirmed working, 2026-03-28)
- Play Again — URL cycling fixed (Fix 11a), chained rematch fixed (Fix 12) ⚠️ (working on two browsers locally against deployed build — full two-device live test pending)

---

## Fix history

### Fix 12 — Chained rematch stale ref poisoning (commit `d4b94b5`, 2026-03-27)

**Bug:** On third+ chained rematch, `rematchGameId` state carried a stale value from the previous game into the new mount. `rematchNavFiredRef` had been reset to `false`, so the navigation effect saw a non-null `rematchGameId` and immediately navigated — without waiting for the new rematch. Players ended up on the wrong game.

**Fix:** Clear `rematchGameId` in the main `useEffect` reset block (alongside the intent resets from Fix 11), before any new rematch creation can set it.

---

### Fix 11 — URL cycling + Resume Game toast (commit `b39944c`, 2026-03-25)

**Bug A — URL cycling / both players stuck on different RPS games:**
`myRematchIntent` and `opponentRematchIntent` are `useState` — they survive a `gameId` change because React Router reuses the `OnlineGameView` component instance. Both carried stale `'play_again'` values into the new game. `rematchCreatedRef` had just been reset to `false` and `myMarker` was still the old value before `fetchGameState` returned. The creation effect saw both intents set, `myMarker === 'X'`, `rematchCreatedRef === false` — and created another game. This cascaded: each new game mount repeated the pattern. Players ended up on different IDs, each one's RPS polling watched a different row, neither saw both picks.

**Fix:** Reset both intents to `null` in the main `useEffect` (alongside the existing `rematchCreatedRef` reset):
```ts
setMyRematchIntent(null);
setOpponentRematchIntent(null);
```

**Bug B — Resume Game toast always visible / clicking did nothing:**
`ResumeGameToast` renders inside `ProtectedRoute` as a sibling of `<Outlet />`, outside the `/game/:id` route context. `useParams()` returned `{}`. `isOnActiveGame` was always `false` — toast appeared on every page including the game the user was already on.

**Fix:** Replace `params.id === activeGameId` with `location.pathname === /game/${activeGameId}`. `useLocation()` works at any tree level.

---

### Fix 10 — database.types.ts missing rematch columns (commit `3abdfa0`, 2026-03-25)

**Problem:** Fix 9 migration added `rematch_x_intent` and `rematch_o_intent` to `games`. `database.types.ts` was never regenerated → build failed with `TS2339`.

**Fix:** Manually added `rematch_x_intent: string | null` and `rematch_o_intent: string | null` to `Row`, `Insert`, and `Update` in the `games` table definition.

---

### Fix 9 — Play Again (commit `89fe317`, 2026-03-24)

**Bug A — RLS blocked the INSERT:**
The games INSERT policy required `auth.uid() = player_x_id`. Rematch swaps who goes first — the creating player inserts a row with `player_x_id = opponentId`. `auth.uid() ≠ player_x_id` → 403.

**Fix:** Policy updated to `auth.uid() = player_x_id OR auth.uid() = player_o_id` (migration `20260324000001`).

**Bug B — Intent not delivered due to degraded WebSocket:**
The losing browser had a degraded WebSocket (`Realtime send() is automatically falling back to REST API`). Supabase's broadcast REST fallback doesn't reliably fan out to WebSocket subscribers — one player's intent never arrived.

**Fix:** Write intent to `rematch_x_intent` / `rematch_o_intent` columns on the games row (migration `20260324000002`). `postgres_changes` delivers it via CDC — more reliable than broadcast. Broadcast and presence kept as fast paths.

---

### Fix 8a — Game-start bug (commit `2a3c3d7`)

**Problem:** After RPS win, joiner's `status` stayed `'rps'` forever. `dismissRPSResult(false)` cleared `rpsResultPicks` but never transitioned status. Board was visible but no cells were clickable.

**Fix:** Moved `dismissRPSResult` to after `fetchGameState`, then added:
```ts
} else {
  fetchGameState(); // transitions joiner from 'rps' → 'active'
}
```

### Fix 8b — Game state polling (commits `5a95079`, `acd9eb7`)

**Problem:** After RPS→active transition, O's moves weren't reaching X. Broadcast/CDC is WebSocket-dependent and unreliable around status transitions.

**Fix:** Added independent game state polling — mirrors the `rps_picks` polling pattern from Fix 7. Runs every 1.5s while `status === 'active'`. Uses strict `>` to avoid overwriting a locally-placed move not yet in DB.

```
RPS architecture:  polls rps_picks  (status === 'rps')   ← Fix 7, unchanged
Game architecture: polls games      (status === 'active') ← Fix 8b, independent
```

---

### Fix 7 — RPS architectural redesign (commit `95d8a7f`, 2026-03-24)

Fixes 1–6 all failed. The event-based RPS system (broadcast + CDC refs) was scrapped entirely. 226 lines removed, 75 added.

**Root cause of Fixes 1–6 failures:**
On a draw, the creator's resolution effect fires when both picks arrive in React state (via CDC). It writes `rps_creator_pick = null, rps_joiner_pick = null` to the DB (draw-clear). That null-clear CDC propagates to both clients. The race: the null-clear CDC can reach the joiner before the creator's `rps_pick` broadcast does. The `postgres_changes` handler overwrote `rpsJoinerPickRef` to null — including the joiner's own pick. When the creator's broadcast finally arrived, `captureRPSResultIfReady(creatorPick, null)` silently failed. Creator captured + showed result. Joiner stayed stuck on "Waiting for opponent...".

**New architecture:**
- `rps_picks` table: `(game_id UUID, user_id UUID, pick TEXT, PRIMARY KEY(game_id, user_id))`
- Both players upsert their pick — no broadcast, no WebSocket dependency
- Both clients poll every 1s: when 2 rows appear, each resolves independently
- Creator waits 2s, then: draw → delete picks → `rpsRound++` → new round; win → update game row + delete picks → joiner's `fetchGameState` syncs

**Failed approaches (Fixes 1–6, commits 4861d8d through a7eca80):**
All attempted to patch the event-based system. Approaches tried: reordering handlers, debouncing, additional broadcast channels, guarding null overwrites, adding resolution flags. All failed — the race between broadcast delivery, CDC delivery, and draw-clear nulls is non-deterministic.

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area | Status |
|-------|------|--------|
| 0 | Infrastructure and cost planning | Brief written (`docs/plans/phase-0-infrastructure-brief.md`) |
| 1 | AI improvement (Easy / Medium / Hard) | **Complete** |
| 2 | Skin system code refactor | **Complete** |
| 2.5 | Disconnect handling + broadcast sync + audio + Play Again | **Complete** |
| 3 | Player progression + achievements + virtual currency | Not started — next |
| 4 | Profile customisation + emoji communication | Not started |
| 5 | Visual redesign | Not started |
| 6 | Cash shop | Not started |
| 7 | Admin dashboard | Not started |
| 8 | Bug report system | Not started |

---

## What is built and working

| Feature | Status |
|---------|--------|
| Guest landing page (`/`) | Done |
| Demo game (`/demo`) | Done |
| Auth flow | Done |
| Main menu (`/menu`) | Done |
| Tutorial — Beginner + Intermediate | Done |
| Single player vs AI (Easy / Medium / Hard) | Done — Phase 1 |
| Local 2-player | Done |
| Network multiplayer — core | Done |
| Skin system scaffolding | Done — Phase 2 |
| User profiles, leaderboard, stat tracking | Done |
| Disconnect handling | Done — Phase 2.5 |
| Broadcast move sync | Done — Phase 2.5 |
| Audio notifications | Done — Phase 2.5 |
| Play Again (readiness dots) | Done — Phase 2.5 |
| RPS sync | Done — Fix 7 + 8 |
| Play Again reliability | Done — Fixes 9–12 |

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
- **Forfeit toast text** — always reads "You were forfeited from your last game after the reconnection window expired." regardless of whether forfeit was intentional. Fix: add `forfeit_reason` column (`'voluntary'` | `'disconnect'`), set at forfeit, branch toast text. Low user impact.
- **Stale `games` rows** — play-again chains can leave `status='active'` or `status='rps'` rows without a clean `status='complete'` write. `useActiveGame` may surface these as false resume prompts. Long-term fix: add `completed_at` column and filter on it.

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
|------|---------|
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
| `docs/plans/2026-03-19-testing-benchmarks.md` | Live testing checklist — run before Phase 3 |

---

## Credentials

`.env.local` is gitignored. It contains:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect)
- Vercel MCP
- GitHub MCP

---

## ⚠️ Incidents / lessons

**rm -rf incident:** Claude used `rm -rf` on directories in the main project, deleting tracked files. All restored via `git restore`. **Never use `rm -rf` on directories. Delete files individually by name.**

**Kill by PID, not taskkill /F /IM node.exe:** When stopping the dev server, kill by PID (`taskkill //F //PID <pid>`) rather than killing all node processes.

**Deploy by push, not Vercel CLI:** Vercel CLI is not available in the shell. Deploy by pushing to `AJHemmings/MEGA-OX-private` — `git push private main` from project root.
