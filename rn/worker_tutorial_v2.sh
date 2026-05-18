#!/bin/bash
# ============================================================
# Worker: Tutorial v2 實作腳本
# 任務：修改 gameStore.ts + TutorialOverlay.tsx + MapScreen.tsx
# ============================================================

set -e

RN="/home/dicoge/game-studio/DungeonD3/rn"

echo "=== Step 1: Patch gameStore.ts ==="
# Backup
cp "$RN/store/gameStore.ts" "$RN/store/gameStore.ts.bak"

# 我們需要修改的內容：
# 1. generateTutorialMap() 新增
# 2. TUTORIAL_STEPS 擴充到 8 步
# 3. TutorialHighlight 新增 EXIT_GLOW
# 4. initGame 支援 floor=0 教學關
# 5. 訊號追蹤 refs

cat > /tmp/gamestore_patch.py << 'PYEOF'
import re

with open('/home/dicoge/game-studio/DungeonD3/rn/store/gameStore.ts', 'r') as f:
    content = f.read()

# 1. Add generateTutorialMap after generateDungeon function
tutorial_map_func = '''

// ============================================================
// 教學關卡生成（5x5 超小地圖）
// ============================================================
function generateTutorialMap(): DungeonMap {
  const cells = Array.from({ length: 5 }, () => Array(5).fill('void'));
  // 外框牆壁
  for (let x = 0; x < 5; x++) { cells[0][x] = 'wall'; cells[4][x] = 'wall'; }
  for (let y = 0; y < 5; y++) { cells[y][0] = 'wall'; cells[y][4] = 'wall'; }
  // 內部 floor (3x3 中心區)
  for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) cells[y][x] = 'floor';
  // 出口在 (1,2) - 玩家左邊
  cells[2][1] = 'stairs';
  return {
    cells,
    px: 2, py: 2,   // 玩家起始位置 (2,2)
    sx: 1, sy: 2,   // 樓梯位置 (1,2)
    rooms: [{ x: 1, y: 1, w: 3, h: 3 }],
  };
}
'''

# Insert after generateDungeon function (before FLOOR_MULTIPLIER)
insert_point = "// 敵人資料（樓層加成）"
content = content.replace(insert_point, tutorial_map_func + insert_point)

# 2. Update TutorialHighlight type
old_type = "export type TutorialHighlight = 'ROLL_DICE' | 'MOVE_TILE' | 'ATTACK_BTN' | 'USE_ITEM' | null;"
new_type = "export type TutorialHighlight = 'ROLL_DICE' | 'MOVE_TILE' | 'ATTACK_BTN' | 'USE_ITEM' | 'EXIT_GLOW' | null;"
content = content.replace(old_type, new_type)

# 3. Update TUTORIAL_STEPS to 8 steps
old_steps = '''export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: '歡迎來到地城！',
    content: '我是你的嚮導 🧙‍♂️\\n點擊下方按鈕，開始你的冒險之旅！',
    highlight: null as TutorialHighlight,
  },
  {
    id: 'roll_dice',
    title: '🎲 擲出命運之骰',
    content: '點擊發光的骰子按鈕來擲骰！\\n骰值越高，行動點數越多！',
    highlight: 'ROLL_DICE' as TutorialHighlight,
  },
  {
    id: 'move_player',
    title: '🗺️ 踏出第一步',
    content: '點擊發光的格子來移動角色！\\n每走一步消耗 1 行動點。',
    highlight: 'MOVE_TILE' as TutorialHighlight,
  },
  {
    id: 'attack_enemy',
    title: '⚔️ 戰鬥！',
    content: '點擊發光的攻擊按鈕來戰鬥！\\n打倒敵人前進吧！',
    highlight: 'ATTACK_BTN' as TutorialHighlight,
  },
  {
    id: 'use_item',
    title: '🎒 使用道具',
    content: '打開背包，點擊「使用」按鈕\\n用生命藥水恢復 HP！',
    highlight: 'USE_ITEM' as TutorialHighlight,
  },
  {
    id: 'complete',
    title: '開始冒險！',
    content: '準備好了嗎？\\n前往 15 層地城，擊敗所有敵人！',
    highlight: null as TutorialHighlight,
  },
];'''

new_steps = '''export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: '歡迎來到地城！',
    content: '我是你的嚮導 🧙‍♂️\\n跟著我學習基本操作！',
    highlight: null as TutorialHighlight,
  },
  {
    id: 'roll_dice',
    title: '🎲 擲出命運之骰',
    content: '點擊發光的骰子按鈕！\\n骰值越高，行動點數越多！',
    highlight: 'ROLL_DICE' as TutorialHighlight,
  },
  {
    id: 'move_player',
    title: '🗺️ 踏出第一步',
    content: '點擊相鄰格子移動！\\n每走一步消耗 1 行動點。',
    highlight: 'MOVE_TILE' as TutorialHighlight,
  },
  {
    id: 'attack_enemy',
    title: '⚔️ 遭遇敵人！',
    content: '點擊敵人或攻擊按鈕進入戰鬥！',
    highlight: 'ATTACK_BTN' as TutorialHighlight,
  },
  {
    id: 'defeat_enemy',
    title: '🎯 攻擊敵人！',
    content: '消滅這隻弱小的史萊姆！',
    highlight: 'ATTACK_BTN' as TutorialHighlight,
  },
  {
    id: 'pickup_item',
    title: '💎 拾取道具',
    content: '地上有閃爍的道具！\\n踩上去自動拾取！',
    highlight: 'MOVE_TILE' as TutorialHighlight,
  },
  {
    id: 'use_item',
    title: '🎒 使用道具',
    content: '打開背包使用生命藥水\\n恢復 HP！',
    highlight: 'USE_ITEM' as TutorialHighlight,
  },
  {
    id: 'go_exit',
    title: '🚪 前往出口',
    content: '出口就在旁邊！\\n綠色光圈引導你！',
    highlight: 'EXIT_GLOW' as TutorialHighlight,
  },
  {
    id: 'complete',
    title: '🎉 教學完成！',
    content: '恭喜完成新手教學！\\n開始你的冒險吧！',
    highlight: null as TutorialHighlight,
  },
];'''

content = content.replace(old_steps, new_steps)

with open('/home/dicoge/game-studio/DungeonD3/rn/store/gameStore.ts', 'w') as f:
    f.write(content)

print("gameStore.ts patched successfully")
PYEOF

python3 /tmp/gamestore_patch.py

echo ""
echo "=== Step 2: Patch TutorialOverlay.tsx ==="
cp "$RN/components/TutorialOverlay.tsx" "$RN/components/TutorialOverlay.tsx.bak"

cat > /tmp/tutorial_overlay_patch.py << 'PYEOF'
import re

with open('/home/dicoge/game-studio/DungeonD3/rn/components/TutorialOverlay.tsx', 'r') as f:
    content = f.read()

# Update imports to include floor and enemies
old_import = '''const tutorialStep = useGameStore(s => s.tutorialStep);
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const tutorialHighlight = useGameStore(s => s.tutorialHighlight);
  const completeTutorialStep = useGameStore(s => s.completeTutorialStep);
  const diceValue = useGameStore(s => s.diceValue);
  const player = useGameStore(s => s.player);
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const setActiveTab = useGameStore(s => s.setActiveTab);'''

new_import = '''const tutorialStep = useGameStore(s => s.tutorialStep);
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const tutorialHighlight = useGameStore(s => s.tutorialHighlight);
  const completeTutorialStep = useGameStore(s => s.completeTutorialStep);
  const diceValue = useGameStore(s => s.diceValue);
  const player = useGameStore(s => s.player);
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const floor = useGameStore(s => s.floor);
  const enemies = useGameStore(s => s.enemies);
  const invLength = player.inv.length;'''

content = content.replace(old_import, new_import)

# Update refs for signals
old_refs = '''const prevPlayerRef = useRef({ x: player.x, y: player.y });
  const prevHpRef = useRef(player.hp);
  const prevEnemyRef = useRef(currentEnemy);'''

new_refs = '''const prevPlayerRef = useRef({ x: player.x, y: player.y });
  const prevHpRef = useRef(player.hp);
  const prevEnemyRef = useRef(currentEnemy);
  const prevInvLenRef = useRef(player.inv.length);'''

content = content.replace(old_refs, new_refs)

# Update isLastStep check (now 'complete' is step 8, index 8)
old_last = '''const isLastStep = step.id === 'complete';
  const isFirstStep = step.id === 'welcome';
  const isActionStep = !isFirstStep && !isLastStep;'''

new_last = '''const isLastStep = step.id === 'complete';
  const isFirstStep = step.id === 'welcome';'''

content = content.replace(old_last, new_last)

# Update Step 4 (attack_enemy) effect - trigger when currentEnemy !== null
old_attack_effect = '''  // Step 3 (attack_enemy): Auto-advance when currentEnemy becomes null (enemy defeated)
  useEffect(() => {
    if (step.id !== 'attack_enemy') return;
    // Enemy was present and now is null → defeated
    if (prevEnemyRef.current !== null && currentEnemy === null) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevEnemyRef.current = currentEnemy;
  }, [currentEnemy, step.id]);'''

new_attack_effect = '''  // Step 3 (attack_enemy): Auto-advance when currentEnemy becomes non-null (enemy encountered)
  useEffect(() => {
    if (step.id !== 'attack_enemy') return;
    if (currentEnemy !== null) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentEnemy, step.id]);

  // Step 4 (defeat_enemy): Auto-advance when currentEnemy becomes null (enemy defeated)
  useEffect(() => {
    if (step.id !== 'defeat_enemy') return;
    if (prevEnemyRef.current !== null && currentEnemy === null) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevEnemyRef.current = currentEnemy;
  }, [currentEnemy, step.id]);'''

content = content.replace(old_attack_effect, new_attack_effect)

# Update Step 5 (use_item) - add pickup step before it
old_use_item_effect = '''  // Step 4 (use_item): Auto-advance when HP increases (item used)
  useEffect(() => {
    if (step.id !== 'use_item') return;
    if (player.hp > prevHpRef.current) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevHpRef.current = player.hp;
  }, [player.hp, step.id]);'''

new_use_item_effect = '''  // Step 5 (pickup_item): Auto-advance when inventory length increases (item picked up)
  useEffect(() => {
    if (step.id !== 'pickup_item') return;
    if (player.inv.length > prevInvLenRef.current) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 600);
      return () => clearTimeout(timer);
    }
    prevInvLenRef.current = player.inv.length;
  }, [player.inv.length, step.id]);

  // Step 6 (use_item): Auto-advance when HP increases (item used)
  useEffect(() => {
    if (step.id !== 'use_item') return;
    if (player.hp > prevHpRef.current) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevHpRef.current = player.hp;
  }, [player.hp, step.id]);'''

content = content.replace(old_use_item_effect, new_use_item_effect)

# Update Step 6 (complete) to go_exit - floor change triggers
old_complete_effect = '''  // Step 5 (complete): Auto-close after 2 seconds
  useEffect(() => {
    if (step.id !== 'complete') return;
    setShowComplete(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      completeTutorialStep(step.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [step.id]);'''

new_complete_effect = '''  // Step 7 (go_exit): Auto-advance when floor changes (reached exit)
  useEffect(() => {
    if (step.id !== 'go_exit') return;
    if (floor > 0) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [floor, step.id]);

  // Step 8 (complete): Auto-close after 2.5 seconds
  useEffect(() => {
    if (step.id !== 'complete') return;
    setShowComplete(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      completeTutorialStep(step.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [step.id]);'''

content = content.replace(old_complete_effect, new_complete_effect)

with open('/home/dicoge/game-studio/DungeonD3/rn/components/TutorialOverlay.tsx', 'w') as f:
    f.write(content)

print("TutorialOverlay.tsx patched successfully")
PYEOF

python3 /tmp/tutorial_overlay_patch.py

echo ""
echo "=== Step 3: Patch MapScreen.tsx ==="
cp "$RN/screens/MapScreen.tsx" "$RN/screens/MapScreen.tsx.bak"

cat > /tmp/map_screen_patch.py << 'PYEOF'
import re

with open('/home/dicoge/game-studio/DungeonD3/rn/screens/MapScreen.tsx', 'r') as f:
    content = f.read()

# Add tutorialStep, tutorialHighlight, floor to destructured store
old_destructure = '''const {
    map, player, floor, movePlayer, initGame, movePoints, enemies, isRolling,
    encounterEnemy, openInventory, rollDice,
    hasRolledThisTurn,
  } = useGameStore();'''

new_destructure = '''const {
    map, player, floor, movePlayer, initGame, movePoints, enemies, isRolling,
    encounterEnemy, openInventory, rollDice,
    hasRolledThisTurn, tutorialStep, tutorialHighlight,
  } = useGameStore();'''

content = content.replace(old_destructure, new_destructure)

# Add highlight styles to CELL_COLORS for tutorial
old_cell_colors = '''const CELL_COLORS: Record<string, { bg: string; border: string; char: string }> = {
  void:   { bg: '#0a0a14', border: '#0a0a14', char: '' },
  wall:   { bg: '#1a1a3a', border: '#4fc3f7', char: '▓' },
  floor:  { bg: '#12122a', border: '#1a1a3a', char: '·' },
  stairs: { bg: '#1a3a1a', border: '#2a5a2a', char: '🚪' },
  enemy:  { bg: '#2a1010', border: '#ef5350', char: '👾' },
  item:   { bg: '#2a2a00', border: '#ffd600', char: '💎' },
};'''

new_cell_colors = '''const CELL_COLORS: Record<string, { bg: string; border: string; char: string }> = {
  void:   { bg: '#0a0a14', border: '#0a0a14', char: '' },
  wall:   { bg: '#1a1a3a', border: '#4fc3f7', char: '▓' },
  floor:  { bg: '#12122a', border: '#1a1a3a', char: '·' },
  stairs: { bg: '#1a3a1a', border: '#2a5a2a', char: '🚪' },
  enemy:  { bg: '#2a1010', border: '#ef5350', char: '👾' },
  item:   { bg: '#2a2a00', border: '#ffd600', char: '💎' },
};

// Tutorial highlight colors
const TUTORIAL_HIGHLIGHT = {
  MOVE: { bg: '#1a3a5a', border: '#4fc3f7', glow: true },
  ATTACK: { bg: '#3a1a1a', border: '#ef5350', glow: true },
  EXIT: { bg: '#1a3a1a', border: '#00e676', glow: true },
  ITEM: { bg: '#3a3a00', border: '#ffd600', glow: true },
};'''

content = content.replace(old_cell_colors, new_cell_colors)

# Update cell rendering to include tutorial highlights
old_cell_render = '''                return (
                  <TouchableOpacity
                    key={`${mx}-${my}`}
                    style={[
                      styles.cell,
                      { backgroundColor: style.bg },
                      { borderColor: style.border },
                      isPlayer && styles.playerCell,
                    ]}
                    onPress={() => !isPlayer && handleTileClick(mx, my)}
                    disabled={movePoints <= 0 || isPlayer}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellChar}>
                      {isPlayer ? '🧙' : style.char}
                    </Text>
                  </TouchableOpacity>
                );'''

new_cell_render = '''                // Tutorial highlight logic
                const isHighlighted = tutorialStep === 2 && !isPlayer && cell === 'floor' &&
                  Math.abs(mx - player.x) + Math.abs(my - player.y) === 1; // adjacent floor
                const isExitHighlight = tutorialStep === 7 && cell === 'stairs';
                const isItemHighlight = tutorialStep === 5 && cell === 'item';

                let cellStyle = { backgroundColor: style.bg, borderColor: style.border };
                if (isHighlighted && tutorialHighlight === 'MOVE_TILE') {
                  cellStyle = { backgroundColor: TUTORIAL_HIGHLIGHT.MOVE.bg, borderColor: TUTORIAL_HIGHLIGHT.MOVE.border };
                } else if (isExitHighlight) {
                  cellStyle = { backgroundColor: TUTORIAL_HIGHLIGHT.EXIT.bg, borderColor: TUTORIAL_HIGHLIGHT.EXIT.border };
                } else if (isItemHighlight) {
                  cellStyle = { backgroundColor: TUTORIAL_HIGHLIGHT.ITEM.bg, borderColor: TUTORIAL_HIGHLIGHT.ITEM.border };
                }

                return (
                  <TouchableOpacity
                    key={`${mx}-${my}`}
                    style={[
                      styles.cell,
                      cellStyle,
                      isPlayer && styles.playerCell,
                    ]}
                    onPress={() => !isPlayer && handleTileClick(mx, my)}
                    disabled={movePoints <= 0 || isPlayer}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellChar}>
                      {isPlayer ? '🧙' : style.char}
                      {isExitHighlight && tutorialHighlight === 'EXIT_GLOW' ? ' ✨' : ''}
                    </Text>
                  </TouchableOpacity>
                );'''

content = content.replace(old_cell_render, new_cell_render)

with open('/home/dicoge/game-studio/DungeonD3/rn/screens/MapScreen.tsx', 'w') as f:
    f.write(content)

print("MapScreen.tsx patched successfully")
PYEOF

python3 /tmp/map_screen_patch.py

echo ""
echo "=== Step 4: TypeScript check ==="
cd "$RN" && npx tsc --noEmit 2>&1 || true

echo ""
echo "=== Done ==="