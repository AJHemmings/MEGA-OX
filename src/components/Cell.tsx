import React, { useEffect, useRef } from "react";
import "./animations.css";
import MarkerSkin from "./skins/MarkerSkin";

type CellProps = {
  value: string;
  onClick: () => void;
  disabled: boolean;
  highlight?: boolean;
  style?: React.CSSProperties;
  shouldAnimate?: boolean;
  playerMarker?: string;
};

const Cell: React.FC<CellProps> = ({
  value,
  onClick,
  disabled,
  highlight = false,
  style,
  shouldAnimate = false,
  playerMarker = "",
}) => {
  const cellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shouldAnimate && cellRef.current && value && playerMarker) {
      // Remove any existing animation classes
      cellRef.current.classList.remove('cell-highlight-x', 'cell-highlight-o');
      
      // Add the appropriate animation class
      const animationClass = playerMarker === 'X' ? 'cell-highlight-x' : 'cell-highlight-o';
      cellRef.current.classList.add(animationClass);
      
      // Remove the animation class after the animation completes
      const timer = setTimeout(() => {
        if (cellRef.current) {
          cellRef.current.classList.remove(animationClass);
        }
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, value, playerMarker]);

  const player = value === 'X' ? 1 : 2;

  return (
    <button
      ref={cellRef}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "46px",
        height: "46px",
        fontSize: "24px",
        fontWeight: "bold",
        cursor: disabled ? "default" : "pointer",
        backgroundColor: highlight ? "#def" : "#fff",
        border: "1px solid #555",
        outline: "none",
        borderRadius: "4px",
        transition: "all 0.2s ease",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      aria-label={`Cell with value ${value}`}
    >
      <MarkerSkin player={player} value={value} />
    </button>
  );
};

export default Cell;
