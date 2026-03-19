import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Game } from '../models/Game';
import { deserializeGame, serializeGame, SerializedState } from '../lib/gameSerializer';
import { useAuth } from '../contexts/AuthContext';
import { resolveRPS, RPSPick } from '../lib/rps';

export type OnlineGameStatus = 'loading' | 'waiting' | 'rps' | 'active' | 'complete';

const countMoves = (state: SerializedState | null | undefined): number => {
  if (!state?.boards) return 0;
  return state.boards.flat().filter((m: string) => m !== '').length;
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
  // Prevents double-resolution if the effect fires again before Realtime returns status='active'
  const rpsResolutionSentRef = useRef(false);
  const localMoveCountRef = useRef(0);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
    if (data.state && Object.keys(data.state).length > 0) {
      const g = deserializeGame(data.state as any);
      setGame(g);
      localMoveCountRef.current = countMoves(data.state as SerializedState);
    } else {
      setGame(new Game());
      localMoveCountRef.current = 0;
    }
  }, [user, gameId]);

  useEffect(() => {
    if (!user || !gameId) return;
    rpsResolutionSentRef.current = false; // reset for each new game

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
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
        const opponentJoined = newPresences.some((p: any) => p.user_id !== user.id);
        if (opponentJoined) {
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
          fetchGameState();
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
        const opponentLeft = leftPresences.some((p: any) => p.user_id !== user.id);
        if (opponentLeft) {
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
        }
      })
      .on('broadcast', { event: 'move' }, (payload: { payload?: { state: SerializedState } }) => {
        if (payload.payload?.state) {
          setGame(deserializeGame(payload.payload.state));
        }
      })
      .on('broadcast', { event: 'rematch' }, (payload: { payload?: { gameId: string } }) => {
        if (payload.payload?.gameId) {
          setRematchGameId(payload.payload.gameId);
        }
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

      const updatePayload: Record<string, any> = { status: 'active' };
      if (result === 'p2') {
        // Joiner wins RPS — swap so joiner becomes X (goes first)
        updatePayload.player_x_id = joinerId;
        updatePayload.player_o_id = user.id;
      }
      const { error } = await supabase.from('games').update(updatePayload).eq('id', gameId);
      if (error) console.error('RPS resolution failed:', error.message);
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

  const requestRematch = useCallback(async () => {
    if (!user || !opponentId) return;

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
      return;
    }

    // Broadcast new game ID to opponent
    channelRef.current?.send({
      type: 'broadcast',
      event: 'rematch',
      payload: { gameId: data.id },
    });

    setRematchGameId(data.id);
  }, [user, opponentId, myMarker]);

  return { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator, opponentConnected, disconnectCountdown, opponentId, rematchGameId, requestRematch };
};
