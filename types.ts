import React from 'react';

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
}

export type Role = 'GUEST' | 'ADMIN' | 'OWNER';
export type GameMode = 'OBBY' | 'RIVALS' | 'RACING' | 'BACKROOMS';

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
  isThrowing?: boolean;
  isJumping?: boolean;
  emote?: string;
  health?: number; // 0-100
  maxHealth?: number;
  kills: number;
  deaths: number;
  isDummy?: boolean;
  drivingVehicleId?: string; // ID of the vehicle being driven
}

export type ItemType = 'NONE' | 'GUN' | 'SWORD' | 'BUILD' | 'UKULELE' | 'FISHING_ROD' | 'WEAKEST_DUMMY';

export type WorldObjectType = 'BLOCK' | 'SPHERE' | 'HOUSE' | 'CAR';

export interface WorldObject {
  id: string;
  type: WorldObjectType;
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  ownerId?: string;
}

export interface NetworkMessage {
  type: 'JOIN' | 'UPDATE' | 'CHAT' | 'KICK' | 'KILL' | 'GAME_MODE' | 'SPAWN' | 'PLACE_OBJECT' | 'REMOVE_OBJECT';
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

declare global {
  namespace JSX {
    interface IntrinsicElements extends R3FElements {}
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends R3FElements {}
  }
}