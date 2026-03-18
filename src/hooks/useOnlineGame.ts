import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Game } from '../models/Game';
import { deserializeGame, serializeGame } from '../lib/gameSerializer';
import { useAuth } from '../contexts/AuthContext';
import { resolveRPS, RPSPick } from '../lib/rps';

export type OnlineGameStatus = 'loading' | 'waiting' | 'rps' | 'active' | 'complete';

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

  useEffect(() => {
    if (!user || !gameId) return;

    // Load initial game state
    const loadGame = async () => {
      const { data } = await supabase.from('games').select('*').eq('id', gameId).single();
      if (!data) return;

      setStatus(data.status as OnlineGameStatus);
      setMyMarker(data.player_x_id === user.id ? 'X' : 'O');
      setWinner(data.winner);
      setIsCreator(data.player_x_id === user.id);
      setRpsCreatorPick(data.rps_creator_pick);
      setRpsJoinerPick(data.rps_joiner_pick);
      setJoinerId(data.player_o_id);

      if (data.state && Object.keys(data.state).length > 0) {
        setGame(deserializeGame(data.state as any));
      } else {
        setGame(new Game());
      }
    };

    loadGame();

    // Subscribe to realtime changes on this game row
    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        const updated = payload.new as any;
        setStatus(updated.status);
        setWinner(updated.winner);
        setRpsCreatorPick(updated.rps_creator_pick);
        setRpsJoinerPick(updated.rps_joiner_pick);
        if (updated.player_o_id) setJoinerId(updated.player_o_id);
        if (updated.state && Object.keys(updated.state).length > 0) {
          setGame(deserializeGame(updated.state));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, user]);

  // Only the creator resolves RPS to avoid a write race condition
  useEffect(() => {
    if (
      status !== 'rps' ||
      !rpsCreatorPick ||
      !rpsJoinerPick ||
      !isCreator ||
      !user
    ) return;

    const result = resolveRPS(rpsCreatorPick as RPSPick, rpsJoinerPick as RPSPick);

    if (result === 'draw') {
      supabase.from('games').update({
        rps_creator_pick: null,
        rps_joiner_pick: null,
      }).eq('id', gameId);
      return;
    }

    const updatePayload: Record<string, any> = { status: 'active' };
    if (result === 'p2') {
      // Joiner wins RPS — swap so joiner becomes X (goes first)
      updatePayload.player_x_id = joinerId;
      updatePayload.player_o_id = user.id;
    }
    supabase.from('games').update(updatePayload).eq('id', gameId);
  }, [status, rpsCreatorPick, rpsJoinerPick, isCreator, joinerId, gameId, user]);

  const placeMarker = useCallback(async (microBoardIndex: number, cellIndex: number) => {
    if (!game || !user || !myMarker || status !== 'active') return false;

    // Validate it's our turn
    const isMyTurn = (myMarker === 'X' && game.currentPlayerIndex === 0) ||
                     (myMarker === 'O' && game.currentPlayerIndex === 1);
    if (!isMyTurn) return false;

    const gameCopy = deserializeGame(serializeGame(game));
    const placed = gameCopy.placeMarker(microBoardIndex, cellIndex);
    if (!placed) return false;

    const newState = serializeGame(gameCopy);
    const isOver = gameCopy.isGameOver();
    const winnerValue = isOver
      ? gameCopy.macroBoard.winner || 'draw'
      : null;

    // Write new state to DB — Realtime will push it to opponent
    await supabase.from('games').update({
      state: newState as any,
      next_player: gameCopy.currentPlayer.marker,
      next_micro_board: gameCopy.nextMicroBoardIndex,
      status: isOver ? 'complete' : 'active',
      winner: winnerValue,
    }).eq('id', gameId);

    // Append to move log
    await supabase.from('game_moves').insert({
      game_id: gameId,
      player_id: user.id,
      micro_board_index: microBoardIndex,
      cell_index: cellIndex,
      move_number: 0, // TODO: track move number
    });

    return true;
  }, [game, user, myMarker, status, gameId]);

  return { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator };
};
