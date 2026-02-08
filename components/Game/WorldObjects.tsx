import React, { useRef, useEffect } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { WorldObject } from '../../types';
import * as THREE from 'three';

// Component khusus untuk Mobil agar bisa menggunakan useFrame per-objek
const CarEntity: React.FC<{ obj: WorldObject }> = ({ obj }) => {
    const rbRef = useRef<RapierRigidBody>(null);
    const drivingVehicleId = useGameStore(state => state.drivingVehicleId);
    const setDriving = useGameStore(state => state.setDriving);
    const updateWorldObject = useGameStore(state => state.updateWorldObject);
    const [subscribeKeys, getKeys] = useKeyboardControls();
    
    const isDriven = drivingVehicleId === obj.id;

    // Refs untuk menyimpan posisi lokal mobil saat menyetir
    // Ini penting agar tidak perlu update Store setiap frame (penyebab glitch)
    const currentPos = useRef(new THREE.Vector3(...obj.position));
    const currentRot = useRef(new THREE.Euler(...obj.rotation));

    // Logic Setir Mobil
    useFrame((state, delta) => {
        if (!rbRef.current) return;
        
        if (isDriven) {
            const keys = getKeys();
            const speed = 25 * delta;
            const turnSpeed = 2.5 * delta;

            const forward = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
            const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);

            // Update Rotasi
            if (forward !== 0) {
                 // Mobil hanya belok jika bergerak
                 currentRot.current.y += turn * turnSpeed * (forward > 0 ? 1 : -1); 
            }

            // Update Posisi
            const dir = new THREE.Vector3(0, 0, 1).applyEuler(currentRot.current);
            if (forward !== 0) {
                 currentPos.current.add(dir.multiplyScalar(forward * speed));
            }

            // Terapkan Fisika Kinematic (Langsung, tanpa menunggu prop update)
            rbRef.current.setNextKinematicTranslation(currentPos.current);
            rbRef.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(currentRot.current));

            // Update Kamera agar mengikuti mobil
            const camOffset = new THREE.Vector3(0, 5, -10).applyEuler(currentRot.current);
            const targetCamPos = currentPos.current.clone().add(camOffset);
            
            // Smooth Follow
            state.camera.position.lerp(targetCamPos, 0.1);
            state.camera.lookAt(currentPos.current);
        }
    });

    const handleCarClick = (e: any) => {
        e.stopPropagation();
        if (isDriven) {
            // SAAT TURUN: Simpan posisi terakhir ke Store agar permanen
            updateWorldObject(obj.id, 
                [currentPos.current.x, currentPos.current.y, currentPos.current.z],
                [currentRot.current.x, currentRot.current.y, currentRot.current.z]
            );
            setDriving(null); // Turun
        } else {
            // SAAT NAIK: Sync ref lokal dengan posisi store saat ini
            currentPos.current.set(...obj.position);
            currentRot.current.set(...obj.rotation);
            setDriving(obj.id); // Naik
        }
    };

    return (
        <RigidBody 
            ref={rbRef}
            key={obj.id} 
            type={isDriven ? "kinematicPosition" : "dynamic"} 
            colliders="hull" 
            position={new THREE.Vector3(...obj.position)} // Initial Position only
            rotation={new THREE.Euler(...obj.rotation)} // Initial Rotation only
            mass={500}
            lockRotations={false}
            friction={1}
        >
            <group onClick={handleCarClick}>
                {/* Body */}
                <mesh position={[0, 0.5, 0]} castShadow>
                    <boxGeometry args={[2, 0.8, 4]} />
                    <meshStandardMaterial color={obj.color || 'blue'} />
                </mesh>
                {/* Cabin */}
                <mesh position={[0, 1.2, -0.5]} castShadow>
                    <boxGeometry args={[1.5, 0.8, 2]} />
                    <meshStandardMaterial color="#9ca3af" glassColor="white" transparent opacity={0.9} />
                </mesh>
                
                {/* Wheels */}
                <mesh position={[-1.1, 0, 1.2]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-1.1, 0, 1.2]} rotation={[0, Math.PI/2, 0]}>
                     <boxGeometry args={[0.2, 0.2, 0.2]} />
                     <meshStandardMaterial color="gray" />
                </mesh>

                <mesh position={[1.1, 0, 1.2]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                 <mesh position={[1.1, 0, 1.2]} rotation={[0, Math.PI/2, 0]}>
                     <boxGeometry args={[0.2, 0.2, 0.2]} />
                     <meshStandardMaterial color="gray" />
                </mesh>

                <mesh position={[-1.1, 0, -1.2]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                 <mesh position={[-1.1, 0, -1.2]} rotation={[0, Math.PI/2, 0]}>
                     <boxGeometry args={[0.2, 0.2, 0.2]} />
                     <meshStandardMaterial color="gray" />
                </mesh>

                <mesh position={[1.1, 0, -1.2]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                 <mesh position={[1.1, 0, -1.2]} rotation={[0, Math.PI/2, 0]}>
                     <boxGeometry args={[0.2, 0.2, 0.2]} />
                     <meshStandardMaterial color="gray" />
                </mesh>

                {/* Prompt */}
                {!isDriven && (
                    <mesh position={[0, 2.5, 0]}>
                        <planeGeometry args={[2, 0.5]} />
                        <meshBasicMaterial color="black" />
                    </mesh>
                )}
            </group>
        </RigidBody>
    );
}

export const WorldObjects: React.FC = () => {
    const objects = useGameStore(state => state.worldObjects);

    return (
        <>
            {objects.map((obj) => {
                if (obj.type === 'BLOCK') {
                    return (
                        <RigidBody key={obj.id} type="fixed" colliders="cuboid" position={new THREE.Vector3(...obj.position)}>
                            <mesh>
                                <boxGeometry args={[2, 2, 2]} />
                                <meshStandardMaterial color={obj.color || 'white'} />
                            </mesh>
                        </RigidBody>
                    );
                }
                if (obj.type === 'SPHERE') {
                    return (
                         <RigidBody key={obj.id} type="dynamic" colliders="ball" position={new THREE.Vector3(...obj.position)}>
                            <mesh>
                                <sphereGeometry args={[1.5, 32, 32]} />
                                <meshStandardMaterial color={obj.color || 'red'} />
                            </mesh>
                        </RigidBody>
                    );
                }
                if (obj.type === 'HOUSE') {
                    return (
                        <group key={obj.id} position={new THREE.Vector3(...obj.position)} rotation={new THREE.Euler(...obj.rotation)}>
                            {/* Floor */}
                            <RigidBody type="fixed">
                                <mesh position={[0, 0.1, 0]}>
                                    <boxGeometry args={[10, 0.2, 10]} />
                                    <meshStandardMaterial color="#78350f" />
                                </mesh>
                            </RigidBody>
                            {/* Walls */}
                            <RigidBody type="fixed">
                                <mesh position={[0, 2.5, -4.9]}>
                                    <boxGeometry args={[10, 5, 0.2]} />
                                    <meshStandardMaterial color="#fcd34d" />
                                </mesh>
                                <mesh position={[-4.9, 2.5, 0]} rotation={[0, Math.PI/2, 0]}>
                                    <boxGeometry args={[10, 5, 0.2]} />
                                    <meshStandardMaterial color="#fcd34d" />
                                </mesh>
                                <mesh position={[4.9, 2.5, 0]} rotation={[0, Math.PI/2, 0]}>
                                    <boxGeometry args={[10, 5, 0.2]} />
                                    <meshStandardMaterial color="#fcd34d" />
                                </mesh>
                            </RigidBody>
                            {/* Roof */}
                            <RigidBody type="fixed">
                                <mesh position={[0, 6, 0]} rotation={[0, Math.PI/4, 0]}>
                                    <coneGeometry args={[9, 4, 4]} />
                                    <meshStandardMaterial color="#991b1b" />
                                </mesh>
                            </RigidBody>
                        </group>
                    );
                }
                if (obj.type === 'CAR') {
                    return <CarEntity key={obj.id} obj={obj} />;
                }
                return null;
            })}
        </>
    );
};