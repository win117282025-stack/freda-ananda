import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { PlayerState } from '../../types';
import { CharacterModel } from './CharacterModel';

interface Props {
  id: string;
  initialData: PlayerState;
}

export const RemotePlayer: React.FC<Props> = ({ id, initialData }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // We keep track of the last known position to smooth locally
  const prevPos = useRef(new THREE.Vector3(...initialData.position));
  const [isMoving, setIsMoving] = useState(false);
  
  useFrame((state, delta) => {
    // Get latest data directly from store to avoid prop drilling updates
    const playerData = useGameStore.getState().players[id];
    
    if (groupRef.current && playerData) {
      // If player is driving, they might be handled differently, but generally sync position same way
      const targetPos = new THREE.Vector3(...playerData.position);
      
      const dist = targetPos.distanceTo(prevPos.current);
      const safeDelta = delta || 0.016; // Prevent divide by zero
      const speed = dist / safeDelta;
      
      // OPTIMIZATION: Hysteresis to prevent rapid toggling loop
      // Start moving at 0.1, stop moving at 0.05
      if (isMoving && speed < 0.05) {
          setIsMoving(false);
      } else if (!isMoving && speed > 0.1) {
          setIsMoving(true);
      }
      
      groupRef.current.position.lerp(targetPos, 0.2);
      
      const currentRotY = groupRef.current.rotation.y;
      const targetRotY = playerData.rotation[1];
      
      let diff = (targetRotY - currentRotY + Math.PI) % (Math.PI * 2) - Math.PI;
      groupRef.current.rotation.y += diff * 0.2;

      prevPos.current.copy(groupRef.current.position);
      
      // Hide visual if driving
      if (playerData.drivingVehicleId) {
          groupRef.current.visible = false;
      } else {
          groupRef.current.visible = true;
      }
    }
  });

  // Get health for bar
  const hp = useGameStore(state => state.players[id]?.health ?? 100);
  const maxHp = useGameStore(state => state.players[id]?.maxHealth ?? 100);

  return (
    <group ref={groupRef} position={initialData.position}>
      <CharacterModel 
        color={initialData.color} 
        heldItem={useGameStore.getState().players[id]?.heldItem || 'NONE'} 
        isMoving={isMoving}
        isRunning={isMoving}
        isAttacking={useGameStore.getState().players[id]?.isAttacking}
        emote={useGameStore.getState().players[id]?.emote}
      />

      {/* Info Tag Billboard */}
      <Billboard
         position={[0, 3.2, 0]}
         follow={true}
         lockX={false}
         lockY={false}
         lockZ={false}
      >
        {/* HEALTH BAR */}
        <group position={[0, 0.4, 0]}>
            <mesh position={[0, 0, -0.01]}>
                 <planeGeometry args={[1.54, 0.24]} />
                 <meshBasicMaterial color="black" />
            </mesh>
            <mesh position={[-0.75 + (1.5 * (hp/maxHp) / 2), 0, 0]}>
                 <planeGeometry args={[1.5 * (hp/maxHp), 0.2]} />
                 <meshBasicMaterial color={hp > 50 ? "#22c55e" : hp > 20 ? "#eab308" : "#ef4444"} />
            </mesh>
        </group>

        {/* NAME TAG */}
        <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[initialData.username.length * 0.2 + 0.5, 0.5]} />
            <meshBasicMaterial color="black" transparent opacity={0.4} />
        </mesh>
        
        <Text
            fontSize={0.35}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
            fontWeight="bold"
        >
            {initialData.username} {initialData.role === 'ADMIN' ? '🛡️' : initialData.role === 'OWNER' ? '👑' : ''}
        </Text>
      </Billboard>
    </group>
  );
};