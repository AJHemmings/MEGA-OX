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
  // rpsResultPicks is captured synchronously in event handlers (immune to React 18 batching).
  // It is only cleared by dismissRPSResult — never by DB null events directly.
  const [rpsResultPicks, setRpsResultPicks] = useState<{ creator: RPSPick; joiner: RPSPick } | null>(null);
  // Increments on each draw round — used as key on RPSScreen to force remount and reset its
  // internal myPick/waiting state so the player can pick again cleanly.
  const [rpsRound, setRpsRound] = useState(0);
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
  // Shadow refs for RPS picks — kept in sync alongside state so event handlers can read the
  // current value of both picks synchronously without depending on a React render cycle.
  const rpsCreatorPickRef = useRef<string | null>(null);
  const rpsJoinerPickRef = useRef<string | null>(null);
  // Guards against capturing the same round twice (e.g. broadcast + postgres_changes both firing).
  const rpsResultCapturedRef = useRef(false);

  // Keep gameRef in sync so event handlers can read latest game state without stale closure
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Called synchronously inside Realtime event handlers — captures both picks the moment they
  // are both known, before React has had a chance to batch any further state updates.
  // Using refs avoids the race where the DB null-clear echo arrives in the same React batch
  // as the "both picks in" event, which would prevent the result screen from ever showing.
  const captureRPSResultIfReady = useCallback((creatorPick: string | null, joinerPick: string | null) => {
    console.log('[RPS captureRPSResultIfReady]', { creatorPick, joinerPick, alreadyCaptured: rpsResultCapturedRef.current });
    if (creatorPick && joinerPick && !rpsResultCapturedRef.current) {
      console.log('[RPS captureRPSResultIfReady] ✅ CAPTURING result', { creator: creatorPick, joiner: joinerPick });
      rpsResultCapturedRef.current = true;
      setRpsResultPicks({ creator: creatorPick as RPSPick, joiner: joinerPick as RPSPick });
    }
  }, []);

  // Called by OnlineGameView after the result screen is dismissed.
  // For draws: increments rpsRound (forces RPSScreen remount to clear internal pick state)
  // and resets the refs so the next round can be captured.
  const dismissRPSResult = useCallback((wasDraw: boolean) => {
    rpsResultCapturedRef.current = false;
    setRpsResultPicks(null);
    if (wasDraw) {
      rpsCreatorPickRef.current = null;
      rpsJoinerPickRef.current = null;
      setRpsRound(r => r + 1);
    }
  }, []);

  // DB polling fallback for RPS resolution.
  // The fast path (broadcast + postgres_changes) depends on the Realtime channel being in
  // SUBSCRIBED state. When it isn't, the "falling back to REST API" warning fires and the
  // stuck-browser symptom occurs: one player submits but never receives the opponent's pick.
  // This effect polls the DB every 1.5s during the RPS phase and captures the result the
  // moment both picks are present — regardless of WebSocket health.
  // Re-runs on rpsRound so draw rounds get their own fresh polling interval.
  useEffect(() => {
    if (status !== 'rps' || !gameId) return;
    const interval = setInterval(async () => {
      if (rpsResultCapturedRef.current) return;
      const { data } = await supabase
        .from('games')
        .select('rps_creator_pick, rps_joiner_pick, status')
        .eq('id', gameId)
        .single();
      if (!data || data.status !== 'rps') return;
      if (data.rps_creator_pick && data.rps_joiner_pick) {
        // Only act if we've already submitted our own pick this round.
        // After a draw dismissal, both refs are reset to null but the DB still
        // has the previous round's picks until the null-clear CDC propagates.
        // Without this guard the poll recaptures stale data and creates an
        // infinite RPS loop.
        const ownPickSubmitted = rpsCreatorPickRef.current !== null || rpsJoinerPickRef.current !== null;
        if (!ownPickSubmitted) return;
        console.log('[RPS poll] ✅ both picks found in DB', { creator: data.rps_creator_pick, joiner: data.rps_joiner_pick });
        rpsCreatorPickRef.current = data.rps_creator_pick;
        rpsJoinerPickRef.current = data.rps_joiner_pick;
        captureRPSResultIfReady(data.rps_creator_pick, data.rps_joiner_pick);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [status, gameId, rpsRound, captureRPSResultIfReady]);

  const fetchGameState = useCallback(async () => {
    if (!user || !gameId) return;
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (error) console.error('fetchGameState failed:', error.message);
    if (!data) return;
    setStatus(data.status as OnlineGameStatus);
    setMyMarker(data.player_x_id === user.id ? 'X' : 'O');
    setWinner(data.winner);
    setIsCreator(data.player_x_id === user.id);
    // Only restore RPS pick state if the game is still in RPS phase.
    // The picks stay in the DB after resolution, so restoring them on an active/complete
    // game would spuriously trigger captureRPSResultIfReady and show the result screen.
    if (data.status === 'rps') {
      rpsCreatorPickRef.current = data.rps_creator_pick;
      rpsJoinerPickRef.current = data.rps_joiner_pick;
      setRpsCreatorPick(data.rps_creator_pick);
      setRpsJoinerPick(data.rps_joiner_pick);
      captureRPSResultIfReady(data.rps_creator_pick, data.rps_joiner_pick);
    }
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
  }, [user, gameId, captureRPSResultIfReady]);

  useEffect(() => {
    if (!user || !gameId) return;
    rpsResolutionSentRef.current = false; // reset for each new game
    rematchCreatedRef.current = false;
    rpsResultCapturedRef.current = false;
    rpsCreatorPickRef.current = null;
    rpsJoinerPickRef.current = null;

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
        // Only update RPS pick state during the RPS phase.
        // After RPS resolves, rps_creator_pick / rps_joiner_pick stay populated in the DB.
        // Any later postgres_changes (move writes, forfeit) carries those stale picks and
        // would spuriously re-trigger captureRPSResultIfReady — showing the RPS result screen
        // mid-game or after a forfeit. Scoping to status='rps' eliminates that.
        // The draw-clear null guard is preserved inside this block: when the creator writes
        // null to clear picks after a draw, that CDC can arrive before the rps_pick broadcast,
        // so we only apply null once the result has already been captured.
        if (updated.status === 'rps') {
          const nullClearAllowed = rpsResultCapturedRef.current;
          console.log('[RPS postgres_changes] status=rps', {
            dbCreator: updated.rps_creator_pick,
            dbJoiner: updated.rps_joiner_pick,
            refCreator: rpsCreatorPickRef.current,
            refJoiner: rpsJoinerPickRef.current,
            nullClearAllowed,
          });
          if (updated.rps_creator_pick !== null || nullClearAllowed) {
            rpsCreatorPickRef.current = updated.rps_creator_pick;
            setRpsCreatorPick(updated.rps_creator_pick);
          }
          if (updated.rps_joiner_pick !== null || nullClearAllowed) {
            rpsJoinerPickRef.current = updated.rps_joiner_pick;
            setRpsJoinerPick(updated.rps_joiner_pick);
          }
          captureRPSResultIfReady(rpsCreatorPickRef.current, rpsJoinerPickRef.current);
        }
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
        // Sync refs immediately so captureRPSResultIfReady can check both picks synchronously,
        // even if one pick came via broadcast and the other hasn't triggered a postgres_changes yet.
        const { column, pick } = payload.payload ?? {};
        console.log('[RPS rps_pick broadcast]', { column, pick, refCreatorBefore: rpsCreatorPickRef.current, refJoinerBefore: rpsJoinerPickRef.current });
        if (column === 'rps_creator_pick' && pick) {
          rpsCreatorPickRef.current = pick;
          setRpsCreatorPick(pick);
        } else if (column === 'rps_joiner_pick' && pick) {
          rpsJoinerPickRef.current = pick;
          setRpsJoinerPick(pick);
        }
        captureRPSResultIfReady(rpsCreatorPickRef.current, rpsJoinerPickRef.current);
      })
      .on('broadcast', { event: 'rematch_intent' }, (payload: { payload: { intent: RematchIntent } }) => {
        if (payload.payload?.intent) {
          setOpponentRematchIntent(payload.payload.intent);
        }
      })
      .on('broadcast', { event: 'rps_resolved' }, (payload: { payload: { playerXId: string; playerOId: string } }) => {
        // Fast-path delivery of RPS resolution — supplements postgres_changes which can be missed.
        // Joiner receives this and advances to 'active' without waiting for a postgres_changes event.
        const { playerXId, playerOId } = payload.payload ?? {};
        if (!playerXId || !playerOId) return;
        setStatus(prev => advanceStatus(prev, 'active'));
        setMyMarker(playerXId === user.id ? 'X' : 'O');
        setIsCreator(playerXId === user.id);
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
  }, [gameId, user, fetchGameState, captureRPSResultIfReady]);

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
    console.log('[RPS resolution effect] creator resolving', { rpsCreatorPick, rpsJoinerPick, result });

    const resolve = async () => {
      if (result === 'draw') {
        rpsResolutionSentRef.current = false; // allow re-resolution after a draw
        console.log('[RPS resolution effect] draw — writing null-clear to DB');
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
      setIsCreator(newPlayerXId === user.id);

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

  // When both players signal play_again, the player who is currently X creates the rematch.
  // Using myMarker rather than isCreator because isCreator reflects post-RPS player assignment
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
    if (error) {
      console.error('[RPS submitRPSPick] DB write failed:', error.message);
      return false;
    }
    // Set own ref immediately — don't wait for the postgres_changes echo.
    // The opponent's rps_pick broadcast can arrive before our echo returns, and the
    // broadcast handler calls captureRPSResultIfReady(rpsCreatorPickRef.current, ...).
    // If our ref is still null at that point the capture silently fails and the result
    // screen never shows (the draw bug: creator stuck on "Waiting for opponent...").
    if (isCreator) {
      rpsCreatorPickRef.current = pick;
    } else {
      rpsJoinerPickRef.current = pick;
    }
    console.log('[RPS submitRPSPick]', { column, pick, isCreator, refCreator: rpsCreatorPickRef.current, refJoiner: rpsJoinerPickRef.current });
    // Attempt capture immediately — if the opponent's pick arrived via broadcast before we
    // submitted (opponent was faster), the capture won't happen in the broadcast handler
    // because our own ref was null at that point. This call covers that gap.
    captureRPSResultIfReady(rpsCreatorPickRef.current, rpsJoinerPickRef.current);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'rps_pick',
      payload: { column, pick },
    });
    return true;
  }, [user, gameId, isCreator, captureRPSResultIfReady]);

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
    rpsCreatorPick, rpsJoinerPick, rpsResultPicks, rpsRound, dismissRPSResult, isCreator,
    opponentConnected, disconnectCountdown, opponentId,
    rematchGameId, forfeitPlayerId,
    myRematchIntent, opponentRematchIntent, signalRematchIntent,
    submitRPSPick,
  };
};
