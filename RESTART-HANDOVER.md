# RESTART-HANDOVER — Mega OX

> Paste the contents of this file as your first message in a new Claude Code session.

---

## Session start prompt

I'm resuming work on Mega OX — an Ultimate Naughts & Crosses game built with React (CRA), TypeScript, Supabase, and deployed on Vercel. Please read this handover doc fully before we proceed.

---

## Current state (as of 2026-06-23)

**Active branch:** `feat/phase9-friends`
**Worktree:** `F:\Projects\MEGA-OX\.worktrees\phase9-friends`
**Main branch:** `main` (Phases 1–8 complete, smoke tested, live)
**Vercel production:** `https://mega-ox.vercel.app`
**Supabase project:** `qioxtkcjtvvkzcoupdfk`

---

## IMMEDIATE NEXT STEPS

Phase 9 is **fully implemented and pushed**. The Vercel preview build for `feat/phase9-friends` is in progress — ESLint errors that blocked the previous build were fixed in commit `98a5760`.

### 1. Verify matchmaking works end-to-end

Open two browser tabs, log in as two different accounts, and:
- Both navigate to `/multiplayer` → click "Find Opponent" (Ranked mode)
- Both click Search
- Expect: both reach the "Opponent Found" confirming screen within ~5 seconds
- Accept on both → expect navigation to `/game/:id` (RPS screen)
- Test decline: one player declines → decliner goes to `/multiplayer`; accepter should re-queue automatically

**If matching still fails:** check browser console for errors. The likely remaining issue is that `matchmaking_queue` Realtime UPDATE events need `REPLICA IDENTITY FULL` — apply this migration if needed:
```sql
ALTER TABLE matchmaking_queue REPLICA IDENTITY FULL;
```

### 2. Smoke test the full Phase 9 feature set

- 👥 icon appears in nav bar for logged-in users
- Drawer opens with Friends / Leaderboard tabs
- Search a username → results appear (excludes self + existing friends)
- Send friend request → "Sent ✓" state; other user sees badge on 👥 icon
- Accept request → friend appears with correct presence dot (green/amber/grey)
- 🏆 tab → friends-only leaderboard ranked by XP
- Play an online game → friend shows amber "In game" status
- Post-game modal → "➕ Add Friend" button for non-friend opponent
- Friends list ⋮ menu → Challenge sends invite; other user sees "Game Invites" in drawer
- Accepting a challenge navigates both players to the game

### 3. Open PR and merge

```bash
gh pr create --title "feat: Phase 9 — Friends, Matchmaking, and Game Invites" \
  --body "..."
```
Merge `feat/phase9-friends` → `main`, then invoke `superpowers:finishing-a-development-branch`.

---

## Phase 9 — what was built

### DB migrations applied to production Supabase

| Migration | What it does |
|---|---|
| `create_friendships_table` | `friendships` table + RLS + unique pair index |
| `create_friends_rpcs` | `send_friend_request`, `respond_to_friend_request`, `get_friends_leaderboard` (SECURITY DEFINER) |
| `create_game_invites` | `game_invites` table + RLS + `send_game_invite`, `respond_to_game_invite` RPCs |
| `rebuild_matchmaking_queue` | Dropped old schema, rebuilt with `user_id`, `match_type`, `status`, `game_id`, `initial_state` |
| `add_ranked_match_type` | Added `'ranked'` to `games.match_type` CHECK constraint |
| `fix_games_status_and_clear_stale_queue` | Added `'cancelled'` and `'forfeit'` to `games.status` CHECK; cleared stale test entries |
| `join_matchmaking_queue` RPC | `pg_advisory_xact_lock`-protected atomic pair-and-create; returns `out_game_id` + `out_opponent_id` |
| `leave_matchmaking_queue` RPC | Deletes caller's `'searching'` entry |
| `confirm_match` RPC | Sets `mm_x_confirmed`/`mm_o_confirmed` on game row; transitions to `'rps'` or `'cancelled'` |
| `add_mm_columns_to_games` | `mm_x_confirmed BOOLEAN`, `mm_o_confirmed BOOLEAN` columns on `games` |

### New files (feat/phase9-friends)

- `src/contexts/PresenceContext.tsx` — joins `presence:global` channel, exposes `presenceMap` + `broadcastStatus`
- `src/hooks/useFriends.ts` — friend CRUD + Realtime sub on friendships table
- `src/hooks/useGameInvites.ts` — send/cancel/accept/decline game invites; Realtime sub
- `src/components/friends/FriendsDrawer.tsx` — slide-in panel, tabs (Friends / Leaderboard)
- `src/components/friends/FriendsList.tsx` — sorted by presence, status dots, ⋮ menu (challenge/remove/block/report)
- `src/components/friends/AddFriendSearch.tsx` — debounced username search, excludeIds
- `src/components/friends/PendingRequests.tsx` — incoming friend requests accept/decline
- `src/components/friends/FriendsLeaderboard.tsx` — calls `get_friends_leaderboard` RPC
- `src/components/friends/IncomingChallenges.tsx` — incoming game invites in drawer

### Modified files

- `src/App.tsx` — `AppShell` inner component (consumes `useAuth()` inside `AuthProvider`); `PresenceProvider`; friends icon + pending badge
- `src/hooks/useOnlineGame.ts` — `broadcastStatus('in_game', gameId)` on start; `broadcastStatus('online')` on end
- `src/components/progression/PostGameModal.tsx` — `opponentId?` prop; Add Friend button with friendship check
- `src/components/game/OnlineGameView.tsx` — passes `opponentId` to PostGameModal
- `src/components/game/MatchmakingPage.tsx` — full rewrite: real matchmaking (searching → confirming → game), dot indicators, accept/decline flow, re-queue on opponent decline
- `src/lib/database.types.ts` — regenerated after mm_ columns and constraint changes

### Critical implementation detail: mountedRef pattern

`MatchmakingPage.tsx` uses `mountedRef` (a `useRef(true)`) to guard all async callbacks. The unmount effect has this structure:

```typescript
useEffect(() => {
  mountedRef.current = true; // ← body resets it on EVERY (re)mount
  return () => {
    mountedRef.current = false;
    queueChannelRef.current?.unsubscribe();
    mmGameChannelRef.current?.unsubscribe();
  };
}, []);
```

The body line is critical. Without it, React StrictMode's fake-unmount sets `mountedRef.current = false`, and on remount it stays false, silently killing all async callbacks (including the RPC that enters the queue). This was the root cause of "not finding game" in development.

---

## Systems live on main

- Guest landing page + demo game
- Auth: sign up, login, sign out, Google OAuth, forgot password, reset password (/reset-password)
- Network multiplayer — core, disconnect, broadcast sync, audio, Play Again, RPS (Fixes 7–12)
- Local 2-player, single-player vs AI (Easy/Medium/Hard), tutorial
- User profiles, leaderboard, stat tracking
- Skin system scaffolding (Phase 2)
- XP/levels, credits, achievements, post-game modal (Phase 3)
- Profile customisation (/customise), in-game emoji (Phase 4)
- Dark glassmorphism redesign, design tokens, shared components (Phase 5)
- Cash shop at /shop (Phase 6)
- Admin dashboard at /admin — skins/achievements/emojis/shop/AI-tuner (Phase 7)
- Admin Debug FAB, BackButton, ProgressionContext, default items on signup, OnlineGameView split
- Stale game cleanup via pg_cron
- Bug report system — in-game modal, MainMenu link, admin panel at /admin/bugs (Phase 8)
- Forgot password + /reset-password page (Phase 8 session patch)

---

## Key architecture reminders

- State routing in `App.tsx` — `currentState` string, not React Router for game states
- All styling is inline CSS — no CSS framework
- `Game` mutates in place; `useGameLogic` does `setGame({ ...game })` to trigger re-renders
- Board indexing: flat 9-element arrays, row/col via `Math.floor(i/3)` and `i%3`
- Supabase MCP calls (`apply_migration`, `execute_sql`) must run in the main session — never delegate to subagents
- Never `rm -rf` tracked project dirs; kill dev server by PID not `taskkill /IM`
- Deploy by git push, not Vercel CLI
- Always add `colorScheme: 'dark'` to any `<select>` element in this project
- Worktrees don't inherit `.env.local` — copy it manually when creating a new worktree
