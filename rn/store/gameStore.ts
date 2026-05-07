// ============================================================
// DungeonD3 — 遊戲狀態 Store v2
// 遵循 SPEC.md 設計
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, Player, Enemy, Item, DungeonMap } from '../types';

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
  '1-3': 1.0, '4-6': 1.3, '7-9': 1.6, '10-14': 2.0, '15': 3.0,
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
  { id: 'floor1_boss', name: '深淵領主', icon: '👿', floor: 5, hp: 300, damage: 25, def: 10, xp_reward: 150, rarity: 'boss' },
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
  { id: 'fire_scroll', name: '火球卷軸', icon: '📜', type: 'consumable', rarity: 'uncommon', effect: { damage: 35 }, cost: 35 },
  { id: 'strength_buff', name: '力量藥劑', icon: '💪', type: 'consumable', rarity: 'rare', effect: { atk_buff: 5, duration: 3 }, cost: 50 },
  { id: 'iron_sword', name: '鐵劍', icon: '⚔️', type: 'weapon', rarity: 'common', effect: { atk: 5 }, cost: 50 },
  { id: 'steel_sword', name: '鋼鐵劍', icon: '🗡️', type: 'weapon', rarity: 'uncommon', effect: { atk: 10 }, cost: 100 },
  { id: 'leather_armor', name: '皮甲', icon: '🥋', type: 'armor', rarity: 'common', effect: { def: 3 }, cost: 40 },
  { id: 'chainmail', name: '鎖子甲', icon: '🛡️', type: 'armor', rarity: 'uncommon', effect: { def: 7 }, cost: 90 },
  { id: 'phoenix_feather', name: '鳳凰羽毛', icon: '🪶', type: 'consumable', rarity: 'legendary', effect: { revive: true }, cost: 200 },
];

// ============================================================
// Tutorial Steps
// ============================================================
export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: '歡迎來到地城！',
    content: '我是你的嚮導 🧙‍♂️\n跟著我一步步學習，成為真正的冒險者！',
    action: null,
  },
  {
    id: 'dice_intro',
    title: '🎲 認識 D20 骰子',
    content: 'D20 骰子是命運的象徵！\n\n每次擲骰，你會獲得「行動點數」用來移動。\n骰值越高，行動點數越多！\n\n• 1-3 點 → 1 行動點\n• 4-6 點 → 2 行動點\n• 7-9 點 → 3 行動點\n• 10-12 點 → 4 行動點\n• ...以此類推',
    action: 'ROLL_DICE',
  },
  {
    id: 'map_intro',
    title: '🗺️ 認識地圖',
    content: '地圖顯示整個地城的結構！\n\n🧙 = 你\n🚪 = 樓梯（通往下一層）\n▓ = 牆壁（不能走）\n· = 地板（可以走）\n\n用方向鍵移動，每走一步消耗 1 行動點。\n行動點用完後，你會自動結束回合。',
    action: 'MOVE_PLAYER',
  },
  {
    id: 'battle_intro',
    title: '⚔️ 戰鬥教學',
    content: '遭遇敵人了！\n\n戰鬥使用 D20 系統：\n• D20 = 1 → Miss（攻擊失敗）\n• D20 + ATK > 敵人DEF → 命中！\n• D20 = 20 → 暴擊！2倍傷害！\n\n按「攻擊」按鈕開始戰鬥！',
    action: 'ATTACK_ENEMY',
  },
  {
    id: 'done',
    title: '準備出發！',
    content: '恭喜完成新手教學！\n\n🏆 目標：通過 15 層地城\n👿 每 5 層會遇到 Boss\n💰 收集金幣購買道具\n\n記得使用背包裡的道具強化自己！',
    action: null,
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
  currentEnemy: null,
  shopAvailable: false,

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
    const nextStep = tutorialStep + 1;
    if (nextStep >= TUTORIAL_STEPS.length) {
      set({ tutorialStep: TUTORIAL_STEPS.length - 1, tutorialDone: true });
    } else {
      set({ tutorialStep: nextStep });
    }
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
      movePoints: 0,
      hasRolledThisTurn: false,
      tutorialStep: 0,
      tutorialDone: false,
      currentEnemy: null,
      shopAvailable: false,
    });
  },

  loadGame: async () => {
    try {
      const data = await AsyncStorage.getItem('dungeonD3_save');
      if (data) {
        const saved = JSON.parse(data);
        set({ ...saved, isRolling: false, currentEnemy: null });
        return true;
      }
      return false;
    } catch {
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

    set({ player: newPlayer });
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
      newPlayer = {
        ...newPlayer,
        lvl: newPlayer.lvl + 1,
        xp: newPlayer.xp - newPlayer.xpN,
        xpN: Math.floor(newPlayer.xpN * 1.5),
        maxHp: newPlayer.maxHp + 10,
        atk: newPlayer.atk + 2,
        hp: Math.min(newPlayer.maxHp + 10, newPlayerHp),
      };
    }

    const newEnemies = get().enemies.map(e =>
      e.id === currentEnemy.id ? { ...e, currentHp: Math.max(0, newEnemyHp) } : e
    ).filter(e => e.currentHp > 0);

    const over = newPlayerHp <= 0;
    const win = get().floor >= 15 && newEnemies.length === 0 && !get().boss;

    set({
      player: newPlayer,
      enemies: newEnemies,
      currentEnemy: newEnemyHp > 0 ? { ...currentEnemy, currentHp: newEnemyHp } : null,
      over,
      win,
    });

    return { result, playerHit };
  },

  skipEnemy: () => {
    const { enemies } = get();
    set({ currentEnemy: null });
  },

  useItem: (itemId) => {
    const { player } = get();
    const item = player.inv.find(i => i.id === itemId);
    if (!item) return;

    let newPlayer = { ...player };
    const healVal = item.effect.heal;
    if (typeof healVal === 'number') {
      newPlayer = { ...newPlayer, hp: Math.min(newPlayer.maxHp, newPlayer.hp + healVal) };
    }
    const atkBuffVal = item.effect.atk_buff;
    if (typeof atkBuffVal === 'number') {
      newPlayer = { ...newPlayer, atk: newPlayer.atk + atkBuffVal };
    }
    if (item.effect.damage) {
      // 炸彈之類直接造成傷害（需要目標）
    }

    const newInv = player.inv
      .map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    newPlayer = { ...newPlayer, inv: newInv };

    set({ player: newPlayer });
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
      newPlayer.atk = 5 + getDefBonus(player.eq.a || { effect: {} });
    } else {
      newPlayer.def = 2 + getAtkBonus(player.eq.w || { effect: {} });
    }

    set({ player: newPlayer });
  },

  nextFloor: () => {
    const { player, floor } = get();
    const nextFloor = floor + 1;
    const newMap = generateDungeon();
    const shopAvailable = nextFloor % 3 === 0;

    let newPlayer = { ...player, x: newMap.px, y: newMap.py };

    // 每5層Boss
    const bossFloor = nextFloor % 5 === 0 && nextFloor <= 15;

    set({
      floor: nextFloor,
      map: newMap,
      player: newPlayer,
      enemies: bossFloor ? spawnEnemiesForFloor(nextFloor) : spawnEnemiesForFloor(nextFloor),
      items: BASE_ITEMS.slice(0, 3 + Math.floor(nextFloor / 3)).map(i => ({ ...i, quantity: 1 })),
      shopAvailable,
      boss: bossFloor ? spawnEnemiesForFloor(nextFloor)[0] || null : null,
      currentEnemy: null,
      diceValue: null,
      movePoints: 0,
    });

    // 存檔
    get().saveGame();
  },

  checkGameOver: () => {
    const { player } = get();
    if (player.hp <= 0) {
      set({ over: true });
    }
  },

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
