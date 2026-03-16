# MEGA-OX Network Multiplayer — Full Scope Design Document

**Date:** 2026-03-16
**Status:** Approved — ready for implementation planning
**Phase:** Phase 1 detailed, Phase 2+ future-proofed

---

## 1. Overview

This document covers the full system design for taking MEGA-OX from a local-only game to a networked, authenticated, ranked platform. Phase 1 delivers network multiplayer, auth, and profiles. The schema and architecture are deliberately designed to accommodate all future scope without rewrites.

---

## 2. High-Level Architecture

```
┌─────────────────────────────┐
│   Vercel (Frontend)         │
│   React + TypeScript        │
│   - Game UI (existing)      │
│   - Auth pages              │
│   - Profile pages           │
│   - Matchmaking UI          │
│   - Leaderboard             │
│   - Main menu (redesigned)  │
└────────────┬────────────────┘
             │ Supabase JS client
             ▼
┌─────────────────────────────┐
│   Supabase (new account)    │
│   ├── Auth                  │  email/password + Google OAuth
│   ├── Postgres DB           │  all game + user data
│   ├── Realtime              │  live move sync between players
│   └── Storage               │  avatars, cosmetic assets, news images
└─────────────────────────────┘
```

**Key principles:**
- No separate backend server. No Vercel API routes. Supabase is the entire backend.
- Postgres Row Level Security (RLS) is the authorisation layer — not middleware.
- The existing `Game.ts` OOP logic stays client-side for rendering. Postgres is the authoritative source of truth.
- Supabase Realtime pushes DB changes to both players — clients never poll.
- Raw MMR is never exposed to the frontend. RLS blocks the column. Rank tier is derived server-side.

---

## 3. Supabase MCP Setup

At the start of implementation, add the Supabase MCP server to Claude Code config:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "YOUR_SUPABASE_ACCESS_TOKEN"]
    }
  }
}
```

Access token: **supabase.com → Account → Access Tokens**

---

## 4. Frontend Routes

| Route | Page | Protected |
|---|---|---|
| `/` | Main menu / lobby | Yes |
| `/login` | Sign in | No |
| `/signup` | Sign up | No |
| `/onboarding` | Username pick (Google OAuth new users) | Yes |
| `/profile/:username` | User profile | No (public) |
| `/settings` | User settings & customisation | Yes |
| `/game/:id` | Live game | Yes |
| `/matchmaking` | Finding a match | Yes |
| `/leaderboard` | Top 1000 players | No (public) |
| `/season` | Current season standings | No (public) |

React Router is already installed. This is where it gets wired up properly.

---

## 5. Database Schema

### 5.1 Auth & Profiles

**`profiles`** — created automatically on signup via Postgres trigger
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | matches `auth.users.id` |
| `username` | text | unique, chosen at signup |
| `avatar_url` | text | Supabase Storage |
| `active_marker_id` | uuid | FK → cosmetic_items |
| `active_board_id` | uuid | FK → cosmetic_items |
| `active_theme_id` | uuid | FK → cosmetic_items |
| `role` | text | `'player'` \| `'admin'` |
| `created_at` | timestamp | |

**`player_stats`**
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | FK → profiles |
| `wins` | integer | |
| `losses` | integer | |
| `draws` | integer | |
| `mmr` | integer | **hidden** — RLS blocks client reads, starts at 1000 |
| `rank_tier` | text | visible title, updated by trigger on mmr change |

**Rank tier thresholds:**
| Tier | MMR Range |
|---|---|
| Grand Master | 2200+ |
| Master | 1900 – 2199 |
| Expert | 1600 – 1899 |
| Strategist | 1300 – 1599 |
| Tactician | 1100 – 1299 |
| Challenger | 900 – 1099 |
| Novice | 0 – 899 |

New players start at 1000 MMR (top of Challenger).

---

### 5.2 Games & Moves

**`games`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `player_x_id` | uuid | FK → profiles |
| `player_o_id` | uuid | FK → profiles, null until opponent joins |
| `state` | jsonb | full board snapshot, overwritten each move |
| `next_player` | text | `'X'` or `'O'` |
| `next_micro_board` | integer | 0–8, null = free choice |
| `status` | text | `'waiting'` → `'active'` → `'complete'` |
| `winner` | text | `'X'`, `'O'`, `'draw'`, null |
| `match_type` | text | `'friendly'` \| `'season'` \| `'tournament'` |
| `season_id` | uuid | FK → seasons, null if not season |
| `tournament_id` | uuid | FK → tournaments, null if not tournament |
| `game_code` | text | unique 6-char code, null if matchmade |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`game_moves`** — append-only log
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `game_id` | uuid | FK → games |
| `player_id` | uuid | FK → profiles |
| `micro_board_index` | integer | 0–8 |
| `cell_index` | integer | 0–8 |
| `move_number` | integer | sequential |
| `created_at` | timestamp | |

**`matchmaking_queue`** — transient, rows deleted once matched
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | FK → profiles |
| `mmr` | integer | snapshot at queue join time |
| `match_type` | text | `'friendly'` \| `'season'` |
| `joined_at` | timestamp | for timeout/widening logic |

---

### 5.3 Seasons

**`seasons`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | e.g. "March 2026 Season" |
| `start_date` | date | |
| `end_date` | date | |
| `status` | text | `'upcoming'` \| `'active'` \| `'complete'` |
| `rules_config` | jsonb | flexible rules (games required, matchmaking constraints, etc.) |

**`season_standings`**
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | FK → profiles |
| `season_id` | uuid | FK → seasons |
| `wins` | integer | |
| `losses` | integer | |
| `draws` | integer | |
| `points` | integer | drives leaderboard |
| `rank_position` | integer | computed at season end |

**`season_prizes`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `season_id` | uuid | FK → seasons |
| `position` | integer | 1, 2, 3, 4 |
| `reward_type` | text | `'coins'` \| `'item'` \| `'both'` |
| `coin_amount` | integer | null if item-only |
| `item_id` | uuid | FK → cosmetic_items, null if coins-only |
| `claimed` | boolean | |
| `claimed_by` | uuid | FK → profiles |
| `claimed_at` | timestamp | |

---

### 5.4 Tournaments

**`tournaments`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | |
| `created_by` | uuid | FK → profiles (admin only) |
| `format` | text | `'single_elim'` \| `'round_robin'` |
| `status` | text | `'upcoming'` \| `'registration'` \| `'active'` \| `'complete'` |
| `start_date` | timestamp | |
| `prize_description` | text | |

**`tournament_registrations`**
| Column | Type | Notes |
|---|---|---|
| `tournament_id` | uuid | FK → tournaments |
| `player_id` | uuid | FK → profiles |
| `registered_at` | timestamp | |
| `status` | text | `'registered'` \| `'confirmed'` \| `'waitlisted'` |

**`tournament_participants`** — confirmed bracket entries only
| Column | Type | Notes |
|---|---|---|
| `tournament_id` | uuid | |
| `player_id` | uuid | |
| `seed` | integer | |
| `eliminated` | boolean | |

---

### 5.5 Cosmetics & Cash Shop

**`cosmetic_items`** — master catalogue
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | |
| `type` | text | `'marker'` \| `'board'` \| `'theme'` |
| `rarity` | text | `'common'` \| `'rare'` \| `'epic'` \| `'legendary'` |
| `animated` | boolean | |
| `asset_url` | text | Supabase Storage |
| `price` | integer | null = not purchasable (win-only) |
| `source` | text | `'shop'` \| `'tournament'` \| `'achievement'` |

**`player_inventory`**
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | FK → profiles |
| `item_id` | uuid | FK → cosmetic_items |
| `acquired_at` | timestamp | |
| `acquisition_source` | text | `'purchased'` \| `'tournament'` \| `'achievement'` |

**`currency_balance`**
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | FK → profiles |
| `coins` | integer | current balance |

**`transactions`** — full audit trail
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `player_id` | uuid | |
| `type` | text | `'purchase'` \| `'reward'` \| `'refund'` \| `'spend'` |
| `amount` | integer | positive = credit, negative = debit |
| `item_id` | uuid | FK → cosmetic_items, null if coins-only |
| `stripe_payment_id` | text | null until real-money payments added |
| `created_at` | timestamp | |

---

### 5.6 Gamification

**`login_streaks`**
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | |
| `current_streak` | integer | |
| `longest_streak` | integer | |
| `last_login_date` | date | |

**`reward_catalog`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `day_number` | integer | streak milestone |
| `reward_type` | text | `'coins'` \| `'item'` |
| `coin_amount` | integer | null if item |
| `item_id` | uuid | FK → cosmetic_items, null if coins |

**`reward_claims`** — prevents double-claiming
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | |
| `reward_catalog_id` | uuid | |
| `claimed_at` | timestamp | |

---

### 5.7 News

**`news_posts`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `title` | text | |
| `content` | text | |
| `category` | text | `'update'` \| `'patch'` \| `'season'` \| `'tournament'` |
| `image_url` | text | Supabase Storage |
| `published_at` | timestamp | |
| `created_by` | uuid | FK → profiles (admin only) |

Frontend always fetches 5 most recent by `published_at`.

---

### 5.8 Tutorial Progress

**`tutorial_progress`**
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid | |
| `page_key` | text | e.g. `'home'`, `'game'`, `'profile'`, `'matchmaking'`, `'leaderboard'` |
| `completed_at` | timestamp | |

On every page load, check if a row exists for the `page_key`. If not — show the tour, write the row.

---

### 5.9 Leaderboard View

A Postgres view — not a table. Queries `player_stats` and `profiles`, ordered by MMR descending, limited to 1000. **MMR is not a column in this view** — position is derived from MMR ordering server-side but the raw number is never returned to the client.

| Column | Source |
|---|---|
| `position` | RANK() OVER (ORDER BY mmr DESC) |
| `player_id` | profiles |
| `username` | profiles |
| `avatar_url` | profiles |
| `rank_tier` | player_stats |
| `wins` | player_stats |
| `losses` | player_stats |
| `draws` | player_stats |

---

## 6. Auth & Onboarding Flow

**Email/password signup:**
1. User enters email, password, username on `/signup`
2. Supabase creates `auth.users` entry
3. Postgres trigger auto-creates: `profiles`, `player_stats` (MMR=1000), `currency_balance` (coins=0), `login_streaks`
4. Redirect to `/` (main menu)

**Google OAuth signup:**
1. User clicks "Continue with Google"
2. Supabase creates `auth.users` entry
3. Redirect to `/onboarding` for username selection (Google doesn't supply one)
4. Same trigger fires on profile creation
5. Redirect to `/`

**Sign in:**
1. Email/password or Google on `/login`
2. Supabase returns JWT — client stores and auto-refreshes silently
3. On app load, `supabase.auth.getSession()` restores existing session
4. Redirect to `/`

**Protected routes:** Single wrapper component. No session → redirect to `/login`.

**Login streak:** On each sign-in, compare today vs `last_login_date`. Same day = no change. Yesterday = streak +1. Any gap = reset to 1. Prompt daily reward if streak matches `reward_catalog` milestone.

**Onboarding tutorial:** First visit to each page checks `tutorial_progress` for that `page_key`. If no row exists, trigger the page tour overlay, then write the row on completion.

---

## 7. Game Mode Flow

```
Training (vs AI)
└── straight into game (existing flow, no auth required in future for guests)

Multiplayer
├── Friendly
│   ├── Create Game → generates 6-char code → waits in 'waiting' status
│   └── Find Game   → joins matchmaking_queue → auto-paired by MMR ±200
│
├── Season  (active season only — greyed out otherwise)
│   └── auto-matchmaking via matchmaking_queue, season rules from rules_config
│
└── Tournament  (active tournament, registered + confirmed players only)
    └── opponent is bracket-determined, game starts when both players are online
```

**Live game sync (Approach B — DB authoritative):**
1. Both players subscribe to their game's Realtime channel on `games` table
2. Player makes a move → writes new `state` snapshot to `games` row
3. Supabase Realtime pushes the row update to both clients instantly
4. RLS validates the move: correct player, correct board, game is active
5. `game_moves` row appended for history

**Matchmaking widening:** If no match found within ±200 MMR after 60 seconds, widen to ±400. Widen again every 30 seconds thereafter.

---

## 8. Main Menu Redesign

```
┌─────────────────────────────────────────────────────┐
│  MEGA OX                          [Avatar] Username  │
│                                   W:12 L:4 D:1  ▼   │
├──────────────────────────┬──────────────────────────┤
│  PLAY                    │  LAST 5 GAMES            │
│                          │  ──────────────          │
│  [ Training (vs AI) ]    │  Win  vs Player2         │
│                          │  Loss vs Player7         │
│  [ Multiplayer      ]    │  Win  vs Player1         │
│    → Friendly            │  Draw vs Player9         │
│    → Season    [live]    │  Win  vs Player3         │
│    → Tournament [live]   │                          │
├──────────────────────────┴──────────────────────────┤
│  NEWS                                               │
│  ◀  [ Season 3 now live — click to register       ] │
│     [ v1.4 patch notes — new board skins added    ]▶ │
├─────────────────────────────────────────────────────┤
│  [ Leaderboard ]  [ Settings ]                      │
└─────────────────────────────────────────────────────┘
```

- Season and Tournament buttons are visible but greyed out with tooltip when inactive
- Profile section (top right) is a dropdown linking to profile page and settings
- News slideshow auto-rotates 5 most recent posts, manual prev/next arrows
- Tournament news cards link directly to registration flow
- Leaderboard button routes to `/leaderboard`

---

## 9. Phase 2+ Future Scope (Hooks Only — Not Built in Phase 1)

All of these attach to the existing schema without migrations:

| Feature | Hooks Already In Place |
|---|---|
| Friends & invites | `profiles.id` as FK target, `games.game_code` for invites |
| In-game chat | `games.id` as FK for `chat_messages` table |
| Replays | `game_moves` append-only log |
| Spectating | Subscribe to game Realtime channel as read-only |
| Achievements | `acquisition_source` in `player_inventory` |
| Real-money payments | `transactions.stripe_payment_id` |
| Tournament prizes | `season_prizes` structure reusable |
| Advanced season rules | `seasons.rules_config` jsonb column |

---

## 10. Total Table Count

| # | Table | Phase |
|---|---|---|
| 1 | profiles | 1 |
| 2 | player_stats | 1 |
| 3 | games | 1 |
| 4 | game_moves | 1 |
| 5 | matchmaking_queue | 1 |
| 6 | seasons | 1 |
| 7 | season_standings | 1 |
| 8 | season_prizes | 1 |
| 9 | tournaments | 1 |
| 10 | tournament_registrations | 1 |
| 11 | tournament_participants | 1 |
| 12 | cosmetic_items | 1 (schema only, no items yet) |
| 13 | player_inventory | 1 |
| 14 | currency_balance | 1 |
| 15 | transactions | 1 |
| 16 | login_streaks | 1 |
| 17 | reward_catalog | 1 |
| 18 | reward_claims | 1 |
| 19 | news_posts | 1 |
| 20 | tutorial_progress | 1 |
| — | leaderboard (view) | 1 |
