// src/__tests__/skinResolver.test.ts
import { resolveGameSkins } from '../skins/resolver';
import { PlayerSkinSelection, GameSkins, Skin } from '../skins/types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';

const emptySelection: PlayerSkinSelection = {
  boardSkin: null,
  markerXSkin: null,
  markerOSkin: null,
};

const neonBoard: Skin = { id: 'neon-grid', name: 'Neon Grid', type: 'board', assetUrl: 'data:image/svg+xml,neon-board' };
const neonX: Skin = { id: 'neon-set', name: 'Neon Set', type: 'marker_x', assetUrl: 'data:image/svg+xml,neon-x' };
const pixelO: Skin = { id: 'pixel-set', name: 'Pixel Set', type: 'marker_o', assetUrl: 'data:image/svg+xml,pixel-o' };

describe('resolveGameSkins', () => {
  it('returns all defaults when neither player has anything equipped', () => {
    const result: GameSkins = resolveGameSkins(emptySelection, emptySelection);
    expect(result.boardSkin).toEqual(DEFAULT_BOARD_SKIN);
    expect(result.p1MarkerSkin).toEqual(DEFAULT_MARKER_X_SKIN);
    expect(result.p2MarkerSkin).toEqual(DEFAULT_MARKER_O_SKIN);
    expect(result.p1WonBoardSkin).toEqual(DEFAULT_WON_BOARD_X_SKIN);
    expect(result.p2WonBoardSkin).toEqual(DEFAULT_WON_BOARD_O_SKIN);
  });

  it('uses p2 (O player) board skin, not p1, for the board', () => {
    const result = resolveGameSkins(
      { ...emptySelection, boardSkin: DEFAULT_BOARD_SKIN }, // p1 has one equipped — irrelevant
      { ...emptySelection, boardSkin: neonBoard },           // p2's is the one that counts
    );
    expect(result.boardSkin).toEqual(neonBoard);
  });

  it('uses p1 markerXSkin for p1 (X) and p2 markerOSkin for p2 (O), independently', () => {
    const result = resolveGameSkins(
      { ...emptySelection, markerXSkin: neonX },
      { ...emptySelection, markerOSkin: pixelO },
    );
    expect(result.p1MarkerSkin).toEqual(neonX);
    expect(result.p2MarkerSkin).toEqual(pixelO);
  });

  it('falls back to default per-slot when only one role is equipped', () => {
    const result = resolveGameSkins(
      { ...emptySelection, markerXSkin: neonX }, // p1 equipped X only
      emptySelection,                             // p2 equipped nothing
    );
    expect(result.p1MarkerSkin).toEqual(neonX);
    expect(result.p2MarkerSkin).toEqual(DEFAULT_MARKER_O_SKIN);
  });

  it('won-board skins always default — no purchasable catalog yet', () => {
    const result = resolveGameSkins(emptySelection, emptySelection);
    expect(result.p1WonBoardSkin).toEqual(DEFAULT_WON_BOARD_X_SKIN);
    expect(result.p2WonBoardSkin).toEqual(DEFAULT_WON_BOARD_O_SKIN);
  });
});
