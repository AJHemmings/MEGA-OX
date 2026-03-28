# Phase 3 Worktree Handover

**Date:** 2026-03-28
**Branch:** `feat/phase3-progression`
**Worktree:** `.worktrees/feat-phase3-progression`
**Build status:** Clean — no TS errors, 13 Jest tests passing

---

## Session start prompt

Read this file in full, then say:

> "I've read the Phase 3 handover. The full implementation is code-complete on `feat/phase3-progression`. Build is clean. Manual testing is pending before merge. The next steps are: apply the 5 SQL migrations, deploy the edge function, and smoke test."

---

## What was built (19 commits)

### Database migrations (apply in this order)

| File | What it does |
|---|---|
| `supabase/migrations/20260328000001_phase3_schema.sql` | Creates `player_progression`, `achievements`, `player_achievements`, `reward_config`; adds `rewards_status`/`rewards_retry_count` to `games`; adds `level` to `profiles` |
| `supabase/migrations/20260328000002_phase3_seed.sql` | Seeds 7 reward_config values + 12 achievement rows |
| `supabase/migrations/20260328000003_phase3_triggers.sql` | Extends existing `handle_new_profile` trigger to auto-create `player_progression` row on signup |
| `supabase/migrations/20260328000004_phase3_rpc.sql` | `increment_credits(p_user_id, p_amount)` — atomic UPSERT into `currency_balance` |
| `supabase/migrations/20260328000005_leaderboard_add_level.sql` | Recreates the `leaderboard` view to include `profiles.level` |

**Apply via Supabase dashboard → SQL editor, in order 000001 → 000005.**

### Edge function

| File | What it does |
|---|---|
| `supabase/functions/post-game-handler/index.ts` | Validates game completion, awards XP + credits, runs two-pass achievement check, handles idempotency and retries |

**Deploy:** `npx supabase functions deploy post-game-handler`
— or upload via Supabase dashboard → Edge Functions → New Function

### New client code

| File | Purpose |
|---|---|
| `src/lib/progression.ts` | Pure XP curve helpers (`xpForLevel`, `cumulativeXPToLevel`, `levelFromXP`, `xpToNextLevel`, `MAX_LEVEL=250`) |
| `src/hooks/useProgression.ts` | Fetches player_progression + currency_balance; exposes `refresh()` for post-game re-fetch |
| `src/hooks/useAchievements.ts` | Fetches all achievements + user's unlocked set, merges into a list |
| `src/lib/postGame.ts` | `callPostGameHandler(gameId)` — calls edge function, returns `PostGameResult | null` |
| `src/components/layout/CreditsBalance.tsx` | Credits display in nav (💳 balance) |
| `src/components/progression/LevelBadge.tsx` | Small level number badge shown next to usernames |
| `src/components/progression/XPProgressBar.tsx` | XP bar with level text + countdown to next level |
| `src/components/progression/PostGameModal.tsx` | Post-game reward summary (XP, credits, level-up, achievements) |
| `src/components/achievements/AchievementsPage.tsx` | `/achievements` route — unlocked/locked sections |

### Modified files

| File | Change |
|---|---|
| `src/lib/database.types.ts` | Added types for all 4 new tables; `rewards_status`/`rewards_retry_count` on `games`; `level` on `profiles` |
| `src/contexts/AuthContext.tsx` | `processMissedRewards()` on login — silently retries any `pending`/stuck-`processing` games |
| `src/components/game/OnlineGameView.tsx` | Calls `callPostGameHandler` when `status === 'complete'`; shows `PostGameModal`; resets on new `gameId` |
| `src/components/GameWrapper.tsx` | TODO comment only — AI/local games have no `games` row yet, so handler can't fire |
| `src/components/MainMenu.tsx` | `<CreditsBalance />` added to nav header |
| `src/components/profile/ProfilePage.tsx` | `<XPProgressBar>` (own profile only), `<LevelBadge>`, link to `/achievements` |
| `src/components/leaderboard/LeaderboardPage.tsx` | `<LevelBadge>` next to usernames; `level` added to query |
| `src/App.tsx` | `/achievements` route added inside `ProtectedRoute` |

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
- [ ] All 5 migrations applied to Supabase (in order)
- [ ] Edge function deployed
- [ ] `npm start` in worktree shows no console errors

**Smoke tests:**

- [ ] **Credits balance visible** — log in, check main menu top-right shows 💳 balance
- [ ] **Level badge** — visible on leaderboard and profile pages
- [ ] **XP bar on own profile** — visible when viewing your own profile, hidden on other profiles
- [ ] **Achievements page** — navigate to `/achievements`, locked and unlocked sections render
- [ ] **Post-game modal — online game** — play a full online game to completion; modal appears with XP/credits; Supabase dashboard shows `games.rewards_status = 'complete'`
- [ ] **Level-up** — set `xp_game_complete` to a high value in `reward_config` via Supabase dashboard; play a game; modal shows level-up banner
- [ ] **Achievement unlock** — set `player_stats.wins = 9` in dashboard; win one game; modal shows `first_win` and `win_10_games` achievements
- [ ] **Deferred processing** — set a completed game's `rewards_status = 'pending'` in dashboard; log out and back in; verify it becomes `'complete'` silently (no modal)
- [ ] **Credits balance updates** — after a game, credits balance in nav reflects new amount

---

## Known issues / notes

- **AI/local game rewards:** GameWrapper has a TODO comment. AI games have no `games` row in Supabase, so `callPostGameHandler` cannot fire for them. Post-game rewards only work for online multiplayer games in Phase 3.
- **`match_type` for Hard AI:** The `HARD_AI_MATCH_TYPE = 'ai_hard'` constant in the edge function is a placeholder. Until AI games create a `games` row, this is never evaluated. Set the correct value when wiring AI game persistence.
- **`game_moves` count is always 0:** The anti-abuse check (min 5 moves) reads from `game_moves` table. CLAUDE.md notes that `move_number` in `game_moves` is always 0 and move history tracking is deferred. If `game_moves` has no rows for a game, `moveCount` is 0 < 5 — meaning all games currently fail the anti-abuse check and award zero XP. **You must verify this before merge.** Check whether `game_moves` rows are actually being written for online games; if not, either lower `MIN_MOVES` to 0 for now or fix the move-write path.

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
