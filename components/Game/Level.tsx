import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// Procedurally generate a long obby
const generateInfiniteLevel = (count: number) => {
  const blocks = [];
  
  // Start Platform (Larger safe zone)
  blocks.push({ position: [0, -1, 0], size: [10, 2, 10], color: '#4ade80', type: 'start' });

  let currentZ = -10;
  let currentY = -1;
  let currentX = 0;

  for (let i = 0; i < count; i++) {
    const type = Math.random();
    
    // Gap size (Reduced for easier gameplay)
    // Previously 3 + rand*3 (3 to 6). Now 1.5 + rand*2 (1.5 to 3.5)
    const gap = 1.5 + Math.random() * 2.0; 
    currentZ -= gap;
    
    // Height variation (Up or Down slightly) - made gentler
    if (Math.random() > 0.6) currentY += 0.5; // Easier steps up
    else if (currentY > -5 && Math.random() > 0.6) currentY -= 0.5;

    // Side variation (Zig Zag)
    if (Math.random() > 0.7) currentX += (Math.random() - 0.5) * 6;

    if (type < 0.7) {
        // Standard Platform (Wider)
        const width = 4 + Math.random() * 3; // Minimum 4 width
        const length = 4 + Math.random() * 3; // Minimum 4 length
        currentZ -= length / 2;
        blocks.push({
            position: [currentX, currentY, currentZ],
            size: [width, 1, length],
            color: Math.random() > 0.5 ? '#facc15' : '#60a5fa',
            type: 'platform'
        });
        currentZ -= length / 2;
    } else if (type < 0.9) {
        // Bridge (Wider than before)
        const length = 6 + Math.random() * 4;
        currentZ -= length / 2;
        blocks.push({
            position: [currentX, currentY, currentZ],
            size: [2.5, 0.5, length], // Wider bridge (2.5)
            color: '#fb923c',
            type: 'bridge'
        });
        currentZ -= length / 2;
    } else {
        // Jump Pad / Small Platform
        currentZ -= 1;
        blocks.push({
            position: [currentX, currentY, currentZ],
            size: [3, 1, 3], // Bigger landing target
            color: '#ec4899',
            type: 'jump'
        });
        currentZ -= 1;
    }
  }
  
  // End Platform (Far away)
  blocks.push({ position: [0, 0, currentZ - 10], size: [20, 2, 20], color: 'gold', type: 'finish' });

  return blocks;
};

export const Level: React.FC = () => {
  const blocks = useMemo(() => generateInfiniteLevel(200), []); // Generate 200 blocks

  return (
    <>
      {/* Ambient Floor (Kill Zone) */}
      <mesh position={[0, -30, -500]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 2000]} />
        <meshBasicMaterial color="#ef4444" opacity={0.3} transparent />
      </mesh>

      {blocks.map((block, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid" friction={1} restitution={0}>
          <mesh 
            position={new THREE.Vector3(...block.position)} 
            receiveShadow
          >
            <boxGeometry args={block.size as [number, number, number]} />
            <meshStandardMaterial color={block.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
};