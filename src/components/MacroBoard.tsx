import React from "react";
import MicroBoard from "./MicroBoard";

type MacroBoardProps = {
  microBoards: {
    cells: string[];
    winner: string;
  }[];
  onPlaceMarker: (microBoardIndex: number, cellIndex: number) => void;
  nextMicroBoardIndex: number | null;
  macroWinner: string;
};

const MacroBoard: React.FC<MacroBoardProps> = ({
  microBoards,
  onPlaceMarker,
  nextMicroBoardIndex,
  macroWinner,
}) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 150px)",
    gridTemplateRows: "repeat(3, 150px)",
    gap: "10px",
    border: "3px solid #333",
    padding: "10px",
    borderRadius: "10px",
    position: "relative",
  };

  const lineStyleHorizontal = (index: number): React.CSSProperties => ({
    position: "absolute",
    top: `${150 * index + 10 * (index - 1)}px`, // 150px cell + 10px gap
    left: "0",
    width: "100%",
    height: "4px",
    backgroundColor: "#333",
    zIndex: 1,
  });

  const lineStyleVertical = (index: number): React.CSSProperties => ({
    position: "absolute",
    left: `${150 * index + 10 * (index - 1)}px`,
    top: "0",
    height: "100%",
    width: "4px",
    backgroundColor: "#333",
    zIndex: 1,
  });

  return (
    <div style={gridStyle} aria-label="Macro board">
      {/* Divider Lines */}
      <div style={lineStyleHorizontal(1)} />
      <div style={lineStyleHorizontal(2)} />
      <div style={lineStyleVertical(1)} />
      <div style={lineStyleVertical(2)} />

      {/* MicroBoards */}
      {microBoards.map((mb, index) => (
        <MicroBoard
          key={index}
          cells={mb.cells}
          winner={mb.winner}
          onCellClick={(cellIndex) => onPlaceMarker(index, cellIndex)}
          disabled={
            macroWinner !== "" ||
            (nextMicroBoardIndex !== null && nextMicroBoardIndex !== index)
          }
          highlight={
            nextMicroBoardIndex === null || nextMicroBoardIndex === index
          }
        />
      ))}
    </div>
  );
};

export default MacroBoard;
