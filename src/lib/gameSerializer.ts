import { Game, Marker } from '../models/Game';

export interface SerializedState {
  boards: string[][];       // [microBoardIndex][cellIndex] = 'X' | 'O' | ''
  boardWinners: string[];
  macroWinner: string;
  currentPlayerIndex: number;
  nextMicroBoardIndex: number | null;
}

export const serializeGame = (game: Game): SerializedState => ({
  boards: game.macroBoard.microBoards.map(mb => mb.cells.map(c => c.marker)),
  boardWinners: game.macroBoard.microBoards.map(mb => mb.winner),
  macroWinner: game.macroBoard.winner,
  currentPlayerIndex: game.currentPlayerIndex,
  nextMicroBoardIndex: game.nextMicroBoardIndex,
});

export const deserializeGame = (state: SerializedState): Game => {
  const game = new Game();
  state.boards.forEach((cells, mbIdx) => {
    cells.forEach((marker, cIdx) => {
      game.macroBoard.microBoards[mbIdx].cells[cIdx].marker = marker as Marker;
    });
    game.macroBoard.microBoards[mbIdx].winner = state.boardWinners[mbIdx] as Marker;
    game.macroBoard.microBoards[mbIdx].checkFull();
  });
  game.macroBoard.winner = state.macroWinner as Marker;
  game.currentPlayerIndex = state.currentPlayerIndex;
  game.nextMicroBoardIndex = state.nextMicroBoardIndex;
  return game;
};
