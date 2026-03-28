// src/contexts/SkinContext.tsx
import React, { createContext, useContext } from 'react';
import { GameSkins } from '../skins/types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

const SkinContext = createContext<GameSkins>(defaultGameSkins);

export const SkinProvider: React.FC<{
  skins: GameSkins;
  children: React.ReactNode;
}> = ({ skins, children }) => (
  <SkinContext.Provider value={skins}>{children}</SkinContext.Provider>
);

export const useSkins = () => useContext(SkinContext);
