# Phase 0 — Infrastructure & Cost Planning Brief
**Mega OX | For AI-assisted cost modelling**
**Date:** 2026-03-18

---

## Purpose of This Document

This document is a complete information brief for modelling the infrastructure costs and
capacity requirements of Mega OX, an online multiplayer browser game built on Supabase
(PostgreSQL + Auth + Storage + Realtime) and deployed via Vercel (React/CRA frontend).

Use this to:
- Estimate per-user database row footprint across all planned tables
- Model storage usage for avatars and cosmetic assets
- Identify which Supabase free-tier limits will be hit first and at what user count
- Recommend when to upgrade to Supabase Pro ($25/month)
- Flag any architectural risks in the current schema

---

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | React (Create React App), TypeScript, deployed on Vercel |
| Database | Supabase (PostgreSQL) — free tier |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (used for live multiplayer game state sync) |
| Storage | Supabase Storage (planned for avatars and cosmetic assets) |
| Payments | Stripe (planned, Phase 6) — private API repo separate from main app |

---

## Supabase Free Tier Limits (for reference)

| Resource | Free Tier Limit |
|---|---|
| Database size | 500 MB |
| Storage | 1 GB |
| Monthly active users (auth) | 50,000 |
| Realtime concurrent connections | 200 |
| Edge function invocations | 500,000 / month |
| Bandwidth | 5 GB / month |
| Row-level security | Included |

---

## Current Database Schema (Already Exists)

All tables below are live in the Supabase project. Row estimates are what a single active user
generates over their lifetime.

### `profiles`
One row per registered user.
```
id uuid PK
username text unique
avatar_url text (URL reference, not stored here)
active_marker_id uuid FK → cosmetic_items
active_board_id uuid FK → cosmetic_items
active_theme_id uuid FK → cosmetic_items
role text ('player' | 'admin')
created_at timestamptz
```
**Row size estimate:** ~200–300 bytes per user.
**Rows at scale:** 1 row per user. At 10,000 users = 10,000 rows.

---

### `player_stats`
One row per registered user (auto-created on signup via trigger).
```
player_id uuid PK FK → profiles
wins integer
losses integer
draws integer
mmr integer
rank_tier text
```
**Row size estimate:** ~100 bytes per user.
**Rows at scale:** 1:1 with users.

---

### `games`
One row per completed or active game. Both multiplayer and (future) ranked games.
State is stored as JSONB — this is the highest-impact table.
```
id uuid PK
player_x_id uuid FK → profiles
player_o_id uuid FK → profiles
state jsonb (full 9×9 board state)
next_player text
next_micro_board integer
status text ('waiting' | 'active' | 'complete' | 'abandoned')
winner text
match_type text ('friendly' | 'season' | 'tournament')
season_id uuid
tournament_id uuid
game_code text
created_at timestamptz
updated_at timestamptz
```
**Row size estimate:** JSONB board state for a completed Ultimate Noughts and Crosses game
is approximately 2–4 KB per row (9 micro boards × 9 cells + metadata).
**Rows at scale:** Highly variable. If an active user plays 3 games/day:
  - 1,000 DAU × 3 games = 3,000 rows/day
  - At 4 KB/row: 12 MB/day, ~360 MB/month for 1,000 DAU

**Key question:** Are completed games retained forever or pruned after N days?
This is the biggest lever on database size.

---

### `game_moves`
Append-only move log. One row per move per game.
An Ultimate Noughts and Crosses game averages approximately 30–60 moves before completion.
```
id uuid PK
game_id uuid FK → games
player_id uuid FK → profiles
micro_board_index integer
cell_index integer
move_number integer
created_at timestamptz
```
**Row size estimate:** ~100–150 bytes per move.
**Rows at scale:** At 45 moves avg per game:
  - 3,000 games/day (1,000 DAU) = 135,000 move rows/day
  - ~13.5 MB/day, ~405 MB/month at this scale

**Key question:** Is the move log necessary for all time, or only for replays/auditing?
Pruning completed game moves after 30–90 days significantly reduces footprint.

---

### `matchmaking_queue`
Transient table. Rows exist only while players are queuing.
```
player_id uuid PK FK → profiles
mmr integer
match_type text
joined_at timestamptz
```
**Row size estimate:** ~80 bytes. Negligible — rows are deleted when matched.

---

### `seasons`
One row per season. Low volume admin-created.
```
id uuid PK
name text
start_date date
end_date date
status text
rules_config jsonb
```
**Rows at scale:** Tens of rows total. Negligible.

---

### `season_standings`
One row per (player, season) pair.
```
player_id uuid
season_id uuid
wins, losses, draws, points integer
rank_position integer
PK (player_id, season_id)
```
**Rows at scale:** At 3 seasons/year with 5,000 active players = 15,000 rows/year. Small.

---

### `season_prizes`
One row per prize per season. Admin-created. Negligible volume.

---

### `tournaments`, `tournament_registrations`, `tournament_participants`
Low-volume admin-managed content. Negligible DB footprint.

---

### `cosmetic_items`
One row per cosmetic in the catalogue. Admin-created.
```
id uuid PK
name text
type text ('marker' | 'board' | 'theme')
rarity text
animated boolean
asset_url text
price integer
source text ('shop' | 'tournament' | 'achievement')
```
**Rows at scale:** Probably 50–500 items total at full catalogue. Negligible row footprint.
**Storage impact:** Asset URLs point to Supabase Storage or CDN. This is where storage
costs actually live — see Storage section below.

---

### `player_inventory`
One row per item owned per player.
```
player_id uuid
item_id uuid
acquired_at timestamptz
acquisition_source text
PK (player_id, item_id)
```
**Rows at scale:** If the average player owns 5 items: 10,000 users = 50,000 rows. Small.
At 50 items avg per engaged player: 500,000 rows at 10,000 users. Still manageable.

---

### `currency_balance`
One row per user (auto-created on signup).
```
player_id uuid PK
coins integer
```
**Row size estimate:** ~50 bytes. 1:1 with users. Negligible.

---

### `transactions`
One row per currency earn/spend event. This grows with engagement.
```
id uuid PK
player_id uuid
type text ('purchase' | 'reward' | 'refund' | 'spend')
amount integer
item_id uuid (nullable)
stripe_payment_id text (nullable)
created_at timestamptz
```
**Row size estimate:** ~150–200 bytes per transaction.
**Rows at scale:** If players earn/spend currency 2× per game:
  - 3,000 games/day = 6,000 rows/day → ~180,000 rows/month at 1,000 DAU

---

### `login_streaks`
One row per user (auto-created on signup).
```
player_id uuid PK
current_streak integer
longest_streak integer
last_login_date date
```
Negligible. 1:1 with users.

---

### `reward_catalog`, `reward_claims`
`reward_catalog`: Admin-created. ~30–90 rows total. Negligible.
`reward_claims`: One row per claim per player.
```
player_id uuid
reward_catalog_id uuid
claimed_at timestamptz
PK (player_id, reward_catalog_id)
```
**Rows at scale:** Daily login rewards. 1,000 DAU × 30 days = 30,000 rows/month.
At ~80 bytes/row = ~2.4 MB/month. Small but grows linearly with engagement.

---

### `news_posts`
Admin-created content. A few posts per week. Negligible.

---

### `tutorial_progress`
One row per (player, tutorial page) completed.
Two tutorials exist (Beginner 7 steps + Intermediate 14 steps = 21 page keys max per player).
```
player_id uuid
page_key text
completed_at timestamptz
PK (player_id, page_key)
```
**Rows at scale:** 21 rows max per player. At 10,000 users = 210,000 rows. Small.

---

## Planned Tables (Not Yet Built — Phases 1–8)

### Phase 1: AI difficulty
No new tables required. Difficulty selection is client-side game logic only.

---

### Phase 2: Skin system refactor
No new tables required. Uses the existing `cosmetic_items` and `player_inventory` schema.
A `skin_type` or component reference replaces string markers in the frontend only.

---

### Phase 3: Progression, Achievements, Currency

#### `player_progression` (new)
```
player_id uuid PK FK → profiles
xp integer
level integer
updated_at timestamptz
```
**Rows:** 1:1 with users. Negligible.

#### `achievements` catalogue (new)
```
id uuid PK
key text unique (e.g. 'win_streak_5')
title text
description text
category text ('milestone' | 'skill' | 'social' | 'progression')
rarity text
reward_xp integer
reward_coins integer
reward_item_id uuid (nullable)
icon_url text
```
**Rows:** Likely 50–200 achievements total. Admin-created. Negligible footprint.

#### `player_achievements` (new)
```
player_id uuid
achievement_id uuid
unlocked_at timestamptz
PK (player_id, achievement_id)
```
**Rows at scale:** If avg player earns 20 achievements: 10,000 users = 200,000 rows. Small.
At 100 achievements avg: 1,000,000 rows at 10,000 users. Still manageable in Postgres.

#### `xp_events` audit log (possible, TBD)
If XP history is tracked (not just the current total):
```
id uuid PK
player_id uuid
amount integer
source text (e.g. 'game_win', 'achievement')
created_at timestamptz
```
**Rows at scale:** Similar growth pattern to `transactions`. If tracked: ~6,000 rows/day
at 1,000 DAU. Could be pruned to latest N events per player.

---

### Phase 4: Profile Customisation and Emoji Communication

#### Avatar storage (Supabase Storage)
- Uploadable avatars require actual file storage, not just URL references.
- A compressed profile avatar: 50–200 KB per user.
- At 10,000 users with uploaded avatars: 500 MB – 2 GB.
- **This alone could exhaust the free 1 GB Storage tier.**

#### `emojis` catalogue (new)
```
id uuid PK
name text
emoji_url text (or unicode char)
is_free boolean
price integer
```
**Rows:** Small admin-managed catalogue. Negligible.

Note: Emoji items may reuse `cosmetic_items` + `player_inventory` rather than a separate table.
Decision TBD at detail design.

---

### Phase 5: Visual redesign
No new tables. Asset references (skin images, board art) stored in `cosmetic_items.asset_url`,
pointing to Supabase Storage or CDN.

---

### Phase 6: Cash shop (Stripe)
No new tables required. Uses `transactions`, `currency_balance`, and `player_inventory`.
`stripe_payment_id` is already a column on `transactions`.
The private API repo handles all Stripe webhook logic — no schema changes in main app.

---

### Phase 7: Admin dashboard
No new tables required. Admin actions operate on existing tables.
`profiles.role` column already has an `'admin'` check constraint.

---

### Phase 8: Bug report system

#### `bug_reports` (new)
```
id uuid PK
user_id uuid (nullable, FK → profiles — null for guest reports)
guest_email text (nullable)
title text
description text
category text ('ui' | 'game_logic' | 'account' | 'other')
screenshot_url text (nullable, Supabase Storage)
status text ('open' | 'in_progress' | 'resolved' | 'dismissed')
admin_notes text (nullable)
created_at timestamptz
updated_at timestamptz
```
**Rows at scale:** Hopefully low volume. Even at 100 reports/month, this is trivially small.
Screenshot uploads: 1–3 MB each if allowed. Rate-limiting (3/hour/user) keeps volume low.

---

## Storage Budget Analysis

| Asset Type | Size Per Item | When This Matters |
|---|---|---|
| User avatar (uploaded) | 50–200 KB | Phase 4 — becomes significant at ~5,000 users with avatars |
| Cosmetic marker/skin image | 10–50 KB | Phase 2/5 — depends on how many items in catalogue |
| Cosmetic board theme image | 50–200 KB | Phase 5 |
| Bug report screenshot | 500 KB – 3 MB | Phase 8 — rate-limited, should stay low |
| Emoji asset (if image-based) | 5–20 KB | Phase 4 |
| News post image | 50–300 KB | Ongoing, admin-controlled |

**Storage pressure scenario:**
- 5,000 users with avatars @ 100 KB avg = 500 MB (half the free tier)
- 200 cosmetic items @ 100 KB avg = 20 MB
- 500 bug report screenshots @ 1 MB avg = 500 MB
- Combined mid-scale estimate: ~1–2 GB → exceeds free 1 GB tier

**Key decision required:** Are avatars stored in Supabase Storage, or are users directed
to a third-party image host (e.g. Gravatar, or pre-set avatar selection instead of upload)?
Pre-set avatars from a fixed set eliminate per-user storage costs entirely.

---

## Realtime Connection Usage

Supabase Realtime is used for live multiplayer game state sync.
- Free tier: 200 concurrent connections
- Each active multiplayer game uses 2 connections (one per player)
- 200 connections = 100 simultaneous multiplayer games
- This limit is reached before database size becomes a concern for a growing game

**Questions to model:**
1. What is the expected peak concurrent game count at 1,000 / 5,000 / 10,000 registered users?
2. Is WebSocket connection pooling or a dedicated game server (e.g. Ably, Liveblocks)
   worth considering at scale, and at what user count does this become necessary?

---

## Key Open Questions for AI Models to Answer

1. **Game row retention:** Should completed `games` rows be retained indefinitely or pruned?
   What is the trade-off between analytics value and DB size at 1,000 / 10,000 DAU?

2. **Move log retention:** Is `game_moves` worth keeping long-term for replay features,
   or should it be pruned after 30–90 days?

3. **XP/transaction audit trails:** Should `xp_events` be a table, or is the current total
   in `player_progression` sufficient? What is the cost of tracking history?

4. **Avatar storage strategy:** Uploadable user avatars vs. a curated set of unlockable
   preset avatars. At what user count does the free storage tier become the binding constraint?

5. **Cosmetic asset hosting:** Supabase Storage vs. Cloudflare R2 (or similar CDN) for
   cosmetic images and skin assets. What are the cost and latency trade-offs at 10,000 users?

6. **Realtime limit:** At what registered user count or DAU count is the 200-connection
   Supabase free tier limit expected to be hit? What is the cheapest path to increasing
   this (Supabase Pro vs. dedicated WebSocket service)?

7. **Upgrade trigger:** Given the above growth model, at what registered user count should
   the project upgrade from Supabase Free to Supabase Pro ($25/month)?

8. **Edge function calls:** Phase 3 currency rewards and achievement checking will likely
   use DB triggers or edge functions. How many edge function invocations does a single
   game completion generate, and how quickly does this approach the 500,000/month free limit?

9. **Bandwidth:** The frontend is a React SPA. What per-user bandwidth consumption should
   be modelled for Supabase API calls (auth, realtime, REST reads)?

10. **JSONB game state size:** The `games.state` column stores the full board as JSONB.
    What is the actual average compressed row size for a completed Ultimate Noughts and
    Crosses game? Is row-level compression (TOAST) sufficient, or should state be normalised?

---

## Summary: Highest-Risk Limits to Model

| Risk | Free Tier Limit | Expected Pressure Point |
|---|---|---|
| Database size | 500 MB | `games` + `game_moves` — depends heavily on retention policy |
| Storage | 1 GB | User avatar uploads at ~5,000 users |
| Realtime connections | 200 | ~100 simultaneous multiplayer games |
| Edge function invocations | 500,000 / month | Phase 3 achievement + currency triggers |
| Monthly active users | 50,000 | Not a near-term concern |
| Bandwidth | 5 GB / month | Unlikely to be hit before other limits |

---

## What a Good Response Looks Like

A useful response to this document will:
- Provide per-user row counts and byte estimates for each table
- Identify which Supabase limit is hit first and at what user count
- Give a clear recommended "upgrade when X users" rule for Supabase Pro
- Flag any architectural decisions in the schema that will cause outsized storage or
  compute costs at scale
- Recommend a retention/pruning policy for `games` and `game_moves`
- Give a storage strategy recommendation for user avatars and cosmetic assets
- Quantify the Realtime connection risk and suggest a mitigation strategy
