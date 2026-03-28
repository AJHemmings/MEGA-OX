# Product Roadmap — Mega OX
**Date:** 2026-03-18
**Status:** Approved
**Author:** Session brainstorm

---

## Context

Mega OX is an Ultimate Naughts and Crosses game (3×3 grid of micro tic-tac-toe boards) currently
in alpha. The following systems are already working:

- Guest landing page + demo game
- User authentication (sign up, login, sign out)
- Network multiplayer (alpha — working locally across browsers)
- Local 2-player
- Single player vs AI (random)
- Tutorial (Beginner + Intermediate)
- Initial user profile system
- Leaderboard
- Stat tracking

The goal driving this roadmap is **a live, retained-user product** — not just a portfolio piece.
The sequencing prioritises building all core systems first, then doing a full visual redesign
once the complete product is understood.

---

## Design Decision: Why Visual Redesign Comes Late

The visual redesign and skin system were initially considered foundational.
After discussion, the decision was reversed:

**Reasoning:** Designing the shop window before knowing what is in the shop leads to rework.
The profile page, shop UI, progression UI, achievement display, and emoji system all need
to be designed together — they share screen real estate, visual hierarchy, and information density.
Redesigning before those systems exist means designing around placeholders.

**Exception:** The skin system *code refactor* (changing markers from plain strings to
renderable components) stays early — it is an architectural prerequisite, not a visual one.
The art direction of those skins is deferred.

---

## Approved Roadmap

### Phase 0 — Infrastructure & Cost Planning
**Goal:** Understand hard constraints before building anything that could hit them.

- Audit current Supabase free tier usage
- Estimate per-user DB footprint for all planned tables (progression, achievements, currency, etc.)
- Model avatar storage: at what user count does 1 GB fill up? What is the per-avatar size budget?
- Decide: cosmetic assets bundled in app vs Supabase Storage vs CDN (Cloudflare R2)
- Define the trigger point for upgrading to Supabase Pro ($25/month)
- Output: a written cost model and a clear "upgrade when X" rule

**Why first:** Every subsequent phase adds DB rows, storage, and edge function calls.
Building without knowing the limits risks hitting a wall mid-feature.

---

### Phase 1 — AI Improvement
**Goal:** Make the solo experience worth playing before building retention systems around it.

- **Easy:** keep current random move selection
- **Medium:** prefer moves that win a micro board; avoid sending opponent to a free board
- **Hard:** minimax or heuristic evaluation of macro board position (alpha-beta pruning)
- Selectable difficulty UI in single-player flow

**Decision:** Option A (hand-coded logic) only. No external AI API — cost, latency, and
complexity are not justified for a casual game. Minimax with alpha-beta pruning is
well-understood and implementable.

**Why before progression:** Achievements and XP rewards will reference AI difficulty.
Designing those rewards before difficulty levels exist creates assumptions.

---

### Phase 2 — Skin System Code Refactor
**Goal:** Change the architecture so cosmetic items can exist. No visual design yet.

- `Cell` component: replace plain string marker (`"X"` / `"O"`) with a skin slot
  (rendered component, SVG, or image reference)
- `MicroBoard` component: won-board overlay becomes a skin slot (same skin, larger render)
- Skin data structure: `{ id, type, assetRef, label }` — no art assets needed yet
- Skins are per-player (X player has a skin, O player has a skin)
- Default skin: current plain text behaviour, rendered as a component

**Why before progression:** Progression milestone rewards will include cosmetic unlocks.
The reward system needs a stable skin ID to reference.

---

### Phase 3 — Player Progression, Achievements, and Virtual Currency
**Goal:** Build the core retention loop in one phase so the three systems can be
designed as a unified reward economy.

#### 3a. Player Progression (EXP + Levels)
- EXP awarded per game played, per win, per draw (values TBD in detail design)
- Level curve: TBD (likely exponential with soft caps at milestone levels)
- Milestone rewards: currency drops, cosmetic unlocks, title/badge unlocks
- Storage: `player_xp` and `player_level` columns on user profile, or a `progression` table
- Display: level and XP bar on profile; optionally visible in-game UI

#### 3b. Achievement System
- Categories: game milestones, skill-based, social, progression-gated
- Reward tiers: common → EXP + currency; rare/hard → free cosmetic item
- Storage: `achievements` catalogue table + `player_achievements` junction table
- Checking method: TBD between DB trigger, edge function, or client-side with server validation
- UI: achievements page, in-game unlock toast, badge on profile

#### 3c. Virtual Currency
- Currency name: TBD (coins, gems, tokens — pick at detail design)
- Earning: awarded on game completion; bonus for wins, streaks (values TBD)
- Anti-abuse: quit detection, minimum game length before reward is granted
- Storage: `currency_balance` table (already exists in Supabase)
- Award method: DB trigger on game completion or post-game edge function call
- Display: balance visible in nav/header when logged in

**Why together:** EXP, achievements, and currency form a single economy.
Designing them in isolation risks imbalance (e.g. achievements that trivially
farm currency, or levels that feel meaningless without rewards).

---

### Phase 4 — Profile Customisation and Emoji Communication
**Goal:** Give players identity and expression before the shop opens.

#### 4a. Profile Customisation
- Avatar: uploadable image or selectable from a set of unlockable avatars
- Badge: small icon next to username — earned via achievements or purchased
- Banner: background strip on profile card — earnable or purchasable
- Profile page layout: avatar, banner, badge, username, level/XP bar,
  stats (games played, win rate), equipped cosmetics, achievement showcase
- Key decision: which items are free progression unlocks vs paid vs both?

#### 4b. Emoji Communication
- Fixed curated set — no free text chat (eliminates moderation overhead)
- Base set: small number of emojis free for all players
- Premium set: additional emojis purchasable from the shop
- UX: quick-select panel during game (ping-wheel style);
  emoji appears as floating bubble near the player's side of the board
- Storage: `emojis` catalogue + `player_inventory` (emoji as a cosmetic category)

---

### Phase 5 — Visual Redesign
**Goal:** A full visual pass now that the complete product is understood.

By this phase, every screen and every system exists. The redesign can make informed decisions:

- Game board style — colour, borders, grid lines, overall feel
- Cell marker skins — the component architecture is ready; design the actual art
- Won micro board overlay — prominent winner symbol, skin-aware
- Palette, typography, spacing — a coherent design language applied across all screens
- Profile page, shop page, achievements page — all designed together, not in isolation
- Art direction decision: Dark/neon? Clean/minimal? Something else? (decide at detail design)

**Key advantage of doing this last:** every screen exists, every component exists,
the design language can be applied once and consistently.

---

### Phase 6 — Cash Shop
**Goal:** Monetise the product once there is a full catalogue and a user base worth selling to.

- Architecture: private API repo (Node/Express or Supabase Edge Functions) owns all payment
  logic and Stripe keys. Main app reads catalogue from Supabase directly.
- `/shop` route: browse cosmetic_items, see owned vs available
- In-game currency spending (primary) + real-money top-ups via Stripe (secondary)
- Build order: seed catalogue → build shop UI → wire currency earning →
  build private API → add Stripe flow
- Do not build shop UI stubs until the private API exists

**See also:** `docs/plans/cash-shop-future-scope.md` for full architecture.

---

### Phase 7 — Admin Dashboard
**Goal:** Give the product owner tools to manage content without touching the database directly.

- Protected `/admin` route — `is_admin` flag on user record; non-admins get 403/redirect
- Skins manager: add/edit/archive cosmetic items with preview upload
- Achievements manager: add/edit achievements, set trigger conditions and rewards
- Emoji manager: add emoji items to catalogue, set free/paid flag
- Cash shop manager: featured items, sale prices, visibility toggles, transaction history
- **AI difficulty tuner:** Adjust the behaviour strength variables for Medium and Hard AI
  without a code deploy. Each heuristic rule has a 0–100 strength value (e.g. Medium
  win-move rule at 80 means the AI follows it 80% of the time and makes a random move
  the other 20%). The admin panel exposes these as editable number inputs per difficulty
  per rule. Values are stored in a config table and read at game start. In Phase 1 these
  values are hardcoded constants; the admin UI replaces those constants without changing
  the underlying AI logic.
- Access control decision: admin actions through private API (auditability) or
  direct Supabase RLS? (TBD at detail design)

---

### Phase 8 — Bug Report System
**Goal:** Capture issues from real users without opening free-text chat.

**Player-facing:**
- "Report a Bug" button from main menu and in-game help/settings dropdown
- Form: title, description, category (UI / game logic / account / other), optional screenshot
- Storage: `bug_reports` table (id, user_id, title, description, category, screenshot_url, status, created_at)
- Rate limit: max 3 reports per hour per user
- Guest users: allow reporting with email field only

**Admin dashboard — bug reports section:**
- List view sortable by date/category/status
- Status workflow: open → in progress → resolved/dismissed
- Internal admin notes per report
- Filter by status, category, date range
- Bulk status update for duplicate reports

---

## Summary Table

| Phase | Area | Depends On |
|---|---|---|
| 0 | Infrastructure & cost planning | — |
| 1 | AI improvement | — |
| 2 | Skin system code refactor | Phase 1 (difficulty levels inform reward design) |
| 3 | Progression + achievements + currency | Phase 2 (skin IDs needed for rewards) |
| 4 | Profile customisation + emoji communication | Phase 3 (progression unlocks inform profile) |
| 5 | Visual redesign | Phase 4 (all screens exist) |
| 6 | Cash shop | Phase 5 (catalogue designed, product looks complete) |
| 7 | Admin dashboard | Phase 6 (content systems all exist) |
| 8 | Bug report system | Phase 6 (stable live product) |

---

## Open Questions (resolve at each phase's detail design)

- Currency name and branding
- EXP values and level curve
- Art direction for visual redesign
- Which profile items are free vs paid vs both
- Achievement trigger method (DB trigger vs edge function vs client + server validation)
- Admin access control: private API vs direct Supabase RLS
- Admin dashboard: single admin or role-based permissions?
- Bug reports: email notifications to admin on new report?
- Bug reports: should resolved reports be visible to the filing player?
