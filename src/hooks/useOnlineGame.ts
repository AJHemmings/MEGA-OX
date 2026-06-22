import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Game } from '../models/Game';
import { deserializeGame, serializeGame, SerializedState } from '../lib/gameSerializer';
import { useAuth } from '../contexts/AuthContext';
import { resolveRPS, RPSPick } from '../lib/rps';
import { usePresenceContext } from '../contexts/PresenceContext';

export type OnlineGameStatus = 'loading' | 'waiting' | 'rps' | 'active' | 'complete';
export type RematchIntent = 'play_again' | 'back_to_menu';

const countMoves = (state: SerializedState | null | undefined): number => {
  if (!state?.boards) return 0;
  return state.boards.flat().filter((m: string) => m !== '').length;
};

// Status can only move forward. Prevents a late/out-of-order postgres_changes event
// (e.g. status='rps' arriving after status='complete') from rewinding the game state.
const STATUS_ORDER: Record<OnlineGameStatus, number> = {
  loading: 0, waiting: 1, rps: 2, active: 3, complete: 4,
};
const advanceStatus = (prev: OnlineGameStatus, next: string): OnlineGameStatus => {
  const nextTyped = next as OnlineGameStatus;
  return STATUS_ORDER[nextTyped] > STATUS_ORDER[prev] ? nextTyped : prev;
};

export const useOnlineGame = (gameId: string) => {
  const { user } = useAuth();
  const { broadcastStatus } = usePresenceContext();
  const [game, setGame] = useState<Game | null>(null);
  const [status, setStatus] = useState<OnlineGameStatus>('loading');
  const [myMarker, setMyMarker] = useState<'X' | 'O' | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  // rpsResultPicks drives the result screen — set by the rps_picks polling effect.
  const [rpsResultPicks, setRpsResultPicks] = useState<{ creator: RPSPick; joiner: RPSPick } | null>(null);
  // Increments on each draw round — used as key on RPSScreen to force remount and reset its
  // internal myPick/waiting state so the player can pick again cleanly.
  const [rpsRound, setRpsRound] = useState(0);
  const [isPlayerX, setIsPlayerX] = useState(false);
  const [joinerId, setJoinerId] = useState<string | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [rematchGameId, setRematchGameId] = useState<string | null>(null);
  const [forfeitPlayerId, setForfeitPlayerId] = useState<string | null>(null);
  const [myRematchIntent, setMyRematchIntent] = useState<RematchIntent | null>(null);
  const [opponentRematchIntent, setOpponentRematchIntent] = useState<RematchIntent | null>(null);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [opponentEmoji, setOpponentEmoji] = useState<string | null>(null);
  const myEmojiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentEmojiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localMoveCountRef = useRef(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const gameRef = useRef<Game | null>(null);
  const rematchCreatedRef = useRef(false);
  // Tracks the gameId that was active when the setup effect last ran.
  // Used by fetchGameState to detect and discard in-flight results from a
  // previous game — the polling fallback can dispatch a fetch just before
  // cleanup fires, and that stale result must not overwrite new-game state.
  const currentGameIdRef = useRef<string>(gameId);

  // Keep gameRef in sync so event handlers can read latest game state without stale closure
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Broadcast presence status when game transitions to active or complete.
  // A single effect on `status` covers all paths (RPS resolution, postgres_changes, broadcast).
  useEffect(() => {
    if (status === 'active') {
      broadcastStatus('in_game', gameId);
    } else if (status === 'complete') {
      broadcastStatus('online');
    }
  }, [status, gameId, broadcastStatus]);

  const fetchGameState = useCallback(async () => {
    if (!user || !gameId) return;
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error) console.error('fetchGameState failed:', error.message);
    if (!data) return;
    // Discard stale results — the polling fallback can dispatch a fetch just before gameId
    // changes, and that async call may resolve after the component has navigated to a new game.
    if (currentGameIdRef.current !== gameId) return;
    setStatus(data.status as OnlineGameStatus);
    setMyMarker(data.player_x_id === user.id ? 'X' : 'O');
    setWinner(data.winner);
    setIsPlayerX(data.player_x_id === user.id);
    setJoinerId(data.player_o_id);
    setOpponentId(data.player_x_id === user.id ? data.player_o_id : data.player_x_id);
    setForfeitPlayerId(data.forfeit_player_id ?? null);
    // Rematch intent — restore on reconnect
    const myIntent = data.player_x_id === user.id ? data.rematch_x_intent : data.rematch_o_intent;
    const opIntent = data.player_x_id === user.id ? data.rematch_o_intent : data.rematch_x_intent;
    if (myIntent) setMyRematchIntent(myIntent as RematchIntent);
    if (opIntent) setOpponentRematchIntent(opIntent as RematchIntent);
    if (data.rematch_game_id) setRematchGameId(data.rematch_game_id);
    if (data.state && Object.keys(data.state).length > 0) {
      const dbMoveCount = countMoves(data.state as unknown as SerializedState);
      // Only apply DB state if it's at least as current as local — prevents overwriting a
      // more recent broadcast state that landed before this fetch resolved
      if (dbMoveCount >= localMoveCountRef.current) {
        const g = deserializeGame(data.state as any);
        setGame(g);
        localMoveCountRef.current = dbMoveCount;
      }
    } else {
      setGame(new Game());
      localMoveCountRef.current = 0;
    }
  }, [user, gameId]);

  // Called by OnlineGameView when the result screen is dismissed.
  const dismissRPSResult = useCallback((wasDraw: boolean) => {
    setRpsResultPicks(null);
    if (wasDraw) {
      setRpsRound(r => r + 1);
    } else {
      fetchGameState();
    }
  }, [fetchGameState]);

  // RPS resolution via dedicated rps_picks table.
  //
  // Each player upserts their pick into rps_picks(game_id, user_id, pick).
  // Both clients poll every 1s. When both rows appear, each client independently computes
  // the result and shows the result screen (deterministic — both get the same answer).
  //
  // Creator resolves after a 2s delay (gives joiner's poll one full cycle to see both rows),
  // then deletes the picks and updates the game if needed. Joiner's next poll sees 0 rows
  // and calls fetchGameState to sync the new status.
  //
  // Re-runs on rpsRound so each draw round gets a fresh capturedThisRound flag.
  useEffect(() => {
    if (status !== 'rps' || !gameId || !user) return;
    let capturedThisRound = false;

    const poll = async () => {
      if (capturedThisRound) return;
      const { data: picks } = await (supabase as any)
        .from('rps_picks')
        .select('user_id, pick')
        .eq('game_id', gameId) as { data: Array<{ user_id: string; pick: string }> | null };
      if (!picks) return;

      if (picks.length === 2) {
        capturedThisRound = true;
        const myRow = picks.find((p: any) => p.user_id === user.id);
        const opponentRow = picks.find((p: any) => p.user_id !== user.id);
        if (!myRow || !opponentRow) return;

        const creatorPick = isPlayerX ? myRow.pick : opponentRow.pick;
        const joinerPick  = isPlayerX ? opponentRow.pick : myRow.pick;
        setRpsResultPicks({ creator: creatorPick as RPSPick, joiner: joinerPick as RPSPick });

        if (isPlayerX) {
          // Wait 2s so the joiner's poll has time to see both rows before we delete them.
          await new Promise(r => setTimeout(r, 2000));
          const result = resolveRPS(creatorPick as RPSPick, joinerPick as RPSPick);
          if (result === 'draw') {
            // Delete picks — both clients see 0 rows → dismissRPSResult → rpsRound++ → new round
            await (supabase as any).from('rps_picks').delete().eq('game_id', gameId);
          } else {
            const creatorWins = result === 'p1';
            const newPlayerXId = creatorWins ? user.id : joinerId!;
            const newPlayerOId = creatorWins ? joinerId! : user.id;
            const updatePayload: Record<string, any> = { status: 'active' };
            if (!creatorWins) {
              updatePayload.player_x_id = newPlayerXId;
              updatePayload.player_o_id = newPlayerOId;
            }
            // Update game first so joiner's fetchGameState sees the new status
            await supabase.from('games').update(updatePayload).eq('id', gameId);
            await (supabase as any).from('rps_picks').delete().eq('game_id', gameId);
            // Advance creator's own state without waiting for CDC
            setStatus(prev => advanceStatus(prev, 'active'));
            setMyMarker(newPlayerXId === user.id ? 'X' : 'O');
          }
        }
        return;
      }

      // 0 picks and no result shown yet — sync in case status moved past rps on the DB
      if (picks.length === 0 && !capturedThisRound) {
        fetchGameState();
      }
    };

    const interval = setInterval(poll, 1000);
    poll();
    return () => { clearInterval(interval); capturedThisRound = true; };
  }, [status, gameId, user, isPlayerX, joinerId, rpsRound, fetchGameState]);

  useEffect(() => {
    if (!user || !gameId) return;
    currentGameIdRef.current = gameId;
    rematchCreatedRef.current = false;
    // Reset rematch intents so stale 'play_again' values from the previous game
    // don't trigger spurious game creation on the next game's first render.
    setMyRematchIntent(null);
    setOpponentRematchIntent(null);
    setRpsRound(0);
    // Reset rematchGameId so the auto-navigate effect on the new game doesn't
    // fire with a stale ID and poison rematchNavFiredRef before the real rematch is created.
    setRematchGameId(null);

    fetchGameState();

    // Subscribe to realtime changes on this game row
    const channel = supabase
      .channel(`game:${gameId}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        const updated = payload.new as any;
        setStatus(prev => advanceStatus(prev, updated.status));
        setWinner(updated.winner);
        setMyMarker(updated.player_x_id === user.id ? 'X' : 'O');
        setForfeitPlayerId(updated.forfeit_player_id ?? null);
        // opponentId must be updated here too — creator has null until joiner joins
        setOpponentId(updated.player_x_id === user.id ? updated.player_o_id : updated.player_x_id);
        if (updated.player_o_id) setJoinerId(updated.player_o_id);
        // Rematch intent via DB — reliable alternative to broadcast when WebSocket is degraded
        const pgMyIntent = updated.player_x_id === user.id ? updated.rematch_x_intent : updated.rematch_o_intent;
        const pgOpIntent = updated.player_x_id === user.id ? updated.rematch_o_intent : updated.rematch_x_intent;
        if (pgMyIntent) setMyRematchIntent(pgMyIntent as RematchIntent);
        if (pgOpIntent) setOpponentRematchIntent(pgOpIntent as RematchIntent);
        if (updated.rematch_game_id) setRematchGameId(updated.rematch_game_id);
        if (updated.state && Object.keys(updated.state).length > 0) {
          // Only apply if the DB state is at least as current as our local state
          const dbMoveCount = countMoves(updated.state);
          if (dbMoveCount >= localMoveCountRef.current) {
            setGame(deserializeGame(updated.state));
            localMoveCountRef.current = dbMoveCount;
          }
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
        const opponentPresence = newPresences.find((p: any) => p.user_id !== user.id);
        if (opponentPresence) {
          setOpponentConnected(true);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setDisconnectCountdown(null);
          // Pick up any Play Again intent the opponent already signalled
          if (opponentPresence.rematch_intent) {
            setOpponentRematchIntent(opponentPresence.rematch_intent as RematchIntent);
          }
          // Broadcast current game state to the reconnecting player — more reliable than a
          // DB fetch since async move writes may not have landed yet
          if (gameRef.current) {
            const g = gameRef.current;
            const isGameOver = g.isGameOver();
            channel.send({
              type: 'broadcast',
              event: 'move',
              payload: {
                state: serializeGame(g),
                isOver: isGameOver,
                winner: isGameOver ? (g.macroBoard.winner || 'draw') : null,
              },
            });
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        // Called whenever any presence changes (including track() updates from other clients).
        // Use this to pick up Play Again intent that arrived while we weren't watching a join.
        const presences = Object.values(channel.presenceState()).flat() as any[];
        const opponentPresence = presences.find((p: any) => p.user_id !== user.id);
        if (opponentPresence?.rematch_intent) {
          setOpponentRematchIntent(opponentPresence.rematch_intent as RematchIntent);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
        const opponentLeft = leftPresences.some((p: any) => p.user_id !== user.id);
        if (!opponentLeft) return;
        // Check if opponent still has any active presence entries (quick reconnect case).
        // Supabase fires leave for the old session ref even if a new session already joined.
        const currentPresences = Object.values(channel.presenceState()).flat() as any[];
        const opponentStillPresent = currentPresences.some((p: any) => p.user_id !== user.id);
        if (opponentStillPresent) return;
        setOpponentConnected(false);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
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
      })
      .on('broadcast', { event: 'move' }, (payload: { payload: { state: SerializedState; isOver?: boolean; winner?: string | null } }) => {
        if (payload.payload?.state) {
          const incomingCount = countMoves(payload.payload.state);
          if (incomingCount >= localMoveCountRef.current) {
            setGame(deserializeGame(payload.payload.state));
            localMoveCountRef.current = incomingCount;
          }
          // Update status/winner immediately from broadcast — don't wait for postgres_changes
          // so both players see the complete screen at the same time
          if (payload.payload.isOver) {
            setStatus('complete');
            if (payload.payload.winner !== undefined) setWinner(payload.payload.winner);
          }
        }
      })
      .on('broadcast', { event: 'rematch' }, (payload: { payload: { gameId: string } }) => {
        if (payload.payload?.gameId) {
          setRematchGameId(payload.payload.gameId);
        }
      })
      .on('broadcast', { event: 'rematch_intent' }, (payload: { payload: { intent: RematchIntent } }) => {
        if (payload.payload?.intent) {
          setOpponentRematchIntent(payload.payload.intent);
        }
      })
      .on('broadcast', { event: 'emoji' }, ({ payload }: { payload: { player_id: string; emoji: string } }) => {
        if (payload.player_id !== user?.id) {
          if (opponentEmojiTimerRef.current) clearTimeout(opponentEmojiTimerRef.current);
          setOpponentEmoji(payload.emoji);
          opponentEmojiTimerRef.current = setTimeout(() => setOpponentEmoji(null), 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id });
        }
      });

    channelRef.current = channel;

    return () => {
      // Fire-and-forget: player is leaving the game, mark them online again.
      // Must come before removeChannel; no setState calls after this point.
      broadcastStatus('online');
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (myEmojiTimerRef.current) clearTimeout(myEmojiTimerRef.current);
      if (opponentEmojiTimerRef.current) clearTimeout(opponentEmojiTimerRef.current);
    };
  }, [gameId, user, fetchGameState, broadcastStatus]);

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

  // Game state polling — independent of broadcast/CDC and the RPS polling.
  // Polls the games table every 1.5s while active so move delivery is guaranteed
  // even if a Realtime broadcast or postgres_changes event is missed.
  // Uses strict > so a local move that hasn't landed in DB yet is never overwritten.
  useEffect(() => {
    if (status !== 'active' || !gameId || !user) return;
    const poll = async () => {
      const { data } = await supabase
        .from('games')
        .select('state, status, winner')
        .eq('id', gameId)
        .single();
      if (!data) return;
      if (data.status === 'complete') {
        setStatus(prev => advanceStatus(prev, 'complete'));
        setWinner(data.winner);
        return;
      }
      if (data.state && Object.keys(data.state).length > 0) {
        const dbMoveCount = countMoves(data.state as unknown as SerializedState);
        if (dbMoveCount > localMoveCountRef.current) {
          setGame(deserializeGame(data.state as any));
          localMoveCountRef.current = dbMoveCount;
        }
      }
    };
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [status, gameId, user]);

  // When both players signal play_again, the player who is currently X creates the rematch.
  // Using myMarker rather than isPlayerX because isPlayerX reflects post-RPS player assignment
  // and may differ from the original creator after an RPS swap.
  useEffect(() => {
    if (myRematchIntent !== 'play_again' || opponentRematchIntent !== 'play_again') return;
    if (!user || !opponentId || rematchCreatedRef.current) return;
    if (myMarker !== 'X') return; // Only player X creates — player O navigates via rematch broadcast

    rematchCreatedRef.current = true;

    const createRematch = async () => {
      // Swap who goes first — whoever was X becomes O in the next game
      const newPlayerX = myMarker === 'X' ? opponentId : user.id;
      const newPlayerO = myMarker === 'X' ? user.id : opponentId;

      // Clean up any abandoned 'rps' games between these two players before creating the new one.
      // Prevents stale rematch rows from accumulating and triggering the resume toast on login.
      await supabase.from('games')
        .update({ status: 'complete' })
        .or(`and(player_x_id.eq.${newPlayerX},player_o_id.eq.${newPlayerO}),and(player_x_id.eq.${newPlayerO},player_o_id.eq.${newPlayerX})`)
        .eq('status', 'rps');

      const { data, error } = await supabase.from('games').insert({
        player_x_id: newPlayerX,
        player_o_id: newPlayerO,
        status: 'rps',
      }).select('id').single();

      if (error || !data) {
        console.error('Rematch game creation failed:', error?.message);
        rematchCreatedRef.current = false;
        return;
      }

      // Write rematch_game_id to DB — reliable delivery to player O via postgres_changes.
      // Broadcast is kept as the fast path but is fire-and-forget; DB is the fallback.
      const { error: rematchIdError } = await supabase.from('games').update({ rematch_game_id: data.id }).eq('id', gameId);
      if (rematchIdError) console.error('[createRematch] rematch_game_id write failed:', rematchIdError.message);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'rematch',
        payload: { gameId: data.id },
      });

      setRematchGameId(data.id);
    };

    createRematch();
  }, [myRematchIntent, opponentRematchIntent, user, opponentId, myMarker, isPlayerX, gameId]);

  // Polling fallback for player O waiting on a rematch game ID.
  // The primary delivery path (rematch_game_id CDC from player X's DB write) can be missed
  // if the postgres_changes event is dropped. This polls fetchGameState every 2s while the
  // player is on the complete screen with Play Again clicked but no rematch game yet received.
  // Stops automatically once rematchGameId is set (navigation fires from OnlineGameView).
  useEffect(() => {
    if (status !== 'complete' || myRematchIntent !== 'play_again' || rematchGameId) return;
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [status, myRematchIntent, rematchGameId, fetchGameState]);

  const placeMarker = useCallback(async (
    microBoardIndex: number,
    cellIndex: number,
    opts?: { skipTurnGuard?: boolean },
  ) => {
    if (!game || !user || !myMarker || status !== 'active') return false;

    if (!opts?.skipTurnGuard) {
      const isMyTurn = (myMarker === 'X' && game.currentPlayerIndex === 0) ||
                       (myMarker === 'O' && game.currentPlayerIndex === 1);
      if (!isMyTurn) return false;
    }

    const gameCopy = deserializeGame(serializeGame(game));
    const placed = gameCopy.placeMarker(microBoardIndex, cellIndex);
    if (!placed) return false;

    localMoveCountRef.current += 1;

    const newState = serializeGame(gameCopy);
    const isOver = gameCopy.isGameOver();
    const winnerValue = isOver ? gameCopy.macroBoard.winner || 'draw' : null;

    // 1. Update local state immediately — no waiting for DB round-trip
    setGame(gameCopy);
    if (isOver) {
      setStatus('complete');
      setWinner(winnerValue);
    }

    // 2 & 3. DB write + broadcast — ordering depends on whether the game ended.
    //
    // For a winning move: await the DB write BEFORE broadcasting. This ensures the
    // DB shows 'complete' before the opponent sees the game as over and navigates
    // away. Without this, useActiveGame on the menu page queries the DB during the
    // fire-and-forget window and finds the game still 'active' → spurious resume toast.
    //
    // For regular moves: broadcast first (fast path), then fire-and-forget DB write.
    // The polling fallback (every 1.5s) guarantees eventual consistency.
    if (isOver) {
      const { error } = await supabase.from('games').update({
        state: newState as any,
        next_player: gameCopy.currentPlayer.marker,
        next_micro_board: gameCopy.nextMicroBoardIndex,
        status: 'complete',
        winner: winnerValue,
      }).eq('id', gameId);
      if (error) console.error('Move DB write failed:', error.message);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'move',
        payload: { state: newState, isOver, winner: winnerValue },
      });
    } else {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'move',
        payload: { state: newState, isOver, winner: winnerValue },
      });
      supabase.from('games').update({
        state: newState as any,
        next_player: gameCopy.currentPlayer.marker,
        next_micro_board: gameCopy.nextMicroBoardIndex,
        status: 'active',
        winner: null,
      }).eq('id', gameId).then(({ error }) => {
        if (error) console.error('Move DB write failed:', error.message);
      });
    }

    if (isOver) {
      supabase.from('game_moves').insert({
        game_id: gameId,
        player_id: user.id,
        micro_board_index: microBoardIndex,
        cell_index: cellIndex,
        move_number: 0,
      }).then(({ error }) => {
        if (error) console.error('game_moves insert failed:', error.message);
      });
    }

    return true;
  }, [game, user, myMarker, status, gameId]);

  // Upsert the player's pick into rps_picks. The polling effect handles the rest.
  const submitRPSPick = useCallback(async (pick: RPSPick): Promise<boolean> => {
    if (!user || !gameId) return false;
    const { error } = await (supabase as any)
      .from('rps_picks')
      .upsert({ game_id: gameId, user_id: user.id, pick }, { onConflict: 'game_id,user_id' }) as { error: { message: string } | null };
    if (error) {
      console.error('[RPS submitRPSPick] upsert failed:', error.message);
      return false;
    }
    return true;
  }, [user, gameId]);

  const signalRematchIntent = useCallback((intent: RematchIntent) => {
    setMyRematchIntent(intent);
    // Reliable path: write to DB — delivered via postgres_changes regardless of WebSocket state.
    // Broadcast fallback to REST API does not reliably fan out to WebSocket subscribers.
    const col = myMarker === 'X' ? 'rematch_x_intent' : 'rematch_o_intent';
    supabase.from('games').update({ [col]: intent }).eq('id', gameId);
    // Fast path: presence + broadcast for immediate delivery on healthy connections
    channelRef.current?.track({ user_id: user?.id, rematch_intent: intent });
    channelRef.current?.send({ type: 'broadcast', event: 'rematch_intent', payload: { intent } });
  }, [user, myMarker, gameId]);

  const sendEmoji = useCallback((emoji: string) => {
    if (!channelRef.current || !user || status !== 'active') return;
    if (myEmojiTimerRef.current) clearTimeout(myEmojiTimerRef.current);
    setMyEmoji(emoji);
    myEmojiTimerRef.current = setTimeout(() => setMyEmoji(null), 3000);
    channelRef.current.send({
      type: 'broadcast',
      event: 'emoji',
      payload: { player_id: user.id, emoji },
    });
  }, [user, status]);

  return {
    game, status, myMarker, winner, placeMarker,
    rpsResultPicks, rpsRound, dismissRPSResult, isPlayerX,
    opponentConnected, disconnectCountdown, opponentId,
    rematchGameId, forfeitPlayerId,
    myRematchIntent, opponentRematchIntent, signalRematchIntent,
    submitRPSPick,
    myEmoji, opponentEmoji, sendEmoji,
  };
};
