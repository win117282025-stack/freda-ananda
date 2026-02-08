import React, { Suspense, useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sky, Stars, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from './Game/Player';
import { Level } from './Game/Level';
import { RivalsLevel } from './Game/RivalsLevel';
import { RemotePlayer } from './Game/RemotePlayer';
import { useGameStore } from '../store/gameStore';
import { PlayerState } from '../types';

// Capture Helper Component
const ScreenshotManager: React.FC = () => {
    const { gl, scene, camera } = useThree();
    const addCapture = useGameStore(state => state.addCapture);
    
    useEffect(() => {
        const handleCapture = () => {
            // Force a render to ensure buffer is fresh
            gl.render(scene, camera);
            const url = gl.domElement.toDataURL('image/png');
            addCapture(url);
        };
        
        window.addEventListener('take-screenshot', handleCapture);
        return () => window.removeEventListener('take-screenshot', handleCapture);
    }, [gl, scene, camera, addCapture]);
    
    return null;
};

export const GameScene: React.FC = () => {
  // Select only the IDs of the players. 
  // Use a comma-separated string to allow stable comparison by value
  const playerIdsString = useGameStore(
    state => Object.keys(state.players).sort().join(',')
  );

  const playerIds = useMemo(() => playerIdsString ? playerIdsString.split(',') : [], [playerIdsString]);
  
  const localId = useGameStore(state => state.localId);
  const gameMode = useGameStore(state => state.gameMode);
  
  // Settings
  const graphicsQuality = useGameStore(state => state.graphicsQuality);
  
  // Calculate DPR based on quality (1-10)
  // Map 1 -> 0.4, 5 -> 1.0, 10 -> 1.5 (High quality shouldn't kill mobile)
  const dpr = 0.4 + (graphicsQuality / 10) * 1.1;

  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space'] },
      ]}
    >
      <div className="absolute inset-0 bg-gray-900 z-0">
        <Canvas 
            shadows={graphicsQuality > 4} 
            camera={{ position: [0, 5, 10], fov: 60 }}
            dpr={[0.4, dpr]} // Clamp max dpr based on quality
            gl={{ preserveDrawingBuffer: true }} // Required for toDataURL
        >
          <ScreenshotManager />
          <Suspense fallback={null}>
            {gameMode === 'OBBY' && (
                <>
                    <Sky sunPosition={[100, 20, 100]} />
                    <Stars radius={100} depth={50} count={graphicsQuality * 500} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow={graphicsQuality > 4} />
                </>
            )}
            
            {gameMode === 'RIVALS' && (
                <>
                    <color attach="background" args={['#111827']} />
                    <fog attach="fog" args={['#111827', 10, 80]} />
                    <ambientLight intensity={0.3} />
                </>
            )}
            
            <Physics gravity={[0, -30, 0]}>
              {gameMode === 'OBBY' ? <Level /> : <RivalsLevel />}
              <Player />
            </Physics>

            {/* Render Remote Players */}
            {playerIds.map((id) => {
               if (id === localId) return null;
               // We pass initial data. Subsequent updates happen via transient updates in RemotePlayer.
               // We need to access state.players[id] safely, though it should exist if id is in playerIds
               const p = useGameStore.getState().players[id]; 
               if (!p) return null;
               return <RemotePlayer key={id} id={id} initialData={p} />;
            })}
            
          </Suspense>
        </Canvas>
      </div>
    </KeyboardControls>
  );
};