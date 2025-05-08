import { useState, useCallback } from "react";
import { Game, Marker } from "../models/Game";

export function useGameLogic() {
  const [game, setGame] = useState(new Game());
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Marker>(Marker.None);

  const onPlaceMarker = useCallback(
    (microBoardIndex: number, cellIndex: number) => {
      if (gameOver) return false;
      const success = game.placeMarker(microBoardIndex, cellIndex);
      if (success) {
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
  }, [game]);

  return {
    game,
    gameOver,
    winner,
    onPlaceMarker,
    resetGame,
  };
}
