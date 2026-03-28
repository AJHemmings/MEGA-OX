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

## Section 1 — Database Schema

### New table: `player_progression`

One row per user. Source of truth for all reward-related counters.

```sql
user_id              uuid references auth.users  PRIMARY KEY
xp                   integer  DEFAULT 0
level                integer  DEFAULT 1
credits_balance      integer  DEFAULT 0
total_wins           integer  DEFAULT 0
total_games          integer  DEFAULT 0
total_credits_earned integer  DEFAULT 0   -- lifetime total, used for achievements
```

RLS: user can read their own row only. Edge function (service role) writes.

### New table: `achievements`

Catalogue of all achievements. Data-driven — adding a row adds an achievement.
Admin page (Phase 7) is a CRUD interface over this table.

```sql
id              uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
key             text  UNIQUE   -- e.g. 'win_10_games', 'reach_level_50'
name            text
description     text
condition_key   text             -- matches a column name in player_progression
threshold       integer          -- value that column must reach
reward_xp       integer  DEFAULT 0
reward_credits  integer  DEFAULT 0
reward_skin_id  uuid references skins  -- nullable
icon_url        text
```

The edge function maps `condition_key` → `player_progression` column.
No code changes needed to add new achievements — insert a row, done.

### New table: `player_achievements`

Junction table — what each player has unlocked.

```sql
user_id         uuid references auth.users
achievement_id  uuid references achievements
unlocked_at     timestamptz  DEFAULT now()
PRIMARY KEY (user_id, achievement_id)
```

RLS: user can read their own rows. Edge function (service role) inserts.

### New table: `reward_config`

All XP and credit award values live here, not hardcoded in the edge function.
Admin page (Phase 7) edits these values without a code deploy.

```sql
key    text  PRIMARY KEY   -- e.g. 'xp_game_complete', 'credits_win'
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

### Modified: `games`

Add one column:

```sql
rewards_processed  boolean  DEFAULT false
```

Prevents double-awarding if the edge function is called more than once for the same game.

### Modified: `profiles`

Add one column:

```sql
level  integer  DEFAULT 1
```

Denormalised copy of `player_progression.level` for public-facing queries
(leaderboard, matchmaking, profile headers). Updated by the edge function whenever
level changes. Only `level` is exposed here — XP and credits remain private.

---

## Section 2 — XP, Levels, and Credits

### XP curve

```
xp_required_for_level(n) = 100 * n^1.5
cumulative_xp_to_reach_level(n) = sum of xp_required_for_level(1) to xp_required_for_level(n-1)
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

`MAX_LEVEL = 250` is a single constant in the edge function. Raise it without any other
code change.

### Credits per game

| Event | Credits |
|---|---|
| Game completed (any result) | 10 |
| Win bonus | +25 (35 total) |
| Draw bonus | +10 (20 total) |
| Loss | 10 (base only) |

### Anti-abuse

The edge function checks both conditions before awarding anything:
- `games.status = 'complete'` with a valid `completed_at` timestamp
- Minimum move count ≥ 5 (reads `game_moves` count or move counter on the game row)

If the minimum move count is not met, the function sets `rewards_processed = true`
but awards nothing. The game is marked processed so it is never retried.

---

## Section 3 — Achievement System

### Trigger method

Edge function (`post-game-handler`) checks achievements after updating `player_progression`.
All logic is server-side — the client cannot award achievements.

### Condition evaluation

After stats are updated, the function fetches all achievements the player has not yet
unlocked. For each, it checks:

```ts
player_progression[achievement.condition_key] >= achievement.threshold
```

Newly passing achievements are inserted into `player_achievements` and their rewards
are added to the running totals.

### Seeded catalogue (starting point — expand as needed)

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
| `reach_level_50` | level | 50 | 0 | 500 | skin unlock TBD |
| `reach_level_100` | level | 100 | 0 | 1000 | skin unlock TBD |
| `reach_level_250` | level | 250 | 0 | 2500 | prestige badge TBD |

---

## Section 4 — Edge Function: `post-game-handler`

**Endpoint:** `POST /functions/v1/post-game-handler`

**Input:**
```ts
{ gameId: string, userId: string }
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
   - Validate JWT — confirm authenticated user matches `userId`
   - Fetch game row — confirm `status = 'complete'`
   - Confirm `userId` is `player_x_id` or `player_o_id`
   - If `rewards_processed = true`, return early (idempotent)

2. **Calculate base rewards**
   - Read `reward_config` table for all value keys
   - Determine outcome (win / draw / loss) for `userId`
   - Check minimum move count — if not met, set `rewards_processed = true` and return `{ xpAwarded: 0, creditsAwarded: 0, ... }`
   - Calculate `xpEarned` and `creditsEarned`

3. **Update `player_progression`**
   - Add `xpEarned` to `xp`, `creditsEarned` to `credits_balance` and `total_credits_earned`
   - Increment `total_games`, increment `total_wins` if win
   - Recalculate `level` from new cumulative XP using curve formula
   - Cap at `MAX_LEVEL = 250`
   - Record `previousLevel` before writing

4. **Sync public level**
   - If `level` changed, update `profiles.level`

5. **Check achievements**
   - Fetch all `achievements` not yet in `player_achievements` for this user
   - Evaluate each `condition_key` against updated `player_progression`
   - Insert passing achievements into `player_achievements`
   - Sum `reward_xp` and `reward_credits` from new achievements
   - Apply bonus totals to `player_progression` (second update)
   - Re-run level calculation after bonus XP (achievement could push to next level)
   - Re-sync `profiles.level` if level changed again

6. **Mark game processed**
   - Set `games.rewards_processed = true`

7. **Return payload**

**Error handling:** If any step throws, the function returns an error without setting
`rewards_processed = true`. The deferred login check retries next session.

### Deferred processing on login

On auth resolve, the client queries:

```sql
SELECT id FROM games
WHERE (player_x_id = :userId OR player_o_id = :userId)
  AND status = 'complete'
  AND rewards_processed = false
```

For each result, calls `post-game-handler`. No level-up modal for deferred processing
— rewards are applied silently. The player's balance and stats update in the background.

---

## Section 5 — UI Components

### `<CreditsBalance>`
Persistent in the main nav/header for all logged-in users. Shows current credits balance
with an icon. Updates immediately from the post-game edge function response.
Entry point to the shop (Phase 6).

### Post-game reward modal
Shown immediately after `post-game-handler` returns. Always appears (even with no level-up
or achievements — XP and credits earned are still shown).

Contents:
- XP earned + animated XP bar fill to new position
- Credits earned
- If `leveledUp`: "Level Up! You are now Level X" + any milestone rewards or unlocks
- If `newAchievements.length > 0`: each achievement with icon, name, and reward summary

Single "Continue" button to dismiss.

### XP progress bar (profile — private)
Visible to profile owner only.
- Current level (prominent)
- Progress bar filled to position within current level
- Text: "X XP to Level N" — decrements as XP is earned

### Level badge (public)
Small level number shown next to username wherever usernames appear:
matchmaking screen, leaderboard, profile header. No XP visible.

### Achievements page (`/achievements`)
Accessible from the profile page. Two sections:
- **Unlocked** — earned achievements with unlock date
- **Locked** — unearned achievements showing name, description, and reward
  (so players know what to aim for)

---

## What is NOT in Phase 3

- Full profile page visual redesign (Phase 5)
- Shop UI and purchase flow (Phase 6)
- Skin equip UI (Phase 4 or 6 — TBD)
- Admin page for managing achievements and reward_config (Phase 7)
- Emoji system (Phase 4)
- Real-money top-ups (Phase 6)
- Prestige system beyond level 250

---

## Open questions (resolve at implementation)

- Exact minimum move count threshold for anti-abuse (5 is a placeholder)
- Achievement icon assets — placeholder icons in Phase 3, real art in Phase 5
- Milestone reward skin IDs for `reach_level_50` and `reach_level_100` (Phase 5 skins don't exist yet — leave `reward_skin_id = null` until Phase 5)
- Prestige badge design for `reach_level_250` (Phase 5)
