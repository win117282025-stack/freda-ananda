import React, { Suspense, useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sky, Stars, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from './Game/Player';
import { Level } from './Game/Level';
import { RivalsLevel } from './Game/RivalsLevel';
import { RacingLevel } from './Game/RacingLevel';
import { BackroomsLevel } from './Game/BackroomsLevel';
import { RemotePlayer } from './Game/RemotePlayer';
import { WorldObjects } from './Game/WorldObjects';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

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

// Day/Night Cycle Component
const DayNightCycle: React.FC = () => {
    const skyRef = useRef<any>(null);
    const starRef = useRef<any>(null);
    const lightRef = useRef<THREE.DirectionalLight>(null);
    
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        // Cycle every 120 seconds
        const cycle = (time % 120) / 120; 
        const angle = cycle * Math.PI * 2;
        
        // Sun moves in arc
        const sunX = Math.sin(angle) * 100;
        const sunY = Math.cos(angle) * 100;
        
        if (skyRef.current) {
            skyRef.current.material.uniforms.sunPosition.value.set(sunX, sunY, -100);
        }
        
        if (lightRef.current) {
            lightRef.current.position.set(sunX, sunY, -100);
            lightRef.current.intensity = Math.max(0, Math.cos(angle)) * 1.5;
        }

        if (starRef.current) {
            // Stars visible when sun is low
            starRef.current.rotation.y += 0.0005;
            // Fade logic simplified
        }
    });

    return (
        <>
            <Sky ref={skyRef} distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <Stars ref={starRef} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <directionalLight ref={lightRef} castShadow intensity={1} shadow-mapSize={[1024, 1024]} />
            <ambientLight intensity={0.2} />
        </>
    );
};

export const GameScene: React.FC = () => {
  const playerIdsString = useGameStore(
    state => Object.keys(state.players).sort().join(',')
  );

  const playerIds = useMemo(() => playerIdsString ? playerIdsString.split(',') : [], [playerIdsString]);
  
  const localId = useGameStore(state => state.localId);
  const gameMode = useGameStore(state => state.gameMode);
  
  const graphicsQuality = useGameStore(state => state.graphicsQuality);
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
            dpr={[0.4, dpr]} 
            gl={{ preserveDrawingBuffer: true }} 
        >
          <ScreenshotManager />
          <Suspense fallback={null}>
            {gameMode === 'OBBY' && <DayNightCycle />}
            {gameMode === 'RACING' && <DayNightCycle />}
            
            {gameMode === 'RIVALS' && (
                <>
                    <color attach="background" args={['#111827']} />
                    <fog attach="fog" args={['#111827', 10, 80]} />
                    <ambientLight intensity={0.3} />
                </>
            )}

            {gameMode === 'BACKROOMS' && (
                <color attach="background" args={['#422006']} />
            )}
            
            <Physics gravity={[0, -30, 0]}>
              {gameMode === 'OBBY' && <Level />}
              {gameMode === 'RIVALS' && <RivalsLevel />}
              {gameMode === 'RACING' && <RacingLevel />}
              {gameMode === 'BACKROOMS' && <BackroomsLevel />}
              
              <WorldObjects />
              <Player />
            </Physics>

            {playerIds.map((id) => {
               if (id === localId) return null;
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