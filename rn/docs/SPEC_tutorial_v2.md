# DungeonD3 — 新手教學系統規格書 v2

> 版本：2.0 | 系統：一次性完成引導式教學  
> 最後更新：2026-05-18  
> 對應程式碼：gameStore.ts, TutorialOverlay.tsx, MapScreen.tsx

---

## 1. 設計目標

讓玩家**一次喝成**完成新手教學，流程：
```
擲骰 → 移動 → 戰鬥 → 拾取道具 → 使用道具 → 走向出口
```

---

## 2. 教學關卡規格（Floor 0 / Tutorial Zone）

| 項目 | 規格 |
|------|------|
| 地圖大小 | **5x5**，超小關卡 |
| 敵人數量 | **1 隻**，HP 低（15），靠近玩家起始位置 |
| 道具數量 | **1 個**，地上發光（生命藥水 ❤️） |
| 出口位置 | 玩家起始位置**旁邊 1 格**（🚪樓梯），綠色光圈 highlight |
| 起始位置 | 地圖中心 (2, 2) |

### 地圖配置（5x5）
```
🧙 = 玩家起始（2,2）
👾 = 敵人（3,2）
❤️ = 道具（2,3）
🚪 = 出口（1,2）
```

### 地圖生成程式
```typescript
function generateTutorialMap(): DungeonMap {
  const cells = Array.from({ length: 5 }, () => Array(5).fill('void'));
  // 外框牆壁
  for (let x=0; x<5; x++) { cells[0][x]='wall'; cells[4][x]='wall'; }
  for (let y=0; y<5; y++) { cells[y][0]='wall'; cells[y][4]='wall'; }
  // 內部 floor
  for (let y=1; y<4; y++) for (let x=1; x<4; x++) cells[y][x]='floor';
  // 出口 (1,2)
  cells[2][1] = 'stairs';
  return {
    cells,
    px: 2, py: 2,   // 玩家起始
    sx: 1, sy: 2,   // 樓梯位置
    rooms: [{ x:1, y:1, w:3, h:3 }],
  };
}
```

---

## 3. 教學步驟（8 步）

| Step | ID | 標題 | 內容 | Highlight | 自動觸發條件 |
|------|-----|------|------|-----------|--------------|
| 1 | `welcome` | 歡迎來到地城！ | 🧙‍♂️ 我是你的嚮導，跟著我學習基本操作！ | null | 玩家點「開始旅程」 |
| 2 | `roll_dice` | 🎲 擲出命運之骰 | 點擊發光的骰子按鈕！骰值越高行動點越多 | `ROLL_DICE` | `diceValue !== null` |
| 3 | `move_player` | 🗺️ 踏出第一步 | 點擊相鄰格子移動！每步消耗 1 行動點 | `MOVE_TILE` | `player.x/y` 改變 |
| 4 | `attack_enemy` | ⚔️ 遭遇敵人！ | 點擊紅色敵人格或攻擊按鈕進入戰鬥！ | `ATTACK_BTN` | `currentEnemy !== null` |
| 5 | `defeat_enemy` | 🎯 攻擊敵人！ | 點擊攻擊按鈕消滅敵人！ | `ATTACK_BTN` | `currentEnemy === null`（敵人死亡） |
| 6 | `pickup_item` | 💎 拾取道具 | 地上閃爍的道具！踩上去自動拾取 | `MOVE_TILE` | `player.inv` length 增加 |
| 7 | `use_item` | 🎒 使用道具 | 打開背包，使用生命藥水恢復 HP！ | `USE_ITEM` | `player.hp` 增加 |
| 8 | `go_exit` | 🚪 前往出口 | 旁邊就是出口！綠色光圈引導你 | `EXIT_GLOW` | `floor` > 0（即離開教學關） |
| — | `complete` | 🎉 教學完成！ | 恭喜完成新手教學！開始冒險吧！ | null | 2.5 秒後自動關閉 |

---

## 4. 信號觸發系統

| 訊號 | 來源 State | 觸發的 Step |
|------|-----------|-------------|
| `diceValue !== null` | gameStore.diceValue | Step 2 → Step 3 |
| `player.x/y` 改變 | gameStore.player | Step 3 → Step 4 |
| `currentEnemy !== null` | gameStore.currentEnemy | Step 4 → Step 5 |
| `currentEnemy === null`（after being non-null） | gameStore.currentEnemy | Step 5 → Step 6 |
| `player.inv` length 增加 | gameStore.player.inv | Step 6 → Step 7 |
| `player.hp` 增加 | gameStore.player.hp | Step 7 → Step 8 |
| `floor > 0` | gameStore.floor | Step 8 → complete |

---

## 5. TutorialOverlay 被動提示設計

### 設計原則
- **不阻擋遊戲**：所有提示使用 `pointerEvents="box-none"`，玩家可以直接操作 UI
- **只做視覺引導**：提示框在底部飄浮，不覆蓋遊戲區域
- **自動進度**：玩家完成對應動作後自動跳下一步，無需點任何 skip/next

### 三種顯示模式

1. **全屏歡迎（Step 1, Step 8 complete）**：覆蓋整個畫面，中央卡片
2. **浮動提示條（Step 2-7）**：底部固定，提示卡 + 進度 dots
3. **Highlight 光圈**：針對具體 UI 元素（骰子按鈕/格子/攻擊鈕）的高亮

### Highlight 光圈樣式
```typescript
const HIGHLIGHT_STYLES = {
  ROLL_DICE: { border: '2px solid #ab47bc', boxShadow: '0 0 20px #ab47bc' },
  MOVE_TILE:  { border: '2px solid #4fc3f7', boxShadow: '0 0 20px #4fc3f7' },
  ATTACK_BTN: { border: '2px solid #ef5350', boxShadow: '0 0 20px #ef5350' },
  USE_ITEM:   { border: '2px solid #ab47bc', boxShadow: '0 0 20px #ab47bc' },
  EXIT_GLOW:  { border: '2px solid #00e676', boxShadow: '0 0 25px #00e676' },
}
```

### 出口 Highlight（綠色光圈）
- 樓梯格 `(1,2)` 在 `floor === 0`（教學關）時顯示綠色光圈 `🚪`
- 教學關的樓梯旁邊額外加一個 `👉` 箭頭指向它
- 當玩家走過去接觸樓梯，`nextFloor()` 被觸發，`floor` 變為 1
- 這時 `floor > 0` 訊號觸發 Step 8 → complete

---

## 6. 敵人設定（教學關）

```typescript
const TUTORIAL_ENEMY: Enemy = {
  id: 'tutorial_slime',
  name: '弱小的史萊姆',
  icon: '🟢',
  floor: 0,
  hp: 15,
  damage: 3,
  def: 1,
  xp_reward: 5,
  rarity: 'common',
  currentHp: 15,
  x: 3, y: 2,  // 玩家右邊 1 格
};
```

---

## 7. 道具設定（教學關）

```typescript
const TUTORIAL_ITEM: InventoryItem = {
  id: 'health_potion',
  name: '生命藥水',
  icon: '❤️',
  type: 'consumable',
  rarity: 'common',
  effect: { heal: 30 },
  cost: 15,
  quantity: 1,
};
```

---

## 8. 地圖 UI 修改

### MapScreen.tsx 教學 Highlight
- 當 `tutorialStep === 2`（roll_dice 完成後），相鄰可行格藍色光圈
- 當 `tutorialStep === 5`（攻擊完成），道具格 `(2,3)` 黃色閃爍
- 當 `tutorialStep === 7`（使用道具完成），樓梯格 `(1,2)` 綠色光圈

### D-Pad 方向鍵
- 在 `tutorialStep === 2`（move_player）時顯示方向鍵，協助移動

---

## 9. TutorialOverlay 實作要點

```typescript
// 訊號監聽（useEffect hooks）
useEffect(() => {
  if (step.id === 'roll_dice' && diceValue !== null) {
    completeTutorialStep('roll_dice');
  }
}, [diceValue]);

useEffect(() => {
  if (step.id === 'move_player') {
    const moved = player.x !== prevPos.x || player.y !== prevPos.y;
    if (moved) completeTutorialStep('move_player');
    prevPos = { x: player.x, y: player.y };
  }
}, [player.x, player.y]);

useEffect(() => {
  if (step.id === 'attack_enemy' && currentEnemy === null && prevEnemy !== null) {
    completeTutorialStep('attack_enemy');
  }
}, [currentEnemy]);

useEffect(() => {
  if (step.id === 'pickup_item' && player.inv.length > prevInvLen) {
    completeTutorialStep('pickup_item');
  }
}, [player.inv.length]);

useEffect(() => {
  if (step.id === 'use_item' && player.hp > prevHp) {
    completeTutorialStep('use_item');
  }
}, [player.hp]);

useEffect(() => {
  if (step.id === 'go_exit' && floor > 0) {
    completeTutorialStep('go_exit');
  }
}, [floor]);
```

---

## 10. gameStore.ts 修改

### 新增多個訊號追蹤
```typescript
// Tutorial step signals
prevDiceValue: number | null,
prevPlayerPos: { x: number, y: number },
prevEnemyHp: number | null,
prevInvLen: number,
prevHp: number,

// Tutorial map generation
generateTutorialMap(): DungeonMap

// Step advancement with signal tracking
advanceTutorialOnSignal(): void
```

### initGame 修改
- 當 `floor === 0` 使用 `generateTutorialMap()` 而非 `generateDungeon()`
- 敵人改為 `TUTORIAL_ENEMY`，道具改為 `TUTORIAL_ITEM`

---

## 11. 驗收標準

| 標準 | 條件 |
|------|------|
| 一次性完成 | 玩家從頭到尾只按「開始旅程」，其餘全部自動觸發 |
| 不卡關 | 每個步驟都有明確的訊號觸發 |
| 不阻擋遊戲 | TutorialOverlay 所有互動 `pointerEvents="box-none"` |
| 出口明顯 | 綠色光圈 + 箭頭，5x5 小地圖一眼看到 |
| TypeScript 0 errors | `npx tsc --noEmit` 通過 |
| Git 已推送 | `git commit -m "feat: tutorial v2"` + `git push` |

---

## 12. 檔案變更清單

| 檔案 | 變更內容 |
|------|---------|
| `docs/SPEC_tutorial_v2.md` | 新增本規格書 |
| `store/gameStore.ts` | + `generateTutorialMap()`, + 8 steps, + 信號追蹤 |
| `components/TutorialOverlay.tsx` | + Step 7/8, + EXIT_GLOW, + 訊號 hooks |
| `screens/MapScreen.tsx` | + 教學 highlight 光圈（藍/黃/綠） |
| `types.ts` | + `TutorialHighlight` 類型擴充 `EXIT_GLOW` |