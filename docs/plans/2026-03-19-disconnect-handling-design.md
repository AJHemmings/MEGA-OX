# Disconnect Handling — Design Doc
*2026-03-19*

## Problem

Players can navigate away from an active online game without consequence. The opponent is left stuck with no way to know what happened, and the disconnected player has no way back unless they use browser history. There is no forfeit mechanism and no reconnection window.

---

## Scope

This design covers online multiplayer only. Local 2-player and single-player vs AI are unaffected.

---

## Disconnection Detection — Supabase Realtime Presence

Both players are already subscribed to a Realtime channel per game in `useOnlineGame.ts`. Presence tracking is added to that same channel — no new channel required.

Each player registers their user ID as their presence state when they mount the game view. Supabase automatically removes their presence entry when they disconnect, regardless of cause (tab close, browser crash, navigation, mobile app switch).

When a player's presence drops, the waiting player's client starts a **90-second grace period timer**. If the disconnected player remounts the game view before 90 seconds, their presence reappears and the timer is cancelled. If the timer expires, the waiting player's client writes the forfeit.

**Forfeit write (on timer expiry):**
```
status: 'complete'
winner: <waiting player's marker>
forfeit_player_id: <disconnected player's user ID>
```

The forfeit is written by the **waiting player's client**, not a server function. This is safe because only one player is ever waiting. Edge case: if both players disconnect simultaneously, the game is left in `active` state indefinitely. This is acceptable for this phase and can be addressed by a cleanup job later.

---

## Leaving the Game

Three exit types with different treatments:

### In-game back button
`OnlineGameView.tsx` back button is intercepted. A confirmation modal appears:

> *"Leaving this game will forfeit it. Your opponent wins. Are you sure?"*

- **Confirm** — leaving player writes forfeit immediately (no grace period — intentional exit), then navigates to menu.
- **Cancel** — nothing happens, game continues.

### Browser back button
React Router v6's `useBlocker` hook is activated while the game is in `active` or `rps` status. Any navigation attempt triggers the same confirmation modal as above. Confirmed forfeit writes immediately.

### Tab close / browser crash
`window.beforeunload` is registered to show the browser's native "are you sure?" prompt. Custom text is not possible in modern browsers. The real handling falls to Presence — the opponent's 90-second timer starts automatically. No code change can prevent a crash; Presence covers it.

**Rule:** Intentional exits (button, browser back with confirmation) → immediate forfeit write. Unintentional exits (crash, accidental close) → 90-second grace period via Presence.

---

## Resume Game Toast

**`useActiveGame` hook** — runs on every authenticated screen. Queries `games` for any row where the current user is `player_x_id` or `player_o_id` and `status` is `active` or `rps`. Returns the game ID or null.

**`ResumeGameToast` component** — fixed-position toast (bottom-right) rendered once in `App.tsx` inside the authenticated route wrapper. Visible on every screen. Disappears when the user is already on that game's screen. Shows:

> *"You have an active game"* — **[Resume]** button → navigates to `/game/{id}`

The query runs on mount of each screen — if a game starts while the user is already on another screen, the toast won't appear until they navigate. Acceptable for this phase.

---

## Forfeit Notification (Disconnected Player)

When the disconnected player returns to any authenticated screen, `useActiveGame` is extended to also check: is there a completed game in the last 30 minutes where `forfeit_player_id = my user ID`?

If yes, a one-time notification appears on the menu:

> *"You were forfeited from your last game after the reconnection window expired."*

Time-bounded to 30 minutes — no acknowledgement flag, no extra DB writes. The notification naturally falls away once the window passes.

---

## Data Model Changes

One new column on the `games` table:

```sql
ALTER TABLE games ADD COLUMN forfeit_player_id uuid REFERENCES auth.users(id);
```

No other schema changes. Presence is Realtime-only and leaves no DB footprint.

---

## Components Affected

| File | Change |
|---|---|
| `src/hooks/useOnlineGame.ts` | Add Presence join/leave tracking, 90s grace timer, forfeit write on expiry |
| `src/components/game/OnlineGameView.tsx` | Forfeit confirmation modal, `useBlocker`, `beforeunload` |
| `src/hooks/useActiveGame.ts` | New hook — query for active or recently-forfeited game |
| `src/components/ResumeGameToast.tsx` | New component — toast + resume button |
| `src/App.tsx` | Render `ResumeGameToast` inside authenticated route wrapper |
| `supabase/migrations/` | Add `forfeit_player_id` column to `games` |

---

## Out of Scope

- Disconnect handling for local 2-player or single-player vs AI
- Server-side forfeit enforcement (Edge Functions) — client-side is sufficient for this phase
- Cleanup job for games stuck in `active` due to double-disconnect — Phase 7 (admin dashboard)
- Recording disconnect forfeit in achievement/stats system — Phase 3
