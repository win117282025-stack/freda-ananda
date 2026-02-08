import { create } from 'zustand';
import { GamePhase, PlayerState, ChatMessage, ItemType, Role, NetworkMessage, GameMode } from '../types';

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
  isHost: boolean; // Multiplayer Topology Flag
  players: Record<string, PlayerState>;
  chatMessages: ChatMessage[];
  
  // Inventory & Controls
  inventory: ItemType[];
  selectedSlot: number;
  isShiftLock: boolean;
  isMobile: boolean;
  virtualInput: VirtualInput;

  // Player Status
  isFlying: boolean;
  isRunning: boolean;
  isAttacking: boolean; // Local attack state
  isThrowing: boolean;  // Local throw state
  isJumping: boolean;   // Local jump state
  emote: string;        // Local emote state ('none', 'dance1', 'dance2', 'dance3')
  
  // Rivals Mode Stats
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;

  // UI State
  isMenuOpen: boolean;

  // Networking Queue
  outgoingMessages: NetworkMessage[];

  // Game Modifiers
  speedMultiplier: number;
  jumpMultiplier: number;

  // Settings
  volume: number;        // 0.0 to 1.0
  graphicsQuality: number; // 1 to 10
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
  
  selectSlot: (index: number) => void;
  unequipItem: () => void; // New action
  
  setIsMobile: (isMobile: boolean) => void;
  setVirtualInput: (input: Partial<VirtualInput>) => void;
  setMenuOpen: (isOpen: boolean) => void;
  
  setModifiers: (speed: number, jump: number) => void;
  
  // Combat Actions
  takeDamage: (amount: number) => void;
  useAmmo: () => boolean;
  reloadAmmo: () => void;
  heal: (amount: number) => void;
  registerKill: (killerId: string, victimId: string) => void; // NEW ACTION
  spawnDummy: (name: string, position: [number, number, number], rotation: [number, number, number]) => void; // NEW ACTION

  // Settings Actions
  setVolume: (v: number) => void;
  setGraphicsQuality: (q: number) => void;
  setTheme: (t: 'DARK' | 'LIGHT') => void;
  addCapture: (url: string) => void;

  addPlayer: (id: string, player: PlayerState) => void;
  updatePlayer: (id: string, pos: [number, number, number], rot: [number, number, number], isAttacking?: boolean, isJumping?: boolean, emote?: string, isThrowing?: boolean) => void;
  removePlayer: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  
  // Network Actions
  queueMessage: (msg: NetworkMessage) => void;
  clearMessageQueue: () => void;

  resetGame: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

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
  
  // Combat Defaults
  health: 100,
  maxHealth: 100,
  ammo: 30,
  maxAmmo: 30,

  isMenuOpen: false,

  outgoingMessages: [],

  speedMultiplier: 1,
  jumpMultiplier: 1,

  // Default Settings
  volume: 0.5,
  graphicsQuality: 5, // Default medium quality
  theme: 'DARK',
  captures: [],

  setPhase: (phase) => set({ phase }),
  setGameMode: (gameMode) => set({ 
    gameMode,
    // Switch inventory based on mode. Rivals gets guns, Obby gets tools.
    // Guests now get Ukulele and Fishing Rod in Obby mode.
    inventory: gameMode === 'RIVALS' 
      ? ['GUN', 'SWORD'] 
      : (get().role === 'ADMIN' || get().role === 'OWNER' 
          ? ['GUN', 'SWORD', 'BUILD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'] 
          : ['SWORD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY']),
    isShiftLock: gameMode === 'RIVALS' // Auto-lock for rivals shooter feel
  }),
  setUsername: (username) => set({ username }),
  setRoomId: (roomId) => set({ roomId }),
  setRole: (role) => set({ 
    role,
    // Update inventory immediately on role change if in default mode
    inventory: (role === 'ADMIN' || role === 'OWNER') 
      ? ['GUN', 'SWORD', 'BUILD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'] 
      : ['SWORD', 'UKULELE', 'FISHING_ROD', 'WEAKEST_DUMMY'] 
  }),
  setIsHost: (isHost) => set({ isHost }),
  
  toggleShiftLock: () => set((state) => ({ isShiftLock: !state.isShiftLock })),
  toggleFly: () => set((state) => ({ isFlying: !state.isFlying })),
  setRunning: (isRunning) => set({ isRunning }),
  setAttacking: (isAttacking) => set({ isAttacking }),
  setThrowing: (isThrowing) => set({ isThrowing }),
  setJumping: (isJumping) => set({ isJumping }),
  setEmote: (emote) => set({ emote }),
  
  selectSlot: (index) => {
    set({ selectedSlot: index });
  },
  
  unequipItem: () => set({ selectedSlot: -1 }), 

  setIsMobile: (isMobile: boolean) => set({ isMobile }),
  
  setVirtualInput: (input) => set((state) => ({
    virtualInput: { ...state.virtualInput, ...input }
  })),
  
  setMenuOpen: (isOpen: boolean) => set({ isMenuOpen: isOpen }),

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
    
    // Update Killer Stats
    if (players[killerId]) {
      players[killerId] = {
        ...players[killerId],
        kills: (players[killerId].kills || 0) + 1
      };
    }

    // Update Victim Stats
    if (players[victimId]) {
      // If it's a dummy, we might just remove it or respawn it.
      // For now, let's treat it like a player that died.
      if (players[victimId].isDummy) {
          delete players[victimId]; // Remove dummy on death
          return { players };
      }

      players[victimId] = {
        ...players[victimId],
        deaths: (players[victimId].deaths || 0) + 1
      };
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
          color: '#e5e7eb', // Light gray for dummy
          isLocal: false,
          kills: 0,
          deaths: 0,
          isDummy: true
      };
      
      // Auto-broadcast if we are connected (roomId exists)
      const newOutgoing = state.roomId ? [
          ...state.outgoingMessages,
          {
              type: 'SPAWN',
              payload: dummy,
              senderId: state.localId
          } as NetworkMessage
      ] : state.outgoingMessages;

      return {
          players: { ...state.players, [id]: dummy },
          outgoingMessages: newOutgoing
      };
  }),

  setVolume: (volume) => set({ volume }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setTheme: (theme) => set({ theme }),
  addCapture: (url: string) => set((state) => ({ captures: [url, ...state.captures] })),
  
  addPlayer: (id, player) => set((state) => ({
    players: { 
      ...state.players, 
      [id]: { 
        ...player,
        // Ensure stats exist if coming from old packet or init
        kills: player.kills || 0,
        deaths: player.deaths || 0
      } 
    }
  })),

  updatePlayer: (id, position, rotation, isAttacking, isJumping, emote, isThrowing) => set((state) => {
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
          isThrowing: isThrowing ?? state.players[id].isThrowing
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
    isMenuOpen: false,
    outgoingMessages: [],
    captures: [],
    health: 100,
    ammo: 30,
    gameMode: 'OBBY'
  }))
}));