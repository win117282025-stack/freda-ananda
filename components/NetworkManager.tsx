import React, { useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useGameStore } from '../store/gameStore';
import { PlayerState, NetworkMessage, GamePhase, WorldObject } from '../types';
import { PLAYER_COLORS } from '../constants';

export const NetworkManager: React.FC = () => {
  // Use specific selectors to avoid re-rendering on 'players' update (which happens every frame)
  const roomId = useGameStore(state => state.roomId);
  const localId = useGameStore(state => state.localId);
  const username = useGameStore(state => state.username);
  const role = useGameStore(state => state.role);
  const isHost = useGameStore(state => state.isHost);
  const health = useGameStore(state => state.health);
  const drivingVehicleId = useGameStore(state => state.drivingVehicleId);
  
  // Actions are stable
  const addPlayer = useGameStore(state => state.addPlayer);
  const updatePlayer = useGameStore(state => state.updatePlayer);
  const addChatMessage = useGameStore(state => state.addChatMessage);
  const clearMessageQueue = useGameStore(state => state.clearMessageQueue);
  const setPhase = useGameStore(state => state.setPhase);
  const registerKill = useGameStore(state => state.registerKill);
  const placeObject = useGameStore(state => state.placeObject);
  const removeObject = useGameStore(state => state.removeObject);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  
  // Local state ref for broadcasting
  const localPlayerRef = useRef<PlayerState>({
    id: localId,
    username,
    role,
    position: [0, 5, 0],
    rotation: [0, 0, 0],
    color: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
    isLocal: true,
    kills: 0,
    deaths: 0,
    health: 100
  });

  // Sync ref with store updates for Username/Role changes
  useEffect(() => {
    if (localPlayerRef.current) {
      localPlayerRef.current.username = username;
      localPlayerRef.current.role = role;
    }
  }, [username, role]);

  useEffect(() => {
    if (!roomId) return;
    
    // Ensure local player is in the store so updatePlayer works correctly
    addPlayer(localId, localPlayerRef.current);

    // Destroy previous peer if exists
    if (peerRef.current) {
        peerRef.current.destroy();
    }

    let peer: Peer;

    if (isHost) {
        // HOST: Must claim the Room ID
        const hostId = `obby-room-${roomId}`;
        console.log(`Initializing Host with ID: ${hostId}`);
        peer = new Peer(hostId);
        
        peer.on('error', (err: any) => {
            console.error('PeerJS Error:', err);
            if (err.type === 'unavailable-id') {
                alert('Room ID tidak tersedia (sedang digunakan). Silakan buat room baru.');
                setPhase(GamePhase.MENU);
            }
        });
    } else {
        // CLIENT: Random ID
        console.log('Initializing Client...');
        peer = new Peer();
    }

    peerRef.current = peer;

    peer.on('open', (id: string) => {
      console.log('My Peer ID:', id);

      if (!isHost) {
          // Client: Connect to Host
          const hostId = `obby-room-${roomId}`;
          console.log(`Connecting to Host: ${hostId}`);
          
          const conn = peer.connect(hostId, { reliable: true });
          setupConnection(conn);
      }
    });

    peer.on('connection', (conn: DataConnection) => {
      console.log(`Incoming connection from: ${conn.peer}`);
      setupConnection(conn);
    });
    
    return () => {
      if (peerRef.current) peerRef.current.destroy();
      connectionsRef.current = [];
    };
  }, [roomId, isHost, setPhase]);

  const setupConnection = (conn: DataConnection) => {
    connectionsRef.current.push(conn);
    
    conn.on('open', () => {
        console.log(`Connection established with ${conn.peer}`);
        
        // Send initial JOIN message
        conn.send({
          type: 'JOIN',
          payload: localPlayerRef.current,
          senderId: localId
        });

        // If I am Host, sync existing players and objects to the new client
        if (isHost) {
            const currentPlayers = useGameStore.getState().players;
            (Object.values(currentPlayers) as PlayerState[]).forEach(p => {
                if (p.id !== localId) {
                    conn.send({
                        type: 'JOIN',
                        payload: p,
                        senderId: p.id
                    });
                }
            });

            // Sync Objects
            const objects = useGameStore.getState().worldObjects;
            objects.forEach(obj => {
                conn.send({
                    type: 'PLACE_OBJECT',
                    payload: obj,
                    senderId: 'HOST'
                });
            });
        }
    });

    conn.on('data', (data: any) => {
      const msg = data as NetworkMessage;
      handleIncomingMessage(msg, conn);
    });

    conn.on('close', () => {
        console.log(`Connection closed: ${conn.peer}`);
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
    });

    conn.on('error', (err) => {
        console.error('Connection Error:', err);
    });
  };

  const handleIncomingMessage = (msg: NetworkMessage, sourceConn: DataConnection) => {
      // 1. Process Message Locally
      if (msg.type === 'UPDATE') {
        const p = msg.payload as PlayerState;
        if (p.id !== localId) {
          // Sync health and vehicle state too
          updatePlayer(
              p.id, 
              p.position, 
              p.rotation, 
              p.isAttacking, 
              p.isJumping, 
              p.emote, 
              p.isThrowing, 
              p.health,
              p.drivingVehicleId
          );
        }
      } 
      else if (msg.type === 'JOIN' || msg.type === 'SPAWN') { // SPAWN treated similarly to JOIN
        const p = msg.payload as PlayerState;
        // Only add if not self
        if (p.id !== localId) {
             const exists = !!useGameStore.getState().players[p.id];
             addPlayer(p.id, p);
             
             if (!exists) {
                const text = msg.type === 'SPAWN' ? `Dummy spawned: ${p.username}` : `${p.username} bergabung!`;
                addChatMessage({
                    id: Math.random().toString(),
                    sender: 'System',
                    text: text,
                    isSystem: true
                });
             }
        }
      } 
      else if (msg.type === 'CHAT') {
        addChatMessage(msg.payload);
      }
      else if (msg.type === 'KILL') {
        // Update Stats First
        registerKill(msg.senderId, msg.payload.targetId);

        // Then process death event if it's me
        if (msg.payload.targetId === localId) {
           handleDeath(msg.senderId);
        }
      }
      else if (msg.type === 'PLACE_OBJECT') {
          // Check if object exists first
          const exists = useGameStore.getState().worldObjects.find(o => o.id === msg.payload.id);
          if (!exists) {
             placeObject(msg.payload as WorldObject);
          }
      }
      else if (msg.type === 'REMOVE_OBJECT') {
          removeObject(msg.payload.id);
      }

      // 2. RELAY Logic (Only Host Relays)
      if (isHost) {
          // Broadcast to everyone else EXCEPT the sender
          connectionsRef.current.forEach(conn => {
              if (conn !== sourceConn && conn.open) {
                  conn.send(msg);
              }
          });
      }
  };

  const handleDeath = (killerId: string) => {
    const event = new CustomEvent('player-death', { detail: { killerId } });
    window.dispatchEvent(event);
    
    // Get killer name for message
    const players = useGameStore.getState().players;
    const killerName = players[killerId] ? players[killerId].username : 'seseorang';
    
    addChatMessage({
      id: Date.now().toString(),
      sender: 'System',
      text: `Kamu dibunuh oleh ${killerName}!`,
      isSystem: true
    });
  };

  // Broadcast Loop
  useEffect(() => {
    if (!roomId) return;
    
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const currentPlayerState = state.players[state.localId];
      
      // Update ref for new connections to use
      if (currentPlayerState) {
          localPlayerRef.current = { ...currentPlayerState, isLocal: true, health: state.health };
          
          const payload: NetworkMessage = {
            type: 'UPDATE',
            payload: {
              id: localId,
              position: currentPlayerState.position,
              rotation: currentPlayerState.rotation,
              isAttacking: state.isAttacking,
              isJumping: state.isJumping,
              emote: state.emote,
              isThrowing: state.isThrowing,
              health: state.health,
              drivingVehicleId: state.drivingVehicleId
            },
            senderId: localId
          };

          // Send to all open connections
          connectionsRef.current.forEach(conn => {
            if(conn.open) conn.send(payload);
          });
      }

      // Process Outgoing Queue
      if (state.outgoingMessages.length > 0) {
        state.outgoingMessages.forEach(msg => {
          connectionsRef.current.forEach(conn => {
            if(conn.open) conn.send(msg);
          });
        });
        clearMessageQueue();
      }

    }, 50); // 20 updates per second
    
    return () => clearInterval(interval);
  }, [roomId, localId]);

  return null;
};