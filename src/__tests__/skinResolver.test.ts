// src/__tests__/skinResolver.test.ts
import { resolveGameSkins } from '../skins/resolver';
import { EquippedSkins, GameSkins } from '../skins/types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';

const emptyEquipped: EquippedSkins = {
  board_skin_id: null,
  marker_x_skin_id: null,
  marker_o_skin_id: null,
  won_board_x_skin_id: null,
  won_board_o_skin_id: null,
};

describe('resolveGameSkins', () => {
  it('returns all defaults when both players have no skins equipped', () => {
    const result: GameSkins = resolveGameSkins(emptyEquipped, emptyEquipped);
    expect(result.boardSkin).toEqual(DEFAULT_BOARD_SKIN);
    expect(result.p1MarkerSkin).toEqual(DEFAULT_MARKER_X_SKIN);
    expect(result.p2MarkerSkin).toEqual(DEFAULT_MARKER_O_SKIN);
    expect(result.p1WonBoardSkin).toEqual(DEFAULT_WON_BOARD_X_SKIN);
    expect(result.p2WonBoardSkin).toEqual(DEFAULT_WON_BOARD_O_SKIN);
  });

  it('uses p2 board skin for the board', () => {
    const result = resolveGameSkins(emptyEquipped, {
      ...emptyEquipped,
      board_skin_id: 'default-board', // same ID as default for simplicity
    });
    expect(result.boardSkin.id).toBe('default-board');
  });

  it('uses p1 marker_x skin for p1 marker', () => {
    const result = resolveGameSkins(
      { ...emptyEquipped, marker_x_skin_id: 'default-marker-x' },
      emptyEquipped
    );
    expect(result.p1MarkerSkin.id).toBe('default-marker-x');
  });
});
