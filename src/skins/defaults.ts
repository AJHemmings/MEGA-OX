// src/skins/defaults.ts
import { Skin } from './types';

export const DEFAULT_BOARD_SKIN: Skin = {
  id: 'default-board',
  name: 'Default Board',
  type: 'board',
  assetUrl: 'placeholder',
};

export const DEFAULT_MARKER_X_SKIN: Skin = {
  id: 'default-marker-x',
  name: 'Default X',
  type: 'marker_x',
  assetUrl: 'placeholder',
};

export const DEFAULT_MARKER_O_SKIN: Skin = {
  id: 'default-marker-o',
  name: 'Default O',
  type: 'marker_o',
  assetUrl: 'placeholder',
};

export const DEFAULT_WON_BOARD_X_SKIN: Skin = {
  id: 'default-won-board-x',
  name: 'Default Won Board X',
  type: 'won_board_x',
  assetUrl: 'placeholder',
};

export const DEFAULT_WON_BOARD_O_SKIN: Skin = {
  id: 'default-won-board-o',
  name: 'Default Won Board O',
  type: 'won_board_o',
  assetUrl: 'placeholder',
};

export const ALL_DEFAULT_SKINS: Skin[] = [
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
];
