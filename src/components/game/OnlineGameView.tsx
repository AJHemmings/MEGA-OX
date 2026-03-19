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
import { resolveRPS, RPSPick, RPSResult } from '../../lib/rps';
import {
  playMarkerPlaced,
  playYourTurn,
  playMicroBoardWon,
  playGameWon,
  playGameLost,
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
  const { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator, opponentConnected, disconnectCountdown } = useOnlineGame(gameId);

  // Snapshot of picks captured when result screen opens — survives status change and draw clear
  const [resultPicks, setResultPicks] = useState<{ creator: RPSPick; joiner: RPSPick } | null>(null);
  const [wonByForfeit, setWonByForfeit] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  const prevMicroWinnersRef = useRef<string[]>([]);
  const prevIsMyTurnRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string>('loading');

  // Open result screen: capture picks snapshot so it stays visible regardless of subsequent state changes
  useEffect(() => {
    if (rpsCreatorPick && rpsJoinerPick && status === 'rps') {
      setResultPicks({ creator: rpsCreatorPick as RPSPick, joiner: rpsJoinerPick as RPSPick });
    }
  }, [rpsCreatorPick, rpsJoinerPick, status]);

  useEffect(() => {
    if (status === 'complete' && !opponentConnected) {
      setWonByForfeit(true);
    }
  }, [status, opponentConnected]);

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

  const handleRPSContinue = useCallback(() => setResultPicks(null), []);
  // RPSScreen's onResolved is now unused (resultPicks drives the result screen),
  // but the prop is required — pass a stable no-op
  const noop = useCallback(() => {}, []);

  // RPS result screen — shown for the full 3s timer regardless of status/pick changes
  if (resultPicks) {
    const result: RPSResult = resolveRPS(resultPicks.creator, resultPicks.joiner);
    return (
      <RPSResultScreen
        creatorPick={resultPicks.creator}
        joinerPick={resultPicks.joiner}
        isCreator={isCreator}
        result={result}
        onContinue={handleRPSContinue}
      />
    );
  }

  // RPS pick screen (no picks submitted yet, or draw re-pick)
  if (status === 'rps') {
    return (
      <RPSScreen
        gameId={gameId}
        isCreator={isCreator}
        onResolved={noop}
      />
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
    <div style={{ maxWidth: 480, margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', textAlign: 'center', userSelect: 'none', padding: '20px', minHeight: '100vh', background: '#1a2332', color: '#ffffff' }}>
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
    </div>
    </SkinProvider>
  );
};

export default OnlineGameView;
