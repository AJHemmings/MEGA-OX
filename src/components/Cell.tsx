import React from "react";

type CellProps = {
  value: string;
  onClick: () => void;
  disabled: boolean;
  highlight?: boolean;
  style?: React.CSSProperties;
};

const Cell: React.FC<CellProps> = ({
  value,
  onClick,
  disabled,
  highlight = false,
  style,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "40px",
        height: "40px",
        fontSize: "24px",
        fontWeight: "bold",
        cursor: disabled ? "default" : "pointer",
        backgroundColor: highlight ? "#def" : "#fff",
        border: "1px solid #555",
        outline: "none",
        ...style,
      }}
      aria-label={`Cell with value ${value}`}
    >
      {value}
    </button>
  );
};

export default Cell;
