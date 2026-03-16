# MEGA-OX Design Log

A running log of major design decisions. Updated whenever a significant architectural or product decision is made.

---

## 2026-03-16 — Network Multiplayer System Design

**Session:** Initial design session for network multiplayer platform.

---

### Backend: Supabase (new account)
**Decision:** Use Supabase as the sole backend — auth, PostgreSQL database, Realtime, and Storage.
**Why:** PostgreSQL is essential for the relational data model (rankings, seasons, history, friends). Supabase Realtime handles live game sync without a separate WebSocket server. New Supabase account created to avoid free tier limits on existing projects. No Vercel API routes needed — Supabase handles everything.

---

### Realtime Architecture: DB-Authoritative (Approach B)
**Decision:** Game state lives in Postgres. Moves are DB writes. Supabase Realtime pushes row changes to both clients. Clients never poll.
**Why:** Postgres RLS acts as the server-side validation layer — moves can only be written by the correct player on the correct turn. No state divergence possible. Match history is automatic. Future features (replay, spectating, reconnection) all depend on the move log existing. Client-authoritative broadcast (Approach A) was rejected due to cheat risk and no recovery from disconnection.

---

### MMR: Hidden ELO + Visible Rank Tiers
**Decision:** Raw MMR (integer, Elo-based) is stored in `player_stats.mmr` and blocked from all client reads via RLS. Visible `rank_tier` is derived from MMR thresholds and publicly readable.
**Why:** Industry standard pattern. Players engage with titles, not numbers. Hiding the raw number prevents unhealthy fixation on exact values and makes smurfing harder to calibrate. Rank tier updates automatically via Postgres trigger on mmr change.

**Tier thresholds:**
| Tier | MMR |
|---|---|
| Grand Master | 2200+ |
| Master | 1900–2199 |
| Expert | 1600–1899 |
| Strategist | 1300–1599 |
| Tactician | 1100–1299 |
| Challenger | 900–1099 |
| Novice | 0–899 |

New players start at 1000 MMR (top of Challenger).

---

### Terminology: "Season" not "League"
**Decision:** The monthly rolling competitive mode is called "Season", not "League".
**Why:** "League" has football/sports connotations implying division-based play. "Season" communicates a time-limited competitive period with a leaderboard, which is the actual mechanic.

---

### Match Types: Friendly, Season, Tournament
**Decision:** Three match types stored in `games.match_type`. Friendly games do not affect MMR. Season and tournament games do.
**Why:** Separates casual and competitive play. Players can warm up in friendlies without risk. Season and tournament results feed MMR and standings respectively.

---

### Leaderboard: View not Table, MMR not Exposed
**Decision:** Leaderboard is a Postgres view over `player_stats` and `profiles`. Shows top 1000 by MMR ordering. Does not include `mmr` as a returned column — only position (derived), rank_tier, and stats.
**Why:** Players can see their position (e.g. #47) without seeing the raw MMR that produced it. Consistent with the hidden MMR principle.

---

### Cosmetics: Markers, Boards, Themes
**Decision:** Three cosmetic types — markers, board skins, themes. Items are either purchasable (in-game coins) or win-only (tournaments, achievements). Schema built in Phase 1; shop UI built later.
**Why:** Monetization hook without blocking gameplay. Future Stripe integration plugs into `transactions.stripe_payment_id` without schema change.

---

### Season Prizes: Positions 1–4
**Decision:** `season_prizes` table supports up to 4 prize positions per season. Prize can be coins, a cosmetic item, or both.
**Why:** Top-4 reward structure provides meaningful goals beyond just first place. Same structure reusable for tournaments.

---

### Tournament Registration Flow
**Decision:** Tournaments have a `'registration'` status. Players register via `tournament_registrations`. Admins confirm entries into `tournament_participants` for bracket seeding.
**Why:** Separates intent to join from confirmed participation. Allows waitlisting, seeding control, and prevents bracket gaps from no-shows.

---

### Supabase MCP Integration
**Decision:** Supabase MCP server to be configured at start of implementation, giving Claude Code direct database access.
**Why:** Allows schema creation, RLS policy writing, and storage configuration without manual dashboard work. Significantly accelerates implementation.

---

### No GitHub Repo Integration (Pro Feature)
**Decision:** Not using Supabase's GitHub repo integration.
**Why:** Requires Pro plan. Not needed — migrations managed via Supabase CLI and MCP tooling instead.
