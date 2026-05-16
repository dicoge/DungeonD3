// ============================================================
// DungeonD3 — 遊戲類型定義
// ============================================================

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  xp: number;
  xpN: number; // 升級所需經驗
  lvl: number;
  inv: InventoryItem[];
  eq: {
    w: EquipItem | null;
    a: EquipItem | null;
  };
  done: string[]; // 已完成的事件/樓層
}

export interface Enemy {
  id: string;
  name: string;
  icon: string;
  floor: number;
  hp: number;
  damage: number;
  def: number;
  xp_reward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  currentHp: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  type: 'consumable' | 'weapon' | 'armor' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effect: {
    heal?: number;
    damage?: number;
    buff?: number;
    revive?: boolean;
    [key: string]: unknown;
  };
  cost: number;
}

export interface InventoryItem extends Item {
  quantity: number;
}

export interface EquipItem extends Item {
  atkBonus?: number;
  defBonus?: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'ability';
  effect: {
    max_hp?: number;
    damage?: number;
    speed?: number;
    critical_chance?: number;
    critical_damage?: number;
    [key: string]: unknown;
  };
  tier: number;
  cost: number;
  prerequisites: string[];
}

export interface Boss {
  id: string;
  name: string;
  icon: string;
  hp: number;
  damage: number;
  def: number;
  xp_reward: number;
  floor: number;
  abilities: string[];
}

export interface DungeonMap {
  cells: string[][];
  px: number;
  py: number;
  sx: number;
  sy: number;
  rooms: Room[];
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloorConfig {
  floor: number;
  enemy_count: number;
  item_count: number;
  special_events: string[];
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  items: Item[];
  map: DungeonMap | null;
  floor: number;
  over: boolean;
  win: boolean;
  boss: Enemy | null;
  diceValue: number | null;
  isRolling: boolean;
  isLoading: boolean;
}
