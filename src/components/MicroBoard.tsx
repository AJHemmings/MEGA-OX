import React from "react";
import Cell from "./Cell";

type MicroBoardProps = {
  cells: string[];
  onCellClick: (cellIndex: number) => void;
  disabled: boolean;
  highlight: boolean;
  winner: string;
};

const MicroBoard: React.FC<MicroBoardProps> = ({
  cells,
  onCellClick,
  disabled,
  highlight,
  winner,
}) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 40px)",
    gridTemplateRows: "repeat(3, 40px)",
    gap: "2px",
    padding: "2px",
    border: highlight ? "2px solid #3399ff" : "2px solid #999",
    backgroundColor:
      winner !== "" ? (winner === "X" ? "#a0d8f0" : "#f0a0a0") : "#fff",
    borderRadius: "4px",
    width: "max-content", // or a fixed size like "150px"
    height: "max-content", // or a fixed size like "150px"
    justifyContent: "center",
    alignContent: "center",
  };

  return (
    <div
      style={gridStyle}
      aria-label={winner ? `MicroBoard won by ${winner}` : "MicroBoard"}
    >
      {cells.map((cellValue, index) => (
        <Cell
          key={index}
          value={cellValue}
          onClick={() => onCellClick(index)}
          disabled={disabled || cellValue !== ""}
        />
      ))}
      {winner && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            fontWeight: "bold",
            fontSize: "14px",
            color: "red",
          }}
        >
          Winner: {winner}
        </div>
      )}
    </div>
  );
};

export default MicroBoard;
