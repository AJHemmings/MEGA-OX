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

---

## 2026-06-23 — Phase 9: Friends, Matchmaking, and Game Invites

---

### Matchmaking: RPC-based atomic pairing with pg_advisory_xact_lock

**Decision:** Real matchmaking is implemented as a Postgres SECURITY DEFINER function (`join_matchmaking_queue`) that acquires a per-user advisory lock, scans for a waiting opponent, and either creates a game or inserts the caller into the queue — all in a single transaction.

**Alternatives considered:**
- **Edge function**: Would work but adds cold-start latency and is harder to test. Supabase RPCs are zero cold-start.
- **Client-side pairing**: Two clients both try to update the same row — race conditions guaranteed without server-side serialization.
- **Queue table + polling**: Would require clients to poll; RPC + Realtime gives push delivery.

**Why advisory lock specifically:** `pg_advisory_xact_lock(hashtext('matchmaking:' || user_id))` locks per user, not per table. Two different users can match simultaneously without blocking each other. A table-level lock would serialize all matchmaking globally.

**Trade-off accepted:** Advisory locks are connection-level — if the DB connection is dropped mid-RPC, the lock is released and the transaction rolls back cleanly. This is fine for our use case.

---

### Subscribe-before-RPC: Avoiding the match-event race condition

**Decision:** In `MatchmakingPage.tsx`, the Realtime subscription to `matchmaking_queue` is established *before* the `join_matchmaking_queue` RPC is called. The RPC is called inside the SUBSCRIBED callback.

**Why:** If Player X calls the RPC first and then subscribes, there's a window where the subscription isn't active. If Player O matches Player X during that window, the `status='matched'` UPDATE event fires before Player X's subscription is listening — Player X misses it and stays stuck on the searching screen forever.

**Trade-off:** The SUBSCRIBED callback is asynchronous (requires a WebSocket round-trip). This adds ~50–200ms before the RPC is called. This is acceptable — we're not competing on matchmaking speed.

---

### React StrictMode and the mountedRef reset pattern

**Decision:** The unmount effect in `MatchmakingPage` has both a body *and* a cleanup, not just a cleanup:

```typescript
useEffect(() => {
  mountedRef.current = true; // ← body runs on every (re)mount
  return () => {
    mountedRef.current = false;
    // unsubscribe channels
  };
}, []);
```

**Why the body is necessary:** React StrictMode (enabled by CRA in development) runs every effect twice: mount → fake-unmount (cleanup) → remount. The fake-unmount cleanup sets `mountedRef.current = false`. If the effect has no body, `mountedRef` is never reset to `true` after the remount. All subsequent async callbacks check `if (!mountedRef.current) return` and bail out silently — the RPC that enters the queue is never called, and the queue stays empty.

**Alternative considered:** Use a local `alive` variable (closure-captured boolean) per effect instance instead of a ref. This correctly gates stale callbacks without the StrictMode reset issue, but it can't be shared across multiple async paths that need the same guard. The ref approach is simpler when multiple effects and callbacks share the same lifetime.

**Trade-off:** This pattern is non-obvious. The body-line comment is essential — without it, a future developer would likely remove it as dead code.

---

### Confirmation flow: two-dot UI over a timer

**Decision:** After matching, both players see two dots (grey by default, green on accept, red on decline). There's no countdown timer — players can take as long as they want.

**Alternatives considered:**
- **30-second countdown timer**: More urgency, mirrors CS:GO/Valorant. Adds complexity (server-side expiry RPC, timer sync between clients). Deferred — can be added later without schema changes.
- **Single "waiting" spinner**: Simpler, but gives no feedback on what the opponent is doing. The dot approach lets each player see the other's state in real-time via Realtime, which is more satisfying.

**Why dots:** The two-dot pattern uses the existing `mm_x_confirmed`/`mm_o_confirmed` columns on the `games` row. No additional table needed. Realtime delivers the column updates sub-second. Simple, extendable.

---

### Role assignment: first-in-queue = X, second-to-match = O

**Decision:** The player who was waiting in the queue first becomes Player X. The player who joins and triggers the match becomes Player O.

**Why:** The `join_matchmaking_queue` RPC creates the game row. At creation time, it knows who the waiter is (the queue entry's `user_id`) and who the joiner is (the current `auth.uid()`). Assigning waiter=X, joiner=O at creation is the natural/atomic choice — no round-trip needed to negotiate roles.

**Trade-off:** Player X always goes first in the RPS phase (they hold `player_x_id`). This is a minor fairness concern since both players do RPS, so actual game turn order is randomised regardless.

---

### Game invites: dedicated table vs ad-hoc game creation

**Decision:** Challenges between friends use a `game_invites` table (`status: 'pending' | 'accepted' | 'declined' | 'cancelled'`). The invited player responds via the `respond_to_game_invite` RPC, which creates the game on accept.

**Alternative considered:** Challenger creates the game immediately and sends a link. Simpler, but the challenged player has no way to decline — they'd just ignore it and the game sits in 'waiting' forever. The invite table gives both players a clean accept/decline UX.

**Why separate from matchmaking_queue:** Game invites are between specific named players. Matchmaking is anonymous and rank-based. They have different schemas, different UX, and different flows. Keeping them separate avoids a generic "pending games" concept that would complicate both.

---

### Presence: single shared channel, not per-user channels

**Decision:** All online users join a single Supabase Presence channel (`presence:global`). Each user tracks their own key (`user_id`) with status and optional `gameId`.

**Alternative:** Per-user channels where friends subscribe to each other's channels. More targeted delivery, but requires subscribing/unsubscribing as the friends list changes. Complex lifecycle management.

**Why shared channel:** Supabase Presence on a shared channel delivers the full presence map to all subscribers. For a game with a small user base, the overhead is negligible. Simpler code — one channel, one `presenceMap` context, zero subscription management per friendship.

**Trade-off:** If the user base scales to thousands of concurrent users, the presence payload gets large. At that point, switch to per-user channels or a Realtime Broadcast approach. For now, simplicity wins.

---

### Friends leaderboard: RPC vs client-side filtering of global leaderboard

**Decision:** `get_friends_leaderboard()` is a SECURITY DEFINER RPC that joins `friendships` with `player_stats` and `profiles`, returning only the caller's friends + the caller themselves, ranked by XP.

**Alternative:** Pull the global leaderboard on the client and filter by the user's friend list. Simple but leaks data — the client receives XP for every player, not just friends. Also doesn't scale.

**Why RPC:** The server applies the friendship filter before any data leaves the database. The caller only sees data they're entitled to see. RLS on the leaderboard view would be complex to write correctly (self-join hazard). SECURITY DEFINER sidesteps the RLS recursion issue we've hit before.

---

### Worktree isolation: copy .env.local manually

**Decision:** Phase 9 was developed in a separate Git worktree (`F:\Projects\MEGA-OX\.worktrees\phase9-friends`). `.env.local` is gitignored and not inherited by new worktrees.

**Lesson learned:** Always copy `.env.local` manually after `git worktree add`. Without it, the dev server starts but every Supabase call fails silently (wrong URL/anon key fallback to empty strings).

**How to apply:** `cp F:\Projects\MEGA-OX\.env.local F:\Projects\MEGA-OX\.worktrees\<name>\.env.local`
