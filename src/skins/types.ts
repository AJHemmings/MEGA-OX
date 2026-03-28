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

export interface EquippedSkins {
  board_skin_id: string | null;
  marker_x_skin_id: string | null;
  marker_o_skin_id: string | null;
  won_board_x_skin_id: string | null;
  won_board_o_skin_id: string | null;
}
