# QA Report — Phase 3 Progression
**Date:** 2026-03-29
**Branch:** `feat/phase3-progression`
**QA Run by:** Automated QA Agent
**Status: ❌ NOT READY TO MERGE — 3 blocking bugs in edge function**

---

## Executive Summary

Phase 3 client code is well-structured and the progression math is correct. The build is clean and 13 Jest tests pass. The RPS/sync architecture is untouched and healthy. However, the `post-game-handler` edge function has 3 bugs that mean **every online game currently awards 0 XP and 0 Credits**, and **win/draw bonuses are never applied**. None of the 5 pending smoke tests from the handover checklist can pass until these are fixed.

---

## Smoke Test Results

| # | Test | Status | Blocker |
|---|------|--------|---------|
| 1 | Credits balance visible in nav | ✅ PASS | — |
| 2 | Level badge on leaderboard + profile | ✅ PASS | — |
| 3 | XP bar on own profile (hidden on others) | ✅ PASS | — |
| 4 | Achievements page renders | ✅ PASS | — |
| 5 | Post-game modal — online game | ❌ FAIL | BUG-001, BUG-002 |
| 6 | Level-up banner in modal | ❌ FAIL | BUG-001 (no XP awarded) |
| 7 | Achievement unlock in modal | ❌ FAIL | BUG-001 (no XP awarded) |
| 8 | Deferred reward processing on login | ❌ NOT TESTABLE | BUG-001 |
| 9 | Credits balance updates after game | ❌ FAIL | BUG-001 (0 credits awarded) |

**4 of 9 smoke tests pass. 5 fail or are untestable. Blocking merge.**

---

## Bug Reports

---

### BUG-001 — P0 BLOCKER: `game_moves` unpopulated → MIN_MOVES guard fires for every game → 0 XP / 0 Credits always awarded

**File:** `supabase/functions/post-game-handler/index.ts:83–102`
**Severity:** P0 — blocks the entire progression system

**Description:**
The edge function counts rows in `game_moves` before awarding rewards:

```typescript
const { count: moveCount } = await supabase
  .from('game_moves')
  .select('id', { count: 'exact', head: true })
  .eq('game_id', gameId)

if ((moveCount ?? 0) < MIN_MOVES) {   // MIN_MOVES = 5
  await supabase.from('games').update({ rewards_status: 'complete' }).eq('id', gameId)
  return new Response(JSON.stringify({
    xpAwarded: 0, creditsAwarded: 0, ...
  }), { status: 200 })
}
```

`game_moves` rows are **never written** by `useOnlineGame.ts`. The table schema exists but the write path is deferred (acknowledged in `CLAUDE.md` and the handover). So `moveCount` is always `null` → `(null ?? 0) = 0` → `0 < 5` → every game hits the early return.

**User-visible impact:**
PostGameModal appears but shows `+0 XP` and `+0 Credits`. `rewards_status` is set to `'complete'` so the game is considered processed and will not retry. All progression is silently blocked.

**Reproduction:**
1. Apply all 5 migrations, deploy edge function
2. Play an online game to completion
3. PostGameModal shows — observe `+0 XP`, `+0 Credits`
4. Check Supabase dashboard: `games.rewards_status = 'complete'`, `player_progression.xp` unchanged

**Fix options (owner decision required):**
- **Option A (recommended for now):** Set `MIN_MOVES = 0` in the edge function until `game_moves` writes are implemented. This removes the guard and lets all games earn rewards. Carries some abuse risk from immediately-abandoned games but the game requires a real opponent, limiting that surface.
- **Option B:** Wire `game_moves` writes into `placeMarker` in `useOnlineGame.ts`. More correct but larger scope.

---

### BUG-002 — P0 BLOCKER: `isWin` and `isDraw` always false — win/draw bonuses never awarded

**File:** `supabase/functions/post-game-handler/index.ts:108–122`
**Severity:** P0 — win and draw bonuses structurally broken

**Description:**
The edge function determines win/draw outcome like this:

```typescript
const isWin  = game.winner === userId   // userId is a UUID
const isDraw = game.winner === null
```

But the `games.winner` column stores `'X'`, `'O'`, or `'draw'` — confirmed by:

- `OnlineGameView.tsx`: `if (winner === 'draw') return "It's a draw!";`
- `OnlineGameView.tsx`: `if (winner === myMarker) return 'You Win!';` (myMarker = `'X'` or `'O'`)
- Forfeit handler: `winner: myMarker === 'X' ? 'O' : 'X'`

A UUID (e.g. `'a1b2c3d4-...'`) will never equal `'X'` or `'O'`, so:

- `isWin` → always `false` → win bonus (`+30 XP`, `+25 Credits`) never applied
- `isDraw` → always `false` (winner is `'draw'`, not `null`) → draw bonus (`+10 XP`, `+10 Credits`) never applied

Every completed game is treated as a loss. Only the base completion reward is ever granted.

**Reproduction:**
1. Fix BUG-001 first (otherwise 0 XP regardless)
2. Play an online game and win
3. PostGameModal shows base XP only — no win bonus
4. Check `reward_config`: `xp_win_bonus` should be 30; confirm it's missing from awarded amount

**Fix:**
The edge function must derive `isWin` from player IDs and the winner marker, not from a UUID comparison:

```typescript
// Winner marker → player UUID
const winnerUserId =
  game.winner === 'X' ? game.player_x_id :
  game.winner === 'O' ? game.player_o_id :
  null

const isWin  = winnerUserId === userId
const isDraw = game.winner === 'draw' || game.winner === null
```

---

### BUG-003 — P1 HIGH: CORS headers missing on 3 response paths

**File:** `supabase/functions/post-game-handler/index.ts:97–102, 274–295, 312`
**Severity:** P1 — browser client may receive opaque responses; `callPostGameHandler` returns `null`

**Description:**
All early-exit error responses (401, 402, 403, 404, 400, 422, 202) correctly include `corsHeaders`. But 3 response paths are missing them:

| Path | Line | Missing |
|------|------|---------|
| MIN_MOVES early return (0 XP) | 97–102 | `corsHeaders` entirely absent |
| Happy-path success response | 274–295 | Only `'Content-Type'` present; no `corsHeaders` |
| Internal error (catch block) | 312 | No headers at all |

Without `Access-Control-Allow-Origin`, the browser blocks the JS from reading the response body. `supabase.functions.invoke()` would return `res.error` as non-null, causing `callPostGameHandler` to log an error and return `null`. No modal would appear.

**Note:** Supabase's CDN relay *may* inject CORS headers — this is not guaranteed and not documented for this case. Should not be relied upon.

**Reproduction:**
1. Fix BUG-001 and BUG-002
2. Play a game to completion (happy path)
3. Open browser devtools → Network tab → `post-game-handler` request
4. Inspect response headers — `Access-Control-Allow-Origin` absent
5. Console shows `post-game-handler error:` log from `callPostGameHandler`

**Fix:**
Merge `corsHeaders` into all three responses:

```typescript
// Line 97-102 (MIN_MOVES return):
return new Response(JSON.stringify({...}), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})

// Line 274-295 (success):
return new Response(JSON.stringify({...}), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})

// Line 312 (error):
return new Response('Internal error', {
  status: 500,
  headers: corsHeaders
})
```

---

### BUG-004 — P2 MEDIUM: `leaderboard` view TypeScript types missing `level` column

**File:** `src/lib/database.types.ts` — `Views.leaderboard.Row`
**Severity:** P2 — TypeScript safety gap; no runtime failure expected

**Description:**
Migration `20260328000005_leaderboard_add_level.sql` adds `profiles.level` to the leaderboard view. `database.types.ts` was partially updated for Phase 3 (all 4 new tables are present) but the leaderboard view Row type still reflects the pre-migration shape — no `level` field.

`LeaderboardPage.tsx` queries `level` directly from the view (`leaderboard` query with `level`). TypeScript will not catch a wrong column name because the type says `level` doesn't exist — the query is untyped with respect to that column.

**Fix:** After applying migration 000005, regenerate types:
```bash
npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
```
Or manually add `level: number | null` to the leaderboard view Row.

---

## Areas Confirmed Working ✅

### RPS architecture — untouched, intact
`useOnlineGame.ts` was not modified in any Phase 3 commit (absent from the 19-commit log). All critical patterns verified present in the current source:
- `capturedThisRound` closure flag (prevents re-processing on interval fire after capture) ✅
- Creator 2s delay before resolving picks ✅
- `rpsRound` increment on draw → `RPSScreen` remount via `key={rpsRound}` ✅
- `advanceStatus()` monotonic guard ✅
- `dismissRPSResult(wasDraw)` → `fetchGameState()` on non-draw ✅
- DB polling 1s interval ✅

### `processMissedRewards` in AuthContext
- Correctly queries `status='complete'` + `(rewards_status='pending' OR processing+stale)` + `retry_count < 3`
- Chained `.or()` calls generate correct AND conditions in PostgREST ✅
- Silent failure per game — failed retry doesn't block other retries ✅
- **Caveat:** Currently all missed games will re-run and again award 0 XP (BUG-001). Once fixed, this flow is correct.

### Progression math (`src/lib/progression.ts` + tests)
- XP curve `Math.round(100 * level^1.5)` is consistent between client and edge function ✅
- 10 progression tests all passing ✅
- `MAX_LEVEL = 250` consistent between both files ✅

### `PostGameModal` guard (`postGameCalledRef`)
- Edge function called exactly once per game (`postGameCalledRef.current`) ✅
- Properly reset on `gameId` change (Play Again scenario) ✅
- `alreadyProcessed` flag correctly suppresses modal on deferred retry ✅

### Client-side build
- TypeScript: clean (per handover) ✅
- 13 Jest tests passing (per handover) ✅
- All Phase 3 routes wired: `/achievements` behind `ProtectedRoute` ✅

---

## Prerequisites Not Yet Verified (require live environment)

These require the Supabase project to have migrations applied and edge function deployed:

- [ ] `player_progression` row auto-created on signup (migration 000003 trigger)
- [ ] `increment_credits` RPC atomic upsert behaviour
- [ ] `rps_picks` table accessible (not in database.types.ts — was it in a prior migration?)
- [ ] Edge function CORS behaviour via Supabase relay (BUG-003 may be mitigated)

---

## Merge Recommendation

**HOLD. Do not merge `feat/phase3-progression` → `main` until:**

1. **BUG-001 resolved** — Set `MIN_MOVES = 0` (recommended) or wire `game_moves` writes
2. **BUG-002 resolved** — Fix `isWin`/`isDraw` to derive from player IDs and winner marker
3. **BUG-003 resolved** — Add `corsHeaders` to all 3 missing response paths
4. **Re-run smoke tests 5–9** with fixes deployed

BUG-004 is post-merge acceptable — can be resolved in the same session as type regeneration after migrations are applied.
