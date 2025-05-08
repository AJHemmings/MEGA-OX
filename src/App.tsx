import React, { useState, useEffect } from "react";
import { Marker } from "./models/Game";
import MacroBoard from "./components/MacroBoard";
import PlayerIndicator from "./components/PlayerIndicator";
import { useGameLogic } from "./hooks/useGameLogic";
import { Modal } from "./components/modal";

const App: React.FC = () => {
  const { game, gameOver, winner, onPlaceMarker, resetGame } = useGameLogic();

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  const handleRestart = () => {
    resetGame();
  };

  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setShowRules(true);
  }, []);

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

      {/* Rules Button */}
      <button
        onClick={() => setShowRules(true)}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: 5,
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
        }}
      >
        How to Play
      </button>

      {/* Modal */}
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
