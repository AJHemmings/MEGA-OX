import React from "react";
import { Marker } from "./models/Game";
import MacroBoard from "./components/MacroBoard";
import PlayerIndicator from "./components/PlayerIndicator";
import { useGameLogic } from "./hooks/useGameLogic";

const App: React.FC = () => {
  const { game, gameOver, winner, onPlaceMarker, resetGame } = useGameLogic();

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  const handleRestart = () => {
    resetGame();
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "20px auto",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        textAlign: "center",
        userSelect: "none",
      }}
    >
      <h1>Mega OX</h1>
      <PlayerIndicator
        currentPlayer={game.currentPlayer.name}
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
        <div style={{ marginTop: 20, fontWeight: "bold", fontSize: "18px" }}>
          {winner === Marker.None ? "It's a draw!" : `Winner: Player ${winner}`}
        </div>
      )}
      <button
        onClick={handleRestart}
        style={{
          marginTop: 20,
          padding: "8px 16px",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: 5,
          border: "none",
          backgroundColor: "#3399ff",
          color: "#fff",
        }}
      >
        Restart Game
      </button>
    </div>
  );
};

export default App;
