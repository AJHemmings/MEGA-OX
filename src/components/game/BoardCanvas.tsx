// src/components/game/BoardCanvas.tsx
// Scales the fixed-pixel MacroBoard down to fit narrow viewports while keeping
// all internal pixel values intact. Re-measures on window resize so rotating a
// device mid-game reflows the board.
import React, { useEffect, useState } from 'react';

const BOARD_PX = 490;

const availWidth = () => Math.min(524, window.innerWidth) - 28;

const BoardCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availW, setAvailW] = useState(availWidth);

  useEffect(() => {
    const onResize = () => setAvailW(availWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scale = Math.min(1, availW / BOARD_PX);

  return (
    <div style={{ overflow: 'hidden', height: Math.round(BOARD_PX * scale) }}>
      <div style={{ width: BOARD_PX, height: BOARD_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
};

export default BoardCanvas;
