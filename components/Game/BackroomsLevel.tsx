import React, { useRef, useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const Nextbot: React.FC<{ position: [number, number, number], image: string, name: string }> = ({ position, image, name }) => {
    const ref = useRef<any>(null);
    const localPlayerId = useGameStore(state => state.localId);
    
    useFrame((state, delta) => {
        if (!ref.current) return;
        
        // Simple AI: Find local player and move towards them
        // In a real multiplayer game, this logic should be on the host and synced via network.
        // For this demo, we make it client-side visual for scare effect.
        
        const player = useGameStore.getState().players[localPlayerId];
        if (player) {
            const playerPos = new THREE.Vector3(...player.position);
            const botPos = ref.current.translation();
            const vecBot = new THREE.Vector3(botPos.x, botPos.y, botPos.z);
            
            const dir = playerPos.sub(vecBot).normalize();
            
            // Move
            const speed = 6;
            ref.current.setLinvel({ x: dir.x * speed, y: -1, z: dir.z * speed }, true);
            
            // Jumpscare distance
            if (vecBot.distanceTo(new THREE.Vector3(...player.position)) < 2) {
                // Kill logic would go here
            }
        }
    });

    return (
        <RigidBody ref={ref} type="dynamic" position={position} lockRotations enabledRotations={[false, true, false]} linearDamping={0}>
             <Billboard>
                 <mesh>
                     <planeGeometry args={[2, 2]} />
                     <meshBasicMaterial color="white" map={new THREE.TextureLoader().load(image)} transparent />
                 </mesh>
                 <Text position={[0, 1.2, 0]} fontSize={0.2} color="red" anchorY="bottom">{name}</Text>
             </Billboard>
        </RigidBody>
    );
};

export const BackroomsLevel: React.FC = () => {
  return (
    <>
      {/* CEILING */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI/2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#d1d5db" />
      </mesh>

      {/* FLOOR (Carpet) */}
      <RigidBody type="fixed">
          <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial color="#ca8a04" roughness={1} />
          </mesh>
      </RigidBody>

      {/* WALLS (Maze-like) */}
      <RigidBody type="fixed">
           {/* Outer Bounds */}
           <mesh position={[0, 3, -50]}>
               <boxGeometry args={[100, 6, 1]} />
               <meshStandardMaterial color="#fef08a" />
           </mesh>
           <mesh position={[0, 3, 50]}>
               <boxGeometry args={[100, 6, 1]} />
               <meshStandardMaterial color="#fef08a" />
           </mesh>
           <mesh position={[-50, 3, 0]} rotation={[0, Math.PI/2, 0]}>
               <boxGeometry args={[100, 6, 1]} />
               <meshStandardMaterial color="#fef08a" />
           </mesh>
           <mesh position={[50, 3, 0]} rotation={[0, Math.PI/2, 0]}>
               <boxGeometry args={[100, 6, 1]} />
               <meshStandardMaterial color="#fef08a" />
           </mesh>

           {/* Random Pillars/Walls */}
           {[...Array(20)].map((_, i) => (
               <mesh key={i} position={[(Math.random()-0.5)*80, 3, (Math.random()-0.5)*80]} rotation={[0, Math.random() > 0.5 ? Math.PI/2 : 0, 0]}>
                   <boxGeometry args={[Math.random() * 10 + 5, 6, 1]} />
                   <meshStandardMaterial color="#fef08a" />
               </mesh>
           ))}
      </RigidBody>

      {/* LIGHTING (Dim & Yellow) */}
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="yellow" distance={20} decay={2} />
      <pointLight position={[20, 5, 20]} intensity={0.5} color="yellow" distance={20} decay={2} />
      <pointLight position={[-20, 5, -20]} intensity={0.5} color="yellow" distance={20} decay={2} />
      <fog attach="fog" args={['#422006', 0, 25]} />

      {/* NEXTBOTS */}
      <Nextbot position={[10, 2, 10]} name="OBUNGA" image="https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png" />
      <Nextbot position={[-15, 2, -15]} name="ANGRY" image="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/SNice.svg/1200px-SNice.svg.png" />
    </>
  );
};