import React, { useState, useEffect } from "react";
import { Marker } from "../models/Game";
import MacroBoard from "./MacroBoard";
import PlayerIndicator from "./PlayerIndicator";
import { useGameLogic } from "../hooks/useGameLogic";
import { Modal } from "./modal";

interface GameWrapperProps {
  gameMode: "single" | "local";
  onBackToMenu: () => void;
}

const GameWrapper: React.FC<GameWrapperProps> = ({
  gameMode,
  onBackToMenu,
}) => {
  const { game, gameOver, winner, onPlaceMarker, resetGame, lastMove } =
    useGameLogic();
  const [showRules, setShowRules] = useState(false);
  const [isAiTurn, setIsAiTurn] = useState(false);

  // UX: Adjust delay and animation timing here:
  const MIN_DELAY_MS = 2000;
  const MAX_DELAY_MS = 6000;
  const AI_THINKING_DELAY_MS =
    Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) +
    MIN_DELAY_MS;

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  // AI logic for single player mode
  useEffect(() => {
    if (
      gameMode === "single" &&
      game.currentPlayer.marker === Marker.O &&
      !gameOver
    ) {
      setIsAiTurn(true);
      const aiMoveTimer = setTimeout(() => {
        makeAiMove();
        setIsAiTurn(false);
      }, AI_THINKING_DELAY_MS); // Use configurable delay

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
              cellIndex,
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
      const randomMove =
        availableMoves[Math.floor(Math.random() * availableMoves.length)];
      onPlaceMarker(randomMove.microIndex, randomMove.cellIndex);
    }
  };

  const handleRestart = () => {
    resetGame();
  };

  const getPlayerName = (marker: string) => {
    if (gameMode === "single") {
      return marker === "X" ? "You" : "AI";
    }
    return `Player ${marker}`;
  };

  const getWinnerText = () => {
    if (winner === Marker.None) {
      return "It's a draw!";
    }
    if (gameMode === "single") {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          backgroundColor: "#2a3441",
          padding: "15px 20px",
          borderRadius: "16px",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
        }}
      >
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

        <h1 style={{ margin: 0, fontSize: "2em", color: "#ffffff" }}>
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
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: gameMode === "single" ? "#ff6b3520" : "#00d4aa20",
          borderRadius: "12px",
          border: `2px solid ${gameMode === "single" ? "#ff6b35" : "#00d4aa"}`,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "56px", // Fixed height to prevent layout shift
          position: "relative",
        }}
      >
        {/* Left spacer for balance */}
        <div style={{ flex: "1" }}></div>

        {/* Center: Main game mode text (static position) */}
        <strong
          style={{
            color: gameMode === "single" ? "#ff6b35" : "#00d4aa",
            fontSize: "16px",
            flex: "0 0 auto",
          }}
        >
          {gameMode === "single" ? "🤖 Player vs AI" : "👥 Local 2-Player"}
        </strong>

        {/* Right: AI thinking indicator (or spacer) */}
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-end" }}>
          {/* UI: AI thinking indicator (positioned to right to prevent layout shift) */}
          {isAiTurn && gameMode === "single" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#a0aec0",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              <span>AI is thinking</span>
              <div
                style={{
                  display: "flex",
                  gap: "2px",
                  animation: "ellipsisPulse 1.5s infinite",
                }}
              >
                <span style={{ animationDelay: "0s" }}>.</span>
                <span style={{ animationDelay: "0.5s" }}>.</span>
                <span style={{ animationDelay: "1s" }}>.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes ellipsisPulse {
            0%, 20% { opacity: 0; }
            50% { opacity: 1; }
            80%, 100% { opacity: 0; }
          }
        `}
      </style>

      {/* Rules Modal */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="How to Play Mega OX"
      >
        <div style={{ textAlign: "left", fontSize: "14px", lineHeight: "1.6" }}>
          <h3 style={{ color: "#ffffff", marginTop: "0" }}>🎯 Objective</h3>
          <p style={{ color: "#a0aec0" }}>
            Win 3 micro boards in a row on the macro board to win the game.
          </p>

          <h3 style={{ color: "#ffffff" }}>🎮 How to Play</h3>
          <ul style={{ color: "#a0aec0", paddingLeft: "20px" }}>
            <li>Players take turns placing their marker (X or O) in cells</li>
            <li>The first player can choose any cell on the macro board</li>
            <li>
              Your move determines which micro board your opponent must play in
              next
            </li>
            <li>Win a micro board by getting 3 in a row within it</li>
            <li>
              If the required micro board is full, you can choose any available
              board
            </li>
          </ul>

          <h3 style={{ color: "#ffffff" }}>🏆 Winning</h3>
          <ul style={{ color: "#a0aec0", paddingLeft: "20px" }}>
            <li>
              Get 3 micro board wins in a row (horizontal, vertical, or
              diagonal)
            </li>
            <li>
              If all micro boards are filled without a macro winner, it's a draw
            </li>
          </ul>
        </div>
      </Modal>

      <PlayerIndicator
        currentPlayer={getPlayerName(game.currentPlayer.marker)}
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
        lastMove={lastMove}
      />

      {gameOver && (
        <div
          style={{
            marginTop: 20,
            fontWeight: "bold",
            fontSize: "20px",
            padding: "25px",
            backgroundColor: "#2a3441",
            borderRadius: "16px",
            border: `3px solid ${
              winner === Marker.X
                ? "#00d4aa"
                : winner === Marker.O
                ? "#ff6b35"
                : "#718096"
            }`,
            color:
              winner === Marker.X
                ? "#00d4aa"
                : winner === Marker.O
                ? "#ff6b35"
                : "#ffffff",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
          }}
        >
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
          fontWeight: "bold",
          transition: "all 0.3s ease",
          boxShadow: "0 8px 25px #00d4aa40",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 35px #00d4aa60";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 25px #00d4aa40";
        }}
      >
        🔄 New Game
      </button>
    </div>
  );
};

export default GameWrapper;
