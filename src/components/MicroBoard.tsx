import React from "react";
import Cell from "./Cell";
import "./animations.css";
import WonBoardSkin from "./skins/WonBoardSkin";

type MicroBoardProps = {
  cells: string[];
  onCellClick: (cellIndex: number) => void;
  disabled: boolean;
  highlight: boolean;
  winner: string;
  recentlyPlacedCell?: number;
  currentPlayerMarker?: string;
};

const MicroBoard: React.FC<MicroBoardProps> = ({
  cells,
  onCellClick,
  disabled,
  highlight,
  winner,
  recentlyPlacedCell = -1,
  currentPlayerMarker = "",
}) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    gap: "2px",
    padding: "2px",
    border: "2px solid #999",
    outline: highlight ? "3px solid #3399ff" : "none",
    outlineOffset: "1px",
    backgroundColor: '#fff',
    position: 'relative',
    borderRadius: "4px",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    transition: "all 0.3s ease",
  };

  return (
    <div
      style={gridStyle}
      className={highlight ? "micro-board-active" : ""}
      aria-label={winner ? `MicroBoard won by ${winner}` : "MicroBoard"}
    >
      {cells.map((cellValue, index) => (
        <Cell
          key={index}
          value={cellValue}
          onClick={() => onCellClick(index)}
          disabled={disabled || cellValue !== ""}
          shouldAnimate={recentlyPlacedCell === index && cellValue !== ""}
          playerMarker={recentlyPlacedCell === index ? currentPlayerMarker : ""}
        />
      ))}
      {winner !== '' && (
        <WonBoardSkin player={winner === 'X' ? 1 : 2} />
      )}
    </div>
  );
};

export default MicroBoard;
