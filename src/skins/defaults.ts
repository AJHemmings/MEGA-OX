// src/skins/defaults.ts
import { Skin } from './types';

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

export const ALL_DEFAULT_SKINS: Skin[] = [
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
];
