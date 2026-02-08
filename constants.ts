export const GRAVITY = -25; // Reduced gravity for floatier jumps
export const JUMP_FORCE = 16; // Increased jump height
export const SPEED = 8;     // Faster walking speed for better momentum
export const RUN_SPEED = 12; // Faster running
export const FLY_SPEED = 20;
export const RESPAWN_THRESHOLD = -20;

export const PLAYER_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

// R6 Dimensions (Approximate)
export const R6_SIZE = {
  Head: [0.5, 0.5, 0.5],
  Torso: [1, 1, 0.5],
  Limb: [0.5, 1, 0.5], // Arms and Legs
};

// Sound Effects
// Using short, reliable sound effects
export const AUDIO_URLS = {
  // Click/Snap sound for Equip
  EQUIP: 'https://assets.mixkit.co/active_storage/sfx/1487/1487-preview.mp3',
  
  // Swoosh sound for Slash (Fixed URL)
  SLASH: 'https://assets.mixkit.co/active_storage/sfx/1485/1485-preview.mp3',
  
  // Soft footstep
  WALK: 'https://assets.mixkit.co/active_storage/sfx/65/65-preview.mp3',
  
  // Cartoon Jump
  JUMP: 'https://assets.mixkit.co/active_storage/sfx/223/223-preview.mp3',

  // Items
  UKULELE: 'https://cdn.pixabay.com/audio/2026/02/06/audio_cae905bd4c.mp3?filename=u_pncj7im3aa-ukulele-480520.mp3',
  FISHING: 'https://cdn.pixabay.com/audio/2026/02/06/audio_f57c995873.mp3?filename=u_pncj7im3aa-fischhhhhh-480521.mp3'
};