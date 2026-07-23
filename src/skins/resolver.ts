// src/skins/resolver.ts
import { PlayerSkinSelection, GameSkins } from './types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from './defaults';

/**
 * Resolves which skins appear in a game given both players' already-fetched
 * cosmetic selections (see fetchPlayerSkinSelection in loadGameSkins.ts).
 * p1 = Player 1 (X, goes first, won RPS)
 * p2 = Player 2 (O, goes second, owns the board background)
 * Won-board skins have no purchasable catalog yet — always default.
 */
export const resolveGameSkins = (
  p1: PlayerSkinSelection,
  p2: PlayerSkinSelection
): GameSkins => ({
  boardSkin:      p2.boardSkin   ?? DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   p1.markerXSkin ?? DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   p2.markerOSkin ?? DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
});
