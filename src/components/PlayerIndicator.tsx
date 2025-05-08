import React from "react";

type PlayerIndicatorProps = {
  currentPlayer: string;
  playerScores: { [key: string]: number };
  drawCount: number;
};

const PlayerIndicator: React.FC<PlayerIndicatorProps> = ({
  currentPlayer,
  playerScores,
  drawCount,
}) => {
  return (
    <div style={{ margin: "10px 0", textAlign: "center" }}>
      <h2>Current Player: {currentPlayer}</h2>
      <div>
        <span>Player 1 Wins: {playerScores["X"] || 0}</span> |{" "}
        <span>Player 2 Wins: {playerScores["O"] || 0}</span> |{" "}
        <span>Draws: {drawCount}</span>
      </div>
    </div>
  );
};

export default PlayerIndicator;
