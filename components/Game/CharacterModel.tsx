import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { R6_SIZE } from '../../constants';
import { ItemType } from '../../types';

interface CharacterProps {
  color: string;
  heldItem?: ItemType;
  isMoving: boolean;
  isRunning: boolean;
  isAttacking?: boolean;
  isJumping?: boolean;
  isThrowing?: boolean;
  emote?: string;
}

export const CharacterModel: React.FC<CharacterProps> = ({ color, heldItem, isMoving, isRunning, isAttacking, isJumping, isThrowing, emote }) => {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);

  // --- MATERIALS ---
  // Classic Noob Colors:
  // Skin (Head/Arms): Bright Yellow (#facc15)
  // Torso: Dynamic Player Color (Shirt)
  // Legs: Bright Green (#4ade80)
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#facc15' }), []); 
  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: color }), [color]);
  const pantsMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4ade80' }), []); 
  
  // Ukulele Materials
  const ukuBodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6d4c41', roughness: 0.3 }), []);
  const ukuDarkMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3e2723' }), []);
  const ukuFretMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a' }), []);
  const ukuStringMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#eeeeee', transparent: true, opacity: 0.8, side: THREE.DoubleSide }), []);
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 0.8, roughness: 0.2 }), []);

  // Fishing Rod Materials
  const rodHandleMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d2d2d' }), []); 
  const rodPoleMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a' }), []); 
  const reelMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#555555' }), []); 
  const lineMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 'white', transparent: true, opacity: 0.5 }), []);

  // Weakest Dummy Materials
  const dummyColor = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e5e7eb' }), []); // Grayish

  // Face Material (Classic Smiley)
  const faceMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 'black' }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = isRunning ? 15 : 10;
    const amp = isRunning ? 0.8 : 0.5;

    // Reset basics
    let leftLegRotX = 0;
    let rightLegRotX = 0;
    let leftArmRotX = 0;
    let rightArmRotX = 0;
    let rightArmRotY = 0;
    let rightArmRotZ = 0;
    let rightArmPosZ = 0;
    let leftArmRotZ = 0; 
    let torsoRotY = 0;   
    
    // --- ANIMATION PRIORITY SYSTEM ---
    
    // 1. DANCE
    if (emote && emote !== 'none' && !isMoving && !isJumping) {
        if (emote === 'dance1') {
             leftArmRotZ = 2.5 + Math.sin(t * 5) * 0.5; 
             rightArmRotZ = -2.5 - Math.sin(t * 5) * 0.5;
             leftLegRotX = Math.sin(t * 10) * 0.1;
             rightLegRotX = -Math.sin(t * 10) * 0.1;
        } else if (emote === 'dance2') {
             torsoRotY = Math.sin(t * 10) * 0.5;
             leftArmRotX = Math.cos(t * 10) * 0.5;
             rightArmRotX = -Math.cos(t * 10) * 0.5;
             leftLegRotX = Math.sin(t * 10) * 0.2;
             rightLegRotX = -Math.sin(t * 10) * 0.2;
        } else if (emote === 'dance3') {
             const fastT = t * 15;
             rightArmRotZ = -0.5 + Math.sin(fastT) * 0.5;
             leftArmRotZ = 0.5 + Math.cos(fastT) * 0.5;
             leftArmRotX = Math.sin(fastT) * 0.5;
             rightArmRotX = Math.sin(fastT) * 0.5;
        }
    }

    // 2. WALK / RUN
    if (isMoving) {
        leftLegRotX = Math.sin(t * speed) * amp;
        rightLegRotX = -Math.sin(t * speed) * amp; 
        leftArmRotX = -Math.sin(t * speed) * amp; 
        
        leftArmRotZ = 0;
        rightArmRotZ = 0;
        torsoRotY = 0;

        if (!heldItem || heldItem === 'NONE') {
            rightArmRotX = Math.sin(t * speed) * amp;
        }
    }

    // 3. JUMP
    if (isJumping) {
        leftLegRotX = 0.5; 
        rightLegRotX = -0.2; 
        leftArmRotZ = 2.8; 
        rightArmRotZ = -2.8;
        
        if (heldItem && heldItem !== 'NONE') {
            rightArmRotZ = 0;
        }
    }

    // 4. ACTION / HOLDING ITEMS
    if (heldItem && heldItem !== 'NONE') {
         if (heldItem === 'GUN' || heldItem === 'SWORD' || heldItem === 'BUILD') {
             rightArmRotX = Math.PI / 2;
         }
         else if (heldItem === 'UKULELE') {
             rightArmRotX = 0.8; 
             rightArmRotY = -0.5; 
             rightArmRotZ = -0.5;
         }
         else if (heldItem === 'FISHING_ROD') {
             rightArmRotX = Math.PI / 4.5; 
         }
         else if (heldItem === 'WEAKEST_DUMMY') {
             rightArmRotX = Math.PI / 2; // Hold out forward
         }

         if (isAttacking) {
             if (heldItem === 'SWORD' || heldItem === 'BUILD' || heldItem === 'WEAKEST_DUMMY') {
                 rightArmRotX = Math.PI / 2 + Math.sin(t * 15) * 0.8;
             }
             else if (heldItem === 'GUN') {
                 rightArmRotX += 0.2; rightArmPosZ = 0.1; 
             }
             else if (heldItem === 'UKULELE') {
                 rightArmRotZ -= 0.2 * Math.sin(t * 25);
                 rightArmRotX += 0.05 * Math.sin(t * 25);
             }
             else if (heldItem === 'FISHING_ROD') {
                 rightArmRotX -= 0.3; 
             }
         }
    }

    // 5. THROW
    if (isThrowing) {
        rightArmRotX = Math.PI / 2 + Math.sin(t * 20) * 2; 
    }

    // --- APPLY ROTATIONS ---
    const lerpFactor = 0.2;
    
    if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, leftLegRotX, lerpFactor);
    if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, rightLegRotX, lerpFactor);
    
    if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, leftArmRotX, lerpFactor);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, leftArmRotZ, lerpFactor);
    }
    
    if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, rightArmRotX, lerpFactor);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, rightArmRotY, lerpFactor);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, rightArmRotZ, lerpFactor);
        rightArmRef.current.position.z = THREE.MathUtils.lerp(rightArmRef.current.position.z, rightArmPosZ, lerpFactor);
    }

    // Head Bob
    if (headRef.current) {
        const targetHeadY = 1.5 + (isMoving ? Math.sin(t * 15) * 0.02 : Math.sin(t * 2) * 0.02);
        headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, targetHeadY, 0.1);
    }
    
    if (torsoRef.current) {
         torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, torsoRotY, 0.1);
    }
  });

  return (
    <group>
      {/* TORSO */}
      <mesh ref={torsoRef} position={[0, 1, 0]} castShadow>
        <boxGeometry args={R6_SIZE.Torso as [number, number, number]} />
        <primitive object={shirtMaterial} />
      </mesh>

      {/* HEAD - UPDATED TO CYLINDER (Pillar Lingkaran) */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        <mesh castShadow position={[0, 0.25, 0]}>
            {/* Radius 0.3 (Diameter 0.6) matches typical blocky proportion better than 0.5 box */}
            <cylinderGeometry args={[0.3, 0.3, 0.6, 32]} />
            <primitive object={skinMaterial} />
        </mesh>
        
        {/* FACE (Simple Smiley) */}
        <group position={[0, 0.25, -0.28]} rotation={[0, 0, 0]}>
             {/* Eyes */}
             <mesh position={[-0.08, 0.05, 0]}>
                 <planeGeometry args={[0.05, 0.08]} />
                 <primitive object={faceMaterial} />
             </mesh>
             <mesh position={[0.08, 0.05, 0]}>
                 <planeGeometry args={[0.05, 0.08]} />
                 <primitive object={faceMaterial} />
             </mesh>
             {/* Mouth (Simple rectangle curve illusion) */}
             <mesh position={[0, -0.06, 0.01]}>
                 <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
                 <meshStandardMaterial color="black" />
                 {/* Rotate mouth to smile */}
                 <group rotation={[0, 0, Math.PI]} /> 
             </mesh>
              {/* Fallback Mouth if Torus is tricky: Simple Box */}
             <mesh position={[0, -0.06, 0]}>
                 <planeGeometry args={[0.12, 0.03]} />
                 <primitive object={faceMaterial} />
             </mesh>
        </group>
      </group>

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.75, 1.25, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={R6_SIZE.Limb as [number, number, number]} />
            <primitive object={skinMaterial} />
        </mesh>
      </group>

      {/* RIGHT ARM & HELD ITEMS */}
      <group ref={rightArmRef} position={[0.75, 1.25, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={R6_SIZE.Limb as [number, number, number]} />
            <primitive object={skinMaterial} />
        </mesh>
        
        {/* === ITEM ATTACHMENT POINT (Hand) === */}
        <group position={[0, -1.0, 0]}>
            
            {/* GUN */}
            {heldItem === 'GUN' && (
                <group rotation={[0, 0, 0]}>
                    <mesh position={[0, 0.2, 0]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.05, 0.05, 0.6]} /><meshStandardMaterial color="#111"/></mesh>
                    <mesh position={[0, 0.1, 0.15]}><boxGeometry args={[0.08, 0.2, 0.1]} /><meshStandardMaterial color="#333"/></mesh>
                </group>
            )}
            
            {/* SWORD */}
            {heldItem === 'SWORD' && (
                <group rotation={[-Math.PI/2, 0, 0]}>
                     <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.4]} /><meshStandardMaterial color="#5D4037"/></mesh>
                     <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.3, 0.05, 0.1]} /><meshStandardMaterial color="gold"/></mesh>
                     <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.1, 1.2, 0.05]} /><meshStandardMaterial color="#E0F7FA" emissive="#00FFFF" emissiveIntensity={0.2} /></mesh>
                </group>
            )}
            
            {/* BUILD */}
            {heldItem === 'BUILD' && (
                <group rotation={[0, 0, 0]}>
                     <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.4]} /><meshStandardMaterial color="brown"/></mesh>
                     <mesh position={[0, 0.5, 0]} rotation={[0,0,1.57]}><boxGeometry args={[0.25, 0.5, 0.25]} /><meshStandardMaterial color="gray"/></mesh>
                </group>
            )}

            {/* WEAKEST DUMMY (Miniature held version) */}
            {heldItem === 'WEAKEST_DUMMY' && (
                <group rotation={[Math.PI, 0, 0]} position={[0, 0.2, 0]} scale={[0.3, 0.3, 0.3]}>
                    {/* Tiny Body */}
                    <mesh position={[0, 0, 0]}><boxGeometry args={[1, 1, 0.5]} /><primitive object={dummyColor} /></mesh>
                    {/* Tiny Head */}
                    <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.3, 0.3, 0.6]} /><primitive object={dummyColor} /></mesh>
                    {/* Tiny Arms */}
                    <mesh position={[-0.75, 0, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><primitive object={dummyColor} /></mesh>
                    <mesh position={[0.75, 0, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><primitive object={dummyColor} /></mesh>
                    {/* Tiny Legs */}
                    <mesh position={[-0.25, -1, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><primitive object={dummyColor} /></mesh>
                    <mesh position={[0.25, -1, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><primitive object={dummyColor} /></mesh>
                </group>
            )}

            {/* UKULELE */}
            {heldItem === 'UKULELE' && (
                 <group 
                    position={[-0.25, 0.45, -0.2]}
                    rotation={[0.3, 0.2, 2.3]}
                 >
                     <group>
                        <mesh position={[0, -0.16, 0]}><cylinderGeometry args={[0.22, 0.22, 0.08, 32]} /><primitive object={ukuBodyMaterial}/></mesh>
                        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.16, 0.16, 0.08, 32]} /><primitive object={ukuBodyMaterial}/></mesh>
                        <mesh position={[0, -0.02, 0]}><boxGeometry args={[0.25, 0.2, 0.08]} /><primitive object={ukuBodyMaterial}/></mesh>
                        <mesh position={[0, 0.04, 0.041]} rotation={[Math.PI/2, 0, 0]}><circleGeometry args={[0.065, 32]} /><meshBasicMaterial color="#1a0f00" /></mesh>
                        <mesh position={[0, -0.22, 0.045]}><boxGeometry args={[0.12, 0.03, 0.01]} /><primitive object={ukuDarkMaterial}/></mesh>
                        <mesh position={[0, -0.22, 0.05]}><boxGeometry args={[0.1, 0.005, 0.005]} /><meshBasicMaterial color="white"/></mesh>
                        <mesh position={[0, 0.55, -0.02]}><boxGeometry args={[0.06, 0.65, 0.04]} /><primitive object={ukuDarkMaterial}/></mesh>
                        <mesh position={[0, 0.55, 0.01]}><boxGeometry args={[0.062, 0.65, 0.005]} /><primitive object={ukuFretMaterial}/></mesh>
                        {[-1, 0, 1, 2, 3, 4, 5, 6].map(i => (<mesh key={i} position={[0, 0.3 + i * 0.08, 0.013]}><boxGeometry args={[0.062, 0.002, 0.001]} /><meshBasicMaterial color="#888"/></mesh>))}
                        <mesh position={[0, 0.95, -0.02]}><boxGeometry args={[0.09, 0.16, 0.04]} /><primitive object={ukuBodyMaterial}/></mesh>
                        <mesh position={[0, 1.0, 0.001]}><planeGeometry args={[0.06, 0.02]} /><primitive object={goldMaterial} /></mesh>
                        <group position={[0, 0.95, 0]}>
                            <mesh position={[-0.055, -0.04, 0]}><boxGeometry args={[0.02, 0.02, 0.05]} /><meshStandardMaterial color="white"/></mesh>
                            <mesh position={[0.055, -0.04, 0]}><boxGeometry args={[0.02, 0.02, 0.05]} /><meshStandardMaterial color="white"/></mesh>
                            <mesh position={[-0.055, 0.04, 0]}><boxGeometry args={[0.02, 0.02, 0.05]} /><meshStandardMaterial color="white"/></mesh>
                            <mesh position={[0.055, 0.04, 0]}><boxGeometry args={[0.02, 0.02, 0.05]} /><meshStandardMaterial color="white"/></mesh>
                        </group>
                        <mesh position={[0, 0.38, 0.02]}><planeGeometry args={[0.05, 1.1]} /><primitive object={ukuStringMaterial} /></mesh>
                     </group>
                 </group>
            )}

            {/* --- SIMPLE FISHING ROD (Reference Style & Tilted) --- */}
            {heldItem === 'FISHING_ROD' && (
                <group 
                    position={[0, 0.3, 0.0]} 
                    rotation={[0.3, 0, 0]} // Miring ke depan/bawah (low angle)
                >
                    {/* HANDLE (Pegangan Abu-abu gelap) */}
                    <mesh position={[0, -0.4, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 0.5]} />
                        <primitive object={rodHandleMaterial} />
                    </mesh>

                    {/* REEL (Kotak Simpel di samping) */}
                    <group position={[0, -0.3, 0.06]}>
                         <mesh rotation={[0, 0, 0]}>
                            <boxGeometry args={[0.08, 0.08, 0.08]} />
                            <primitive object={reelMaterial} />
                         </mesh>
                         {/* Tuas Kecil */}
                         <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.01, 0.01, 0.1]} />
                             <meshStandardMaterial color="#222" />
                         </mesh>
                    </group>

                    {/* POLE (Batang Panjang Hitam Polos) */}
                    <mesh position={[0, 1.2, 0]}>
                        <cylinderGeometry args={[0.01, 0.03, 3.0]} />
                        <primitive object={rodPoleMaterial} />
                    </mesh>

                    {/* STRING & BOBBER (Tali & Pelampung) */}
                    <group position={[0, 2.7, 0]}>
                         <group rotation={[-1.0, 0, 0]}>
                             {/* Tali Pancing */}
                             <mesh position={[0, -1.0, 0]}>
                                 <cylinderGeometry args={[0.002, 0.002, 2.0]} />
                                 <primitive object={lineMaterial} />
                             </mesh>
                             
                             {/* Bobber (Pelampung) */}
                             <group position={[0, -2.0, 0]}>
                                 <mesh position={[0, 0, 0]}>
                                     <sphereGeometry args={[0.08]} />
                                     <meshStandardMaterial color="#ff0000" />
                                 </mesh>
                                 <mesh position={[0, 0.06, 0]}>
                                     <sphereGeometry args={[0.08, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} />
                                     <meshStandardMaterial color="white" />
                                 </mesh>
                             </group>
                         </group>
                    </group>
                </group>
            )}

        </group>
      </group>

      {/* LEFT LEG */}
      <group ref={leftLegRef} position={[-0.25, 0.5, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={R6_SIZE.Limb as [number, number, number]} />
            <primitive object={pantsMaterial} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightLegRef} position={[0.25, 0.5, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={R6_SIZE.Limb as [number, number, number]} />
            <primitive object={pantsMaterial} />
        </mesh>
      </group>
    </group>
  );
};