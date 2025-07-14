import { useState, useCallback } from "react";
import { Game, Marker } from "../models/Game";

export function useGameLogic() {
  const [game, setGame] = useState(new Game());
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Marker>(Marker.None);
  const [lastMove, setLastMove] = useState<{
    microBoardIndex: number;
    cellIndex: number;
    playerMarker: string;
  } | null>(null);

  const onPlaceMarker = useCallback(
    (microBoardIndex: number, cellIndex: number) => {
      if (gameOver) return false;
      
      // Get current player before making the move
      const currentPlayerMarker = game.currentPlayer.marker;
      
      const success = game.placeMarker(microBoardIndex, cellIndex);
      if (success) {
        // Track the last move for animation
        setLastMove({
          microBoardIndex,
          cellIndex,
          playerMarker: currentPlayerMarker,
        });
        
        // Clear the last move after animation duration
        setTimeout(() => {
          setLastMove(null);
        }, 2500);
        
        if (game.isGameOver()) {
          setGameOver(true);
          const w = game.macroBoard.winner;
          setWinner(w);
          // Update counts accordingly
          if (w === Marker.None) {
            game.incrementWin(Marker.None);
          } else {
            game.incrementWin(w);
          }
        }
        // Trigger state update by resetting game reference to force React re-render
        setGame(
          Object.assign(Object.create(Object.getPrototypeOf(game)), game)
        );
      }
      return success;
    },
    [game, gameOver]
  );

  const resetGame = useCallback(() => {
    game.resetGame();
    setGame(Object.assign(Object.create(Object.getPrototypeOf(game)), game));
    setGameOver(false);
    setWinner(Marker.None);
    setLastMove(null);
  }, [game]);

  return {
    game,
    gameOver,
    winner,
    onPlaceMarker,
    resetGame,
    lastMove,
  };
}
