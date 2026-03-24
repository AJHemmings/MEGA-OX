# Broadcast Sync, Audio & Rematch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace DB-mediated move sync with Realtime broadcast for instant, reliable gameplay; add audio notifications; add Play Again flow.

**Architecture:** Move events broadcast peer-to-peer via Supabase Realtime channel (fast path). DB writes still happen per move as an authoritative checkpoint, but the UI no longer waits for the postgres_changes round-trip — each player applies the move locally on broadcast receipt. On reconnect, a fresh DB fetch reconciles any missed state. Audio uses Web Audio API (no assets). Play Again uses broadcast to redirect both players to a new game.

**Tech Stack:** TypeScript, React, Supabase Realtime (broadcast + presence + postgres_changes), Web Audio API

---

## Context: what currently happens vs. what will happen

**Before:** `placeMarker` writes to DB → postgres_changes fires (2 network hops) → UI updates. Moving player also waits for their own round-trip to see their marker.

**After:** `placeMarker` updates local state immediately → broadcasts serialized game state → opponent receives broadcast and updates their state. DB write happens async in the background as a checkpoint. Stale postgres_changes updates are ignored if local state is already ahead.

---

## Task 1: Store channel in a ref so `placeMarker` can broadcast

**File:** `src/hooks/useOnlineGame.ts`

The `channel` object is currently scoped inside `useEffect`. `placeMarker` is a `useCallback` outside the effect, so it can't access `channel`. Fix: store the channel in a `useRef`.

**Step 1: Add the channelRef**

At the top of the hook (alongside the other refs already there), add:

```typescript
const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
```

**Step 2: Assign the channel to the ref after creating it**

In the `useEffect`, after the channel is created and before `.subscribe()`, add:

```typescript
channelRef.current = channel;
```

The existing `const channel = supabase.channel(...)` block ends with `.subscribe(...)`. Insert the assignment like this:

```typescript
const channel = supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes', { ... }, handler)
  .on('presence', { event: 'join' }, handler)
  .on('presence', { event: 'leave' }, handler)
  .subscribe(async (status) => { ... });

channelRef.current = channel;
```

**Step 3: Clear the ref on cleanup**

In the `useEffect` return function, after `supabase.removeChannel(channel)`, add:

```typescript
channelRef.current = null;
```

**Step 4: Manual test — verify nothing broke**

Start dev server in the worktree (`npm start` from `F:\Projects\MEGA-OX\.worktrees\feat-disconnect-handling`), open two browser tabs, play a move. Should behave exactly as before.

**Step 5: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "refactor: store realtime channel in ref for placeMarker access"
```

---

## Task 2: Add broadcast receiver for move events

**File:** `src/hooks/useOnlineGame.ts`

Add a broadcast handler to the channel. When the opponent sends a `move` broadcast, apply their game state locally. This is the fast path that replaces waiting for postgres_changes.

**Step 1: Add the broadcast handler to the channel chain**

Inside the `useEffect`, add `.on('broadcast', ...)` to the channel chain, between the presence handlers and `.subscribe()`:

```typescript
.on('broadcast', { event: 'move' }, (payload: { payload: { state: any } }) => {
  if (payload.payload?.state) {
    setGame(deserializeGame(payload.payload.state));
  }
})
```

The full channel creation block now has 4 handlers: postgres_changes, presence join, presence leave, broadcast move.

**Step 2: Manual test**

No visible change yet (nothing is broadcasting). Move handling still works via postgres_changes as before.

**Step 3: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "feat: add broadcast listener for move events in useOnlineGame"
```

---

## Task 3: Optimistic local update + broadcast in `placeMarker`

**File:** `src/hooks/useOnlineGame.ts`

After placing a move, immediately update local game state and broadcast the new state. The DB write becomes fire-and-forget (still happens, but UI doesn't wait for it).

**Step 1: Update `placeMarker`**

Replace the body of `placeMarker` with this:

```typescript
const placeMarker = useCallback(async (microBoardIndex: number, cellIndex: number) => {
  if (!game || !user || !myMarker || status !== 'active') return false;

  const isMyTurn = (myMarker === 'X' && game.currentPlayerIndex === 0) ||
                   (myMarker === 'O' && game.currentPlayerIndex === 1);
  if (!isMyTurn) return false;

  const gameCopy = deserializeGame(serializeGame(game));
  const placed = gameCopy.placeMarker(microBoardIndex, cellIndex);
  if (!placed) return false;

  const newState = serializeGame(gameCopy);
  const isOver = gameCopy.isGameOver();
  const winnerValue = isOver ? gameCopy.macroBoard.winner || 'draw' : null;

  // 1. Update local state immediately — no waiting for DB round-trip
  setGame(gameCopy);

  // 2. Broadcast to opponent via channel (fast path)
  channelRef.current?.send({
    type: 'broadcast',
    event: 'move',
    payload: { state: newState },
  });

  // 3. Write to DB async — authoritative checkpoint, not the sync mechanism
  supabase.from('games').update({
    state: newState as any,
    next_player: gameCopy.currentPlayer.marker,
    next_micro_board: gameCopy.nextMicroBoardIndex,
    status: isOver ? 'complete' : 'active',
    winner: winnerValue,
  }).eq('id', gameId).then(({ error }) => {
    if (error) console.error('Move DB write failed:', error.message);
  });

  if (isOver) {
    await supabase.from('game_moves').insert({
      game_id: gameId,
      player_id: user.id,
      micro_board_index: microBoardIndex,
      cell_index: cellIndex,
      move_number: 0,
    });
  }

  return true;
}, [game, user, myMarker, status, gameId]);
```

Key changes from before:
- `setGame(gameCopy)` — local state updates immediately
- `channelRef.current?.send(...)` — broadcasts to opponent
- DB update uses `.then()` instead of `await` — fire and forget
- `game_moves` insert only happens on game over (was always `move_number: 0` anyway — deferred)

**Step 2: Manual test — two tabs**

Open two browser tabs. Make a move in tab 1. The marker should appear instantly in both tabs without any visible lag. The move should no longer require a DB round-trip to appear.

**Step 3: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "feat: optimistic local update and broadcast in placeMarker"
```

---

## Task 4: Guard postgres_changes against stale state overwrites

**File:** `src/hooks/useOnlineGame.ts`

With broadcast now updating state fast, a delayed postgres_changes event could arrive and overwrite a newer local state. Guard against this by tracking move count.

**Step 1: Add a move count ref**

Near the top of the hook (with other refs):

```typescript
const localMoveCountRef = useRef(0);
```

**Step 2: Increment when placing a move**

At the top of `placeMarker`, after validating it's our turn and the move is valid, add:

```typescript
localMoveCountRef.current += 1;
const thisMoveCount = localMoveCountRef.current;
```

**Step 3: Add a helper to count moves from serialized state**

Add this helper inside the hook (before the return):

```typescript
const countMoves = (state: any): number => {
  if (!state?.boards) return 0;
  return state.boards.flat().filter((m: string) => m !== '').length;
};
```

**Step 4: Guard the postgres_changes handler**

In the `postgres_changes` handler inside `useEffect`, wrap the `setGame` call:

```typescript
.on('postgres_changes', { ... }, (payload) => {
  const updated = payload.new as any;
  setStatus(updated.status);
  setWinner(updated.winner);
  setMyMarker(updated.player_x_id === user.id ? 'X' : 'O');
  setRpsCreatorPick(updated.rps_creator_pick);
  setRpsJoinerPick(updated.rps_joiner_pick);
  if (updated.player_o_id) setJoinerId(updated.player_o_id);
  if (updated.state && Object.keys(updated.state).length > 0) {
    // Only apply if the DB state is at least as current as our local state
    const dbMoveCount = countMoves(updated.state);
    if (dbMoveCount >= localMoveCountRef.current) {
      setGame(deserializeGame(updated.state));
      localMoveCountRef.current = dbMoveCount;
    }
  }
})
```

**Step 5: Initialise move count on load**

In `loadGame()`, after deserializing game state, set:

```typescript
if (data.state && Object.keys(data.state).length > 0) {
  const g = deserializeGame(data.state as any);
  setGame(g);
  localMoveCountRef.current = countMoves(data.state);
} else {
  setGame(new Game());
  localMoveCountRef.current = 0;
}
```

**Step 6: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "fix: guard postgres_changes from overwriting newer broadcast state"
```

---

## Task 5: Re-fetch game state on opponent reconnect

**File:** `src/hooks/useOnlineGame.ts`

When an opponent disconnects and reconnects, both clients should re-sync from the DB to ensure they share the same authoritative state.

**Step 1: Extract `loadGame` to a stable ref**

Currently `loadGame` is defined inside `useEffect` and can't be called from the Presence handler. Move it to a `useCallback` above the effect, or use a `useRef` to store it.

The cleanest approach: define a `fetchGameState` function with `useCallback` at the hook level, and call it both on mount and on reconnect.

Add above the `useEffect`:

```typescript
const fetchGameState = useCallback(async () => {
  if (!user || !gameId) return;
  const { data } = await supabase.from('games').select('*').eq('id', gameId).single();
  if (!data) return;
  setStatus(data.status as OnlineGameStatus);
  setMyMarker(data.player_x_id === user.id ? 'X' : 'O');
  setWinner(data.winner);
  setIsCreator(data.player_x_id === user.id);
  setRpsCreatorPick(data.rps_creator_pick);
  setRpsJoinerPick(data.rps_joiner_pick);
  setJoinerId(data.player_o_id);
  setOpponentId(data.player_x_id === user.id ? data.player_o_id : data.player_x_id);
  if (data.state && Object.keys(data.state).length > 0) {
    const g = deserializeGame(data.state as any);
    setGame(g);
    localMoveCountRef.current = countMoves(data.state);
  } else {
    setGame(new Game());
    localMoveCountRef.current = 0;
  }
}, [user, gameId]);
```

**Step 2: Replace the inline `loadGame` call in `useEffect`**

Replace `loadGame()` call with `fetchGameState()`.

**Step 3: Call `fetchGameState` in the Presence join handler**

In the `join` handler, after cancelling the disconnect timer, add:

```typescript
fetchGameState();
```

This ensures both players re-sync from DB whenever the opponent rejoins (whether after a disconnect or a cold start).

**Step 4: Add `fetchGameState` to `useEffect` dependency array**

The effect depends on `fetchGameState`, so include it:

```typescript
}, [gameId, user, fetchGameState]);
```

**Step 5: Commit**

```bash
git add src/hooks/useOnlineGame.ts
git commit -m "fix: re-fetch game state from DB on opponent reconnect"
```

---

## Task 6: Audio notifications

**Files:**
- Create: `src/lib/sounds.ts`
- Modify: `src/components/game/OnlineGameView.tsx`
- Modify: `src/components/GameWrapper.tsx` (for AI/local games)

Use the Web Audio API to generate sounds programmatically — no audio files needed. This avoids asset management and works in any browser.

**Step 1: Create `src/lib/sounds.ts`**

```typescript
// Web Audio API sound effects — no audio files needed.
// AudioContext must be created on user interaction, then reused.

let ctx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!ctx) ctx = new AudioContext();
  return ctx;
};

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  delay = 0
) => {
  const audioCtx = getCtx();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);

  gainNode.gain.setValueAtTime(gainValue, audioCtx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

  oscillator.start(audioCtx.currentTime + delay);
  oscillator.stop(audioCtx.currentTime + delay + duration);
};

// Short click — a marker was placed
export const playMarkerPlaced = () => {
  playTone(440, 0.08, 'square', 0.15);
};

// Rising two-note chime — it's your turn
export const playYourTurn = () => {
  playTone(523, 0.15, 'sine', 0.25);        // C5
  playTone(659, 0.2, 'sine', 0.25, 0.15);   // E5
};

// Three-note ascending fanfare — you won a micro board
export const playMicroBoardWon = () => {
  playTone(523, 0.12, 'sine', 0.3);
  playTone(659, 0.12, 'sine', 0.3, 0.13);
  playTone(784, 0.2, 'sine', 0.3, 0.26);
};

// Ascending arpeggio — game won
export const playGameWon = () => {
  [523, 659, 784, 1047].forEach((f, i) => {
    playTone(f, 0.18, 'sine', 0.3, i * 0.12);
  });
};

// Descending tone — game lost
export const playGameLost = () => {
  playTone(392, 0.2, 'sine', 0.25);
  playTone(330, 0.3, 'sine', 0.25, 0.22);
};
```

**Step 2: Wire audio into `OnlineGameView.tsx`**

Import sounds at the top:

```typescript
import {
  playMarkerPlaced,
  playYourTurn,
  playMicroBoardWon,
  playGameWon,
  playGameLost,
} from '../../lib/sounds';
```

Track previous game state to detect changes. Add these refs near the top of the component:

```typescript
const prevMicroWinnersRef = useRef<string[]>([]);
const prevIsMyTurnRef = useRef<boolean>(false);
const prevStatusRef = useRef<string>('loading');
```

Add a `useEffect` that fires whenever `game` or `status` changes:

```typescript
useEffect(() => {
  if (!game || !myMarker) return;

  // Marker placed — fires for both players on any state change during active game
  if (status === 'active' && prevStatusRef.current === 'active') {
    playMarkerPlaced();
  }

  // Micro board won — check if any new winners appeared
  const currentWinners = game.macroBoard.microBoards.map(mb => mb.winner);
  currentWinners.forEach((w, i) => {
    if (w && w !== '' && w !== prevMicroWinnersRef.current[i]) {
      playMicroBoardWon();
    }
  });
  prevMicroWinnersRef.current = currentWinners;

  // Your turn
  const currentIsMyTurn =
    (myMarker === 'X' && game.currentPlayerIndex === 0) ||
    (myMarker === 'O' && game.currentPlayerIndex === 1);
  if (currentIsMyTurn && !prevIsMyTurnRef.current && status === 'active') {
    playYourTurn();
  }
  prevIsMyTurnRef.current = currentIsMyTurn;

  // Game over
  if (status === 'complete' && prevStatusRef.current !== 'complete') {
    if (winner === myMarker) {
      playGameWon();
    } else if (winner && winner !== 'draw') {
      playGameLost();
    }
  }

  prevStatusRef.current = status;
}, [game, status, myMarker, winner]);
```

**Step 3: Wire audio into `GameWrapper.tsx` (local/AI games)**

Import in `GameWrapper.tsx`:

```typescript
import { playMarkerPlaced, playYourTurn, playMicroBoardWon, playGameWon } from '../lib/sounds';
```

In the existing `handleCellClick` or equivalent move handler (wherever `game.placeMarker` is called after a successful placement), call `playMarkerPlaced()`.

Find the AI move `useEffect` that triggers AI moves — after the AI places its move, call `playMarkerPlaced()`.

For micro board wins and game won, add a small `useEffect` watching `game` state changes (same pattern as above, minus the "your turn" chime for AI games where it's less relevant).

**Step 4: Manual test**

- Open two tabs, play moves — should hear click on each placement
- Wait for your turn — should hear two-note chime
- Win a micro board — should hear three-note fanfare
- Win/lose the game — appropriate sound

**Step 5: Commit**

```bash
git add src/lib/sounds.ts src/components/game/OnlineGameView.tsx src/components/GameWrapper.tsx
git commit -m "feat: add Web Audio API sound notifications for moves, turns, and game events"
```

---

## Task 7: Play Again (online)

**File:** `src/components/game/OnlineGameView.tsx`
**Also modifies:** `src/hooks/useOnlineGame.ts`

When a game ends, show a "Play Again" button. Clicking it creates a new game in the DB and broadcasts the new game ID to the opponent so both navigate there automatically.

**Architecture note:** We already have a live channel with broadcast capability. Broadcast the rematch offer — no DB schema changes needed. If the opponent has already left, the broadcast is lost, which is acceptable.

**Step 1: Add a `rematch` broadcast handler in `useOnlineGame.ts`**

Export a `rematch` function and a `rematchGameId` state. In the hook:

```typescript
const [rematchGameId, setRematchGameId] = useState<string | null>(null);
```

Add to the channel chain (alongside the existing `broadcast` handler for `move`):

```typescript
.on('broadcast', { event: 'rematch' }, (payload: { payload: { gameId: string } }) => {
  if (payload.payload?.gameId) {
    setRematchGameId(payload.payload.gameId);
  }
})
```

Add a `requestRematch` function:

```typescript
const requestRematch = useCallback(async () => {
  if (!user || !opponentId) return;

  // Determine player_x and player_o for the new game — swap who goes first (creator becomes joiner)
  const newPlayer_x = isCreator ? opponentId : user.id;
  const newPlayer_o = isCreator ? user.id : opponentId;

  const { data, error } = await supabase.from('games').insert({
    player_x_id: newPlayer_x,
    player_o_id: newPlayer_o,
    status: 'rps',
    created_by: user.id,
  }).select('id').single();

  if (error || !data) {
    console.error('Rematch game creation failed:', error?.message);
    return;
  }

  // Broadcast new game ID to opponent
  channelRef.current?.send({
    type: 'broadcast',
    event: 'rematch',
    payload: { gameId: data.id },
  });

  setRematchGameId(data.id);
}, [user, opponentId, isCreator, gameId]);
```

Add `rematchGameId` and `requestRematch` to the hook's return value.

**Step 2: Wire into `OnlineGameView.tsx`**

Destructure from `useOnlineGame`:

```typescript
const { ..., rematchGameId, requestRematch } = useOnlineGame(gameId);
```

Add a `useEffect` to auto-navigate when rematch game ID arrives:

```typescript
useEffect(() => {
  if (rematchGameId) {
    navigate(`/game/${rematchGameId}`);
  }
}, [rematchGameId, navigate]);
```

In the `status === 'complete'` block, add the Play Again button alongside "Back to Menu":

```typescript
{status === 'complete' && (
  <div style={{ ... }}>
    {wonByForfeit && winner === myMarker
      ? 'Your opponent disconnected. You win!'
      : getWinnerText()}
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={requestRematch}
        style={{ marginTop: '16px', padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: 10, border: '2px solid #00d4aa', backgroundColor: 'transparent', color: '#00d4aa', fontWeight: 'bold' }}
      >
        Play Again
      </button>
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

**Step 3: Manual test**

- Play a full game to completion
- Click "Play Again" on one tab — both tabs should navigate to the new game and enter RPS
- Click "Back to Menu" on the second tab — should navigate normally

**Step 4: Commit**

```bash
git add src/hooks/useOnlineGame.ts src/components/game/OnlineGameView.tsx
git commit -m "feat: Play Again — broadcast rematch flow, both players navigate to new game"
```

---

## Task 8: Build verification + live testing checklist

**Step 1: Run a production build to catch any TypeScript errors**

```bash
npm run build
```

Expected: clean build with no errors. Fix any TypeScript issues before continuing.

**Step 2: Commit any build fixes, then stop.**

Hand control back to the user for live testing. Do NOT update the handover yet.

---

## ⚠️ STOP — Live Testing Required Before Task 9

The following tests must be done by the user on the private Vercel deployment before the handover is updated.

**Deployment:** push `feat/disconnect-handling` to `AJHemmings/MEGA-OX-private` to trigger a build, then test at the private Vercel URL.

### Sync tests (two devices or two browsers, logged in as different users)

| # | Test | Expected |
|---|------|----------|
| 1 | Player A makes a move | Appears on Player B's screen instantly (no lag) |
| 2 | Player A makes a move, Player B makes a move | Both screens stay in sync, turns alternate correctly |
| 3 | Player B closes the tab mid-game, Player A makes a move | Move appears on A's screen immediately |
| 4 | Player B re-opens the game (via ResumeGameToast or direct URL) | B sees the current board state |
| 5 | Player A makes a move just as Player B reconnects | Move appears on both screens correctly |

### Audio tests

| # | Test | Expected |
|---|------|----------|
| 6 | Make a move | Short click sound |
| 7 | It becomes your turn | Two-note rising chime |
| 8 | Win a micro board | Three-note ascending fanfare |
| 9 | Win the game | Four-note arpeggio |
| 10 | Lose the game | Descending two-note tone |

### Play Again tests

| # | Test | Expected |
|---|------|----------|
| 11 | Game ends, Player A clicks "Play Again" | Both players navigate to new game, RPS screen shows |
| 12 | Game ends, Player A clicks "Back to Menu" | A navigates to menu, B stays on result screen |
| 13 | Game ends, both players click "Play Again" simultaneously | Both navigate to a new game (may create two new games — acceptable edge case for now) |

Report results back. Proceed to Task 9 only after testing is complete and any bugs are fixed.

---

## Task 9: Update handover

**Step 1: Update `docs/plans/RESTART-HANDOVER.md`**

Update the "Current state" and "What is built and working" sections to reflect:
- Broadcast sync is live (live testing bugs resolved)
- Audio notifications added
- Play Again added
- Status: ready for merge

**Step 2: Commit**

```bash
git add docs/plans/RESTART-HANDOVER.md
git commit -m "docs: update handover — broadcast sync, audio, rematch complete, live tested"
```

---

## Known limitations (not in scope for this plan)

- **Double-disconnect edge case** — already documented. If both players disconnect simultaneously, game stays `active`. Cleanup job planned for Phase 7.
- **Rematch if opponent left** — if the opponent navigated away before the game ended, the rematch broadcast won't reach them. They can still find the new game via ResumeGameToast if they're logged in (as it will show as an active game waiting for their join). This is acceptable for now.
- **`game_moves` table** — currently only inserts on game over. Full move-by-move history is deferred.
- **`useLoginStreak.ts` line 31** — `.single()` → `.maybeSingle()` 406 errors. Deferred.
