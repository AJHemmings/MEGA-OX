import React, { useState } from "react";
import MainMenu from "./components/MainMenu";
import MultiplayerMenu from "./components/MultiplayerMenu";
import GameWrapper from "./components/GameWrapper";

type AppState = 'menu' | 'multiplayer-menu' | 'game';
type GameMode = 'single' | 'local' | 'online-host' | 'online-join';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('single');

  const handleGameModeSelect = (mode: 'single' | 'multi') => {
    if (mode === 'single') {
      setGameMode('single');
      setCurrentState('game');
    } else {
      setCurrentState('multiplayer-menu');
    }
  };

  const handleMultiplayerGameStart = (mode: GameMode) => {
    setGameMode(mode);
    setCurrentState('game');
  };

  const handleBackToMenu = () => {
    setCurrentState('menu');
  };

  const handleBackToMultiplayerMenu = () => {
    setCurrentState('multiplayer-menu');
  };

  // Render based on current state
  switch (currentState) {
    case 'menu':
      return <MainMenu onGameModeSelect={handleGameModeSelect} />;
    
    case 'multiplayer-menu':
      return (
        <MultiplayerMenu 
          onBack={handleBackToMenu}
          onGameStart={handleMultiplayerGameStart}
        />
      );
    
    case 'game':
      return (
        <GameWrapper 
          gameMode={gameMode === 'online-host' || gameMode === 'online-join' ? 'local' : gameMode}
          onBackToMenu={gameMode === 'single' ? handleBackToMenu : handleBackToMultiplayerMenu}
        />
      );
    
    default:
      return <MainMenu onGameModeSelect={handleGameModeSelect} />;
  }
};

export default App;
