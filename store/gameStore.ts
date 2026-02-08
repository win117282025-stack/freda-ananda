import { create } from 'zustand';
import { GamePhase, PlayerState, ChatMessage, ItemType, Role, NetworkMessage, GameMode, WorldObject, WorldObjectType } from '../types';

interface VirtualInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
}

interface GameStore {
  phase: GamePhase;
  roomId: string | null;
  gameMode: GameMode;
  username: string;
  localId: string;
  role: Role;
  isHost: boolean;
  players: Record<string, PlayerState>;
  chatMessages: ChatMessage[];
  
  // World Objects (Building)
  worldObjects: WorldObject[];
  
  // Inventory & Controls
  inventory: ItemType[];
  selectedSlot: number;
  isShiftLock: boolean;
  isMobile: boolean;
  virtualInput: VirtualInput;

  // Player Status
  isFlying: boolean;
  isRunning: boolean;
  isAttacking: boolean;
  isThrowing: boolean;
  isJumping: boolean;
  emote: string;
  drivingVehicleId: string | null; // ID of vehicle currently driving
  
  // Rivals Mode Stats
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;

  // UI State
  isMenuOpen: boolean;
  buildType: WorldObjectType; // Current selected build type

  // Networking Queue
  outgoingMessages: NetworkMessage[];

  // Game Modifiers
  speedMultiplier: number;
  jumpMultiplier: number;

  // Settings
  volume: number;
  graphicsQuality: number;
  theme: 'DARK' | 'LIGHT';
  captures: string[];

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setUsername: (name: string) => void;
  setRoomId: (id: string) => void;
  setRole: (role: Role) => void;
  setIsHost: (isHost: boolean) => void;
  toggleShiftLock: () => void;
  toggleFly: () => void;
  setRunning: (isRunning: boolean) => void;
  setAttacking: (isAttacking: boolean) => void;
  setThrowing: (isThrowing: boolean) => void;
  setJumping: (isJumping: boolean) => void;
  setEmote: (emote: string) => void;
  setDriving: (vehicleId: string | null) => void;
  
  selectSlot: (index: number) => void;
  unequipItem: () => void;
  setBuildType: (type: WorldObjectType) => void;
  
  setIsMobile: (isMobile: boolean) => void;
  setVirtualInput: (input: Partial<VirtualInput>) => void;
  setMenuOpen: (isOpen: boolean) => void;
  
  setModifiers: (speed: number, jump: number) => void;
  
  // Combat Actions
  takeDamage: (amount: number) => void;
  useAmmo: () => boolean;
  reloadAmmo: () => void;
  heal: (amount: number) => void;
  registerKill: (killerId: string, victimId: string) => void;
  spawnDummy: (name: string, position: [number, number, number], rotation: [number, number, number]) => void;

  // Building Actions
  placeObject: (obj: WorldObject) => void;
  removeObject: (id: string) => void;
  updateWorldObject: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
  clearObjects: () => void;

  // Settings Actions
  setVolume: (v: number) => void;
  setGraphicsQuality: (q: number) => void;
  setTheme: (t: 'DARK' | 'LIGHT') => void;
  addCapture: (url: string) => void;

  addPlayer: (id: string, player: PlayerState) => void;
  updatePlayer: (id: string, pos: [number, number, number], rot: [number, number, number], isAttacking?: boolean, isJumping?: boolean, emote?: string, isThrowing?: boolean, health?: number, drivingVehicleId?: string) => void;
  removePlayer: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  
  // Network Actions
  queueMessage: (msg: NetworkMessage) => void;
  clearMessageQueue: () => void;

  resetGame: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getInventoryForMode = (mode: GameMode, role: Role): ItemType[] => {
    if (mode === 'RIVALS') return ['GUN', 'SWORD'];
    if (mode === 'RACING') return ['BUILD']; // Build allows spawning cars if owner
    if (mode === 'BACKROOMS') return ['SWORD']; // Maybe a weapon for defense
    // OBBY / DEFAULT
    if (role === 'ADMIN' || role === 'OWNER') return ['GUN', 'SWORD', 'BUILD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'];
    return ['SWORD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'];
};

export const useGameStore = create<GameStore>((set, get) => ({
  phase: GamePhase.MENU,
  roomId: null,
  gameMode: 'OBBY',
  username: 'Tamu',
  localId: generateId(),
  role: 'GUEST',
  isHost: false,
  players: {},
  chatMessages: [],
  worldObjects: [],
  
  inventory: ['SWORD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'],
  selectedSlot: 0,
  isShiftLock: false,
  isMobile: false,
  virtualInput: { forward: false, backward: false, left: false, right: false, jump: false, run: false },

  isFlying: false,
  isRunning: false,
  isAttacking: false,
  isThrowing: false,
  isJumping: false,
  emote: 'none',
  drivingVehicleId: null,
  
  health: 100,
  maxHealth: 100,
  ammo: 30,
  maxAmmo: 30,

  isMenuOpen: false,
  buildType: 'BLOCK',

  outgoingMessages: [],

  speedMultiplier: 1,
  jumpMultiplier: 1,

  volume: 0.5,
  graphicsQuality: 5,
  theme: 'DARK',
  captures: [],

  setPhase: (phase) => set({ phase }),
  setGameMode: (gameMode) => set((state) => ({ 
    gameMode,
    inventory: getInventoryForMode(gameMode, state.role),
    isShiftLock: gameMode === 'RIVALS' || gameMode === 'BACKROOMS',
    worldObjects: [] // Clear objects when switching mode
  })),
  setUsername: (username) => set({ username }),
  setRoomId: (roomId) => set({ roomId }),
  setRole: (role) => set((state) => ({ 
    role,
    inventory: getInventoryForMode(state.gameMode, role)
  })),
  setIsHost: (isHost) => set({ isHost }),
  
  toggleShiftLock: () => set((state) => ({ isShiftLock: !state.isShiftLock })),
  toggleFly: () => set((state) => ({ isFlying: !state.isFlying })),
  setRunning: (isRunning) => set({ isRunning }),
  setAttacking: (isAttacking) => set({ isAttacking }),
  setThrowing: (isThrowing) => set({ isThrowing }),
  setJumping: (isJumping) => set({ isJumping }),
  setEmote: (emote: string) => set({ emote }),
  setDriving: (id) => set({ drivingVehicleId: id }),
  
  selectSlot: (index) => set({ selectedSlot: index }),
  unequipItem: () => set({ selectedSlot: -1 }), 
  setBuildType: (type) => set({ buildType: type }),

  setIsMobile: (isMobile) => set({ isMobile }),
  
  setVirtualInput: (input) => set((state) => ({
    virtualInput: { ...state.virtualInput, ...input }
  })),
  
  setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

  setModifiers: (speed, jump) => set({ speedMultiplier: speed, jumpMultiplier: jump }),
  
  takeDamage: (amount) => set((state) => ({ 
      health: Math.max(0, state.health - amount) 
  })),
  
  useAmmo: () => {
      const state = get();
      if (state.ammo > 0) {
          set({ ammo: state.ammo - 1 });
          return true;
      }
      return false;
  },
  
  reloadAmmo: () => set((state) => ({ ammo: state.maxAmmo })),
  
  heal: (amount) => set((state) => ({ health: Math.min(state.maxHealth, state.health + amount) })),

  registerKill: (killerId, victimId) => set((state) => {
    const players = { ...state.players };
    if (players[killerId]) {
      players[killerId] = { ...players[killerId], kills: (players[killerId].kills || 0) + 1 };
    }
    if (players[victimId]) {
      if (players[victimId].isDummy) {
          delete players[victimId];
          return { players };
      }
      players[victimId] = { ...players[victimId], deaths: (players[victimId].deaths || 0) + 1 };
    }
    return { players };
  }),

  spawnDummy: (name, position, rotation) => set((state) => {
      const id = `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const dummy: PlayerState = {
          id,
          username: name,
          role: 'GUEST',
          position,
          rotation,
          color: '#e5e7eb',
          isLocal: false,
          kills: 0,
          deaths: 0,
          isDummy: true,
          health: 100,
          maxHealth: 100
      };
      
      const newOutgoing = state.roomId ? [
          ...state.outgoingMessages,
          { type: 'SPAWN', payload: dummy, senderId: state.localId } as NetworkMessage
      ] : state.outgoingMessages;

      return {
          players: { ...state.players, [id]: dummy },
          outgoingMessages: newOutgoing
      };
  }),

  // Building Actions
  placeObject: (obj) => set((state) => {
      const newObjects = [...state.worldObjects, obj];
      const newOutgoing = state.roomId ? [
          ...state.outgoingMessages,
          { type: 'PLACE_OBJECT', payload: obj, senderId: state.localId } as NetworkMessage
      ] : state.outgoingMessages;
      return { worldObjects: newObjects, outgoingMessages: newOutgoing };
  }),

  removeObject: (id) => set((state) => {
      const newObjects = state.worldObjects.filter(o => o.id !== id);
      const newOutgoing = state.roomId ? [
          ...state.outgoingMessages,
          { type: 'REMOVE_OBJECT', payload: { id }, senderId: state.localId } as NetworkMessage
      ] : state.outgoingMessages;
      return { worldObjects: newObjects, outgoingMessages: newOutgoing };
  }),

  updateWorldObject: (id, position, rotation) => set((state) => ({
      worldObjects: state.worldObjects.map(obj => 
          obj.id === id ? { ...obj, position, rotation } : obj
      )
  })),

  clearObjects: () => set({ worldObjects: [] }),

  setVolume: (volume) => set({ volume }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setTheme: (theme) => set({ theme }),
  addCapture: (url) => set((state) => ({ captures: [url, ...state.captures] })),
  
  addPlayer: (id, player) => set((state) => ({
    players: { 
      ...state.players, 
      [id]: { 
        ...player,
        kills: player.kills || 0,
        deaths: player.deaths || 0,
        health: player.health ?? 100
      } 
    }
  })),

  updatePlayer: (id, position, rotation, isAttacking, isJumping, emote, isThrowing, health, drivingVehicleId) => set((state) => {
    if (!state.players[id]) return state;
    return {
      players: {
        ...state.players,
        [id]: { 
          ...state.players[id], 
          position, 
          rotation,
          isAttacking: isAttacking ?? state.players[id].isAttacking,
          isJumping: isJumping ?? state.players[id].isJumping,
          emote: emote ?? state.players[id].emote,
          isThrowing: isThrowing ?? state.players[id].isThrowing,
          health: health ?? state.players[id].health,
          drivingVehicleId: drivingVehicleId
        }
      }
    };
  }),

  removePlayer: (id) => set((state) => {
    const newPlayers = { ...state.players };
    delete newPlayers[id];
    return { players: newPlayers };
  }),

  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages, msg].slice(-50)
  })),

  queueMessage: (msg) => set((state) => ({
    outgoingMessages: [...state.outgoingMessages, msg]
  })),

  clearMessageQueue: () => set({ outgoingMessages: [] }),

  resetGame: () => set((state) => ({
    roomId: null,
    players: {},
    worldObjects: [],
    chatMessages: [],
    phase: GamePhase.MENU,
    role: 'GUEST',
    isHost: false,
    inventory: ['SWORD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'], 
    isShiftLock: false,
    speedMultiplier: 1,
    jumpMultiplier: 1,
    isFlying: false,
    isRunning: false,
    isAttacking: false,
    isThrowing: false,
    isJumping: false,
    emote: 'none',
    drivingVehicleId: null,
    isMenuOpen: false,
    outgoingMessages: [],
    captures: [],
    health: 100,
    ammo: 30,
    gameMode: 'OBBY'
  }))
}));