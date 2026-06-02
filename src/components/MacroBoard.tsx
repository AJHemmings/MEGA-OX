import React from "react";
import MicroBoard from "./MicroBoard";
import BoardSkin from "./skins/BoardSkin";

type MacroBoardProps = {
  microBoards: {
    cells: string[];
    winner: string;
  }[];
  onPlaceMarker: (microBoardIndex: number, cellIndex: number) => void;
  nextMicroBoardIndex: number | null;
  macroWinner: string;
  lastMove?: {
    microBoardIndex: number;
    cellIndex: number;
    playerMarker: string;
  } | null;
};

const MacroBoard: React.FC<MacroBoardProps> = ({
  microBoards,
  onPlaceMarker,
  nextMicroBoardIndex,
  macroWinner,
  lastMove,
}) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 150px)",
    gridTemplateRows: "repeat(3, 150px)",
    gap: "10px",
    border: "3px solid transparent",
    padding: "10px",
    borderRadius: "10px",
    position: "relative",
  };

  return (
    <BoardSkin>
      <div style={gridStyle} aria-label="Macro board">

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
            recentlyPlacedCell={
              lastMove && lastMove.microBoardIndex === index
                ? lastMove.cellIndex
                : -1
            }
            currentPlayerMarker={
              lastMove && lastMove.microBoardIndex === index
                ? lastMove.playerMarker
                : ""
            }
          />
        ))}
      </div>
    </BoardSkin>
  );
};

export default MacroBoard;
