import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Marker } from '../../models/Game';
import MacroBoard from '../MacroBoard';
import PlayerIndicator from '../PlayerIndicator';
import { useOnlineGame } from '../../hooks/useOnlineGame';
import { SkinProvider } from '../../contexts/SkinContext';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../../skins/defaults';
import { GameSkins } from '../../skins/types';
import RPSScreen from './RPSScreen';
import RPSResultScreen from './RPSResultScreen';
import { resolveRPS, RPSResult } from '../../lib/rps';
import {
  playMarkerPlaced,
  playYourTurn,
  playMicroBoardWon,
  playGameWon,
  playGameLost,
  resumeAudio,
} from '../../lib/sounds';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

interface OnlineGameViewProps {
  gameId: string;
}

const OnlineGameView: React.FC<OnlineGameViewProps> = ({ gameId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { game, status, myMarker, winner, placeMarker, rpsResultPicks, rpsRound, dismissRPSResult, isCreator, opponentConnected, disconnectCountdown, rematchGameId, forfeitPlayerId, myRematchIntent, opponentRematchIntent, signalRematchIntent, submitRPSPick } = useOnlineGame(gameId);

  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // Derived from DB — not from presence, so no race condition when opponent navigates away after game ends
  const wonByForfeit = forfeitPlayerId !== null;
  const opponentForfeited = forfeitPlayerId !== null && forfeitPlayerId !== user?.id;

  const prevMicroWinnersRef = useRef<string[]>([]);
  const prevIsMyTurnRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string>('loading');
  const prevCellCountRef = useRef<number>(0);
  const hasGameStartedRef = useRef<boolean>(false);
  // Set to true once the result screen has been shown and dismissed for a non-draw round.
  // Prevents RPSScreen flashing back during the 'rps'→'active' status gap (race condition
  // where the result screen auto-continues before postgres_changes delivers status='active').
  const rpsResultShownRef = useRef(false);

  // Reset RPS guard when gameId changes — React Router reuses this component instance
  // across /game/:id navigations (Play Again), so useRef values persist between games.
  useEffect(() => {
    rpsResultShownRef.current = false;
  }, [gameId]);

  useEffect(() => {
    if (rematchGameId) {
      navigate(`/game/${rematchGameId}`);
    }
  }, [rematchGameId, navigate]);

  const handleForfeit = useCallback(async () => {
    if (!myMarker || !user) return;
    await supabase.from('games').update({
      status: 'complete',
      winner: myMarker === 'X' ? 'O' : 'X',
      forfeit_player_id: user.id,
    }).eq('id', gameId);
    navigate('/menu');
  }, [myMarker, user, gameId, navigate]);

  // Intercept browser back button — push a dummy state so popstate fires instead of navigating away
  useEffect(() => {
    if (status !== 'active') return;
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowForfeitModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status]);

  useEffect(() => {
    if (status !== 'active') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  useEffect(() => {
    if (!game || !myMarker) return;

    // Seed initial state on first active render so sounds don't fire on mount
    const currentIsMyTurn =
      (myMarker === 'X' && game.currentPlayerIndex === 0) ||
      (myMarker === 'O' && game.currentPlayerIndex === 1);

    if (status === 'active' && !hasGameStartedRef.current) {
      hasGameStartedRef.current = true;
      prevIsMyTurnRef.current = currentIsMyTurn; // seed so first turn doesn't fire
      prevCellCountRef.current = game.macroBoard.microBoards
        .reduce((total, mb) => total + mb.cells.filter(c => c.marker !== Marker.None).length, 0);
    }

    // Marker placed — only fire when total filled cells increases by exactly 1
    const currentCellCount = game.macroBoard.microBoards
      .reduce((total, mb) => total + mb.cells.filter(c => c.marker !== Marker.None).length, 0);
    if (status === 'active' && currentCellCount === prevCellCountRef.current + 1) {
      playMarkerPlaced();
    }
    prevCellCountRef.current = currentCellCount;

    // Micro board won — check if any new winners appeared
    const currentWinners = game.macroBoard.microBoards.map(mb => mb.winner);
    currentWinners.forEach((w, i) => {
      if (w && w !== prevMicroWinnersRef.current[i]) {
        playMicroBoardWon();
      }
    });
    prevMicroWinnersRef.current = currentWinners;

    // Your turn — only fire after game has started (not on mount)
    if (hasGameStartedRef.current && currentIsMyTurn && !prevIsMyTurnRef.current && status === 'active') {
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

  const handleRPSContinue = useCallback(() => {
    if (rpsResultPicks) {
      const result = resolveRPS(rpsResultPicks.creator, rpsResultPicks.joiner);
      // Only set the guard on a decisive result. For draws, the re-pick screen must show
      // again, so we leave rpsResultShownRef as-is (dismissRPSResult resets it via rpsRound).
      if (result !== 'draw') {
        rpsResultShownRef.current = true;
      }
      dismissRPSResult(result === 'draw');
    }
  }, [rpsResultPicks, dismissRPSResult]);

  // RPS result screen — shown for the full 3s timer regardless of status/pick changes.
  // rpsResultPicks is captured synchronously in the hook's event handlers, so it is immune
  // to the React 18 batching race where DB null-clear can arrive in the same batch as the
  // "both picks in" event and prevent the result screen from ever showing.
  if (rpsResultPicks) {
    const result: RPSResult = resolveRPS(rpsResultPicks.creator, rpsResultPicks.joiner);
    return (
      <RPSResultScreen
        creatorPick={rpsResultPicks.creator}
        joinerPick={rpsResultPicks.joiner}
        isCreator={isCreator}
        result={result}
        onContinue={handleRPSContinue}
      />
    );
  }

  // RPS pick screen (no picks submitted yet, or draw re-pick).
  // key={rpsRound} forces a full remount on each draw round, clearing RPSScreen's internal
  // myPick/waiting state so the player gets a clean pick UI for the next round.
  // Guard: if the result screen was already shown and dismissed, don't flash RPSScreen
  // during the brief gap before status advances from 'rps' to 'active'.
  if (status === 'rps' && !rpsResultShownRef.current) {
    return (
      <RPSScreen key={rpsRound} onSubmitPick={submitRPSPick} />
    );
  }

  if (status === 'loading' || !game) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Loading game...</p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '16px' }}>
        <p>Waiting for opponent to join...</p>
        <button onClick={() => navigate('/menu')} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    );
  }

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  const isMyTurn = myMarker !== null && (
    (myMarker === 'X' && game.currentPlayerIndex === 0) ||
    (myMarker === 'O' && game.currentPlayerIndex === 1)
  );

  const getWinnerText = () => {
    if (winner === 'draw') return "It's a draw!";
    if (winner === myMarker) return 'You Win!';
    return 'Opponent Wins!';
  };

  const macroWinner = game.macroBoard.winner === Marker.None ? '' : game.macroBoard.winner;

  return (
    <SkinProvider skins={defaultGameSkins}>
    <div onClick={resumeAudio} style={{ maxWidth: 480, margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', textAlign: 'center', userSelect: 'none', padding: '20px', minHeight: '100vh', background: '#1a2332', color: '#ffffff' }}>
      {showForfeitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#2a3441', borderRadius: '16px', padding: '32px', maxWidth: '320px', textAlign: 'center', border: '1px solid #ff6b35' }}>
            <h3 style={{ color: '#fff', margin: '0 0 12px' }}>Leave game?</h3>
            <p style={{ color: '#a0aec0', margin: '0 0 24px', fontSize: '14px' }}>
              Leaving this game will forfeit it. Your opponent wins.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowForfeitModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3a4a5a', background: 'transparent', color: '#a0aec0', cursor: 'pointer' }}
              >
                Stay
              </button>
              <button
                onClick={handleForfeit}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ff6b35', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Forfeit & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#2a3441', padding: '15px 20px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
        <button
          onClick={() => {
            if (status === 'active') {
              setShowForfeitModal(true);
            } else {
              navigate('/menu');
            }
          }}
          style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: 12, border: '2px solid #ff6b35', backgroundColor: 'transparent', color: '#ff6b35', fontWeight: 'bold' }}
        >
          ← Menu
        </button>
        <h1 style={{ margin: 0, fontSize: '2em', color: '#ffffff' }}>Mega OX</h1>
        <div style={{ width: 72 }} />
      </div>

      {/* Turn indicator */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#00d4aa20', borderRadius: '12px', border: '2px solid #00d4aa', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '56px' }}>
        <strong style={{ color: '#00d4aa', fontSize: '16px' }}>
          {status === 'complete'
            ? getWinnerText()
            : isMyTurn
            ? `Your turn (${myMarker})`
            : "Opponent's turn..."}
        </strong>
      </div>

      {!opponentConnected && disconnectCountdown !== null && status === 'active' && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#ff6b3520', border: '1px solid #ff6b35', borderRadius: '10px', color: '#ff6b35', fontSize: '14px' }}>
          Opponent disconnected — forfeiting in {disconnectCountdown}s
        </div>
      )}

      <PlayerIndicator
        currentPlayer={isMyTurn ? `You (${myMarker})` : `Opponent (${myMarker === 'X' ? 'O' : 'X'})`}
        playerScores={{ X: game.winCounts[Marker.X], O: game.winCounts[Marker.O] }}
        drawCount={game.drawCount}
      />

      <MacroBoard
        microBoards={microBoardsData}
        onPlaceMarker={placeMarker}
        nextMicroBoardIndex={game.nextMicroBoardIndex}
        macroWinner={macroWinner}
        lastMove={null}
      />

      {status === 'complete' && (
        <div style={{ marginTop: 20, fontWeight: 'bold', fontSize: '20px', padding: '25px', backgroundColor: '#2a3441', borderRadius: '16px', border: '3px solid #00d4aa', color: '#00d4aa', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
          {opponentForfeited
            ? 'Your opponent disconnected. You win!'
            : getWinnerText()}
          {wonByForfeit ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                onClick={() => navigate('/menu')}
                style={{ padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: 10, border: 'none', backgroundColor: '#00d4aa', color: '#fff', fontWeight: 'bold' }}
              >
                Back to Menu
              </button>
            </div>
          ) : (
            <>
              {/* Readiness dots — green = play again, red = leaving, grey = undecided */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '14px 0 6px' }}>
                <span title="You" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: myRematchIntent === 'play_again' ? '#00d4aa' : myRematchIntent === 'back_to_menu' ? '#ff6b35' : '#3a4a5a' }} />
                <span title="Opponent" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: opponentRematchIntent === 'play_again' ? '#00d4aa' : opponentRematchIntent === 'back_to_menu' ? '#ff6b35' : '#3a4a5a' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => signalRematchIntent('play_again')}
                  disabled={myRematchIntent !== null}
                  style={{ marginTop: '10px', padding: '12px 24px', fontSize: '15px', cursor: myRematchIntent !== null ? 'default' : 'pointer', borderRadius: 10, border: '2px solid #00d4aa', backgroundColor: 'transparent', color: myRematchIntent !== null ? '#3a4a5a' : '#00d4aa', fontWeight: 'bold', borderColor: myRematchIntent !== null ? '#3a4a5a' : '#00d4aa' }}
                >
                  {myRematchIntent === 'play_again' ? 'Waiting...' : 'Play Again'}
                </button>
                <button
                  onClick={() => { signalRematchIntent('back_to_menu'); navigate('/menu'); }}
                  style={{ marginTop: '10px', padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: 10, border: 'none', backgroundColor: '#00d4aa', color: '#fff', fontWeight: 'bold' }}
                >
                  Back to Menu
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </SkinProvider>
  );
};

export default OnlineGameView;
