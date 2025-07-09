import React, { useState, useEffect } from "react";
import { Marker } from "../models/Game";
import MacroBoard from "./MacroBoard";
import PlayerIndicator from "./PlayerIndicator";
import { useGameLogic } from "../hooks/useGameLogic";
import { Modal } from "./modal";

interface GameWrapperProps {
  gameMode: 'single' | 'local';
  onBackToMenu: () => void;
}

const GameWrapper: React.FC<GameWrapperProps> = ({ gameMode, onBackToMenu }) => {
  const { game, gameOver, winner, onPlaceMarker, resetGame } = useGameLogic();
  const [showRules, setShowRules] = useState(false);
  const [isAiTurn, setIsAiTurn] = useState(false);

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  // AI logic for single player mode
  useEffect(() => {
    if (gameMode === 'single' && game.currentPlayer.marker === Marker.O && !gameOver) {
      setIsAiTurn(true);
      const aiMoveTimer = setTimeout(() => {
        makeAiMove();
        setIsAiTurn(false);
      }, 1000); // Add a delay to make AI moves visible

      return () => clearTimeout(aiMoveTimer);
    }
  }, [game.currentPlayer, gameOver, gameMode]);

  const makeAiMove = () => {
    // Simple AI: find the best available move
    const availableMoves: { microIndex: number; cellIndex: number }[] = [];
    
    // If nextMicroBoardIndex is set and that board is available
    if (game.nextMicroBoardIndex !== null) {
      const microBoard = game.macroBoard.microBoards[game.nextMicroBoardIndex];
      if (microBoard.winner === Marker.None) {
        microBoard.cells.forEach((cell, cellIndex) => {
          if (cell.isEmpty()) {
            availableMoves.push({ 
              microIndex: game.nextMicroBoardIndex!, 
              cellIndex 
            });
          }
        });
      }
    }
    
    // If no moves in the required board, find all available moves
    if (availableMoves.length === 0) {
      game.macroBoard.microBoards.forEach((microBoard, microIndex) => {
        if (microBoard.winner === Marker.None) {
          microBoard.cells.forEach((cell, cellIndex) => {
            if (cell.isEmpty()) {
              availableMoves.push({ microIndex, cellIndex });
            }
          });
        }
      });
    }

    // Make a random move (can be improved with better AI logic)
    if (availableMoves.length > 0) {
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      onPlaceMarker(randomMove.microIndex, randomMove.cellIndex);
    }
  };

  const handleRestart = () => {
    resetGame();
  };

  const getPlayerName = (marker: string) => {
    if (gameMode === 'single') {
      return marker === 'X' ? 'You' : 'AI';
    }
    return `Player ${marker}`;
  };

  const getWinnerText = () => {
    if (winner === Marker.None) {
      return "It's a draw!";
    }
    if (gameMode === 'single') {
      return winner === Marker.X ? "You Win! 🎉" : "AI Wins! 🤖";
    }
    return `Winner: Player ${winner}`;
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "20px auto",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        textAlign: "center",
        userSelect: "none",
        padding: "20px",
        minHeight: "100vh",
        background: "#1a2332",
        color: "#ffffff",
      }}
    >
      {/* Header with back button */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
        backgroundColor: '#2a3441',
        padding: '15px 20px',
        borderRadius: '16px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
      }}>
        <button
          onClick={onBackToMenu}
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: 12,
            border: "2px solid #ff6b35",
            backgroundColor: "transparent",
            color: "#ff6b35",
            fontWeight: "bold",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ff6b35";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#ff6b35";
          }}
        >
          ← Menu
        </button>
        
        <h1 style={{ margin: 0, fontSize: '2em', color: '#ffffff' }}>
          Mega OX
        </h1>
        
        <button
          onClick={() => setShowRules(true)}
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: 12,
            border: "2px solid #4299e1",
            backgroundColor: "transparent",
            color: "#4299e1",
            fontWeight: "bold",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4299e1";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#4299e1";
          }}
        >
          Rules
        </button>
      </div>

      {/* Game mode indicator */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: gameMode === 'single' ? '#ff6b3520' : '#00d4aa20',
        borderRadius: '12px',
        border: `2px solid ${gameMode === 'single' ? '#ff6b35' : '#00d4aa'}`,
        color: '#ffffff',
      }}>
        <strong style={{ 
          color: gameMode === 'single' ? '#ff6b35' : '#00d4aa',
          fontSize: '16px'
        }}>
          {gameMode === 'single' ? '🤖 Player vs AI' : '👥 Local 2-Player'}
        </strong>
        {isAiTurn && gameMode === 'single' && (
          <div style={{ 
            marginTop: '8px', 
            color: '#a0aec0',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            AI is thinking...
          </div>
        )}
      </div>

      {/* Rules Modal */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="How to Play"
      >
        <ul style={{ textAlign: "left", fontSize: "14px", lineHeight: "1.6" }}>
          <li>
            Players take turns selecting a cell on the macro board{" "}
            <span style={{ fontWeight: "bold", color: "#3399ff" }}>
              (highlighted micro board area)
            </span>{" "}
            the first player can chose any cell on the macro board.
          </li>
          <li>
            Within the micro board, players select a cell to place their marker
            (X or O).
          </li>
          <li>
            The position of the last move determines the next micro board the
            other player must play in.
          </li>
          <li>Win 3 micro boards in a row on the macro board to win.</li>
          <li>
            If all micro boards are filled without a macro board winner, the
            game ends in a draw.
          </li>
          <li>
            If the required micro board is already full, the player may choose
            any other available micro board to continue the game.
          </li>
          <li>Use the restart button to begin a new game.</li>
        </ul>
      </Modal>

      <PlayerIndicator
        currentPlayer={getPlayerName(game.currentPlayer.name)}
        playerScores={{
          X: game.winCounts[Marker.X],
          O: game.winCounts[Marker.O],
        }}
        drawCount={game.drawCount}
      />
      
      <MacroBoard
        microBoards={microBoardsData}
        onPlaceMarker={onPlaceMarker}
        nextMicroBoardIndex={game.nextMicroBoardIndex}
        macroWinner={winner === Marker.None ? "" : winner}
      />
      
      {gameOver && (
        <div style={{ 
          marginTop: 20, 
          fontWeight: "bold", 
          fontSize: "20px",
          padding: '25px',
          backgroundColor: '#2a3441',
          borderRadius: '16px',
          border: `3px solid ${winner === Marker.X ? '#00d4aa' : winner === Marker.O ? '#ff6b35' : '#718096'}`,
          color: winner === Marker.X ? '#00d4aa' : winner === Marker.O ? '#ff6b35' : '#ffffff',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        }}>
          {getWinnerText()}
        </div>
      )}
      
      <button
        onClick={handleRestart}
        style={{
          marginTop: 20,
          padding: "15px 30px",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: 12,
          border: "none",
          backgroundColor: "#00d4aa",
          color: "#fff",
          fontWeight: 'bold',
          transition: "all 0.3s ease",
          boxShadow: '0 8px 25px #00d4aa40',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 35px #00d4aa60';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px #00d4aa40';
        }}
      >
        🔄 New Game
      </button>
    </div>
  );
};

export default GameWrapper;
