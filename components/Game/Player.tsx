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
  
  // Use Selectors to avoid re-rendering on every store update
  const localId = useGameStore(state => state.localId);
  const updatePlayer = useGameStore(state => state.updatePlayer);
  const roomId = useGameStore(state => state.roomId);
  const inventory = useGameStore(state => state.inventory);
  const selectedSlot = useGameStore(state => state.selectedSlot);
  const unequipItem = useGameStore(state => state.unequipItem); // NEW
  const isShiftLock = useGameStore(state => state.isShiftLock);
  const virtualInput = useGameStore(state => state.virtualInput);
  const speedMultiplier = useGameStore(state => state.speedMultiplier);
  const jumpMultiplier = useGameStore(state => state.jumpMultiplier);
  const isFlying = useGameStore(state => state.isFlying);
  const isRunning = useGameStore(state => state.isRunning);
  const setRunning = useGameStore(state => state.setRunning);
  // Role is stable
  const setAttacking = useGameStore(state => state.setAttacking);
  const setThrowing = useGameStore(state => state.setThrowing); // NEW
  const setJumping = useGameStore(state => state.setJumping);   // NEW
  const isAttacking = useGameStore(state => state.isAttacking);
  const isThrowing = useGameStore(state => state.isThrowing);   // NEW
  const isJumping = useGameStore(state => state.isJumping);     // NEW
  const emote = useGameStore(state => state.emote);             // NEW
  const setEmote = useGameStore(state => state.setEmote);       // NEW
  
  const queueMessage = useGameStore(state => state.queueMessage);
  const addChatMessage = useGameStore(state => state.addChatMessage);
  const volume = useGameStore(state => state.volume);
  const useAmmo = useGameStore(state => state.useAmmo);
  const gameMode = useGameStore(state => state.gameMode);
  const isMenuOpen = useGameStore(state => state.isMenuOpen);
  
  // Use a stable selector for color. The strict equality check of the string return value prevents re-renders.
  const localPlayerColor = useGameStore(state => state.players[localId]?.color || '#00A2FF');
  const role = useGameStore(state => state.role);

  const cameraState = useRef({
    yaw: 0,
    pitch: 0.3,
    zoom: 5,
    isDragging: false
  });
  
  // Track previous send to avoid spamming store
  const lastUpdateRef = useRef({ pos: new THREE.Vector3(), rotY: 0, isJumping: false });

  // --- AUDIO SYSTEM ---
  const [audio] = useState(() => ({
    equip: new Audio(AUDIO_URLS.EQUIP),
    slash: new Audio(AUDIO_URLS.SLASH),
    walk: new Audio(AUDIO_URLS.WALK),
    jump: new Audio(AUDIO_URLS.JUMP),
    ukulele: new Audio(AUDIO_URLS.UKULELE),
    fishing: new Audio(AUDIO_URLS.FISHING)
  }));

  // Update Volumes
  useEffect(() => {
    audio.walk.volume = 0.6 * volume;
    audio.jump.volume = 0.5 * volume;
    audio.equip.volume = 0.5 * volume;
    audio.slash.volume = 0.5 * volume;
    audio.ukulele.volume = 0.6 * volume;
    audio.fishing.volume = 0.5 * volume;
  }, [volume, audio]);

  // Setup Audio Settings
  useEffect(() => {
    // Helper to safely configure audio
    const configureAudio = (a: HTMLAudioElement, vol: number, loop: boolean = false) => {
        a.volume = vol * volume; // Initial volume set
        a.loop = loop;
        a.crossOrigin = "anonymous"; // Important for CDNs
        a.load(); // Force load
    };

    configureAudio(audio.walk, 0.6, true);  // Lower volume for footsteps
    configureAudio(audio.jump, 0.5);
    configureAudio(audio.equip.cloneNode() as HTMLAudioElement, 0.5); // Use clones for overlaps
    configureAudio(audio.slash, 0.5);
    configureAudio(audio.ukulele, 0.6, true); // Loop music
    configureAudio(audio.fishing, 0.5, false);

    return () => {
        audio.walk.pause();
        audio.walk.currentTime = 0;
        audio.ukulele.pause(); // Stop music on unmount
    };
  }, [audio]); // Depend only on audio initialization

  // Handle Equip Sound
  useEffect(() => {
    // -1 means no item
    const item = selectedSlot === -1 ? 'NONE' : inventory[selectedSlot];
    if (item === 'SWORD' || item === 'GUN' || item === 'FISHING_ROD' || item === 'UKULELE') {
        audio.equip.currentTime = 0;
        audio.equip.play().catch(() => {});
    }
    
    // Stop ukulele if unequipped
    if (item !== 'UKULELE' && !audio.ukulele.paused) {
        audio.ukulele.pause();
        audio.ukulele.currentTime = 0;
    }
  }, [selectedSlot, inventory, audio]);

  // Death Listener
  useEffect(() => {
    const onDeath = () => {
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        setEmote('none'); // Stop dancing on death
        
        // Reset Health/Ammo if in Rivals
        if (gameMode === 'RIVALS') {
            useGameStore.getState().heal(100);
            useGameStore.getState().reloadAmmo();
        }
      }
    };
    window.addEventListener('player-death', onDeath);
    return () => window.removeEventListener('player-death', onDeath);
  }, [gameMode, setEmote]);

  // KEYBOARD INPUT HANDLERS (Throw, Unequip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (useGameStore.getState().isMenuOpen) return;
        if (document.activeElement?.tagName === 'INPUT') return;

        // THROW (G)
        if (e.key.toLowerCase() === 'g') {
            setThrowing(true);
            setTimeout(() => setThrowing(false), 300);
        }

        // UNEQUIP (Backspace)
        if (e.key === 'Backspace') {
            unequipItem();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setThrowing, unequipItem]);


  // Attack Logic
  useEffect(() => {
    const handleAttack = () => {
        // Block attack if menu is open
        if (useGameStore.getState().isMenuOpen) return;

        const item = selectedSlot === -1 ? 'NONE' : inventory[selectedSlot];
        
        // Stop Emote on attack
        if (emote !== 'none') setEmote('none');

        // Allow attack even if NONE (Punch?) - For now, if NONE, we just do nothing or maybe generic punch later
        if (item === 'NONE' || item === 'BUILD') return;
        
        // UKULELE Logic: Toggle Music
        if (item === 'UKULELE') {
            if (audio.ukulele.paused) {
                audio.ukulele.play().catch(() => {});
                addChatMessage({ id: Date.now().toString(), sender: 'System', text: '🎵 Playing Ukulele music...' });
            } else {
                audio.ukulele.pause();
                audio.ukulele.currentTime = 0;
                addChatMessage({ id: Date.now().toString(), sender: 'System', text: 'Music stopped.' });
            }
            // Small strum animation
            setAttacking(true);
            setTimeout(() => setAttacking(false), 500);
            return;
        }

        // FISHING ROD Logic
        if (item === 'FISHING_ROD') {
            audio.fishing.currentTime = 0;
            audio.fishing.play().catch(() => {});
            setAttacking(true);
            setTimeout(() => setAttacking(false), 500);
            return;
        }

        // WEAKEST DUMMY SPAWN LOGIC
        if (item === 'WEAKEST_DUMMY') {
             // Temporarily unlock pointer to allow prompt
             document.exitPointerLock();
             setTimeout(() => {
                 const name = prompt("Beri nama Dummy kamu:", "Weakest Dummy");
                 // Re-lock if needed
                 if (isShiftLock) document.body.requestPointerLock();
                 
                 if (name) {
                     if (!rigidBodyRef.current) return;
                     const pos = rigidBodyRef.current.translation();
                     const rotY = groupRef.current ? groupRef.current.rotation.y : 0;
                     
                     // Calculate spawn position in front of player
                     const spawnDist = 3;
                     const spawnX = pos.x + Math.sin(rotY) * spawnDist;
                     const spawnZ = pos.z + Math.cos(rotY) * spawnDist;
                     
                     useGameStore.getState().spawnDummy(name, [spawnX, pos.y, spawnZ], [0, rotY + Math.PI, 0]); // Face player
                     addChatMessage({ id: Date.now().toString(), sender: 'System', text: `Spawned dummy: ${name}` });
                 }
             }, 10);
             
             setAttacking(true);
             setTimeout(() => setAttacking(false), 300);
             return;
        }
        
        // Gun Ammo Check
        if (item === 'GUN') {
            const hasAmmo = useAmmo();
            if (!hasAmmo) {
                // Click empty sound?
                return;
            }
        }
        
        setAttacking(true);
        setTimeout(() => setAttacking(false), 300); // Animation duration

        // Play Attack Sound
        if (item === 'SWORD') {
            const slashSound = audio.slash.cloneNode() as HTMLAudioElement;
            slashSound.volume = audio.slash.volume;
            slashSound.play().catch(() => {});
        } else if (item === 'GUN') {
            const shootSound = audio.equip.cloneNode() as HTMLAudioElement;
            shootSound.volume = audio.equip.volume;
            shootSound.play().catch(() => {});
        }

        // Combat Logic (Hit detection)
        if (!rigidBodyRef.current) return;
        const players = useGameStore.getState().players;
        const myPos = rigidBodyRef.current.translation();
        const myVec = new THREE.Vector3(myPos.x, myPos.y, myPos.z);

        if (item === 'SWORD') {
            Object.values(players).forEach((p: PlayerState) => {
                if (p.id === localId) return;
                const enemyPos = new THREE.Vector3(...p.position);
                const dist = myVec.distanceTo(enemyPos);
                
                if (dist < 4) {
                    const dirToEnemy = new THREE.Vector3().subVectors(enemyPos, myVec).normalize();
                    const myForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), groupRef.current!.rotation.y);
                    const angle = myForward.angleTo(dirToEnemy);

                    if (angle < Math.PI / 3) { 
                        queueMessage({
                            type: 'KILL',
                            senderId: localId,
                            payload: { targetId: p.id }
                        });
                        addChatMessage({ id: Date.now().toString(), sender: 'System', text: `Kamu menebas ${p.username}!` });
                    }
                }
            });
        } 
        else if (item === 'GUN') {
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            
            Object.values(players).forEach((p: PlayerState) => {
                if (p.id === localId) return;
                const enemyPos = new THREE.Vector3(...p.position);
                enemyPos.y += 1; // Aim at chest height
                
                const dirToEnemy = new THREE.Vector3().subVectors(enemyPos, camera.position).normalize();
                const angle = camDir.angleTo(dirToEnemy);
                const dist = camera.position.distanceTo(enemyPos);

                if (angle < 0.05 && dist < 100) {
                     queueMessage({
                        type: 'KILL',
                        senderId: localId,
                        payload: { targetId: p.id }
                    });
                    addChatMessage({ id: Date.now().toString(), sender: 'System', text: `Kamu menembak ${p.username}!` });
                }
            });
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (useGameStore.getState().isMenuOpen) return;
        if (e.button === 0 && !isShiftLock) { 
            handleAttack();
        }
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
  }, [inventory, selectedSlot, localId, isShiftLock, queueMessage, camera, setAttacking, audio, useAmmo, emote, setEmote]);


  // Camera Input Logic
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (e: MouseEvent) => {
      // Block camera movement if menu is open
      if (useGameStore.getState().isMenuOpen) return;

      if (isShiftLock || cameraState.current.isDragging) {
        const sensitivity = 0.002;
        cameraState.current.yaw -= e.movementX * sensitivity;
        cameraState.current.pitch -= e.movementY * sensitivity;
        cameraState.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraState.current.pitch));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (useGameStore.getState().isMenuOpen) return;
      if (e.button === 2) { 
        cameraState.current.isDragging = true;
      }
    };

    const handleMouseUp = () => {
      cameraState.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (useGameStore.getState().isMenuOpen) return;
      cameraState.current.zoom += e.deltaY * 0.01;
      cameraState.current.zoom = Math.max(2, Math.min(20, cameraState.current.zoom));
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let lastPinchDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
        if (useGameStore.getState().isMenuOpen) return;

        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
            return;
        }
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.clientX > window.innerWidth / 2) {
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (useGameStore.getState().isMenuOpen) return;

        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (lastPinchDistance > 0) {
                const diff = lastPinchDistance - currentDistance;
                cameraState.current.zoom += diff * 0.02;
                cameraState.current.zoom = Math.max(2, Math.min(20, cameraState.current.zoom));
            }
            lastPinchDistance = currentDistance;
            return;
        }

        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.clientX > window.innerWidth / 2) {
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;
                
                const sensitivity = 0.005;
                cameraState.current.yaw -= deltaX * sensitivity;
                cameraState.current.pitch -= deltaY * sensitivity;
                cameraState.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraState.current.pitch));

                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        }
    };
    
    const handleTouchEnd = () => {
        lastPinchDistance = 0;
    };

    const handleContextMenu = (e: Event) => e.preventDefault();

    if (isShiftLock) {
        canvas.requestPointerLock();
    } else {
        document.exitPointerLock();
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel);
    document.addEventListener('contextmenu', handleContextMenu);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('contextmenu', handleContextMenu);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      document.exitPointerLock();
    };
  }, [isShiftLock, gl.domElement]);

  // Handle Shift Key for Running
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Shift') setRunning(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Shift') setRunning(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }
  }, [setRunning]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

    if (isMenuOpen) {
        const linvel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
        return;
    }

    const keys = getKeys();
    const forward = keys.forward || virtualInput.forward;
    const backward = keys.backward || virtualInput.backward;
    const left = keys.left || virtualInput.left;
    const right = keys.right || virtualInput.right;
    const jump = keys.jump || virtualInput.jump;
    const run = virtualInput.run || isRunning;

    if (virtualInput.run && !isRunning) setRunning(true);

    const velocity = rigidBodyRef.current.linvel();
    const translation = rigidBodyRef.current.translation();
    const { yaw, pitch, zoom } = cameraState.current;

    // --- GROUND DETECTION & JUMP STATE ---
    // If vy is significantly positive or negative, we are airborn
    // Threshold 0.1 is safe
    const grounded = Math.abs(velocity.y) < 0.1;
    const newIsJumping = !grounded && !isFlying;
    
    if (newIsJumping !== isJumping) {
        setJumping(newIsJumping);
    }

    // --- MOVEMENT CHECK ---
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    const isActuallyMoving = horizontalSpeed > 0.5 && !isFlying;

    // Cancel Emote if moving or jumping
    if ((isActuallyMoving || newIsJumping) && emote !== 'none') {
        setEmote('none');
    }

    // --- AUDIO: WALK & JUMP ---
    if (isActuallyMoving && grounded) {
        if (audio.walk.paused) {
            audio.walk.play().catch(() => {});
        }
    } else {
        if (!audio.walk.paused) {
            audio.walk.pause();
        }
    }

    // --- CAMERA ---
    const orbitOffset = new THREE.Vector3();
    orbitOffset.x = zoom * Math.sin(yaw) * Math.cos(pitch);
    orbitOffset.y = zoom * Math.sin(pitch);
    orbitOffset.z = zoom * Math.cos(yaw) * Math.cos(pitch);

    let targetPos = new THREE.Vector3(translation.x, translation.y + 1.5, translation.z);
    
    if (isShiftLock || gameMode === 'RIVALS') {
        const cameraRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
        targetPos.add(cameraRight.multiplyScalar(1.5));
    }

    const camPos = new THREE.Vector3().copy(targetPos).add(orbitOffset);
    state.camera.position.lerp(camPos, 0.2); 
    state.camera.lookAt(targetPos);

    // --- FLYING LOGIC (ADMIN/OWNER) ---
    if (isFlying && (role === 'ADMIN' || role === 'OWNER')) {
        rigidBodyRef.current.setGravityScale(0, true);
        
        const flySpeed = FLY_SPEED * speedMultiplier;
        const moveDir = new THREE.Vector3();

        const forwardInput = Number(forward) - Number(backward);
        const sideInput = Number(left) - Number(right);
        const upInput = Number(jump) - (run ? 1 : 0);

        const camDir = new THREE.Vector3();
        state.camera.getWorldDirection(camDir);
        const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0,1,0));

        moveDir.addScaledVector(camDir, forwardInput);
        moveDir.addScaledVector(camRight, sideInput);
        moveDir.y += upInput;

        moveDir.normalize().multiplyScalar(flySpeed);
        
        rigidBodyRef.current.setLinvel({ x: moveDir.x, y: moveDir.y, z: moveDir.z }, true);
        groupRef.current.rotation.y = yaw;
        return;
    } else {
        rigidBodyRef.current.setGravityScale(1, true);
    }

    // --- NORMAL MOVEMENT ---
    if (isShiftLock) {
        let targetRot = yaw;
        const currentRot = groupRef.current.rotation.y;
        const diff = (targetRot - currentRot + Math.PI) % (Math.PI * 2) - Math.PI;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, groupRef.current.rotation.y + diff, 0.3);
    } else {
        const moveX = Number(left) - Number(right);
        const moveZ = Number(forward) - Number(backward);
        
        if (moveX !== 0 || moveZ !== 0) {
            const moveAngle = Math.atan2(moveX, moveZ);
            const targetRot = yaw + moveAngle;

            const currentRot = groupRef.current.rotation.y;
            const diff = (targetRot - currentRot + Math.PI) % (Math.PI * 2) - Math.PI;
            // Smoother rotation for classic walk
            groupRef.current.rotation.y += diff * 0.15;
        }
    }

    const forwardInput = Number(forward) - Number(backward);
    const sideInput = Number(left) - Number(right);

    const baseSpeed = run ? RUN_SPEED : SPEED;
    const moveSpeed = baseSpeed * speedMultiplier;
    const moveDir = new THREE.Vector3();

    if (forwardInput !== 0 || sideInput !== 0) {
        const camForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
        const camRight = new THREE.Vector3(Math.sin(yaw - Math.PI/2), 0, Math.cos(yaw - Math.PI/2)).normalize();

        moveDir.addScaledVector(camForward, -forwardInput);
        moveDir.addScaledVector(camRight, sideInput);
        
        moveDir.normalize().multiplyScalar(moveSpeed);
    }

    rigidBodyRef.current.setLinvel({ x: moveDir.x, y: velocity.y, z: moveDir.z }, true);

    if (jump && grounded) {
       rigidBodyRef.current.setLinvel({ x: rigidBodyRef.current.linvel().x, y: JUMP_FORCE * jumpMultiplier, z: rigidBodyRef.current.linvel().z }, true);
       audio.jump.currentTime = 0;
       audio.jump.play().catch(() => {});
       setJumping(true);
    }

    if (translation.y < RESPAWN_THRESHOLD) {
      rigidBodyRef.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      
      if (gameMode === 'RIVALS') {
           useGameStore.getState().heal(100);
           useGameStore.getState().reloadAmmo();
      }
    }

    // --- NETWORK UPDATE THROTTLING ---
    if (roomId) {
        const dist = lastUpdateRef.current.pos.distanceTo(translation);
        const rotDiff = Math.abs(lastUpdateRef.current.rotY - groupRef.current.rotation.y);
        
        if (dist > 0.05 || rotDiff > 0.05 || isAttacking || isThrowing || isJumping !== lastUpdateRef.current.isJumping) {
            updatePlayer(
                localId, 
                [translation.x, translation.y, translation.z], 
                [0, groupRef.current.rotation.y, 0], 
                isAttacking,
                isJumping,
                emote,
                isThrowing
            );
            lastUpdateRef.current.pos.copy(translation);
            lastUpdateRef.current.rotY = groupRef.current.rotation.y;
            lastUpdateRef.current.isJumping = isJumping;
        }
    }
  });

  const selectedItem = selectedSlot === -1 ? 'NONE' : inventory[selectedSlot];
  const isMoving = virtualInput.forward || virtualInput.backward || virtualInput.left || virtualInput.right || getKeys().forward || getKeys().backward || getKeys().left || getKeys().right;

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