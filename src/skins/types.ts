// src/skins/types.ts

export type SkinType =
  | 'board'
  | 'marker_x'
  | 'marker_o'
  | 'won_board_x'
  | 'won_board_o';

export type SkinEvent =
  | 'ambient'
  | 'marker_placed'
  | 'board_won'
  | 'board_targeted'
  | 'game_won'
  | 'game_drawn'
  | null;

export interface Skin {
  id: string;
  name: string;
  type: SkinType;
  /** 'placeholder' uses the built-in CSS fallback. A URL loads a Lottie JSON file. */
  assetUrl: 'placeholder' | string;
}

export interface GameSkins {
  boardSkin: Skin;
  p1MarkerSkin: Skin;       // Player 1 is always X
  p2MarkerSkin: Skin;       // Player 2 is always O
  p1WonBoardSkin: Skin;
  p2WonBoardSkin: Skin;
}

// One player's resolved cosmetic_items rows, already mapped to Skin objects.
// null means "nothing equipped for this slot" (or it's out of scope — see
// won-board skins, which have no cosmetic_items catalog yet and always
// resolve to the default in resolveGameSkins).
export interface PlayerSkinSelection {
  boardSkin: Skin | null;
  markerXSkin: Skin | null;
  markerOSkin: Skin | null;
}
