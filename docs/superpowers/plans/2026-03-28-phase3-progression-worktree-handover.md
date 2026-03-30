# Phase 3 Worktree Handover

**Date:** 2026-03-28
**Branch:** `feat/phase3-progression`
**Worktree:** `.worktrees/feat-phase3-progression`
**Build status:** Clean — no TS errors, 13 Jest tests passing
**Edge function:** v5 deployed (2026-03-30) — per-player rewards fix + modal gate

---

## Session start prompt

Read this file in full, then say:

> "I've read the Phase 3 handover. The edge function 401 is fixed and the modal fires. One known UX bug remains: the Play Again / Back to Menu buttons appear before the PostGameModal, so the next task is to gate those buttons behind the modal's Continue action."

---

## What was built (19 commits)

### Database migrations (apply in this order)

| File                                                           | What it does                                                                                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase/migrations/20260328000001_phase3_schema.sql`         | Creates `player_progression`, `achievements`, `player_achievements`, `reward_config`; adds `rewards_status`/`rewards_retry_count` to `games`; adds `level` to `profiles` |
| `supabase/migrations/20260328000002_phase3_seed.sql`           | Seeds 7 reward_config values + 12 achievement rows                                                                                                                       |
| `supabase/migrations/20260328000003_phase3_triggers.sql`       | Extends existing `handle_new_profile` trigger to auto-create `player_progression` row on signup                                                                          |
| `supabase/migrations/20260328000004_phase3_rpc.sql`            | `increment_credits(p_user_id, p_amount)` — atomic UPSERT into `currency_balance`                                                                                         |
| `supabase/migrations/20260328000005_leaderboard_add_level.sql` | Recreates the `leaderboard` view to include `profiles.level`                                                                                                             |

**Apply via Supabase dashboard → SQL editor, in order 000001 → 000005.**

### Edge function

| File                                            | What it does                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/post-game-handler/index.ts` | Validates game completion, awards XP + credits, runs two-pass achievement check, handles idempotency and retries |

**Deploy:** `npx supabase functions deploy post-game-handler`
— or upload via Supabase dashboard → Edge Functions → New Function

### New client code

| File                                               | Purpose                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----- |
| `src/lib/progression.ts`                           | Pure XP curve helpers (`xpForLevel`, `cumulativeXPToLevel`, `levelFromXP`, `xpToNextLevel`, `MAX_LEVEL=250`) |
| `src/hooks/useProgression.ts`                      | Fetches player_progression + currency_balance; exposes `refresh()` for post-game re-fetch                    |
| `src/hooks/useAchievements.ts`                     | Fetches all achievements + user's unlocked set, merges into a list                                           |
| `src/lib/postGame.ts`                              | `callPostGameHandler(gameId)` — calls edge function, returns `PostGameResult                                 | null` |
| `src/components/layout/CreditsBalance.tsx`         | Credits display in nav (💳 balance)                                                                          |
| `src/components/progression/LevelBadge.tsx`        | Small level number badge shown next to usernames                                                             |
| `src/components/progression/XPProgressBar.tsx`     | XP bar with level text + countdown to next level                                                             |
| `src/components/progression/PostGameModal.tsx`     | Post-game reward summary (XP, credits, level-up, achievements)                                               |
| `src/components/achievements/AchievementsPage.tsx` | `/achievements` route — unlocked/locked sections                                                             |

### Modified files

| File                                             | Change                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `src/lib/database.types.ts`                      | Added types for all 4 new tables; `rewards_status`/`rewards_retry_count` on `games`; `level` on `profiles` |
| `src/contexts/AuthContext.tsx`                   | `processMissedRewards()` on login — silently retries any `pending`/stuck-`processing` games                |
| `src/components/game/OnlineGameView.tsx`         | Calls `callPostGameHandler` when `status === 'complete'`; shows `PostGameModal`; resets on new `gameId`    |
| `src/components/GameWrapper.tsx`                 | TODO comment only — AI/local games have no `games` row yet, so handler can't fire                          |
| `src/components/MainMenu.tsx`                    | `<CreditsBalance />` added to nav header                                                                   |
| `src/components/profile/ProfilePage.tsx`         | `<XPProgressBar>` (own profile only), `<LevelBadge>`, link to `/achievements`                              |
| `src/components/leaderboard/LeaderboardPage.tsx` | `<LevelBadge>` next to usernames; `level` added to query                                                   |
| `src/App.tsx`                                    | `/achievements` route added inside `ProtectedRoute`                                                        |

---

## What is NOT in Phase 3

- Shop UI and purchase flow (Phase 6)
- Admin page for managing `achievements` and `reward_config` (Phase 7)
- Post-game rewards for AI/local games (GameWrapper has no `games` row — Phase 6 or later)
- Skin unlocks for `reach_level_50` / `reach_level_100` achievements (`reward_skin_id` is null until Phase 5)
- Full profile visual redesign (Phase 5)

---

## Manual testing checklist (before merging)

**Prerequisites:**

- [✅] All 5 migrations applied to Supabase (confirmed via MCP — all Phase 3 tables exist)
- [✅] Edge function deployed — v5 (2026-03-30), `verify_jwt: false`
- [ ] `npm start` in worktree shows no console errors

**Smoke tests:**

- [✅] **Credits balance visible** — log in, check main menu top-right shows 💳 balance
- [✅] **Level badge** — visible on leaderboard and profile pages
- [✅] **XP bar on own profile** — visible when viewing your own profile, hidden on other profiles
- [✅] **Achievements page** — navigate to `/achievements`, locked and unlocked sections render
- [ ] **Post-game modal fires with correct XP/credits** — after a game, buttons show "Loading rewards…" first, then modal appears with non-zero XP and credits *(modal gate and rewards bug both fixed — retest from scratch)*
- [ ] **Both players see the modal** — test with two accounts; both should get their own XP/credits modal, not just the first player
- [❌] **Level-up** — set `xp_game_complete` to a high value in `reward_config` via Supabase dashboard; play a game; modal shows level-up banner
- [❌] **Achievement unlock** — set `player_stats.wins = 9` in dashboard; win one game; modal shows `first_win` and `win_10_games` achievements
- [❌] **Deferred processing** — set a completed game's `player_x_rewards_status = 'pending'` in dashboard (or `player_o_rewards_status`); log out and back in; verify it becomes `'complete'` silently (no modal)
- [❌] **Credits balance updates** — after a game, credits balance in nav reflects new amount

---

## Next task — full smoke test pass

Both the modal gate and the rewards bug are fixed (2026-03-30, commit `6f68263`). Run the full smoke test checklist above with two accounts. If all boxes are ticked, merge to main.

---

## Session fixes (2026-03-30) — modal gate + per-player rewards

### Bug 1: Play Again / Back to Menu buttons appeared before PostGameModal

**Symptom:** Buttons appeared immediately on `status === 'complete'`. Modal arrived 2–3 seconds later. Players could click Play Again before seeing rewards.

**Root cause:** The non-forfeit button block rendered unconditionally inside `{status === 'complete' && (...)}`. `callPostGameHandler` is async but nothing gated visibility on its completion.

**What was tried / why it would have failed:** The previous handover suggested a `postGameDismissed` boolean gated on `postGameCalledRef`. Problem: `postGameCalledRef` is set to `true` before the async call, but if the call returns `null` (network error or non-participant), `postGameDismissed` would never be set to `true` — buttons would be hidden forever.

**Fix that worked:** Added `postGameLoading` state. Set `true` before the call, `false` in `.then()` unconditionally (success or null). While `postGameLoading` is true, render "Loading rewards…" placeholder instead of buttons. When loading resolves to `null` (no result), buttons appear immediately. When it resolves to a result, modal shows; buttons appear after Continue clears the result. Reset in the `gameId` reset effect for Play Again chains. Forfeit path (`wonByForfeit === true`) renders immediately — unaffected.

**Files changed:** `src/components/game/OnlineGameView.tsx`

---

### Bug 2: No XP or credits awarded — neither player saw rewards in the modal or profile

**Symptom:** Modal fired but showed `+0 XP` / `+0 Credits` (or only Player X ever saw the modal). Profile progression never updated after a game.

**Root cause (schema vs code mismatch):**

The Phase 3 schema migration (`20260328000001_phase3_schema.sql`) added **per-player** reward status columns to `games`:
- `player_x_rewards_status`, `player_x_rewards_retry_count`
- `player_o_rewards_status`, `player_o_rewards_retry_count`

The migration even has an inline comment explaining exactly why a shared column blocks the second player. But the edge function, `AuthContext.processMissedRewards`, and `database.types.ts` were all never updated — they still referenced the old shared `rewards_status` / `rewards_retry_count` columns.

**What this caused:**
- The `rewards_status` column still exists in the DB (pre-Phase-3), so the edge function didn't crash
- Player X calls the edge function → processes rewards → sets `rewards_status = 'complete'`
- Player O calls it → hits `game.rewards_status === 'complete'` → returns `{ alreadyProcessed: true }` → client guard blocks the modal → Player O gets no XP, no credits, no modal
- `processMissedRewards` in AuthContext also queried `rewards_status` — so Player O's missed rewards were never retried on login either

**Approaches tried and failed:** N/A — this was diagnosed directly from the schema migration comment and code audit.

**Fix that worked:**
1. **Edge function** — `myMarker` determination moved before status guards; all `game.rewards_status` / `game.rewards_retry_count` references replaced with the correct `player_x_*` or `player_o_*` column via `statusCol`/`retryCol` variables. Catch block updated to re-fetch and write the correct column.
2. **AuthContext** — `processMissedRewards` now runs two parallel queries (once filtering by `player_x_id` + `player_x_rewards_status`, once by `player_o_id` + `player_o_rewards_status`).
3. **database.types.ts** — per-player columns added to games `Row`, `Insert`, and `Update` types.

**Edge function redeployed as v5** (2026-03-30) — the client-side changes deploy when the branch merges to main.

**Commit:** `6f68263`

---

## Session fixes (2026-03-30) — edge function 401

### What failed

**Root cause:** The edge function was deployed with `verify_jwt: true` (Supabase default). Supabase's infrastructure validates the JWT before the function code runs. `callPostGameHandler` was manually extracting `session.access_token` from `supabase.auth.getSession()` and passing it as a static `Authorization` header. `getSession()` reads from cache and can return an already-expired token. An expired token hits the `verify_jwt` gate and gets rejected in ~58ms — the function code never ran.

Evidence: all 401s in Supabase edge function logs had execution times of 22–70ms (infrastructure-level rejection). No 200s in the entire log history.

The original edge function auth code also used `SUPABASE_SERVICE_ROLE_KEY` to create the client and then called `supabase.auth.getUser(token)`. This is not the Supabase-recommended pattern for user token verification and is a secondary source of 401s once the infrastructure gate is bypassed.

### What was confirmed working

Migrations were already applied (confirmed via Supabase MCP — all Phase 3 tables present, `game_moves` table had 209 rows so move writes were working fine). The `MIN_MOVES = 5` anti-abuse check was not the problem.

### Fix applied

**`src/lib/postGame.ts`** — Removed the manual `Authorization` header from `supabase.functions.invoke`. The Supabase client now manages auth automatically (with token refresh). The `session` null-guard is kept as a fast-fail.

**`supabase/functions/post-game-handler/index.ts`** — Switched to Supabase's recommended auth pattern:
- User verification: `createClient(url, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })` then `getUser()` with no argument
- DB operations: separate `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` admin client

**Deployed** as v4 with `verify_jwt: false` — the function validates its own tokens, no double-gate needed.

---

## Known issues / notes

- **AI/local game rewards:** GameWrapper has a TODO comment. AI games have no `games` row in Supabase, so `callPostGameHandler` cannot fire for them. Post-game rewards only work for online multiplayer games in Phase 3.
- **`match_type` for Hard AI:** The `HARD_AI_MATCH_TYPE = 'ai_hard'` constant in the edge function is a placeholder. Until AI games create a `games` row, this is never evaluated. Set the correct value when wiring AI game persistence.
- **`game_moves` anti-abuse check:** Confirmed working — `game_moves` rows ARE being written for online games (209 rows in table). `MIN_MOVES = 5` will always pass for any real completed game (minimum moves to win Mega OX is ~17 total). Not an issue.

---

## After testing is complete

1. Merge to main: `cd F:/Projects/MEGA-OX && git merge .worktrees/feat-phase3-progression/.. ` — actually:
   ```bash
   git checkout main
   git merge feat/phase3-progression
   git worktree remove .worktrees/feat-phase3-progression
   git branch -d feat/phase3-progression
   ```
2. Push to private Vercel: `git push private main`
3. Update `docs/plans/RESTART-HANDOVER.md` — Phase 3 complete

---

## Commit log (19 commits)

```
ec23bb6 chore: remove unused levelFromXP import
749020a fix: progression refresh after reward, upsert currency_balance in RPC
d2b7c7c feat: AchievementsPage and /achievements route
a81e09a feat: deferred post-game reward processing on login
e48c8cb feat: post-game rewards in GameWrapper (TODO: needs games row for AI games)
11b6177 feat: post-game rewards in OnlineGameView
63ba2bf feat: callPostGameHandler helper
aebc5b4 feat: PostGameModal component
7bf6098 feat: XPProgressBar on profile
6cf11ef feat: LevelBadge component with username integrations
cf050ec feat: CreditsBalance component in nav
241f3cd feat: useAchievements hook
8c5ef09 feat: useProgression hook
d02db02 chore: update database.types.ts for Phase 3 tables
16ed771 fix: edge function — real level in early return, processing/complete status, statMap cleanup, stale retry count
8e69754 feat: post-game-handler edge function — XP, credits, achievements
f7f3d23 feat: pure XP/level progression helpers with tests
23c7357 feat: auto-create player_progression row on signup
05e32c0 feat: seed reward_config and achievements catalogue
55841ab feat: Phase 3 schema migration — progression, achievements, reward_config
```
