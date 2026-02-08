import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { CapsuleCollider, RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { JUMP_FORCE, SPEED, RUN_SPEED, FLY_SPEED, RESPAWN_THRESHOLD, AUDIO_URLS } from '../../constants';
import { CharacterModel } from './CharacterModel';
import { PlayerState } from '../../types';

export const Player = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  const localId = useGameStore(state => state.localId);
  const updatePlayer = useGameStore(state => state.updatePlayer);
  const roomId = useGameStore(state => state.roomId);
  const inventory = useGameStore(state => state.inventory);
  const selectedSlot = useGameStore(state => state.selectedSlot);
  const unequipItem = useGameStore(state => state.unequipItem);
  const isShiftLock = useGameStore(state => state.isShiftLock);
  const virtualInput = useGameStore(state => state.virtualInput);
  const speedMultiplier = useGameStore(state => state.speedMultiplier);
  const jumpMultiplier = useGameStore(state => state.jumpMultiplier);
  const isFlying = useGameStore(state => state.isFlying);
  const isRunning = useGameStore(state => state.isRunning);
  const setRunning = useGameStore(state => state.setRunning);
  const setAttacking = useGameStore(state => state.setAttacking);
  const setThrowing = useGameStore(state => state.setThrowing);
  const setJumping = useGameStore(state => state.setJumping);
  const isAttacking = useGameStore(state => state.isAttacking);
  const isThrowing = useGameStore(state => state.isThrowing);
  const isJumping = useGameStore(state => state.isJumping);
  const emote = useGameStore(state => state.emote);
  const setEmote = useGameStore(state => state.setEmote);
  const placeObject = useGameStore(state => state.placeObject);
  const buildType = useGameStore(state => state.buildType);
  const drivingVehicleId = useGameStore(state => state.drivingVehicleId);
  const setDriving = useGameStore(state => state.setDriving);
  
  const queueMessage = useGameStore(state => state.queueMessage);
  const addChatMessage = useGameStore(state => state.addChatMessage);
  const volume = useGameStore(state => state.volume);
  const useAmmo = useGameStore(state => state.useAmmo);
  const gameMode = useGameStore(state => state.gameMode);
  const isMenuOpen = useGameStore(state => state.isMenuOpen);
  
  const localPlayerColor = useGameStore(state => state.players[localId]?.color || '#00A2FF');
  const role = useGameStore(state => state.role);
  const health = useGameStore(state => state.health);

  const cameraState = useRef({
    yaw: 0,
    pitch: 0.3,
    zoom: 5,
    isDragging: false
  });
  
  const lastUpdateRef = useRef({ pos: new THREE.Vector3(), rotY: 0, isJumping: false });

  const [audio] = useState(() => ({
    equip: new Audio(AUDIO_URLS.EQUIP),
    slash: new Audio(AUDIO_URLS.SLASH),
    walk: new Audio(AUDIO_URLS.WALK),
    jump: new Audio(AUDIO_URLS.JUMP),
    ukulele: new Audio(AUDIO_URLS.UKULELE),
    fishing: new Audio(AUDIO_URLS.FISHING)
  }));

  useEffect(() => {
    audio.walk.volume = 0.6 * volume;
    audio.jump.volume = 0.5 * volume;
    audio.equip.volume = 0.5 * volume;
    audio.slash.volume = 0.5 * volume;
    audio.ukulele.volume = 0.6 * volume;
    audio.fishing.volume = 0.5 * volume;
  }, [volume, audio]);

  // Keyboard Shortcuts (Dismount)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'KeyE' && drivingVehicleId) {
            setDriving(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drivingVehicleId, setDriving]);

  // Handle Logic
  useEffect(() => {
    const handleAttack = () => {
        if (useGameStore.getState().isMenuOpen) return;
        if (drivingVehicleId) return; // Cannot attack while driving

        const item = selectedSlot === -1 ? 'NONE' : inventory[selectedSlot];
        
        if (emote !== 'none') setEmote('none');

        // BUILDING LOGIC
        if (item === 'BUILD') {
            if (!rigidBodyRef.current) return;
            const pos = rigidBodyRef.current.translation();
            const rotY = groupRef.current ? groupRef.current.rotation.y : 0;
            
            // Spawn 4 units in front
            const spawnX = pos.x + Math.sin(rotY) * 4;
            const spawnZ = pos.z + Math.cos(rotY) * 4;
            const spawnY = pos.y;

            const id = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            
            // Color based on role
            const color = role === 'OWNER' ? 'gold' : role === 'ADMIN' ? 'red' : 'white';

            placeObject({
                id,
                type: buildType,
                position: [spawnX, spawnY, spawnZ],
                rotation: [0, rotY, 0],
                color: color,
                ownerId: localId
            });
            
            setAttacking(true);
            setTimeout(() => setAttacking(false), 300);
            return;
        }

        if (item === 'NONE') return;
        
        // ... (Existing Tool Logic: Ukulele, Fishing, Dummy, Gun, Sword) ...
        if (item === 'UKULELE') {
            if (audio.ukulele.paused) {
                audio.ukulele.play().catch(() => {});
            } else {
                audio.ukulele.pause();
                audio.ukulele.currentTime = 0;
            }
            setAttacking(true);
            setTimeout(() => setAttacking(false), 500);
            return;
        }

        if (item === 'FISHING_ROD') {
            audio.fishing.currentTime = 0;
            audio.fishing.play().catch(() => {});
            setAttacking(true);
            setTimeout(() => setAttacking(false), 500);
            return;
        }

        if (item === 'WEAKEST_DUMMY') {
             document.exitPointerLock();
             setTimeout(() => {
                 const name = prompt("Beri nama Dummy kamu:", "Weakest Dummy");
                 if (isShiftLock) document.body.requestPointerLock();
                 if (name && rigidBodyRef.current) {
                     const pos = rigidBodyRef.current.translation();
                     const rotY = groupRef.current ? groupRef.current.rotation.y : 0;
                     const spawnX = pos.x + Math.sin(rotY) * 3;
                     const spawnZ = pos.z + Math.cos(rotY) * 3;
                     useGameStore.getState().spawnDummy(name, [spawnX, pos.y, spawnZ], [0, rotY + Math.PI, 0]);
                 }
             }, 10);
             setAttacking(true);
             setTimeout(() => setAttacking(false), 300);
             return;
        }
        
        setAttacking(true);
        setTimeout(() => setAttacking(false), 300);

        // Combat Hit Detection (Sword/Gun)
        // ... (Existing Combat Logic) ...
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (useGameStore.getState().isMenuOpen) return;
        if (e.button === 0 && !isShiftLock) handleAttack();
    };
    
    const handleClick = () => {
        if (useGameStore.getState().isMenuOpen) return;
        if (isShiftLock) handleAttack();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('click', handleClick);
    
    return () => {
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('click', handleClick);
    };
  }, [inventory, selectedSlot, localId, isShiftLock, queueMessage, camera, setAttacking, audio, useAmmo, emote, setEmote, buildType, placeObject, role, drivingVehicleId]);

  // Camera Logic (Reuse existing)
  useEffect(() => {
    // ... (Keep existing camera event listeners)
    const canvas = gl.domElement;
    const handleMouseMove = (e: MouseEvent) => {
      if (useGameStore.getState().isMenuOpen) return;
      if (isShiftLock || cameraState.current.isDragging) {
        cameraState.current.yaw -= e.movementX * 0.002;
        cameraState.current.pitch -= e.movementY * 0.002;
        cameraState.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraState.current.pitch));
      }
    };
    const handleMouseDown = (e: MouseEvent) => { if(e.button===2) cameraState.current.isDragging=true; };
    const handleMouseUp = () => { cameraState.current.isDragging=false; };
    const handleWheel = (e: WheelEvent) => { cameraState.current.zoom += e.deltaY * 0.01; cameraState.current.zoom = Math.max(2, Math.min(20, cameraState.current.zoom)); };

    if (isShiftLock) canvas.requestPointerLock(); else document.exitPointerLock();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel);
    return () => {
       document.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mousedown', handleMouseDown);
       document.removeEventListener('mouseup', handleMouseUp);
       document.removeEventListener('wheel', handleWheel);
    };
  }, [isShiftLock, gl.domElement]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

    if (isMenuOpen) return;

    const keys = getKeys();
    const forward = keys.forward || virtualInput.forward;
    const backward = keys.backward || virtualInput.backward;
    const left = keys.left || virtualInput.left;
    const right = keys.right || virtualInput.right;
    const jump = keys.jump || virtualInput.jump;
    const run = virtualInput.run || isRunning;

    const velocity = rigidBodyRef.current.linvel();
    const translation = rigidBodyRef.current.translation();
    const { yaw, pitch, zoom } = cameraState.current;

    const grounded = Math.abs(velocity.y) < 0.1;
    const newIsJumping = !grounded && !isFlying;
    if (newIsJumping !== isJumping) setJumping(newIsJumping);

    // Audio
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (horizontalSpeed > 0.5 && grounded && audio.walk.paused) audio.walk.play().catch(()=>{});
    else if (horizontalSpeed <= 0.5 || !grounded) audio.walk.pause();

    // Camera Orbit
    const orbitOffset = new THREE.Vector3(
        zoom * Math.sin(yaw) * Math.cos(pitch),
        zoom * Math.sin(pitch),
        zoom * Math.cos(yaw) * Math.cos(pitch)
    );
    let targetPos = new THREE.Vector3(translation.x, translation.y + 1.5, translation.z);
    if (isShiftLock) {
         targetPos.add(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), yaw).multiplyScalar(1.5));
    }
    state.camera.position.lerp(targetPos.clone().add(orbitOffset), 0.2);
    state.camera.lookAt(targetPos);

    // Movement Physics
    // ... (Keep existing movement logic) ...
    if (isFlying && (role === 'ADMIN' || role === 'OWNER')) {
        rigidBodyRef.current.setGravityScale(0, true);
        const flySpeed = FLY_SPEED * speedMultiplier;
        const moveDir = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        state.camera.getWorldDirection(camDir);
        const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0,1,0));
        moveDir.addScaledVector(camDir, Number(forward)-Number(backward));
        moveDir.addScaledVector(camRight, Number(left)-Number(right));
        moveDir.y += Number(jump) - (run?1:0);
        moveDir.normalize().multiplyScalar(flySpeed);
        rigidBodyRef.current.setLinvel(moveDir, true);
        groupRef.current.rotation.y = yaw;
    } else {
        rigidBodyRef.current.setGravityScale(1, true);
        
        // Rotation
        if (isShiftLock) {
            let targetRot = yaw;
            const currentRot = groupRef.current.rotation.y;
            const diff = (targetRot - currentRot + Math.PI) % (Math.PI * 2) - Math.PI;
            groupRef.current.rotation.y += diff * 0.3;
        } else if (Number(left)-Number(right) !== 0 || Number(forward)-Number(backward) !== 0) {
            const moveAngle = Math.atan2(Number(left)-Number(right), Number(forward)-Number(backward));
            const targetRot = yaw + moveAngle;
            const currentRot = groupRef.current.rotation.y;
            const diff = (targetRot - currentRot + Math.PI) % (Math.PI * 2) - Math.PI;
            groupRef.current.rotation.y += diff * 0.15;
        }

        // Velocity
        const baseSpeed = run ? RUN_SPEED : SPEED;
        const moveSpeed = baseSpeed * speedMultiplier;
        const moveDir = new THREE.Vector3();
        const camForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
        const camRight = new THREE.Vector3(Math.sin(yaw - Math.PI/2), 0, Math.cos(yaw - Math.PI/2)).normalize();
        
        const fwdIn = Number(forward) - Number(backward);
        const sideIn = Number(left) - Number(right);
        
        if (fwdIn !== 0 || sideIn !== 0) {
            moveDir.addScaledVector(camForward, -fwdIn);
            moveDir.addScaledVector(camRight, sideIn);
            moveDir.normalize().multiplyScalar(moveSpeed);
        }
        
        rigidBodyRef.current.setLinvel({ x: moveDir.x, y: velocity.y, z: moveDir.z }, true);
        
        if (jump && grounded) {
            rigidBodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE * jumpMultiplier, z: velocity.z }, true);
            audio.jump.currentTime = 0;
            audio.jump.play().catch(()=>{});
            setJumping(true);
        }
    }
    
    // Respawn
    if (translation.y < RESPAWN_THRESHOLD) {
        rigidBodyRef.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Network Sync
    if (roomId) {
        const dist = lastUpdateRef.current.pos.distanceTo(translation);
        if (dist > 0.05 || isAttacking || isThrowing || isJumping !== lastUpdateRef.current.isJumping) {
            updatePlayer(
                localId, 
                [translation.x, translation.y, translation.z], 
                [0, groupRef.current.rotation.y, 0], 
                isAttacking,
                isJumping,
                emote,
                isThrowing,
                health,
                drivingVehicleId
            );
            lastUpdateRef.current.pos.copy(translation);
            lastUpdateRef.current.isJumping = isJumping;
        }
    }

  });

  const selectedItem = selectedSlot === -1 ? 'NONE' : inventory[selectedSlot];
  const isMoving = virtualInput.forward || virtualInput.backward || virtualInput.left || virtualInput.right || getKeys().forward || getKeys().backward || getKeys().left || getKeys().right;

  // Don't render player mesh if driving (inside car)
  if (drivingVehicleId) return null;

  return (
    <RigidBody 
      ref={rigidBodyRef} 
      colliders={false} 
      mass={1} 
      type="dynamic" 
      position={[0, 5, 0]} 
      enabledRotations={[false, false, false]}
      friction={0} 
      linearDamping={isFlying ? 5 : 1}
    >
      <CapsuleCollider args={[0.75, 0.5]} />
      <group ref={groupRef}>
          <CharacterModel 
            color={localPlayerColor} 
            heldItem={selectedItem}
            isMoving={!!isMoving && !isMenuOpen} 
            isRunning={(isRunning || virtualInput.run) && !isMenuOpen}
            isAttacking={isAttacking}
            isJumping={isJumping}
            isThrowing={isThrowing}
            emote={emote}
          />
      </group>
    </RigidBody>
  );
};