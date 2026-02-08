import React, { useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/gameStore';

export const RacingLevel: React.FC = () => {
  const placeObject = useGameStore(state => state.placeObject);
  const clearObjects = useGameStore(state => state.clearObjects);
  const isHost = useGameStore(state => state.isHost);

  // Spawn cars initially if host
  useEffect(() => {
    if (isHost && useGameStore.getState().worldObjects.length === 0) {
        // Spawn 3 Racing Cars
        placeObject({
            id: 'race-car-1',
            type: 'CAR',
            position: [0, 2, 0],
            rotation: [0, 0, 0],
            color: 'red'
        });
        placeObject({
            id: 'race-car-2',
            type: 'CAR',
            position: [5, 2, 0],
            rotation: [0, 0, 0],
            color: 'blue'
        });
        placeObject({
            id: 'race-car-3',
            type: 'CAR',
            position: [-5, 2, 0],
            rotation: [0, 0, 0],
            color: 'green'
        });
    }
  }, [isHost]);

  return (
    <>
      {/* ASPHALT GROUND */}
      <RigidBody type="fixed" friction={2}>
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[500, 1, 500]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* TRACK WALLS (Simple Loop) */}
      <group>
         <RigidBody type="fixed">
             {/* Outer Walls */}
             <mesh position={[0, 2, -100]}>
                 <boxGeometry args={[200, 4, 2]} />
                 <meshStandardMaterial color="white" />
             </mesh>
             <mesh position={[0, 2, 100]}>
                 <boxGeometry args={[200, 4, 2]} />
                 <meshStandardMaterial color="white" />
             </mesh>
             <mesh position={[-100, 2, 0]} rotation={[0, Math.PI/2, 0]}>
                 <boxGeometry args={[200, 4, 2]} />
                 <meshStandardMaterial color="white" />
             </mesh>
             <mesh position={[100, 2, 0]} rotation={[0, Math.PI/2, 0]}>
                 <boxGeometry args={[200, 4, 2]} />
                 <meshStandardMaterial color="white" />
             </mesh>

             {/* Inner Island */}
             <mesh position={[0, 1, 0]}>
                 <boxGeometry args={[100, 2, 100]} />
                 <meshStandardMaterial color="green" />
             </mesh>
         </RigidBody>
      </group>

      {/* RAMPS */}
      <RigidBody type="fixed">
           <mesh position={[0, 0, -50]} rotation={[Math.PI/8, 0, 0]}>
                <boxGeometry args={[20, 1, 30]} />
                <meshStandardMaterial color="orange" />
           </mesh>
      </RigidBody>
      
      {/* CHECKERED START LINE */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
           <planeGeometry args={[40, 5]} />
           <meshStandardMaterial color="white" /> 
           {/* In a real app we'd use a texture */}
      </mesh>
      <mesh position={[0, 0.11, 0]}>
           <boxGeometry args={[40, 0.01, 1]} />
           <meshStandardMaterial color="black" />
      </mesh>
      
      <ambientLight intensity={0.8} />
      <directionalLight position={[100, 100, 50]} intensity={1} castShadow />
    </>
  );
};