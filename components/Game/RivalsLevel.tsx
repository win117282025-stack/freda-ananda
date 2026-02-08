import React from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export const RivalsLevel: React.FC = () => {
  return (
    <>
      {/* ARENA FLOOR */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -2, 0]} receiveShadow>
          <boxGeometry args={[100, 2, 100]} />
          <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Grid pattern overlay */}
        <gridHelper args={[100, 50, 'cyan', 'gray']} position={[0, -0.99, 0]} />
      </RigidBody>

      {/* WALLS & COVER */}
      <group>
        {/* Central Monolith */}
        <RigidBody type="fixed">
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[8, 10, 8]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        </RigidBody>

        {/* Tactical Cover Blocks */}
        {[
          [-15, 1, -15], [15, 1, 15], [-15, 1, 15], [15, 1, -15],
          [-25, 2, 0], [25, 2, 0], [0, 2, -25], [0, 2, 25]
        ].map((pos, i) => (
          <RigidBody key={i} type="fixed">
            <mesh position={new THREE.Vector3(...pos)} castShadow>
              <boxGeometry args={[4, pos[1]*2, 4]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#4b5563" : "#6b7280"} />
            </mesh>
          </RigidBody>
        ))}

        {/* Ramps */}
        <RigidBody type="fixed">
             <mesh position={[0, 0, 15]} rotation={[Math.PI / 6, 0, 0]} castShadow>
                <boxGeometry args={[6, 1, 12]} />
                <meshStandardMaterial color="#9ca3af" />
             </mesh>
        </RigidBody>
        <RigidBody type="fixed">
             <mesh position={[0, 0, -15]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
                <boxGeometry args={[6, 1, 12]} />
                <meshStandardMaterial color="#9ca3af" />
             </mesh>
        </RigidBody>
      </group>

      {/* BOUNDARY WALLS */}
      <RigidBody type="fixed">
         <mesh position={[50, 5, 0]}>
            <boxGeometry args={[1, 10, 100]} />
            <meshStandardMaterial color="cyan" transparent opacity={0.2} />
         </mesh>
         <mesh position={[-50, 5, 0]}>
            <boxGeometry args={[1, 10, 100]} />
            <meshStandardMaterial color="cyan" transparent opacity={0.2} />
         </mesh>
         <mesh position={[0, 5, 50]}>
            <boxGeometry args={[100, 10, 1]} />
            <meshStandardMaterial color="purple" transparent opacity={0.2} />
         </mesh>
         <mesh position={[0, 5, -50]}>
            <boxGeometry args={[100, 10, 1]} />
            <meshStandardMaterial color="purple" transparent opacity={0.2} />
         </mesh>
      </RigidBody>

      {/* LIGHTING FOR ATMOSPHERE */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 20, 0]} intensity={2} color="cyan" distance={50} decay={2} />
      <pointLight position={[-30, 10, -30]} intensity={1} color="orange" distance={40} />
      <pointLight position={[30, 10, 30]} intensity={1} color="purple" distance={40} />
    </>
  );
};