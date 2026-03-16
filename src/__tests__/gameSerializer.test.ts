import { serializeGame, deserializeGame } from '../lib/gameSerializer';
import { Game, Marker } from '../models/Game';

test('serialise and deserialise preserves game state', () => {
  const game = new Game('Alice', 'Bob');
  game.placeMarker(4, 4); // X plays centre board, centre cell
  game.placeMarker(4, 2); // O plays centre board (forced), cell 2

  const serialised = serializeGame(game);
  const restored = deserializeGame(serialised);

  expect(restored.macroBoard.microBoards[4].cells[4].marker).toBe(Marker.X);
  expect(restored.macroBoard.microBoards[4].cells[2].marker).toBe(Marker.O);
  expect(restored.nextMicroBoardIndex).toBe(game.nextMicroBoardIndex);
  expect(restored.currentPlayerIndex).toBe(game.currentPlayerIndex);
});

test('deserialise handles empty initial state', () => {
  const game = new Game();
  const restored = deserializeGame(serializeGame(game));
  expect(restored.macroBoard.winner).toBe(Marker.None);
});
