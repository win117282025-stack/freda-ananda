import React from 'react';
import { useGameStore } from './store/gameStore';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { GameScene } from './components/GameScene';
import { NetworkManager } from './components/NetworkManager';
import { RobloxMenu } from './components/RobloxMenu';
import { GamePhase } from './types';

function App() {
  const phase = useGameStore((state) => state.phase);
  const isMenuOpen = useGameStore((state) => state.isMenuOpen);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* Logic Components */}
      <NetworkManager />

      {/* UI & Scene */}
      {phase === GamePhase.MENU ? (
        <MainMenu />
      ) : (
        <>
          <HUD />
          {isMenuOpen && <RobloxMenu />}
          <GameScene />
        </>
      )}
    </div>
  );
}

export default App;