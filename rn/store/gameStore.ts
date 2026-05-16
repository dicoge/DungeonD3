// ============================================================
// DungeonD3 — 遊戲狀態 Store v2
// 遵循 SPEC.md 設計
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, Player, Enemy, Item, DungeonMap } from '../types';
import { SFX } from '../services/audio';

// 攻擊骰
function d20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function d6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// 根據骰值計算移動點數
function calcMovePoints(diceValue: number): number {
  return Math.max(1, Math.floor(diceValue / 3));
}

// 攻擊結算
function resolveAttack(atk: number, def: number): {
  d20Value: number;
  hit: boolean;
  crit: boolean;
  dmg: number;
  playerDmg?: number;
} {
  const r = d20();
  if (r === 1) return { d20Value: r, hit: false, crit: false, dmg: 0 };
  if (r === 20) return { d20Value: r, hit: true, crit: true, dmg: atk + d6() * 2 };
  const tot = r + atk;
  return { d20Value: r, hit: tot > def, crit: false, dmg: tot > def ? atk + d6() : 0 };
}

// 安全取得裝備加成
function getAtkBonus(item: { effect: Record<string, unknown> }): number {
  const v = item.effect.atk;
  return typeof v === 'number' ? v : 0;
}
function getDefBonus(item: { effect: Record<string, unknown> }): number {
  const v = item.effect.def;
  return typeof v === 'number' ? v : 0;
}

// 地城生成
function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}

function hcor(m: string[][], x1: number, x2: number, y: number): void {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    if (y > 0 && y < m.length - 1 && x > 0 && x < m[0].length - 1) {
      m[y][x] = 'floor';
    }
  }
}

function vcor(m: string[][], y1: number, y2: number, x: number): void {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    if (y > 0 && y < m.length - 1 && x > 0 && x < m[0].length - 1) {
      m[y][x] = 'floor';
    }
  }
}

function generateDungeon(): DungeonMap {
  const W = 30, H = 20;
  const map = Array.from({ length: H }, () => Array(W).fill('void'));
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  const target = 8 + rnd(4);

  for (let a = 0; a < target * 5 && rooms.length < target; a++) {
    const rw = 4 + rnd(5), rh = 3 + rnd(4);
    const rx = 2 + rnd(W - rw - 4), ry = 2 + rnd(H - rh - 4);
    if (rooms.some(r => rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y)) continue;
    rooms.push({ x: rx, y: ry, w: rw, h: rh });
    for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) map[y][x] = 'floor';
  }

  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    const ax = Math.floor(a.x + a.w / 2), ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);
    if (rnd(2) === 0) { hcor(map, ax, bx, ay); vcor(map, ay, by, bx); }
    else { vcor(map, ay, by, ax); hcor(map, ax, bx, by); }
  }

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (map[y][x] !== 'void') continue;
      let adj = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (map[y + dy] && map[y + dy][x + dx] === 'floor') { adj = true; break; }
      }
      if (adj) map[y][x] = 'wall';
    }
  }

  const last = rooms[rooms.length - 1];
  const sx = Math.floor(last.x + last.w / 2), sy = Math.floor(last.y + last.h / 2);
  map[sy][sx] = 'stairs';
  const first = rooms[0];
  return {
    cells: map,
    px: Math.floor(first.x + first.w / 2),
    py: Math.floor(first.y + first.h / 2),
    sx, sy, rooms,
  };
}

// 敵人資料（樓層加成）
const FLOOR_MULTIPLIER: Record<string, number> = {
  '1-3': 1.0, '4-6': 1.3, '7-9': 1.6, '10-14': 2.0, '15': 2.0,
};

const BASE_ENEMIES: Omit<Enemy, 'currentHp'>[] = [
  { id: 'slime', name: '史萊姆', icon: '🟢', floor: 1, hp: 30, damage: 5, def: 2, xp_reward: 10, rarity: 'common' },
  { id: 'goblin', name: '哥布林', icon: '👺', floor: 1, hp: 35, damage: 6, def: 3, xp_reward: 12, rarity: 'common' },
  { id: 'bat', name: '洞穴蝙蝠', icon: '🦇', floor: 1, hp: 25, damage: 7, def: 1, xp_reward: 8, rarity: 'common' },
  { id: 'rat', name: '毒鼠', icon: '🐀', floor: 1, hp: 28, damage: 5, def: 2, xp_reward: 9, rarity: 'common' },
  { id: 'skeleton', name: '骨骸戰士', icon: '💀', floor: 2, hp: 50, damage: 10, def: 5, xp_reward: 20, rarity: 'common' },
  { id: 'orc', name: '獸人', icon: '👹', floor: 2, hp: 60, damage: 12, def: 4, xp_reward: 22, rarity: 'common' },
  { id: 'troll', name: '巨魔', icon: '🧌', floor: 3, hp: 100, damage: 18, def: 8, xp_reward: 40, rarity: 'uncommon' },
  { id: 'dragon_spawn', name: '幼龍', icon: '🐉', floor: 4, hp: 200, damage: 30, def: 15, xp_reward: 80, rarity: 'rare' },
  { id: '5_boss', name: '深淵領主', icon: '👿', floor: 5, hp: 300, damage: 25, def: 10, xp_reward: 150, rarity: 'boss' },
  { id: '10_boss', name: '深淵將軍', icon: '👹', floor: 10, hp: 500, damage: 35, def: 18, xp_reward: 300, rarity: 'boss' },
  { id: '15_boss', name: '暗黑龍王', icon: '🐲', floor: 15, hp: 400, damage: 45, def: 25, xp_reward: 500, rarity: 'boss' },
];

function getFloorMultiplier(floor: number): number {
  if (floor <= 3) return 1.0;
  if (floor <= 6) return 1.3;
  if (floor <= 9) return 1.6;
  if (floor <= 14) return 2.0;
  return 3.0;
}

function spawnEnemiesForFloor(floor: number): Enemy[] {
  const mult = getFloorMultiplier(floor);
  const bossFloor = floor % 5 === 0 && floor <= 15;

  if (bossFloor) {
    const boss = BASE_ENEMIES.find(e => e.id === `${floor}_boss`);
    if (boss) {
      return [{
        ...boss,
        hp: Math.floor(boss.hp * mult),
        damage: Math.floor(boss.damage * mult),
        currentHp: Math.floor(boss.hp * mult),
      }];
    }
  }

  const eligible = BASE_ENEMIES.filter(e => e.floor <= Math.ceil(floor / 2));
  const count = Math.min(3 + Math.floor(floor / 2), 8);
  const selected = eligible.sort(() => Math.random() - 0.5).slice(0, count);

  return selected.map(e => ({
    ...e,
    hp: Math.floor(e.hp * mult),
    damage: Math.floor(e.damage * mult),
    def: Math.floor(e.def * mult),
    currentHp: Math.floor(e.hp * mult),
  }));
}

// 道具資料
const BASE_ITEMS: Item[] = [
  { id: 'health_potion', name: '生命藥水', icon: '❤️', type: 'consumable', rarity: 'common', effect: { heal: 30 }, cost: 15 },
  { id: 'bomb', name: '炸彈', icon: '💣', type: 'consumable', rarity: 'uncommon', effect: { damage: 40 }, cost: 30 },
  { id: 'fire_scroll', name: '火球卷軸', icon: '📜', type: 'consumable', rarity: 'uncommon', effect: { damage: 35 }, cost: 25 },
  { id: 'strength_buff', name: '力量藥劑', icon: '💪', type: 'consumable', rarity: 'rare', effect: { atk_buff: 5, duration: 3 }, cost: 50 },
  { id: 'iron_sword', name: '鐵劍', icon: '⚔️', type: 'weapon', rarity: 'common', effect: { atk: 5 }, cost: 50 },
  { id: 'steel_sword', name: '鋼鐵劍', icon: '🗡️', type: 'weapon', rarity: 'uncommon', effect: { atk: 10 }, cost: 100 },
  { id: 'leather_armor', name: '皮甲', icon: '🥋', type: 'armor', rarity: 'common', effect: { def: 3 }, cost: 40 },
  { id: 'chainmail', name: '鎖子甲', icon: '🛡️', type: 'armor', rarity: 'uncommon', effect: { def: 7 }, cost: 90 },
  { id: 'phoenix_feather', name: '鳳凰羽毛', icon: '🪶', type: 'consumable', rarity: 'legendary', effect: { revive: true }, cost: 200 },
];

// ============================================================
// Tutorial Steps — 互動引導式教學
// 每一步引導玩家操作 UI 元素，自動進度，無跳過按鈕
// ============================================================
export type TutorialHighlight = 'ROLL_DICE' | 'MOVE_TILE' | 'ATTACK_BTN' | 'USE_ITEM' | null;

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: '歡迎來到地城！',
    content: '我是你的嚮導 🧙‍♂️\n點擊下方按鈕，開始你的冒險之旅！',
    highlight: null as TutorialHighlight,
  },
  {
    id: 'roll_dice',
    title: '🎲 擲出命運之骰',
    content: '點擊發光的骰子按鈕來擲骰！\n骰值越高，行動點數越多！',
    highlight: 'ROLL_DICE' as TutorialHighlight,
  },
  {
    id: 'move_player',
    title: '🗺️ 踏出第一步',
    content: '點擊發光的格子來移動角色！\n每走一步消耗 1 行動點。',
    highlight: 'MOVE_TILE' as TutorialHighlight,
  },
  {
    id: 'attack_enemy',
    title: '⚔️ 戰鬥！',
    content: '點擊發光的攻擊按鈕來戰鬥！\n打倒敵人前進吧！',
    highlight: 'ATTACK_BTN' as TutorialHighlight,
  },
  {
    id: 'use_item',
    title: '🎒 使用道具',
    content: '打開背包，點擊「使用」按鈕\n用生命藥水恢復 HP！',
    highlight: 'USE_ITEM' as TutorialHighlight,
  },
  {
    id: 'complete',
    title: '開始冒險！',
    content: '準備好了嗎？\n前往 15 層地城，擊敗所有敵人！',
    highlight: null as TutorialHighlight,
  },
];

// ============================================================
// Store Interface
// ============================================================
interface GameStore extends GameState {
  // 骰子系統
  rollDice: () => void;
  diceValue: number | null;
  isRolling: boolean;
  movePoints: number;
  hasRolledThisTurn: boolean; // 防止本回合重複骰

  // 教學系統
  tutorialStep: number;
  tutorialDone: boolean;
  tutorialHighlight: TutorialHighlight;
  completeTutorialStep: (stepId: string) => void;

  // 初始化
  initGame: () => void;
  loadGame: () => Promise<boolean>;

  // 移動
  movePlayer: (dx: number, dy: number) => boolean;
  useMovePoint: () => void;

  // 戰鬥
  currentEnemy: Enemy | null;
  encounterEnemy: (enemy: Enemy) => void;
  attack: () => { result: ReturnType<typeof resolveAttack>; playerHit: number };
  skipEnemy: () => void;

  // 道具
  useItem: (itemId: string) => void;
  equipItem: (itemId: string, slot: 'w' | 'a') => void;
  unequipItem: (slot: 'w' | 'a') => void;

  // 商店
  buyItem: (itemId: string) => void;

  // 商店狀態（每3層出現）
  shopAvailable: boolean;

  // 樓層
  nextFloor: () => void;

  // 結算
  checkGameOver: () => void;

  // 存檔
  saveGame: () => Promise<void>;

  // --- UI State (手機格式覆蓋層) ---
  activeTab: 'dice' | 'map';
  showShop: boolean;
  showInventory: boolean;
  setActiveTab: (tab: 'dice' | 'map') => void;
  openShop: () => void;
  closeShop: () => void;
  openInventory: () => void;
  closeInventory: () => void;
}

// ============================================================
export const useGameStore = create<GameStore>((set, get) => ({
  player: {
    x: 0, y: 0, hp: 30, maxHp: 30, atk: 5, def: 2,
    gold: 0, xp: 0, xpN: 50, lvl: 1, inv: [], eq: { w: null, a: null }, done: [],
  },
  enemies: [],
  items: BASE_ITEMS.slice(0, 4).map(i => ({ ...i, quantity: 1 })),
  map: null,
  floor: 1,
  over: false,
  win: false,
  boss: null,
  diceValue: null,
  isRolling: false,
  movePoints: 0,
  hasRolledThisTurn: false,
  tutorialStep: 0,
  tutorialDone: false,
  tutorialHighlight: null,
  currentEnemy: null,
  shopAvailable: false,

  // UI state
  activeTab: 'dice',
  showShop: false,
  showInventory: false,
  isLoading: false,

  rollDice: () => {
    const { hasRolledThisTurn, movePoints } = get();
    // 已經骰過了，或行動點還沒用完，不能再骰
    if (hasRolledThisTurn || movePoints > 0) return;
    set({ isRolling: true });
    setTimeout(() => {
      const value = Math.floor(Math.random() * 20) + 1;
      const movePoints = calcMovePoints(value);
      set({
        diceValue: value,
        isRolling: false,
        movePoints,
        hasRolledThisTurn: true, // 標記本回合已骰
      });
    }, 1500);
  },

  completeTutorialStep: (stepId: string) => {
    const { tutorialStep } = get();
    const currentStepIndex = TUTORIAL_STEPS.findIndex(s => s.id === stepId);
    if (currentStepIndex === -1) return;

    const nextStep = currentStepIndex + 1;
    if (nextStep >= TUTORIAL_STEPS.length) {
      set({ tutorialStep: TUTORIAL_STEPS.length - 1, tutorialDone: true, tutorialHighlight: null });
      return;
    }

    const nextStepId = TUTORIAL_STEPS[nextStep].id;
    const nextHighlight = TUTORIAL_STEPS[nextStep].highlight;

    // Setup state for the next step
    switch (nextStepId) {
      case 'roll_dice':
        // Ensure dice is rollable (reset turn state)
        set({
          hasRolledThisTurn: false,
          movePoints: 0,
          diceValue: null,
        });
        break;
      case 'move_player':
        // Switch to map tab, ensure player has move points
        set({
          activeTab: 'map',
          movePoints: Math.max(1, get().movePoints),
        });
        break;
      case 'attack_enemy':
        // Ensure there's an enemy and move points for attack
        if (get().enemies.length === 0) {
          // Add a weak enemy if none exist
          const weakEnemy = {
            id: 'tutorial_slime',
            name: '弱小的史萊姆',
            icon: '🟢',
            floor: 1,
            hp: 15,
            damage: 3,
            def: 1,
            xp_reward: 5,
            rarity: 'common' as const,
            currentHp: 15,
          };
          set({ enemies: [weakEnemy] });
        }
        set({ movePoints: Math.max(1, get().movePoints) });
        break;
      case 'use_item':
        // Give a health potion if player doesn't have one, open inventory
        const player = get().player;
        const hasPotion = player.inv.some(i => i.id === 'health_potion');
        if (!hasPotion) {
          const newInv = [...player.inv, { id: 'health_potion', name: '生命藥水', icon: '❤️', type: 'consumable' as const, rarity: 'common' as const, effect: { heal: 30 }, cost: 15, quantity: 1 }];
          set({ player: { ...player, inv: newInv } });
        }
        set({ showInventory: true });
        break;
      case 'complete':
        set({ showInventory: false });
        break;
    }

    set({ tutorialStep: nextStep, tutorialHighlight: nextHighlight });
  },

  initGame: () => {
    const newPlayer: Player = {
      x: 0, y: 0, hp: 30, maxHp: 30, atk: 5, def: 2,
      gold: 0, xp: 0, xpN: 50, lvl: 1, inv: [
        { ...BASE_ITEMS[0], quantity: 2 }, // 2瓶生命藥水
      ], eq: { w: null, a: null }, done: [],
    };
    const newMap = generateDungeon();
    newPlayer.x = newMap.px;
    newPlayer.y = newMap.py;
    const enemies = spawnEnemiesForFloor(1);

    set({
      player: newPlayer,
      map: newMap,
      enemies,
      items: BASE_ITEMS.slice(0, 4).map(i => ({ ...i, quantity: 1 })),
      floor: 1,
      over: false,
      win: false,
      boss: null,
      diceValue: null,
      isRolling: false,
      isLoading: false,
      movePoints: 0,
      hasRolledThisTurn: false,
      tutorialStep: 0,
      tutorialDone: false,
      tutorialHighlight: null,
      currentEnemy: null,
      shopAvailable: false,
    });
  },

  loadGame: async () => {
    set({ isLoading: true });
    try {
      const data = await AsyncStorage.getItem('dungeonD3_save');
      if (data) {
        const saved = JSON.parse(data);
        set({ ...saved, isLoading: false, isRolling: false, currentEnemy: null });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  movePlayer: (dx, dy) => {
    const { player, map, movePoints } = get();
    if (!map || movePoints <= 0) return false;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (ny < 0 || ny >= map.cells.length || nx < 0 || nx >= map.cells[0].length) return false;
    const cell = map.cells[ny][nx];
    if (cell === 'void' || cell === 'wall') return false;

    const newPlayer = { ...player, x: nx, y: ny };

    // 樓梯
    if (cell === 'stairs') {
      get().nextFloor();
    }

    set({ player: newPlayer, movePoints: movePoints - 1 });
    return true;
  },

  useMovePoint: () => {
    const { movePoints } = get();
    if (movePoints > 0) {
      const newPts = movePoints - 1;
      set({ movePoints: newPts });
      // 行動點用完，回合結束，可以再骰
      if (newPts === 0) {
        set({ hasRolledThisTurn: false, diceValue: null });
      }
    }
  },

  encounterEnemy: (enemy) => {
    set({ currentEnemy: enemy });
  },

  attack: () => {
    const { player, currentEnemy } = get();
    if (!currentEnemy) return {
      result: { d20Value: 0, hit: false, crit: false, dmg: 0 },
      playerHit: 0
    };

    const result = resolveAttack(player.atk, currentEnemy.def);
    let newEnemyHp = currentEnemy.currentHp;
    let newPlayerHp = player.hp;
    let xpGain = 0;
    let goldGain = 0;

    if (result.hit) {
      newEnemyHp -= result.dmg;
    }

    // 敵人反擊
    let playerHit = 0;
    if (newEnemyHp > 0) {
      const enemyAttack = resolveAttack(currentEnemy.damage, player.def);
      if (enemyAttack.hit) {
        playerHit = enemyAttack.dmg;
        newPlayerHp -= playerHit;
      }
    }

    // 更新敵人 HP
    if (newEnemyHp <= 0) {
      xpGain = currentEnemy.xp_reward;
      goldGain = Math.floor(currentEnemy.xp_reward / 2);
    }

    let newPlayer = {
      ...player,
      hp: Math.max(0, newPlayerHp),
      xp: player.xp + xpGain,
      gold: player.gold + goldGain,
    };

    // 升級檢查
    if (newPlayer.xp >= newPlayer.xpN) {
      const newMaxHp = newPlayer.maxHp + 10;
      newPlayer = {
        ...newPlayer,
        lvl: newPlayer.lvl + 1,
        xp: newPlayer.xp - newPlayer.xpN,
        xpN: Math.floor(newPlayer.xpN * 1.5),
        maxHp: newMaxHp,
        atk: newPlayer.atk + 2,
        hp: Math.min(player.hp + 10, newMaxHp),
      };
    }

    const newEnemies = get().enemies.map(e =>
      e.id === currentEnemy.id ? { ...e, currentHp: Math.max(0, newEnemyHp) } : e
    ).filter(e => e.currentHp > 0);

    const tutorialProtect = !get().tutorialDone && newPlayerHp <= 0;
    let over = newPlayerHp <= 0;
    const win = get().floor >= 15 && newEnemies.length === 0;

    // 教學模式保護：玩家歸零時自動復活半血，不觸發 Game Over
    if (tutorialProtect) {
      newPlayer = {
        ...newPlayer,
        hp: Math.floor(newPlayer.maxHp / 2),
      };
      over = false;
    }

    set({
      player: newPlayer,
      enemies: newEnemies,
      currentEnemy: newEnemyHp > 0 ? { ...currentEnemy, currentHp: newEnemyHp } : null,
      over,
      win,
    });

    get().saveGame();
    return { result, playerHit };
  },

  skipEnemy: () => {
    const { enemies, currentEnemy } = get();
    if (!currentEnemy) return;
    const newEnemies = enemies.filter(e => e.id !== currentEnemy.id);
    set({ currentEnemy: null, enemies: newEnemies });
  },

  useItem: (itemId) => {
    const { player, currentEnemy, enemies } = get();
    const item = player.inv.find(i => i.id === itemId);
    if (!item) return;

    // Potion spam prevention: if healing item and already at full HP, return early
    const healVal = item.effect.heal;
    if (typeof healVal === 'number' && player.hp >= player.maxHp) {
      return;
    }

    let newPlayer = { ...player };
    let newEnemyHp = currentEnemy ? currentEnemy.currentHp : 0;
    let newEnemies = [...enemies];
    if (typeof healVal === 'number') {
      newPlayer = { ...newPlayer, hp: Math.min(newPlayer.maxHp, newPlayer.hp + healVal) };
    }
    const atkBuffVal = item.effect.atk_buff;
    if (typeof atkBuffVal === 'number') {
      newPlayer = { ...newPlayer, atk: newPlayer.atk + atkBuffVal };
    }
    if (item.effect.damage && currentEnemy) {
      // 炸彈之類直接造成傷害到敵人
      const dmg = typeof item.effect.damage === 'number' ? item.effect.damage : 0;
      newEnemyHp = Math.max(0, currentEnemy.currentHp - dmg);
      newEnemies = enemies.map(e =>
        e.id === currentEnemy.id ? { ...e, currentHp: newEnemyHp } : e
      ).filter(e => e.currentHp > 0);
    }

    const newInv = player.inv
      .map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    newPlayer = { ...newPlayer, inv: newInv };

    set({
      player: newPlayer,
      enemies: newEnemies,
      currentEnemy: newEnemyHp > 0 && currentEnemy ? { ...currentEnemy, currentHp: newEnemyHp } : null,
    });

    // 使用道具消耗 2 MOVE 並結束回合
    const mp = get().movePoints;
    const newMp = Math.max(0, mp - 2);
    set({ movePoints: newMp });
    if (newMp === 0) {
      set({ hasRolledThisTurn: false, diceValue: null });
    }

    get().saveGame();
  },

  buyItem: (itemId) => {
    const { player, items } = get();
    const item = items.find(i => i.id === itemId);
    if (!item || player.gold < item.cost) return;

    const newPlayer = {
      ...player,
      gold: player.gold - item.cost,
    };

    const existing = newPlayer.inv.find(i => i.id === itemId);
    if (existing) {
      newPlayer.inv = newPlayer.inv.map(i =>
        i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newPlayer.inv = [...newPlayer.inv, { ...item, quantity: 1 }];
    }

    set({ player: newPlayer, items: items.filter(i => i.id !== itemId) });
    SFX.buy();
    get().saveGame();
  },

  equipItem: (itemId, slot) => {
    const { player } = get();
    const item = player.inv.find(i => i.id === itemId);
    if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return;

    const newInv = player.inv.filter(i => i.id !== itemId);
    const oldEquip = player.eq[slot];

    let newPlayer = {
      ...player,
      inv: oldEquip ? [...newInv, { ...oldEquip, quantity: 1 }] : newInv,
      eq: { ...player.eq, [slot]: item },
    };

    // 重新計算屬性
    if (item.type === 'weapon') {
      newPlayer = {
        ...newPlayer,
        atk: 5 + (slot === 'w' ? getAtkBonus(item) : getAtkBonus(player.eq.w || { effect: {} })),
      };
    }
    if (item.type === 'armor') {
      newPlayer = {
        ...newPlayer,
        def: 2 + (slot === 'a' ? getDefBonus(item) : getDefBonus(player.eq.a || { effect: {} })),
      };
    }

    set({ player: newPlayer });
  },

  unequipItem: (slot) => {
    const { player } = get();
    const item = player.eq[slot];
    if (!item) return;

    const newPlayer = {
      ...player,
      inv: [...player.inv, { ...item, quantity: 1 }],
      eq: { ...player.eq, [slot]: null },
    };

    if (slot === 'w') {
      newPlayer.atk = 5 + getAtkBonus(player.eq.w || { effect: {} });
    } else {
      newPlayer.def = 2 + getDefBonus(player.eq.a || { effect: {} });
    }

    set({ player: newPlayer });
  },

  nextFloor: () => {
    const { player, floor } = get();
    const nextFloor = floor + 1;
    const newMap = generateDungeon();
    const shopAvailable = nextFloor % 3 === 0 && nextFloor >= 3;

    let newPlayer = { ...player, x: newMap.px, y: newMap.py };

    // 每5層Boss
    const bossFloor = nextFloor % 5 === 0 && nextFloor <= 15;

    // 只有商店樓層才刷新庫存
    const newItems = shopAvailable
      ? BASE_ITEMS.slice(0, 3 + Math.floor(nextFloor / 3)).map(i => ({ ...i, quantity: 1 }))
      : get().items;

    const floorEnemies = spawnEnemiesForFloor(nextFloor);

    set({
      floor: nextFloor,
      map: newMap,
      player: newPlayer,
      enemies: floorEnemies,
      items: newItems,
      shopAvailable,
      boss: bossFloor ? floorEnemies[0] || null : null,
      currentEnemy: null,
      diceValue: null,
      movePoints: 0,
      hasRolledThisTurn: false,
    });

    // 存檔
    get().saveGame();
  },

checkGameOver: () => {
    const { player, tutorialDone } = get();
    if (player.hp <= 0) {
      // 教學模式保護：玩家歸零時自動復活半血，不觸發 Game Over
      if (!tutorialDone) {
        set({
          player: {
            ...player,
            hp: Math.floor(player.maxHp / 2),
          },
          over: false,
        });
        return;
      }
      set({ over: true });
    }
  },

  // --- UI State Setters ---
  setActiveTab: (tab) => set({ activeTab: tab }),
  openShop: () => set({ showShop: true }),
  closeShop: () => set({ showShop: false }),
  openInventory: () => set({ showInventory: true }),
  closeInventory: () => set({ showInventory: false }),

  saveGame: async () => {
    const { player, floor, enemies, items, map, boss } = get();
    try {
      await AsyncStorage.setItem('dungeonD3_save', JSON.stringify({
        player, floor, enemies, items, map, boss,
        version: '1.0.0',
        timestamp: Date.now(),
      }));
    } catch {}
  },
}));
