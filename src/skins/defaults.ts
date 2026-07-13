// src/skins/defaults.ts
import { GameSkins, Skin } from './types';

export const DEFAULT_BOARD_SKIN: Skin = {
  id: 'default-board',
  name: 'Default Board',
  type: 'board',
  assetUrl: '/assets/default-board.svg',
};

export const DEFAULT_MARKER_X_SKIN: Skin = {
  id: 'default-marker-x',
  name: 'Default X (Xan)',
  type: 'marker_x',
  assetUrl: '/assets/xan.svg',
};

export const DEFAULT_MARKER_O_SKIN: Skin = {
  id: 'default-marker-o',
  name: 'Default O (Mo)',
  type: 'marker_o',
  assetUrl: '/assets/mo.svg',
};

export const DEFAULT_WON_BOARD_X_SKIN: Skin = {
  id: 'default-won-board-x',
  name: 'Default Won Board X (Xan)',
  type: 'won_board_x',
  assetUrl: '/assets/xan-won.json',
};

export const DEFAULT_WON_BOARD_O_SKIN: Skin = {
  id: 'default-won-board-o',
  name: 'Default Won Board O (Mo)',
  type: 'won_board_o',
  assetUrl: '/assets/mo-won.json',
};

// Complete default loadout — the fallback used by SkinContext and any game
// screen that renders before player skins are resolved.
export const DEFAULT_GAME_SKINS: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

export const ALL_DEFAULT_SKINS: Skin[] = [
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
];
