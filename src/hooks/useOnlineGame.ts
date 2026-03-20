import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Game } from '../models/Game';
import { deserializeGame, serializeGame, SerializedState } from '../lib/gameSerializer';
import { useAuth } from '../contexts/AuthContext';
import { resolveRPS, RPSPick } from '../lib/rps';

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
  const [game, setGame] = useState<Game | null>(null);
  const [status, setStatus] = useState<OnlineGameStatus>('loading');
  const [myMarker, setMyMarker] = useState<'X' | 'O' | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [rpsCreatorPick, setRpsCreatorPick] = useState<string | null>(null);
  const [rpsJoinerPick, setRpsJoinerPick] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [joinerId, setJoinerId] = useState<string | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [rematchGameId, setRematchGameId] = useState<string | null>(null);
  const [forfeitPlayerId, setForfeitPlayerId] = useState<string | null>(null);
  const [myRematchIntent, setMyRematchIntent] = useState<RematchIntent | null>(null);
  const [opponentRematchIntent, setOpponentRematchIntent] = useState<RematchIntent | null>(null);

  // Prevents double-resolution if the effect fires again before Realtime returns status='active'
  const rpsResolutionSentRef = useRef(false);
  const localMoveCountRef = useRef(0);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const gameRef = useRef<Game | null>(null);
  const rematchCreatedRef = useRef(false);

  // Keep gameRef in sync so event handlers can read latest game state without stale closure
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const fetchGameState = useCallback(async () => {
    if (!user || !gameId) return;
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error) console.error('fetchGameState failed:', error.message);
    if (!data) return;
    setStatus(data.status as OnlineGameStatus);
    setMyMarker(data.player_x_id === user.id ? 'X' : 'O');
    setWinner(data.winner);
    setIsCreator(data.player_x_id === user.id);
    setRpsCreatorPick(data.rps_creator_pick);
    setRpsJoinerPick(data.rps_joiner_pick);
    setJoinerId(data.player_o_id);
    setOpponentId(data.player_x_id === user.id ? data.player_o_id : data.player_x_id);
    setForfeitPlayerId(data.forfeit_player_id ?? null);
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

  useEffect(() => {
    if (!user || !gameId) return;
    rpsResolutionSentRef.current = false; // reset for each new game
    rematchCreatedRef.current = false;

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
        setRpsCreatorPick(updated.rps_creator_pick);
        setRpsJoinerPick(updated.rps_joiner_pick);
        setForfeitPlayerId(updated.forfeit_player_id ?? null);
        // opponentId must be updated here too — creator has null until joiner joins
        setOpponentId(updated.player_x_id === user.id ? updated.player_o_id : updated.player_x_id);
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
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
        const opponentPresence = newPresences.find((p: any) => p.user_id !== user.id);
        if (opponentPresence) {
          setOpponentConnected(true);
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
          }
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
          setGame(deserializeGame(payload.payload.state));
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
      .on('broadcast', { event: 'rps_pick' }, (payload: { payload: { column: string; pick: string } }) => {
        // Fast-path delivery of RPS picks — supplements postgres_changes which can be missed.
        // Both paths set the same state so whichever arrives first wins; the second is a no-op.
        const { column, pick } = payload.payload ?? {};
        if (column === 'rps_creator_pick' && pick) setRpsCreatorPick(pick);
        else if (column === 'rps_joiner_pick' && pick) setRpsJoinerPick(pick);
      })
      .on('broadcast', { event: 'rematch_intent' }, (payload: { payload: { intent: RematchIntent } }) => {
        if (payload.payload?.intent) {
          setOpponentRematchIntent(payload.payload.intent);
        }
      })
      .on('broadcast', { event: 'rps_resolved' }, (payload: { payload: { playerXId: string; playerOId: string } }) => {
        // Fast-path delivery of RPS resolution — supplements postgres_changes which can be missed.
        // Joiner receives this and advances to 'active' without waiting for a postgres_changes event.
        // isCreator is intentionally NOT set here — it is set once in fetchGameState and is stable.
        const { playerXId, playerOId } = payload.payload ?? {};
        if (!playerXId || !playerOId) return;
        setStatus(prev => advanceStatus(prev, 'active'));
        setMyMarker(playerXId === user.id ? 'X' : 'O');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [gameId, user, fetchGameState]);

  // Only the creator resolves RPS to avoid a write race condition.
  // rpsResolutionSentRef guards against the effect re-firing (while Realtime hasn't
  // returned status='active' yet) and accidentally overwriting the first resolution.
  useEffect(() => {
    if (
      status !== 'rps' ||
      !rpsCreatorPick ||
      !rpsJoinerPick ||
      !isCreator ||
      !user
    ) return;

    if (rpsResolutionSentRef.current) return;
    rpsResolutionSentRef.current = true;

    const result = resolveRPS(rpsCreatorPick as RPSPick, rpsJoinerPick as RPSPick);

    const resolve = async () => {
      if (result === 'draw') {
        rpsResolutionSentRef.current = false; // allow re-resolution after a draw
        const { error } = await supabase.from('games').update({
          rps_creator_pick: null,
          rps_joiner_pick: null,
        }).eq('id', gameId);
        if (error) console.error('RPS draw clear failed:', error.message);
        return;
      }

      // Compute final player assignment before the write so we can broadcast it
      const newPlayerXId = result === 'p2' ? joinerId! : user.id;
      const newPlayerOId = result === 'p2' ? user.id : joinerId!;

      const updatePayload: Record<string, any> = { status: 'active' };
      if (result === 'p2') {
        // Joiner wins RPS — swap so joiner becomes X (goes first)
        updatePayload.player_x_id = newPlayerXId;
        updatePayload.player_o_id = newPlayerOId;
      }
      const { error } = await supabase.from('games').update(updatePayload).eq('id', gameId);
      if (error) {
        console.error('RPS resolution failed:', error.message);
        rpsResolutionSentRef.current = false; // allow retry on failure
        return;
      }

      // Advance creator's own state immediately — broadcast self=false won't deliver to us
      setStatus(prev => advanceStatus(prev, 'active'));
      setMyMarker(newPlayerXId === user.id ? 'X' : 'O');
      // Note: isCreator is intentionally NOT updated here. It is set once in fetchGameState
      // and stays constant for the game lifetime. Play Again uses it to decide who creates
      // the rematch — always the original creator, regardless of who won RPS.

      // Broadcast to joiner — fast path so they advance without depending on postgres_changes
      channelRef.current?.send({
        type: 'broadcast',
        event: 'rps_resolved',
        payload: { playerXId: newPlayerXId, playerOId: newPlayerOId },
      });
    };

    resolve();
  }, [status, rpsCreatorPick, rpsJoinerPick, isCreator, joinerId, gameId, user]);

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

  // When both players signal play_again, the creator creates the rematch game
  useEffect(() => {
    if (myRematchIntent !== 'play_again' || opponentRematchIntent !== 'play_again') return;
    if (!user || !opponentId || rematchCreatedRef.current) return;
    if (!isCreator) return; // Only creator creates — joiner navigates via rematch broadcast

    rematchCreatedRef.current = true;

    const createRematch = async () => {
      // Swap who goes first — whoever was X becomes O in the next game
      const newPlayerX = myMarker === 'X' ? opponentId : user.id;
      const newPlayerO = myMarker === 'X' ? user.id : opponentId;

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

      channelRef.current?.send({
        type: 'broadcast',
        event: 'rematch',
        payload: { gameId: data.id },
      });

      setRematchGameId(data.id);
    };

    createRematch();
  }, [myRematchIntent, opponentRematchIntent, user, opponentId, myMarker, isCreator]);

  const placeMarker = useCallback(async (microBoardIndex: number, cellIndex: number) => {
    if (!game || !user || !myMarker || status !== 'active') return false;

    const isMyTurn = (myMarker === 'X' && game.currentPlayerIndex === 0) ||
                     (myMarker === 'O' && game.currentPlayerIndex === 1);
    if (!isMyTurn) return false;

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

    // 2. Broadcast to opponent via channel (fast path) — include isOver/winner so
    //    the opponent's status updates immediately without waiting for postgres_changes
    channelRef.current?.send({
      type: 'broadcast',
      event: 'move',
      payload: { state: newState, isOver, winner: winnerValue },
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

  // Write the player's RPS pick to DB and broadcast it immediately.
  // Broadcast ensures the opponent receives the pick without depending on postgres_changes
  // delivery, which can be missed when the Realtime connection is briefly degraded.
  const submitRPSPick = useCallback(async (pick: RPSPick): Promise<boolean> => {
    if (!user || !gameId) return false;
    const column = isCreator ? 'rps_creator_pick' : 'rps_joiner_pick';
    const { error } = await supabase.from('games').update({ [column]: pick }).eq('id', gameId);
    if (error) return false;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'rps_pick',
      payload: { column, pick },
    });
    return true;
  }, [user, gameId, isCreator]);

  const signalRematchIntent = useCallback((intent: RematchIntent) => {
    setMyRematchIntent(intent);
    // Update presence so the intent survives reconnects and is visible via sync events.
    // This is the reliable path — broadcast below is the fast path.
    channelRef.current?.track({ user_id: user?.id, rematch_intent: intent });
    // Fast path: broadcast for immediate delivery
    channelRef.current?.send({
      type: 'broadcast',
      event: 'rematch_intent',
      payload: { intent },
    });
  }, [user]);

  return {
    game, status, myMarker, winner, placeMarker,
    rpsCreatorPick, rpsJoinerPick, isCreator,
    opponentConnected, disconnectCountdown, opponentId,
    rematchGameId, forfeitPlayerId,
    myRematchIntent, opponentRematchIntent, signalRematchIntent,
    submitRPSPick,
  };
};
