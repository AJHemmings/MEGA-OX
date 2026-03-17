import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker } from '../../models/Game';
import MacroBoard from '../MacroBoard';
import PlayerIndicator from '../PlayerIndicator';
import { useOnlineGame } from '../../hooks/useOnlineGame';

interface OnlineGameViewProps {
  gameId: string;
}

const OnlineGameView: React.FC<OnlineGameViewProps> = ({ gameId }) => {
  const navigate = useNavigate();
  const { game, status, myMarker, winner, placeMarker } = useOnlineGame(gameId);

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
    <div style={{ maxWidth: 480, margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', textAlign: 'center', userSelect: 'none', padding: '20px', minHeight: '100vh', background: '#1a2332', color: '#ffffff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#2a3441', padding: '15px 20px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
        <button
          onClick={() => navigate('/menu')}
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
          {getWinnerText()}
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
  );
};

export default OnlineGameView;
