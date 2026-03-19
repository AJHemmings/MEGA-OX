# Disconnect Handling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Detect when an online multiplayer player leaves an active game, give them a 90-second reconnection window, auto-forfeit if they don't return, and surface a resume toast on all authenticated screens.

**Architecture:** Supabase Realtime Presence tracks live connections per game channel. The waiting player's client runs a 90-second countdown on disconnect and writes the forfeit on expiry. Intentional exits (back button, browser back) show a confirmation modal that writes forfeit immediately. A lightweight `useActiveGame` hook drives a persistent `ResumeGameToast` rendered across all authenticated screens.

**Tech Stack:** React, React Router v6 (`useBlocker`), Supabase Realtime Presence, TypeScript, inline CSS

**Branch:** Create a new worktree from `feat/phase-2-skins` — this work builds on Phase 2 code.

---

## Task 1: Supabase migration — add `forfeit_player_id`

**Files:**
- Create: `supabase/migrations/20260319000001_disconnect_forfeit.sql`
- Modify: `src/lib/database.types.ts`

**Step 1: Write the migration file**

```sql
-- supabase/migrations/20260319000001_disconnect_forfeit.sql
ALTER TABLE games
  ADD COLUMN forfeit_player_id uuid REFERENCES auth.users(id);
```

**Step 2: Run the migration**

Run this SQL in the Supabase dashboard SQL editor (Project: `qioxtkcjtvvkzcoupdfk`).
Expected: no error, column appears in `games` table schema.

**Step 3: Update database types**

In `src/lib/database.types.ts`, find the `games` row type and add:

```typescript
forfeit_player_id: string | null
```

Add it to both the `Row` and `Update` types for `games`. The `Insert` type can remain without it (defaults to null).

**Step 4: Commit**

```bash
git add supabase/migrations/20260319000001_disconnect_forfeit.sql src/lib/database.types.ts
git commit -m "feat: add forfeit_player_id column to games"
```

---

## Task 2: `useActiveGame` hook

**Files:**
- Create: `src/hooks/useActiveGame.ts`

**Step 1: Write the hook**

```typescript
// src/hooks/useActiveGame.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ActiveGameResult {
  activeGameId: string | null;
  forfeitedGameId: string | null;
}

export const useActiveGame = (userId: string | null): ActiveGameResult => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [forfeitedGameId, setForfeitedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      // Active or in-RPS game
      const { data: active } = await supabase
        .from('games')
        .select('id')
        .or(`player_x_id.eq.${userId},player_o_id.eq.${userId}`)
        .in('status', ['active', 'rps'])
        .limit(1)
        .maybeSingle();

      if (active) {
        setActiveGameId(active.id);
        return;
      }

      // Recently forfeited (last 30 minutes)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: forfeited } = await supabase
        .from('games')
        .select('id')
        .eq('forfeit_player_id', userId)
        .eq('status', 'complete')
        .gte('updated_at', thirtyMinAgo)
        .limit(1)
        .maybeSingle();

      if (forfeited) {
        setForfeitedGameId(forfeited.id);
      }
    };

    check();
  }, [userId]);

  return { activeGameId, forfeitedGameId };
};
```

**Step 2: Commit**

```bash
git add src/hooks/useActiveGame.ts
git commit -m "feat: add useActiveGame hook"
```

---

## Task 3: `ResumeGameToast` component

**Files:**
- Create: `src/components/ResumeGameToast.tsx`
- Modify: `src/components/layout/ProtectedRoute.tsx`

**Step 1: Write the component**

```tsx
// src/components/ResumeGameToast.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActiveGame } from '../hooks/useActiveGame';

const ResumeGameToast: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { activeGameId, forfeitedGameId } = useActiveGame(user?.id ?? null);

  // Don't show resume toast if already on that game's screen
  const isOnActiveGame = params.id && params.id === activeGameId;

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#2a3441',
    border: '1px solid #00d4aa',
    borderRadius: '12px',
    padding: '16px 20px',
    color: '#fff',
    zIndex: 1000,
    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
    maxWidth: '300px',
  };

  if (activeGameId && !isOnActiveGame) {
    return (
      <div style={toastStyle}>
        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#a0aec0' }}>
          You have an active game
        </p>
        <button
          onClick={() => navigate(`/game/${activeGameId}`)}
          style={{ background: '#00d4aa', border: 'none', borderRadius: '8px', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          Resume Game
        </button>
      </div>
    );
  }

  if (forfeitedGameId) {
    return (
      <div style={{ ...toastStyle, border: '1px solid #ff6b35' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#a0aec0' }}>
          You were forfeited from your last game after the reconnection window expired.
        </p>
      </div>
    );
  }

  return null;
};

export default ResumeGameToast;
```

**Step 2: Read ProtectedRoute**

Open `src/components/layout/ProtectedRoute.tsx` and read its current contents before editing.

**Step 3: Add ResumeGameToast to ProtectedRoute**

Import `ResumeGameToast` and render it alongside `<Outlet />`:

```tsx
import ResumeGameToast from '../ResumeGameToast';

// Inside the return, wrap Outlet with a fragment:
return (
  <>
    <Outlet />
    <ResumeGameToast />
  </>
);
```

**Step 4: Manual test**

Start the dev server. Log in. Verify no toast appears on the menu when no game is active.

**Step 5: Commit**

```bash
git add src/components/ResumeGameToast.tsx src/components/layout/ProtectedRoute.tsx
git commit -m "feat: add ResumeGameToast component"
```

---

## Task 4: Presence + grace period + forfeit write in `useOnlineGame`

**Files:**
- Modify: `src/hooks/useOnlineGame.ts`

This is the most complex task. Read the full current file before starting.

**Step 1: Add new state and refs**

Inside `useOnlineGame`, add after the existing state declarations:

```typescript
const [opponentConnected, setOpponentConnected] = useState(true);
const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
const [opponentId, setOpponentId] = useState<string | null>(null);
const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

**Step 2: Track opponentId in loadGame**

In the `loadGame` function, after setting `setJoinerId`, add:

```typescript
setOpponentId(data.player_x_id === user.id ? data.player_o_id : data.player_x_id);
```

**Step 3: Add Presence to the channel**

Replace the existing channel setup with Presence-aware version. The channel already subscribes to `postgres_changes`. Add `.on('presence', ...)` handlers before `.subscribe()`:

```typescript
const channel = supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'games',
    filter: `id=eq.${gameId}`
  }, (payload) => {
    // ... existing handler unchanged
  })
  .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
    const opponentJoined = newPresences.some((p: any) => p.user_id !== user.id);
    if (opponentJoined) {
      setOpponentConnected(true);
      // Cancel grace period timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setDisconnectCountdown(null);
    }
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
    const opponentLeft = leftPresences.some((p: any) => p.user_id !== user.id);
    if (opponentLeft) {
      setOpponentConnected(false);
      // Start 90-second countdown
      let remaining = 90;
      setDisconnectCountdown(remaining);
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setDisconnectCountdown(remaining);
        if (remaining <= 0 && countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }, 1000);
    }
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: user.id });
    }
  });
```

**Step 4: Add forfeit write effect**

Add a new `useEffect` after the existing RPS resolution effect:

```typescript
useEffect(() => {
  if (disconnectCountdown !== 0 || !myMarker || !opponentId || status !== 'active') return;

  const writeForfeit = async () => {
    await supabase.from('games').update({
      status: 'complete',
      winner: myMarker,
      forfeit_player_id: opponentId,
    }).eq('id', gameId);
  };

  writeForfeit();
}, [disconnectCountdown, myMarker, opponentId, status, gameId]);
```

**Step 5: Clean up timers on unmount**

Update the channel cleanup return to also clear timers:

```typescript
return () => {
  supabase.removeChannel(channel);
  if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
  if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
};
```

**Step 6: Expose new values in return**

Add `opponentConnected`, `disconnectCountdown`, and `opponentId` to the hook's return object:

```typescript
return { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator, opponentConnected, disconnectCountdown, opponentId };
```

**Step 7: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "feat: add Presence tracking and 90s grace period to useOnlineGame"
```

---

## Task 5: Disconnect UI in `OnlineGameView`

**Files:**
- Modify: `src/components/game/OnlineGameView.tsx`

**Step 1: Consume new hook values**

Update the destructure at line 34:

```typescript
const { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator, opponentConnected, disconnectCountdown } = useOnlineGame(gameId);
```

**Step 2: Add disconnect banner**

In the active game JSX, add a banner below the turn indicator div (after the `isMyTurn` block, before `<PlayerIndicator>`):

```tsx
{!opponentConnected && disconnectCountdown !== null && status === 'active' && (
  <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#ff6b3520', border: '1px solid #ff6b35', borderRadius: '10px', color: '#ff6b35', fontSize: '14px' }}>
    Opponent disconnected — forfeiting in {disconnectCountdown}s
  </div>
)}
```

**Step 3: Add disconnect win modal**

Replace the existing `status === 'complete'` block with one that distinguishes a disconnect win. Add a prop to track whether the win was from a forfeit. The simplest approach — check if the game was won while `opponentConnected` is false:

Add state at the top of the component:

```typescript
const [wonByForfeit, setWonByForfeit] = useState(false);
```

Add an effect that detects when status flips to complete while opponent was disconnected:

```typescript
useEffect(() => {
  if (status === 'complete' && !opponentConnected) {
    setWonByForfeit(true);
  }
}, [status, opponentConnected]);
```

Update the complete modal JSX:

```tsx
{status === 'complete' && (
  <div style={{ marginTop: 20, fontWeight: 'bold', fontSize: '20px', padding: '25px', backgroundColor: '#2a3441', borderRadius: '16px', border: '3px solid #00d4aa', color: '#00d4aa', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
    {wonByForfeit && winner === myMarker
      ? 'Your opponent disconnected. You win!'
      : getWinnerText()}
    <div>
      <button
        onClick={() => navigate('/menu')}
        style={{ marginTop: '16px', padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: 10, border: 'none', backgroundColor: '#00d4aa', color: '#fff', fontWeight: 'bold' }}
      >
        Back to Menu
      </button>
    </div>
  </div>
)}
```

**Step 4: Manual test**

Open two browser tabs. Start an online game. Close one tab. Verify the other sees the disconnect banner counting down from 90. After 90s, verify the win modal appears with the disconnect message.

**Step 5: Commit**

```bash
git add src/components/game/OnlineGameView.tsx
git commit -m "feat: add disconnect banner and forfeit win modal to OnlineGameView"
```

---

## Task 6: Intentional exit — forfeit confirmation modal

**Files:**
- Modify: `src/components/game/OnlineGameView.tsx`

**Step 1: Add modal state and forfeit handler**

Add at the top of the component, alongside existing state:

```typescript
const [showForfeitModal, setShowForfeitModal] = useState(false);
```

Add a forfeit handler:

```typescript
const handleForfeit = useCallback(async () => {
  if (!myMarker || !game) return;
  const opponentMarker = myMarker === 'X' ? 'O' : 'X'; // Unused here but clear intent
  await supabase.from('games').update({
    status: 'complete',
    winner: myMarker === 'X' ? 'O' : 'X', // Opponent wins
    forfeit_player_id: user?.id ?? null,
  }).eq('id', gameId);
  navigate('/menu');
}, [myMarker, game, gameId, navigate, user]);
```

Import `supabase` and `useAuth` at the top of the file if not already present.

**Step 2: Intercept the back button click**

Change the `← Menu` button's `onClick` from `() => navigate('/menu')` to:

```typescript
onClick={() => {
  if (status === 'active') {
    setShowForfeitModal(true);
  } else {
    navigate('/menu');
  }
}}
```

**Step 3: Add `useBlocker` for browser back**

Import `useBlocker` from `react-router-dom`. Add after the existing `useNavigate` call:

```typescript
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    status === 'active' && currentLocation.pathname !== nextLocation.pathname
);

useEffect(() => {
  if (blocker.state === 'blocked') {
    setShowForfeitModal(true);
  }
}, [blocker.state]);
```

**Step 4: Add `beforeunload` listener**

```typescript
useEffect(() => {
  if (status !== 'active') return;
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [status]);
```

**Step 5: Add the modal JSX**

Add inside the main return, as the first child of the outer div:

```tsx
{showForfeitModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
    <div style={{ background: '#2a3441', borderRadius: '16px', padding: '32px', maxWidth: '320px', textAlign: 'center', border: '1px solid #ff6b35' }}>
      <h3 style={{ color: '#fff', margin: '0 0 12px' }}>Leave game?</h3>
      <p style={{ color: '#a0aec0', margin: '0 0 24px', fontSize: '14px' }}>
        Leaving this game will forfeit it. Your opponent wins.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => {
            if (blocker.state === 'blocked') blocker.reset?.();
            setShowForfeitModal(false);
          }}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3a4a5a', background: 'transparent', color: '#a0aec0', cursor: 'pointer' }}
        >
          Stay
        </button>
        <button
          onClick={async () => {
            if (blocker.state === 'blocked') blocker.proceed?.();
            await handleForfeit();
          }}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ff6b35', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Forfeit & Leave
        </button>
      </div>
    </div>
  </div>
)}
```

**Step 6: Manual test**

- Start an online game. Click `← Menu`. Verify modal appears. Click "Stay" — verify game continues. Click `← Menu` again, click "Forfeit & Leave" — verify opponent's screen shows them winning.
- Start a game. Press browser back button. Verify modal appears.
- Start a game. Try closing the tab — verify browser shows native "are you sure?" prompt.

**Step 7: Commit**

```bash
git add src/components/game/OnlineGameView.tsx
git commit -m "feat: add forfeit confirmation modal, useBlocker, and beforeunload to OnlineGameView"
```

---

## Task 7: Update RESTART-HANDOVER.md

Update `docs/plans/RESTART-HANDOVER.md` to reflect:
- Disconnect handling feature added (design doc + implementation plan exist)
- Phase 2 worktree status (still awaiting merge to local main)
- Note the new column in `games` table (`forfeit_player_id`)

```bash
git add docs/plans/RESTART-HANDOVER.md
git commit -m "docs: update handover — disconnect handling designed and planned"
```
