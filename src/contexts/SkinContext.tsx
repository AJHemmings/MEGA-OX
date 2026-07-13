// src/contexts/SkinContext.tsx
import React, { createContext, useContext } from 'react';
import { GameSkins } from '../skins/types';
import { DEFAULT_GAME_SKINS } from '../skins/defaults';

const SkinContext = createContext<GameSkins>(DEFAULT_GAME_SKINS);

export const SkinProvider: React.FC<{
  skins: GameSkins;
  children: React.ReactNode;
}> = ({ skins, children }) => (
  <SkinContext.Provider value={skins}>{children}</SkinContext.Provider>
);

export const useSkins = () => useContext(SkinContext);
