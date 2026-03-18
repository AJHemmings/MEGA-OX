// src/skins/resolver.ts
import { EquippedSkins, GameSkins } from './types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from './defaults';
import { getSkin } from './registry';

/**
 * Resolves which skins appear in a game given both players' equipped skins.
 * p1Skins = Player 1 (X, goes first, won RPS)
 * p2Skins = Player 2 (O, goes second, owns the board background)
 */
export const resolveGameSkins = (
  p1Skins: EquippedSkins,
  p2Skins: EquippedSkins
): GameSkins => ({
  boardSkin:      getSkin(p2Skins.board_skin_id,       DEFAULT_BOARD_SKIN),
  p1MarkerSkin:   getSkin(p1Skins.marker_x_skin_id,    DEFAULT_MARKER_X_SKIN),
  p2MarkerSkin:   getSkin(p2Skins.marker_o_skin_id,    DEFAULT_MARKER_O_SKIN),
  p1WonBoardSkin: getSkin(p1Skins.won_board_x_skin_id, DEFAULT_WON_BOARD_X_SKIN),
  p2WonBoardSkin: getSkin(p2Skins.won_board_o_skin_id, DEFAULT_WON_BOARD_O_SKIN),
});
