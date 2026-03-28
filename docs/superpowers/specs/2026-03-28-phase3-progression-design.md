# Phase 3 — Player Progression, Achievements, and Virtual Currency
**Date:** 2026-03-28
**Status:** Approved
**Author:** Brainstorming session

---

## Context

Phase 3 builds the core retention loop for Mega OX. Phases 0–2.5 are complete.
The skin system architecture (Phase 2) is in place, providing the `skins` and `user_skins`
tables that achievement rewards can reference.

The three systems — XP/levels, achievements, and virtual currency — are designed together
so they form a balanced reward economy rather than three disconnected features.

---

## Decisions Made

| Question | Decision |
|---|---|
| Currency name | Credits |
| XP visibility | Private (profile only) |
| Level visibility | Public (shown to other players) |
| Level-up experience | Modal with rewards summary |
| Achievements reset | Permanent — never reset on same account |
| Achievement trigger method | Supabase edge function (security priority) |
| Level cap | 250 (MAX_LEVEL constant, extensible) |
| Shop / credits balance access | Persistent nav header + main menu + profile |

---

## Existing Schema — Relevant Tables

Before designing new tables, note what already exists and must be respected:

| Table | Relevant fields | Impact on Phase 3 |
|---|---|---|
| `currency_balance` | `player_id`, `coins` | Renamed to Credits in Phase 3 — `coins` column becomes the credits balance. Do NOT create a duplicate credits column. |
| `player_stats` | `player_id`, `wins`, `losses`, `draws`, `mmr`, `rank_tier` | `total_wins` and `total_games` in `player_progression` must stay in sync with this table, or read from it. See note below. |
| `games` | `match_type`, `player_x_id`, `player_o_id`, `status`, `winner` | `match_type` is used to detect AI games for the difficulty bonus reward. |
| `profiles` | `id`, `username`, `role`, `avatar_url`, plus skin slots | Phase 3 adds a `level` column here. |

**`player_stats` vs `player_progression` counters:** `player_stats` already tracks `wins`, `losses`, `draws` for the leaderboard/MMR system. Rather than duplicate these, `player_progression` reads from `player_stats` at award time to check achievement thresholds on `total_wins` and `total_games`. The edge function does not maintain separate win/game counters — it relies on `player_stats` as the source of truth for those counts.

---

## Section 1 — Database Schema

### New table: `player_progression`

One row per user. Stores XP, level, and lifetime credit total.
Credits balance lives in the existing `currency_balance` table (see above).

```sql
user_id              uuid references auth.users  PRIMARY KEY
xp                   integer  DEFAULT 0
level                integer  DEFAULT 1
total_credits_earned integer  DEFAULT 0   -- lifetime total, used for achievements
```

RLS: user can read their own row only. Edge function (service role) writes.

### New table: `achievements`

Catalogue of all achievements. Data-driven — adding a row adds an achievement.
Admin page (Phase 7) is a CRUD interface over this table. No code deploy needed
to add or modify achievements.

```sql
id              uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
key             text  UNIQUE   -- e.g. 'win_10_games', 'reach_level_50'
name            text
description     text
condition_key   text   -- stat to evaluate: 'total_wins' | 'total_games' | 'level' | 'total_credits_earned'
threshold       integer
reward_xp       integer  DEFAULT 0
reward_credits  integer  DEFAULT 0
reward_skin_id  uuid references skins  -- nullable, for future skin unlocks
icon_url        text
```

The edge function maps `condition_key` to the correct stat source:
- `'total_wins'` and `'total_games'` → read from `player_stats`
- `'level'` → read from `player_progression`
- `'total_credits_earned'` → read from `player_progression`

### New table: `player_achievements`

Junction table — what each player has unlocked. Composite primary key prevents
duplicate inserts at the DB level — used by the idempotent INSERT pattern.

```sql
user_id         uuid references auth.users
achievement_id  uuid references achievements
unlocked_at     timestamptz  DEFAULT now()
PRIMARY KEY (user_id, achievement_id)
```

RLS: user can read their own rows. Edge function (service role) inserts.

### New table: `reward_config`

All XP and credit award values per game event. Admin page (Phase 7) edits these
without a code deploy. Named distinctly from the existing `reward_catalog` table
(which handles login-streak day rewards — a separate system).

```sql
key    text  PRIMARY KEY   -- e.g. 'xp_game_complete', 'credits_win_bonus'
value  integer
```

**Seed values:**

| Key | Value |
|---|---|
| `xp_game_complete` | 20 |
| `xp_win_bonus` | 30 |
| `xp_win_hard_ai_bonus` | 20 |
| `xp_draw_bonus` | 10 |
| `credits_game_complete` | 10 |
| `credits_win_bonus` | 25 |
| `credits_draw_bonus` | 10 |

`xp_win_hard_ai_bonus` applies when `games.match_type` indicates a Hard AI game.
The exact `match_type` value for Hard AI is confirmed at implementation (check
existing usage in the codebase before writing the migration).

### Modified: `games`

Replace the `rewards_processed` boolean with a `rewards_status` enum string.
This supports the idempotent-with-retry pattern described in Section 4.

```sql
rewards_status       text  DEFAULT 'pending'
  -- values: 'pending' | 'processing' | 'complete' | 'failed'
rewards_retry_count  integer  DEFAULT 0
```

**`'processing'`** is set as the very first write when the edge function starts.
This prevents any retry from re-entering while execution is in flight.
**`'complete'`** is set after all writes succeed.
**`'failed'`** is set after 3 failed retries — permanently excluded from deferred processing.

### Modified: `profiles`

Add one column for the public-facing level display:

```sql
level  integer  DEFAULT 1
```

Denormalised copy of `player_progression.level`. Updated by the edge function
whenever level changes. Only `level` is exposed here — XP and credits remain private.

---

## Section 2 — XP, Levels, and Credits

### XP curve

```
xp_required_for_level(n) = 100 * n^1.5
cumulative_xp_to_reach_level(n) = sum of xp_required_for_level(1..n-1)
```

Reference pacing:

| Level | Cumulative XP to reach |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 5 | 558 |
| 10 | 1,683 |
| 25 | 8,839 |
| 50 | 30,619 |
| 100 | 109,139 |
| 250 | 591,882 |

`MAX_LEVEL = 250` is a single constant in the edge function. Raise it without
any other code change.

### Credits per game

Credits are stored in `currency_balance.coins` (existing table). The edge function
increments this column — it does not use a separate credits field.

| Event | Credits |
|---|---|
| Game completed (any result) | 10 |
| Win bonus | +25 (35 total) |
| Draw bonus | +10 (20 total) |
| Loss | 10 (base only) |

### Anti-abuse

The edge function checks both conditions before awarding anything:
- `games.status = 'complete'` with a valid `updated_at` timestamp
- Minimum move count ≥ 5 (reads `game_moves` count for this `game_id`)

If the minimum move count is not met, the function sets `rewards_status = 'complete'`
but awards nothing. The game is permanently marked so it is never retried.

---

## Section 3 — Achievement System

### Trigger method

Edge function (`post-game-handler`) checks achievements after updating stats.
All logic is server-side — the client cannot award achievements.

### Condition evaluation and idempotency

The function uses `INSERT INTO player_achievements ... ON CONFLICT DO NOTHING RETURNING *`.
Only rows returned by this statement (i.e., actually newly inserted) are used to
calculate bonus XP and credits. Rows that already existed (conflict) are silently
ignored. This means the achievement reward calculation is safe to re-run — it
will never double-award bonuses for achievements already in `player_achievements`.

### Level-threshold achievements — second pass

After applying achievement bonus XP and recalculating level, the function performs
a second achievement check targeting `condition_key = 'level'` only. This catches
the edge case where bonus XP from stat-based achievements (e.g. `win_50_games`)
pushes the player across a level threshold they didn't cross on the first pass.

### Seeded catalogue (starting point — expand via admin page in Phase 7)

| Key | Condition | Threshold | XP | Credits | Other |
|---|---|---|---|---|---|
| `first_win` | total_wins | 1 | 50 | 25 | — |
| `win_10_games` | total_wins | 10 | 100 | 50 | — |
| `win_50_games` | total_wins | 50 | 300 | 150 | — |
| `win_100_games` | total_wins | 100 | 500 | 250 | — |
| `play_10_games` | total_games | 10 | 50 | 25 | — |
| `play_50_games` | total_games | 50 | 150 | 75 | — |
| `play_100_games` | total_games | 100 | 200 | 100 | — |
| `reach_level_10` | level | 10 | 0 | 100 | — |
| `reach_level_25` | level | 25 | 0 | 250 | — |
| `reach_level_50` | level | 50 | 0 | 500 | skin unlock TBD (Phase 5) |
| `reach_level_100` | level | 100 | 0 | 1000 | skin unlock TBD (Phase 5) |
| `reach_level_250` | level | 250 | 0 | 2500 | prestige badge TBD (Phase 5) |

---

## Section 4 — Edge Function: `post-game-handler`

**Endpoint:** `POST /functions/v1/post-game-handler`

**Input:**
```ts
{ gameId: string }
// userId is NOT accepted from the client. It is derived from the JWT inside the function.
```

**Output:**
```ts
{
  xpAwarded: number,
  creditsAwarded: number,
  previousLevel: number,
  newLevel: number,
  leveledUp: boolean,
  newAchievements: {
    key: string,
    name: string,
    description: string,
    icon_url: string,
    reward_xp: number,
    reward_credits: number,
    reward_skin_id: string | null
  }[]
}
```

**Execution steps:**

1. **Verify request**
   - Extract `userId` from JWT (`jwt.sub`) — never from the request body
   - Fetch the game row — confirm `status = 'complete'`
   - Confirm `userId` is `player_x_id` or `player_o_id`
   - If `rewards_status = 'processing'` or `'complete'`, return early (idempotent)
   - If `rewards_status = 'failed'`, return error — do not retry permanently failed games

2. **Claim the game atomically**
   - Set `games.rewards_status = 'processing'` as the very first write
   - This prevents concurrent or duplicate calls from entering the logic below

3. **Calculate base rewards**
   - Read `reward_config` table for all value keys
   - Determine outcome (win / draw / loss) for `userId`
   - Read `game_moves` count for this `game_id` — if < 5, set `rewards_status = 'complete'` and return `{ xpAwarded: 0, creditsAwarded: 0, ... }`
   - Apply `xp_win_hard_ai_bonus` if `games.match_type` matches the Hard AI value
   - Calculate `xpEarned` and `creditsEarned`

4. **Update progression**
   - Add `xpEarned` to `player_progression.xp`
   - Add `creditsEarned` to `currency_balance.coins` and `player_progression.total_credits_earned`
   - Recalculate `level` from updated cumulative XP using the curve formula
   - Cap at `MAX_LEVEL = 250`
   - Record `previousLevel` before writing
   - If `level` changed, update `profiles.level`

5. **Check stat-based achievements** (first pass — all condition_keys except `'level'`)
   - Fetch current stats from `player_stats` (`wins`, `wins + losses + draws` for total_games)
   - Fetch all `achievements` where `condition_key != 'level'` and not yet in `player_achievements`
   - Evaluate each threshold condition
   - `INSERT INTO player_achievements ... ON CONFLICT DO NOTHING RETURNING *`
   - Sum `reward_xp` and `reward_credits` from **returned rows only**
   - Apply bonus totals to `player_progression.xp` and `currency_balance.coins`
   - Recalculate level after bonus XP — update `profiles.level` if changed

6. **Check level-threshold achievements** (second pass — `condition_key = 'level'` only)
   - Fetch all `achievements` where `condition_key = 'level'` and not yet in `player_achievements`
   - Evaluate against the now-final level value
   - `INSERT ... ON CONFLICT DO NOTHING RETURNING *`
   - Apply any bonus credits/XP from returned rows
   - Final level recalculation if bonus XP was awarded; update `profiles.level` if changed

7. **Mark game complete**
   - Set `games.rewards_status = 'complete'`

8. **Return payload**

**Error handling:**

If any step after step 2 throws:
- Increment `games.rewards_retry_count`
- If `rewards_retry_count >= 3`: set `rewards_status = 'failed'` — permanently excluded
- Otherwise: set `rewards_status = 'pending'` — eligible for deferred retry on next login

Note: step 2 sets `rewards_status = 'processing'`. If the function crashes before
resetting to `'pending'` or `'failed'`, the game stays `'processing'` forever.
To guard against this, the deferred login query treats rows stuck in `'processing'`
for more than 10 minutes as `'pending'` (using `updated_at` timestamp check).

### Deferred processing on login

On auth resolve, the client queries:

```sql
SELECT id FROM games
WHERE (player_x_id = :userId OR player_o_id = :userId)
  AND status = 'complete'
  AND rewards_status = 'pending'
  AND rewards_retry_count < 3
```

Also includes any rows stuck in `'processing'` for > 10 minutes:

```sql
OR (rewards_status = 'processing' AND updated_at < now() - interval '10 minutes')
```

For each result, calls `post-game-handler`. No level-up modal for deferred
processing — rewards are applied silently and the balance updates in the background.

---

## Section 5 — UI Components

### `<CreditsBalance>`
Persistent in the main nav/header for all logged-in users. Shows current credits
balance (reads `currency_balance.coins`) with an icon. Updates immediately after
the post-game edge function returns. Entry point to the shop (Phase 6).

### Post-game reward modal
Shown immediately after `post-game-handler` returns. Always appears after every game.

Contents:
- XP earned + animated XP bar fill to new position within the current level
- Credits earned
- If `leveledUp`: "Level Up! You are now Level X" + any milestone rewards or unlocks
- If `newAchievements.length > 0`: each achievement with icon, name, and reward summary

Single "Continue" button to dismiss.

### XP progress bar (profile — private)
Visible to profile owner only.
- Current level (prominent)
- Progress bar filled to position within current level
- Text: "X XP to Level N" — counts down as XP accumulates

### Level badge (public)
Small level number shown next to username wherever usernames appear:
matchmaking screen, leaderboard, profile header. No XP visible.

### Achievements page (`/achievements`)
Accessible from the profile page. Two sections:
- **Unlocked** — earned achievements with unlock date
- **Locked** — unearned achievements with name, description, and reward visible
  (players know what to aim for)

---

## What is NOT in Phase 3

- Full profile page visual redesign (Phase 5)
- Shop UI and purchase flow (Phase 6)
- Skin equip UI (Phase 4 or 6 — TBD)
- Admin page for managing `achievements` and `reward_config` (Phase 7)
- Emoji system (Phase 4)
- Real-money top-ups (Phase 6)
- Prestige system beyond level 250

---

## Open questions (resolve at implementation)

- Exact `match_type` value for Hard AI games — check existing codebase usage before writing migration
- Exact minimum move count threshold for anti-abuse (5 is a placeholder)
- Achievement icon assets — placeholder icons in Phase 3, real art in Phase 5
- Milestone reward `reward_skin_id` for `reach_level_50` and `reach_level_100` — set to `null` until Phase 5 skins exist
- Prestige badge design for `reach_level_250` — Phase 5
