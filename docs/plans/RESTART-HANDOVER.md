# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. **Phases 1–5 are complete and merged to `main`**, plus a tech debt + leaderboard fix session on 2026-05-28. Live on `mega-ox-dev.vercel.app`.
>
> Next phase is **Phase 6: Cash shop**. Remaining tech debt items from the code review are listed in 'Known issues'."

---

## Current state

`main` branch: Tech debt + leaderboard fixes merged (2026-05-28). Latest commit: `d121c89`.

**Private Vercel (`mega-ox-dev`):** Testing environment — live URL: https://mega-ox-dev.vercel.app
— Project ID: `prj_ax0KSF6QTW1EMnAdtDa9HesZWCub`, Team: `team_1OpFieVAJDQLmmKEYGvVhGPi`
— Connected to: `AJHemmings/MEGA-OX-private` (private repo), tracking `main`
— Deploy: `git push private main` from project root
— Deployment protection: **disabled** (for testing)
— Latest production commit: `b63b143` (landing page UI polish, 2026-05-27)
— Edge function: **v10** deployed 2026-03-31. `verify_jwt: false` locked in `config.toml`.

**Public Vercel (`mega-ox`):** Portfolio/CV version — local game, AI only. URL: https://mega-ox.vercel.app
— Still running Phase 3-era code. Do NOT push to `origin/main` without explicit instruction.

---

## Tech debt + leaderboard fixes — complete ✅ (merged 2026-05-28)

**Commit:** `d121c89` (merge commit), feature branch `feat/tech-debt`

**Tech debt resolved (from 2026-05-27 code review):**
- `disconnectTimerRef` dead code removed from `useOnlineGame.ts` — declared/cleared but never assigned
- `tierColour` extracted to `src/styles/tokens.ts` — was duplicated in `LeaderboardPage` and `ProfilePage`
- `usePlayerProfile` dep array fixed — `[user]` → `[userId]` (primitive) to prevent redundant fetches on token refresh

**Tech debt still open (deferred to later session):**
- `Field` input component duplicated in `LoginPage` + `SignUpPage` (already diverged)
- `loadProfile` in `OnlineGameView` reimplements `usePlayerProfile` inline
- Orphaned countdown interval on rapid disconnect/reconnect (`useOnlineGame.ts` leave handler)

**Leaderboard fixes:**
- Migration `20260528000001_backfill_player_stats.sql` — inserts missing `player_stats` rows for profiles without one; overwrites W/L/D with ground-truth counts from `games` table (already applied to live DB)
- Migration `20260528000002_leaderboard_row_number.sql` — replaces `rank()` with `row_number()` so tied MMR (everyone on default 1000) produces unique positions (already applied to live DB)
- Podium now renders when fewer than 3 players are ranked (was `=== 3`, now `> 0`)
- Friends/Season leaderboard tabs now show correct placeholders instead of global data

**UI fixes:**
- SEASON 04 pill and heading removed from `LeaderboardPage` and `SeasonPage`
- Mobile hamburger menu added to `MobileLayout` in `MainMenu.tsx` — `≡` icon top-left, slide-in drawer (Leaderboard, Achievements, Season), closes on backdrop tap

---

## Phase 5 — complete ✅ (merged 2026-05-27)

**Design brief:** `docs/superpowers/specs/2026-05-26-phase5-visual-redesign-design.md`
**Design handoff assets:** `design_handoff_phase5_visual_redesign/`

**What was built:**
- Full visual pass across all screens — dark glassmorphism aesthetic (deep navy/blue base, frosted glass cards, teal `#00d4aa` accent)
- Shared design token system: `src/styles/tokens.ts` — colours, radius, font, spacing
- New shared components: `Glass`, `PrimaryButton`, `SecondaryButton`, `PageBackground`, `Pill`, `TabBar`
- All screens restyled: GuestLandingPage, MainMenu, MultiplayerMenu, MatchmakingPage, OnlineGameView, ProfilePage, CustomisePage, LeaderboardPage, AchievementsPage, auth pages, HowToPlay, SeasonPage, SettingsPage
- Desktop + mobile responsive layouts on MainMenu
- Design direction: Telegram tap-to-earn game aesthetic — not neon/esports, not flat/corporate

**Landing page polish (2026-05-27, commit `b63b143`):**
- Removed board preview grid (looked bad)
- Added "Coming soon" pill to the Ranked Multiplayer unlock row
- Replaced side-by-side Log In / Sign Up buttons with full-width Log In button + "Don't have an account? Sign up!" link below

**ESLint fixes (2026-05-27, commit `59cfabc`):**
- Three unused-var errors from the Phase 5 refactor blocked the Vercel build
- `MainMenu.tsx`: removed `navigate` from `MobileLayout` destructure (used in `DesktopLayout` only)
- `MultiplayerMenu.tsx`: renamed unused `user` to `_user`
- `MatchmakingPage.tsx`: removed unused `Pill` import

**Smoke tests:** Phase 5 visual pass is not a logic change — no new smoke test checklist. Verify visually on https://mega-ox-dev.vercel.app.

---

## Phase 3 — complete ✅ (merged 2026-03-31)

**Design doc:** `docs/superpowers/specs/2026-03-28-phase3-progression-design.md`
**Implementation plan:** `docs/superpowers/plans/2026-03-28-phase3-progression.md`
**Edge function:** v10 deployed (2026-03-31) — `verify_jwt: false` (locked in `config.toml`), precomputed level thresholds

**What was built:**
- 5 SQL migrations (schema, seed, triggers, RPC, leaderboard view update)
- 2 Realtime migrations: `currency_balance` and `player_stats` added to `supabase_realtime` publication
- `post-game-handler` Supabase edge function (XP, credits, achievements, idempotency, retry, W/L/D increment)
- `useProgression`, `useAchievements`, `usePlayerProfile` hooks
- `CreditsBalance`, `LevelBadge`, `XPProgressBar`, `PostGameModal` components
- `/achievements` page
- Post-game call wired into `OnlineGameView` and `AuthContext` (deferred retry)

**All smoke tests passed 2026-03-31:**
- ✅ Post-game modal opens with "Loading rewards…" then shows XP + credits
- ✅ No 401 / FunctionsHttpError in console
- ✅ Winner: 50 XP + 35 credits; Loser: 20 XP + 10 credits
- ✅ W/L/D updates immediately in main menu header and profile (no reload)
- ✅ Credits balance updates immediately in header
- ✅ Supabase DB: `player_stats`, `currency_balance`, `player_progression`, `rewards_status` all correct

---

## Phase 3 — fix history (2026-03-31)

### Fix: Edge function 401

**Problem:** Post-game edge function returned 401 after v7 deploy.

**Attempts that did NOT fix it:**
- v7 with `verify_jwt: true` — 401 persisted

**Fix (v8):**
- Redeployed with `verify_jwt: false` — function handles its own auth via `getUser()`
- `postGame.ts` updated to explicitly pass `Authorization: Bearer <token>` header in the invoke call

**Status:** ✅ Resolved.

---

### Fix: W/L/D never incrementing

**Problem:** Edge function read `player_stats` for achievement threshold checks but never wrote back to them. No DB trigger existed either. W/L/D stayed frozen.

**Fix:** Edge function now increments the correct counter (wins/losses/draws) after determining game outcome, before achievement checking, so thresholds fire against correct new totals.

**Status:** ✅ Resolved in v7/v8.

---

### Fix: Real-time subscriptions for credits and W/L/D

**Problem:** `useProgression` (credits) and `usePlayerProfile` (W/L/D) were one-shot fetches. Post-game DB updates never reflected in UI without a hard reload.

**Fix:**
- `useProgression.ts` — added `postgres_changes` subscription on `currency_balance` filtered by `player_id`
- `usePlayerProfile.ts` — added `postgres_changes` subscription on `player_stats` filtered by `player_id`
- `ProfilePage.tsx` — same `player_stats` subscription for viewed profile
- Two new migrations: `20260331000001_realtime_currency_balance.sql` and `20260331000002_realtime_player_stats.sql`

**Status:** ✅ Confirmed working.

---

### Fix: XP level curve O(n²) (v9)

**Problem:** `levelFromXP` called `cumulativeXPToLevel` on every iteration. `cumulativeXPToLevel` summed from l=1 each time — O(n²) for MAX_LEVEL=250.

**Fix:** Replaced with `LEVEL_THRESHOLDS` — a 250-element array precomputed once at cold-start. `levelFromXP` is now a single O(n) scan. Behaviour is identical; same curve, same level outputs.

**Status:** ✅ Deployed in v9. ⚠️ See below — v9 silently broke the function.

---

### Fix: Post-game modal not appearing + no progression recorded after live game (v10, 2026-03-31)

**Problem:** After Phase 3 merged and `main` pushed to private Vercel, post-game modal did not appear in live testing. No XP, credits, W/L/D, or achievements recorded for either player. Games remained with `player_x_rewards_status = 'pending'` and retry count = 0.

**Root cause:** When v9 was deployed (the O(n²) optimization, commit `2854227`), `verify_jwt` was not set in `config.toml`. Without it, the Supabase CLI defaults `verify_jwt` to `true` on every deploy, silently reverting the v8 fix. All POST requests to the function returned 401 before the function body ran — same failure mode as v7. The smoke tests had run against v8 (`verify_jwt: false`), not v9, so this regression was not caught before merge.

**Evidence from Supabase edge function logs:**
- v8 calls: all `POST | 200` ✓
- v9 calls: all `POST | 401` ✗ — confirmed via Supabase MCP log query

**Attempted fix that did NOT work:**
- Initial diagnosis: missing DB columns (`player_x_rewards_status` etc.) from an uncommitted migration. A migration was written (`20260331000003_per_player_rewards_columns.sql`) and the apply attempt was made — but failed with "column already exists." The columns had been added manually earlier. Wrong diagnosis.

**Fix (v10):**
1. Added `[functions.post-game-handler] verify_jwt = false` to `supabase/config.toml` so the setting persists across all future deploys.
2. Redeployed via Supabase MCP — v10 is now live with `verify_jwt: false`.

**Note on stuck games:** Two games from today are stuck at `player_x_rewards_status = 'pending'` with retry count 0 (game IDs `60f0fa13` and `48d7050b`). These will be retried automatically when the affected players next log in (`processMissedRewards` in `AuthContext`).

**Status:** ✅ Resolved in v10.

**Critical lesson:** Always set `verify_jwt = false` in `config.toml` before deploying any new version of `post-game-handler`. Without it, every deploy silently breaks the function. Never deploy this function without checking `config.toml` first.

---

## Phase 4 — complete ✅ (merged 2026-05-20)

**Design doc / retrospective:** `docs/qa/phase4-design-retrospective.md`
**Implementation plan:** `docs/superpowers/plans/2026-05-20-phase4-customisation-emoji.md`

**What was built:**
- 2 SQL migrations: `20260520000001_phase4_schema.sql` (loadout columns, cosmetic catalogue, inventory grants, RLS), `20260520000002_progression_public_read.sql` (allow cross-user progression reads)
- `useInventory` hook — fetches owned cosmetic items, client-side type filter (PostgREST limitation)
- `useLoadout` hook — reads/writes equipped loadout with optimistic update + stale-closure-safe rollback
- `CustomisePage` at `/customise` — 4-tab equip UI (Avatar/Badge/Banner/Emoji)
- `ProfilePage` extended — FK joins for equipped cosmetics, banner as `<img>` (SVG fix), badge in username row
- `EmojiPanel` + `EmojiBubble` components — in-game emoji picker + floating bubble with `emojiBounce` animation
- `useOnlineGame` extended — `myEmoji`, `opponentEmoji`, `sendEmoji` (guarded by `status !== 'active'`)
- `OnlineGameView` extended — board wrapper for emoji bubble positioning

**Key bugs caught in review (12 total before merge):**
- `useLoadout` stale closure: `prev` captured outside setter could restore wrong value on rapid equips. Fixed: captured atomically inside setter.
- `.then().catch()` on PromiseLike: Supabase returns PromiseLike not Promise. Fixed: async IIFE with try/catch/finally.
- `EmojiBubble` missing `animations.css` import: bounce animation silently failed. Fixed.
- `sendEmoji` no status guard: could fire after game ends. Fixed.
- PostgREST `.eq()` on embedded columns silently returns nothing. Fixed: fetch all, filter client-side.

**Post-smoke-test bug fixes (committed 2026-05-20, commit `c7699ab`):**
- Banner not displaying: SVG `fill="url(#g)"` contains unencoded `()` which breaks CSS `url()` parser. Fixed: switched to absolutely-positioned `<img>` element with an overlay div.
- Other players' levels showing as 1: `player_progression` RLS policy was `USING (auth.uid() = user_id)` — own row only. Fixed: migration `20260520000002` drops old policy, creates `USING (true)` for authenticated users.

---

## Housekeeping fixes (2026-05-20)

### Fix: False-diagnosis migration deleted

**What:** `supabase/migrations/20260331000003_per_player_rewards_columns.sql` was deleted.

**Why it existed:** During the v10 incident, the wrong diagnosis was made — it was thought the per-player rewards columns (`player_x_rewards_status` etc.) were missing. A migration was written to drop the old shared columns and add the per-player ones. The apply attempt failed with "column already exists" because the columns had been added manually earlier. The real problem was `verify_jwt` reverting to `true` on the v9 deploy.

**Why it was dangerous to leave:** Supabase CLI tracks applied migrations in `schema_migrations`. This file was in the `migrations/` directory but never applied — so it wasn't tracked. The next `supabase db push` would have tried to apply it, hit "column already exists", and blocked all future migrations.

**Fix:** File deleted. DB schema is correct; nothing needed applying.

---

### Fix: `lottie-react` not installed

**What:** `npm install lottie-react` run 2026-05-20.

**Why:** Three skin components (`BoardSkin.tsx`, `MarkerSkin.tsx`, `WonBoardSkin.tsx`) import `lottie-react` but it was missing from `package.json`. The dev server failed to compile with "Module not found: Can't resolve 'lottie-react'".

**Why it was missing:** The skin system scaffolding (Phase 2) added Lottie imports but the package install was either never done or lost — it wasn't in `node_modules`. No user-facing feature was broken in production (Vercel installs from `package.json`, not `node_modules`) — this only blocked the local dev server.

**Fix:** Package installed. Dev server compiles and runs cleanly.

---

## Deferred — rewards fallback UX

**What it is:** If post-game call fails (network error, retry exhaustion), the game result is stored in `games` but the player gets no feedback that XP/credits weren't recorded. The deferred retry on login (`AuthContext`) already handles eventual consistency — the gap is user-facing feedback only.

**What needs building (future session):**
- On post-game failure, derive outcome client-side from the `games` row and show fallback text in modal: "You won! Rewards couldn't be processed — they'll be retried next time you log in."
- "Rewards pending" badge on main menu when any game has `rewards_status = 'pending'` for current user.

**Not blocking Phase 4.** Retry mechanism already handles eventual consistency.

---

## Approved product roadmap

Full design doc: `docs/plans/2026-03-18-product-roadmap-design.md`

| Phase | Area                                                      | Status           |
| ----- | --------------------------------------------------------- | ---------------- |
| 0     | Infrastructure and cost planning                          | Brief written    |
| 1     | AI improvement (Easy / Medium / Hard)                     | **Complete**     |
| 2     | Skin system code refactor                                 | **Complete**     |
| 2.5   | Disconnect handling + broadcast sync + audio + Play Again | **Complete**     |
| 3     | Player progression + achievements + virtual currency      | **Complete**     |
| 4     | Profile customisation + emoji communication               | **Complete** (merged 2026-05-20)  |
| 5     | Visual redesign                                           | **Complete** (merged 2026-05-27)  |
| 6     | Cash shop                                                 | Not started      |
| 7     | Admin dashboard                                           | Not started      |
| 8     | Bug report system                                         | Not started      |

---

## What is built and working

| Feature                                    | Status            |
| ------------------------------------------ | ----------------- |
| Guest landing page (`/`)                   | Done              |
| Demo game (`/demo`)                        | Done              |
| Auth flow                                  | Done              |
| Main menu (`/menu`)                        | Done              |
| Tutorial — Beginner + Intermediate         | Done              |
| Single player vs AI (Easy / Medium / Hard) | Done — Phase 1    |
| Local 2-player                             | Done              |
| Network multiplayer — core                 | Done              |
| Skin system scaffolding                    | Done — Phase 2    |
| User profiles, leaderboard, stat tracking  | Done              |
| Disconnect handling                        | Done — Phase 2.5  |
| Broadcast move sync                        | Done — Phase 2.5  |
| Audio notifications                        | Done — Phase 2.5  |
| Play Again (readiness dots)                | Done — Phase 2.5  |
| RPS sync                                   | Done — Fix 7 + 8  |
| Play Again reliability                     | Done — Fixes 9–12 |
| Player progression (XP + levels)           | Done — Phase 3    |
| Virtual currency (credits)                 | Done — Phase 3    |
| Achievements                               | Done — Phase 3    |
| Post-game modal                            | Done — Phase 3    |
| Avatar / badge / banner equip (CustomisePage) | Done — Phase 4           |
| Profile cosmetics display (ProfilePage)    | Done — Phase 4            |
| In-game emoji communication                | Done — Phase 4            |
| Visual redesign (all screens)              | Done — Phase 5            |

---

## Confirmed working — live testing

- Move sync (1.1–1.5) — instant, in sync, constraints, micro/macro wins ✅
- Intentional exit (3.1–3.3) — forfeit confirm/cancel modal ✅
- Browser back button interception + tab close prompt ✅
- Auto-forfeit on disconnect (90s countdown → forfeit fires → both screens update) ✅
- Countdown cancels when disconnected player reconnects ✅
- Resume toast appears correctly ✅
- Resume toast suppressed when already on that game ✅ (Fix 11b)
- Audio (4.1–4.8) — all sounds confirmed ✅
- RPS — both browsers submit picks successfully ✅ (Fix 7)
- RPS — result screen shows on both browsers before game starts ✅ (Fix 7)
- RPS — win case: result screen → game starts, both players can move ✅ (Fix 8a)
- Game generation — working ✅
- Join with code — creator navigates correctly ✅
- RPS draw — result screen → both return to pick screen ✅ (confirmed 2026-03-28)
- Play Again — URL cycling fixed (Fix 11a), chained rematch fixed (Fix 12) ⚠️ (confirmed on two browsers locally against deployed build — full two-device live test still pending)
- Post-game modal — XP + credits shown correctly ✅ (Phase 3, 2026-03-31)
- W/L/D increments in DB and UI after game ✅ (Phase 3, 2026-03-31)
- Credits balance updates in real-time ✅ (Phase 3, 2026-03-31)
- Profile XP + level updates after game ✅ (Phase 3, 2026-03-31)

**Phase 4 — smoke test (pending full browser verification on deployed build):**
- [ ] Profile shows default avatar (Classic Blue), badge (Newcomer), banner (Night Sky)
- [ ] Go to `/customise` from profile — 4 tabs load, 2 items each
- [ ] Equip "Classic Orange" avatar → back to profile → avatar updated
- [ ] Equip "Ocean" banner → profile card shows gradient background with text still readable
- [ ] Viewing another player's profile shows their correct level (not always 1)
- [ ] Online game: emoji button visible during active game only
- [ ] Click 😊 → panel opens showing 👍 🔥
- [ ] Click 👍 → bubble appears left side, disappears after 3s
- [ ] Other player sees 👍 on right side, disappears after 3s
- [ ] Emoji button hidden after game ends

---

## Fix history

### Fix: XP level curve O(n²) → precomputed thresholds (commit `2854227`, 2026-03-31)

**Bug:** `levelFromXP` called `cumulativeXPToLevel(level + 1)` on every loop iteration. `cumulativeXPToLevel` summed from l=1 to targetLevel each time — O(n²) total for MAX_LEVEL=250. Would degrade at high levels.

**Fix:** Replaced with `LEVEL_THRESHOLDS` — a 250-element array built once via IIFE at module load. `levelFromXP` walks the array directly. O(n) precomputation, O(n) lookup per call with zero nested work.

---

### Fix 12 — Chained rematch stale ref poisoning (commit `d4b94b5`, 2026-03-27)

**Bug:** On third+ chained rematch, `rematchGameId` state carried a stale value from the previous game into the new mount. `rematchNavFiredRef` had been reset to `false`, so the navigation effect saw a non-null `rematchGameId` and immediately navigated — without waiting for the new rematch. Players ended up on the wrong game.

**Fix:** Clear `rematchGameId` in the main `useEffect` reset block (alongside the intent resets from Fix 11), before any new rematch creation can set it.

---

### Fix 11 — URL cycling + Resume Game toast (commit `b39944c`, 2026-03-25)

**Bug A — URL cycling / both players stuck on different RPS games:**
`myRematchIntent` and `opponentRematchIntent` are `useState` — they survive a `gameId` change because React Router reuses the `OnlineGameView` component instance. Both carried stale `'play_again'` values into the new game. `rematchCreatedRef` had just been reset to `false` and `myMarker` was still the old value before `fetchGameState` returned. The creation effect saw both intents set, `myMarker === 'X'`, `rematchCreatedRef === false` — and created another game. This cascaded: each new game mount repeated the pattern. Players ended up on different IDs, each one's RPS polling watched a different row, neither saw both picks.

**Fix:** Reset both intents to `null` in the main `useEffect` (alongside the existing `rematchCreatedRef` reset):
```ts
setMyRematchIntent(null);
setOpponentRematchIntent(null);
```

**Bug B — Resume Game toast always visible / clicking did nothing:**
`ResumeGameToast` renders inside `ProtectedRoute` as a sibling of `<Outlet />`, outside the `/game/:id` route context. `useParams()` returned `{}`. `isOnActiveGame` was always `false` — toast appeared on every page including the game the user was already on.

**Fix:** Replace `params.id === activeGameId` with `location.pathname === /game/${activeGameId}`. `useLocation()` works at any tree level.

---

### Fix 10 — database.types.ts missing rematch columns (commit `3abdfa0`, 2026-03-25)

**Problem:** Fix 9 migration added `rematch_x_intent` and `rematch_o_intent` to `games`. `database.types.ts` was never regenerated → build failed with `TS2339`.

**Fix:** Manually added `rematch_x_intent: string | null` and `rematch_o_intent: string | null` to `Row`, `Insert`, and `Update` in the `games` table definition.

---

### Fix 9 — Play Again (commit `89fe317`, 2026-03-24)

**Bug A — RLS blocked the INSERT:**
The games INSERT policy required `auth.uid() = player_x_id`. Rematch swaps who goes first — the creating player inserts a row with `player_x_id = opponentId`. `auth.uid() ≠ player_x_id` → 403.

**Fix:** Policy updated to `auth.uid() = player_x_id OR auth.uid() = player_o_id` (migration `20260324000001`).

**Bug B — Intent not delivered due to degraded WebSocket:**
The losing browser had a degraded WebSocket (`Realtime send() is automatically falling back to REST API`). Supabase's broadcast REST fallback doesn't reliably fan out to WebSocket subscribers — one player's intent never arrived.

**Fix:** Write intent to `rematch_x_intent` / `rematch_o_intent` columns on the games row (migration `20260324000002`). `postgres_changes` delivers it via CDC — more reliable than broadcast. Broadcast and presence kept as fast paths.

---

### Fix 8a — Game-start bug (commit `2a3c3d7`)

**Problem:** After RPS win, joiner's `status` stayed `'rps'` forever. `dismissRPSResult(false)` cleared `rpsResultPicks` but never transitioned status. Board was visible but no cells were clickable.

**Fix:** Moved `dismissRPSResult` to after `fetchGameState`, then added:
```ts
} else {
  fetchGameState(); // transitions joiner from 'rps' → 'active'
}
```

### Fix 8b — Game state polling (commits `5a95079`, `acd9eb7`)

**Problem:** After RPS→active transition, O's moves weren't reaching X. Broadcast/CDC is WebSocket-dependent and unreliable around status transitions.

**Fix:** Added independent game state polling — mirrors the `rps_picks` polling pattern from Fix 7. Runs every 1.5s while `status === 'active'`. Uses strict `>` to avoid overwriting a locally-placed move not yet in DB.

```
RPS architecture:  polls rps_picks  (status === 'rps')   ← Fix 7, unchanged
Game architecture: polls games      (status === 'active') ← Fix 8b, independent
```

---

### Fix 7 — RPS architectural redesign (commit `95d8a7f`, 2026-03-24)

Fixes 1–6 all failed. The event-based RPS system (broadcast + CDC refs) was scrapped entirely. 226 lines removed, 75 added.

**Root cause of Fixes 1–6 failures:**
On a draw, the creator's resolution effect fires when both picks arrive in React state (via CDC). It writes `rps_creator_pick = null, rps_joiner_pick = null` to the DB (draw-clear). That null-clear CDC propagates to both clients. The race: the null-clear CDC can reach the joiner before the creator's `rps_pick` broadcast does. The `postgres_changes` handler overwrote `rpsJoinerPickRef` to null — including the joiner's own pick. When the creator's broadcast finally arrived, `captureRPSResultIfReady(creatorPick, null)` silently failed. Creator captured + showed result. Joiner stayed stuck on "Waiting for opponent...".

**Failed approaches (Fixes 1–6, commits 4861d8d through a7eca80):**
All attempted to patch the event-based system. Approaches tried: reordering handlers, debouncing, additional broadcast channels, guarding null overwrites, adding resolution flags. All failed — the race between broadcast delivery, CDC delivery, and draw-clear nulls is non-deterministic.

**New architecture:**
- `rps_picks` table: `(game_id UUID, user_id UUID, pick TEXT, PRIMARY KEY(game_id, user_id))`
- Both players upsert their pick — no broadcast, no WebSocket dependency
- Both clients poll every 1s: when 2 rows appear, each resolves independently
- Creator waits 2s, then: draw → delete picks → `rpsRound++` → new round; win → update game row + delete picks → joiner's `fetchGameState` syncs

---

## Code review findings — 2026-05-27

A full architectural code review was run (7-angle, multi-agent). Two initial findings were wrong (code had guards the agents missed). Confirmed findings below.

### Confirmed tech debt

~~**`disconnectTimerRef` is dead code**~~ ✅ Fixed 2026-05-28

~~**`tierColour` duplicated**~~ ✅ Fixed 2026-05-28 — extracted to `src/styles/tokens.ts`

~~**`usePlayerProfile` effect dep is `[user]` not `[user?.id]`**~~ ✅ Fixed 2026-05-28

**`Field` input component duplicated** (`LoginPage.tsx` ~line 10, `SignUpPage.tsx` ~line 13)
Same styled input component defined in two files, already slightly diverged (SignUpPage added a `right` prop). Extract to `src/components/common/Field.tsx`.

**`loadProfile` in `OnlineGameView` re-implements `usePlayerProfile`** (`OnlineGameView.tsx` ~line 152)
An inline async function fetches username, avatar, rank tier, and level — the exact shape `usePlayerProfile` exposes. `OnlineGameView` does not import `usePlayerProfile` at all. If the profile schema changes, only the hook gets updated.

### Conditional bug (depends on Supabase config)

**Email confirmation signup skips profile creation** (`AuthContext.tsx` ~line 75)
If "Confirm email" is enabled in Supabase (Authentication → Email), `signUp()` returns no session. The immediately following `getUser()` returns `null`. The `if (user)` block is skipped — no `profiles`, `player_stats`, or `currency_balance` row is created. The user confirms their email, logs in, and the entire app is broken for them. **Check the Supabase dashboard toggle. If off, ignore this.**

### Plausible but not smoke-test-visible

**Orphaned disconnect countdown interval** (`useOnlineGame.ts` ~line 286)
The `leave` presence handler starts a `setInterval` without first calling `clearInterval` on the existing one. If the opponent disconnects → reconnects → disconnects again within the 90-second window, a second interval is started while the first is still running (the `join` handler cleared the ref but the first interval is already gone). Two intervals compete, producing visible countdown jitter. Fix: `clearInterval(countdownIntervalRef.current)` as the first line of the `leave` handler.

---

## Known issues / deferred

- **Phase 4 — EmojiBubble overflow on mobile** — bubbles positioned at `-60px` from board edge will go off-screen on viewports narrower than ~520px. No crash; bubble is invisible on those devices. Fix: adjust offset or use board-relative positioning. Deferred to Phase 5 visual redesign.
- **Phase 4 — New users have null loadout columns** — the migration sets defaults for existing users but not for sign-ups after migration. New users see no equipped cosmetics until they visit `/customise`. `ProfilePage` handles null gracefully (falls back to letter avatar, omits badge/banner). Fix: add a DB trigger or default values on columns. Deferred.
- **`useLoginStreak.ts` line 31** — swap `.single()` to `.maybeSingle()` to silence 406 errors. Low priority, no user-facing impact.
- **`p1GoesFirst` from `LocalRPSScreen`** — stored in `App.tsx` but not yet passed to `GameWrapper`. Phase 6.
- **Skins tables have no RLS policies** — fine for Phase 2, needed before Phase 6.
- **Double-disconnect edge case** — if both players disconnect simultaneously, game stays `active`. Cleanup job planned for Phase 7.
- **`isCreator` in `useOnlineGame`** — actually means "is player X". Renaming to `isPlayerX` deferred.
- **Play Again simultaneous click race** — two clients can both try to create a rematch. `rematchCreatedRef` prevents it per-client, not across clients. Acceptable.
- **`game_moves` table `move_number` is always 0** — full move history tracking deferred.
- **Play Again not shown on forfeit games** — by design.
- **Forfeit toast text** — always reads "You were forfeited from your last game after the reconnection window expired." regardless of whether forfeit was intentional. Fix: add `forfeit_reason` column (`'voluntary'` | `'disconnect'`), set at forfeit, branch toast text. Low user impact.
- **Stale `games` rows** — play-again chains can leave `status='active'` or `status='rps'` rows without a clean `status='complete'` write. `useActiveGame` may surface these as false resume prompts. Long-term fix: add `completed_at` column and filter on it.
- **Rewards fallback UX** — if edge function fails, user gets no feedback. Deferred (retry on login already handles eventual consistency).

---

## Key design decisions

- **Visual redesign is Phase 5**, not Phase 0.
- **Skin system is split:** code refactor is Phase 2; visual art direction is Phase 5.
- **Progression, achievements, and currency are one phase** (Phase 3).
- **AI improvement (Phase 1) comes before progression** because achievements reference difficulty levels.
- **Hand-coded AI only** — minimax with alpha-beta pruning for Hard.
- **Disconnect forfeit is written by the waiting player's client** (not a server function). Risk: double-disconnect leaves game stuck — cleanup deferred to Phase 7.
- **Grace period is 90 seconds** before auto-forfeit.
- **Intentional exits write forfeit immediately** (no grace period).

---

## Key files

| File                                              | Purpose                                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/models/Game.ts`                              | Core game logic — OOP, no React                                                                                                                                                      |
| `src/hooks/useGameLogic.ts`                       | React wrapper, `{ ...game }` spread for re-renders                                                                                                                                   |
| `src/hooks/useOnlineGame.ts`                      | Online game state — RPS polling (`rps_picks`, status=`'rps'`), game state polling (`games`, status=`'active'`), broadcast sync, `dismissRPSResult`, Presence, disconnect, Play Again |
| `src/hooks/useActiveGame.ts`                      | Active/forfeited game detection — re-queries on navigation                                                                                                                           |
| `src/lib/sounds.ts`                               | Web Audio API — `resumeAudio()` must be called on first user gesture                                                                                                                 |
| `src/lib/gameSerializer.ts`                       | `serializeGame` / `deserializeGame`                                                                                                                                                  |
| `src/lib/postGame.ts`                             | Post-game edge function call — explicit auth token header                                                                                                                            |
| `src/hooks/useProgression.ts`                     | XP/level/credits state + real-time subscription on `currency_balance`                                                                                                               |
| `src/hooks/useAchievements.ts`                    | Achievement fetch                                                                                                                                                                    |
| `src/hooks/usePlayerProfile.ts`                   | W/L/D state + real-time subscription on `player_stats`                                                                                                                              |
| `src/components/progression/PostGameModal.tsx`    | Post-game rewards modal                                                                                                                                                              |
| `src/components/ResumeGameToast.tsx`              | Resume + forfeit toast                                                                                                                                                               |
| `src/components/game/OnlineGameView.tsx`          | Online game UI — disconnect banner, forfeit modal, Play Again dots, audio, post-game call                                                                                            |
| `src/components/game/RPSScreen.tsx`               | RPS pick UI — accepts `onSubmitPick` callback; no direct Supabase writes                                                                                                             |
| `src/components/game/RPSResultScreen.tsx`         | RPS result screen — 3s auto-continue                                                                                                                                                 |
| `src/components/game/MatchmakingPage.tsx`         | Create/join game — lobby channel + SUBSCRIBED fallback                                                                                                                               |
| `src/components/GameWrapper.tsx`                  | Local/AI game UI                                                                                                                                                                     |
| `src/App.tsx`                                     | React Router v7, all routes                                                                                                                                                          |
| `src/ai/aiPlayer.ts`                              | AI difficulty module (Phase 1)                                                                                                                                                       |
| `src/contexts/SkinContext.tsx`                    | Skin context (Phase 2)                                                                                                                                                               |
| `src/contexts/AuthContext.tsx`                    | Auth state + deferred post-game retry on login                                                                                                                                       |
| `src/lib/rps.ts`                                  | RPS logic — pure functions                                                                                                                                                           |
| `supabase/functions/post-game-handler/index.ts`   | Edge function — XP, credits, achievements, W/L/D, idempotency, precomputed level thresholds                                                                                         |
| `src/hooks/useInventory.ts`                       | Fetches player-owned cosmetic items from `player_inventory` joined with `cosmetic_items`; filters by type client-side                                                               |
| `src/hooks/useLoadout.ts`                         | Reads/writes equipped avatar/badge/banner on `profiles`; optimistic update + server rollback                                                                                        |
| `src/components/profile/CustomisePage.tsx`        | `/customise` — 4 tabs (Avatar/Badge/Banner/Emoji), click-to-equip                                                                                                                  |
| `src/components/game/EmojiPanel.tsx`              | In-game emoji picker — shows owned emojis, sends via `sendEmoji`                                                                                                                   |
| `src/components/game/EmojiBubble.tsx`             | Floating emoji bubble, positioned absolute left/right of board                                                                                                                      |
| `supabase/migrations/20260520000001_phase4_schema.sql` | Loadout columns on profiles, cosmetic_items seed (2 each: avatar/badge/banner/emoji), inventory grants, RLS                                                              |
| `docs/plans/2026-03-18-product-roadmap-design.md` | Full approved product roadmap                                                                                                                                                        |
| `docs/plans/2026-03-19-testing-benchmarks.md`     | Live testing checklist                                                                                                                                                               |

---

## Credentials

`.env.local` is gitignored. It contains:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect)
- Vercel MCP
- GitHub MCP

---

## ⚠️ Incidents / lessons

**rm -rf incident:** Claude used `rm -rf` on directories in the main project, deleting tracked files. All restored via `git restore`. **Never use `rm -rf` on directories. Delete files individually by name. Use `rmdir /s /q` via `cmd /c` for directory removal on Windows.**

**Kill by PID, not taskkill /F /IM node.exe:** When stopping the dev server, kill by PID (`taskkill //F //PID <pid>`) rather than killing all node processes.

**Deploy by push, not Vercel CLI:** Vercel CLI is not available in the shell. Deploy by pushing to `AJHemmings/MEGA-OX-private` — `git push private main` from project root.

**Supabase MCP wrong account (2026-05-20):** The MCP OAuth token was bound to `adamjh84@outlook.com` (personal account), not the MEGA-OX project account. Every `apply_migration` and `execute_sql` call returned "permission denied". Fix: clear `accessToken`, `refreshToken`, and `expiresAt` in `C:\Users\ajhem\.claude\.credentials.json` under the `plugin:supabase:supabase` key, then run `/mcp` in Claude Code to re-authenticate via the OAuth browser flow with the correct account. The correct account owns project `qioxtkcjtvvkzcoupdfk`.

**RPS event-based system (Fixes 1–6) is a dead end:** Six separate attempts to fix RPS using broadcast + CDC refs all failed due to a non-deterministic race between broadcast delivery, CDC delivery, and draw-clear nulls. Do not attempt to revive this approach. The polling architecture (Fix 7) is the correct solution.

**Edge function `verify_jwt: true` does not fix 401s caused by missing auth headers:** The 401 was in the function's own auth logic, not the gateway. `verify_jwt: false` + explicit `Authorization: Bearer <token>` in the invoke call is the correct pattern for this project.

---

## Open questions (resolve at each phase's detail design)

- Currency name and branding
- Art direction for visual redesign
- Which profile items are free progression unlocks vs paid vs both
- Admin access control: private API vs direct Supabase RLS
- Bug reports: email notifications to admin on new submission?
