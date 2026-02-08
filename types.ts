import React from 'react';

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
}

export type Role = 'GUEST' | 'ADMIN' | 'OWNER';
export type GameMode = 'OBBY' | 'RIVALS';

export interface PlayerState {
  id: string;
  username: string;
  role: Role;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  isLocal: boolean;
  heldItem?: ItemType;
  isAttacking?: boolean;
  isThrowing?: boolean; // New: Throw animation state
  isJumping?: boolean;  // New: Jump animation state
  emote?: string;       // New: Current dance/emote
  health?: number; // 0-100
  maxHealth?: number;
  kills: number;   // NEW: Leaderboard stat
  deaths: number;  // NEW: Leaderboard stat
  isDummy?: boolean; // NEW: Flag for dummy entities
}

export type ItemType = 'NONE' | 'GUN' | 'SWORD' | 'BUILD' | 'UKULELE' | 'FISHING_ROD' | 'WEAKEST_DUMMY';

export interface NetworkMessage {
  type: 'JOIN' | 'UPDATE' | 'CHAT' | 'KICK' | 'KILL' | 'GAME_MODE' | 'SPAWN';
  payload: any;
  senderId: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isSystem?: boolean;
  isAi?: boolean;
}

// Helper interface for R3F elements
interface R3FElements {
  ambientLight: any;
  pointLight: any;
  directionalLight: any;
  spotLight: any;
  hemisphereLight: any;
  
  group: any;
  mesh: any;
  primitive: any;
  
  boxGeometry: any;
  planeGeometry: any;
  sphereGeometry: any;
  cylinderGeometry: any;
  capsuleGeometry: any;
  circleGeometry: any;
  gridHelper: any;
  
  meshStandardMaterial: any;
  meshBasicMaterial: any;
  meshPhongMaterial: any;
  
  color: any;
  fog: any;
  
  // HTML Elements
  div: any;
  span: any;
  h1: any;
  p: any;
  button: any;
  input: any;
  label: any;
  form: any;
  i: any;
  img: any;
  textarea: any;
  select: any;
  option: any;

  [elemName: string]: any;
}

// Shim to fix JSX IntrinsicElements errors for React Three Fiber
// Augment Global JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends R3FElements {}
  }
}

// Augment React Module JSX (fallback for different TS/React configurations)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends R3FElements {}
  }
}