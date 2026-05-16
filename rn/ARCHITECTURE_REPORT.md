# DungeonD3 架構規劃報告

> 生成日期：2026-05-14
> 分析範圍：全專案原始碼（gameStore.ts, 5 Screens, 2 Components, types.ts, audio.ts, App.tsx）
> 總行數：~2,260 行（含 styles）

---

## 1. 現行架構總覽

### 1.1 目錄結構

```
rn/
├── App.tsx                    # 主入口 + Tab Navigation + GameOverOverlay（241行）
├── index.ts                   # Expo 註冊入口
├── types.ts                   # 全部 TypeScript 類型定義（126行）
├── store/
│   └── gameStore.ts           # Zustand 狀態管理 + 全部遊戲邏輯（639行）
├── screens/
│   ├── DiceScreen.tsx         # 🎲 骰子頁（241行）
│   ├── MapScreen.tsx          # 🗺️ 地圖頁（239行）
│   ├── BattleScreen.tsx       # ⚔️ 戰鬥頁（244行）
│   ├── ShopScreen.tsx         # 🛒 商店頁（190行）
│   └── InventoryScreen.tsx    # 🎒 背包頁（247行）
├── components/
│   ├── D20Dice.tsx            # D20 骰子 SVG 元件（206行）
│   └── TutorialOverlay.tsx    # 新手教學覆蓋層（232行）
└── services/
    └── audio.ts               # 音效服務（107行）
```

### 1.2 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 框架 | React Native (Expo) | SDK 54 |
| 狀態管理 | Zustand | ^5.0.13 |
| 導航 | @react-navigation/bottom-tabs | ^7.15.11 |
| 圖形 | react-native-svg | ^15.15.4 |
| 存檔 | @react-native-async-storage/async-storage | 2.2.0 |
| 音效 | expo-av | ^16.0.8 |
| 語言 | TypeScript | ~5.9.2 |

### 1.3 資料流架構

```
使用者互動 (Screens)
    ↓ 呼叫 store action
Zustand Store (gameStore.ts) — 單一 Store，內含全部遊戲邏輯
    ↓ set() 更新狀態
React 重新渲染 (Screens/Components)
    ↓
AsyncStorage (存檔)
```

**單一 Store 模式（Monolithic Store）** — 所有遊戲狀態與商業邏輯集中在 `gameStore.ts` 一檔 639 行中。

---

## 2. 核心系統分析

### 2.1 狀態管理（Zustand Store Interface）

```
GameStore (extends GameState)
├── 骰子系統    : rollDice, diceValue, isRolling, movePoints, hasRolledThisTurn
├── 教學系統    : tutorialStep, tutorialDone, completeTutorialStep
├── 初始化/存檔 : initGame, loadGame, saveGame
├── 移動系統    : movePlayer, useMovePoint
├── 戰鬥系統    : currentEnemy, encounterEnemy, attack, skipEnemy
├── 道具系統    : useItem, equipItem, unequipItem
├── 商店系統    : buyItem, shopAvailable
├── 樓層系統    : nextFloor, floor
└── 結算系統    : checkGameOver, over, win
```

### 2.2 類型系統（types.ts）

| 類型 | 用途 | 重要欄位 |
|------|------|----------|
| `Player` | 玩家狀態 | x, y, hp, maxHp, atk, def, gold, xp, xpN, lvl, inv[], eq{w,a}, done[] |
| `Enemy` | 敵人狀態 | id, name, icon, floor, hp, damage, def, xp_reward, rarity, currentHp |
| `Item` | 道具定義 | id, name, icon, type, rarity, effect{}, cost |
| `InventoryItem` | 背包物品 (extends Item) | + quantity |
| `EquipItem` | 裝備物品 (extends Item) | + atkBonus?, defBonus? |
| `DungeonMap` | 地圖 | cells[][], px, py, sx, sy, rooms[] |
| `GameState` | 遊戲全域狀態 | player, enemies, items, map, floor, over, win, boss |
| `Boss` | Boss 定義（**未被使用**） | id, name, icon, hp, damage, def, xp_reward, floor, abilities[] |

> **問題**：`Boss` 類型定義了但從未被 `gameStore.ts` 使用 — 遊戲中 Boss 直接用 `Enemy` 類型處理。`FloorConfig` 與 `Upgrade` 類型也未被使用。

### 2.3 核心循環流程

```
[App initGame()] → [generateDungeon()] → [rollDice()] → [movePlayer()]
    → [cell === 'stairs' ? nextFloor()] OR [encounterEnemy() → attack()]
    → [checkGameOver/win] → [saveGame()]
```

---

## 3. Bug 深度分析與修復規劃

### 3.1 Bug 清單與根因

| ID | 等級 | 位置 | 症狀 | 根因 |
|:--:|:----:|:----:|------|------|
| B1 | **P0** | gameStore.ts:460 | 勝利條件永不觸發 | `floor > 15` 在 `attack()` 中檢查，但遊戲最大樓層為 15，`floor` 無法大於 15 |
| B2 | **P0** | gameStore.ts:129 | 樓層 10/15 無 Boss | `BASE_ENEMIES` 只定義了 `floor1_boss`，缺少 `10_boss` 和 `15_boss` |
| B3 | **P0** | gameStore.ts:586-588 | 卸載裝備後屬性計算錯誤 | `getDefBonus`/`getAtkBonus` 調用互換，武器卸載加了護甲 DEF，護甲卸載加了武器 ATK |
| B4 | **P1** | gameStore.ts:479-517 | 使用道具不消耗行動點 | `useItem()` 未檢查/消耗 `movePoints` |
| B5 | **P1** | gameStore.ts:610 | 商店刷新邏輯與樓層不同步 | `nextFloor()` 每次換層都刷新商店物品，但商店只在 3/6/9/12/15 層可進入 |
| B6 | **P1** | gameStore.ts:460 | `boss` 引用多餘 | Win 條件中 `!get().boss` 檢查無實際作用；`boss` state 僅在 `nextFloor` 設置但未在其他邏輯中使用 |

### 3.2 Bug 修復順序

```
Phase 1 — 不可出貨級 (P0)
  ├── B1: 勝利條件修復
  ├── B2: 補上 Boss 定義
  └── B3: 屬性計算修正

Phase 2 — 遊戲體驗 (P1)
  ├── B4: useItem 消耗行動點
  ├── B5: 商店刷新邏輯修正
  └── B6: 清理多餘 boss 引用

Phase 3 — 架構清理
  └── 移除未使用的類型 (Boss, FloorConfig, Upgrade)
```

#### B1 修復方案 — 勝利條件

```typescript
// 方案A（建議）：在 nextFloor 中檢查
nextFloor: () => {
  const nextFloor = floor + 1;
  if (nextFloor > 15) {
    set({ win: true, floor: 15 });
    return;
  }
  // ... 原有邏輯
}

// 方案B：在 attack 中修正判斷
// 改為：擊敗 floor 15 的 Boss 時觸發勝利
const win = currentEnemy?.id === '15_boss' && newEnemyHp <= 0;
```

#### B2 修復方案 — 補上 Boss 定義

```typescript
// 在 BASE_ENEMIES 中加入：
{ id: '10_boss', name: '虛空守護者', icon: '👾', floor: 10, hp: 500, damage: 40, def: 20, xp_reward: 300, rarity: 'boss' },
{ id: '15_boss', name: '深淵領主', icon: '👿', floor: 15, hp: 1000, damage: 60, def: 30, xp_reward: 500, rarity: 'boss' },
```

#### B3 修復方案 — 屬性計算修正

```typescript
// unequipItem 正確認：
if (slot === 'w') {
  // 卸載武器：ATK 恢復基礎值（護甲不影響 ATK）
  newPlayer.atk = 5;
} else {
  // 卸載護甲：DEF 恢復基礎值（武器不影響 DEF）
  newPlayer.def = 2;
}
```

#### B4 修復方案 — useItem 消耗行動點

```typescript
useItem: (itemId) => {
  const { player, currentEnemy, enemies, movePoints } = get();
  if (movePoints < 2) return; // 行動點不足
  // ... 原有邏輯 ...
  // 消耗行動點
  set({ movePoints: movePoints - 2 });
  // 若行動點歸零，重置回合
  if (movePoints - 2 === 0) {
    set({ hasRolledThisTurn: false, diceValue: null });
  }
}
```

#### B5 修復方案 — 商店刷新

```typescript
// 僅在 shopAvailable 時刷新商店物品
nextFloor: () => {
  // ...
  set({
    // ...
    items: shopAvailable 
      ? BASE_ITEMS.slice(0, 3 + Math.floor(nextFloor / 3)).map(i => ({ ...i, quantity: 1 }))
      : [], // 非商店樓層清空商店
    // ...
  });
}
```

#### B6 修復方案 — 清理 boss 引用

- 移除 `GameState.boss` 欄位
- 移除 `nextFloor()` 中設置 boss 的邏輯
- 簡化 `attack()` 中 win 條件

---

## 4. 架構改善建議

### 4.1 短期改善（可立即執行）

#### S1: 將 Store 拆分為模組（Modular Store）

**現狀**：單一檔案 639 行，包含地城生成、戰鬥、道具、商店、存檔等不相關邏輯。

**建議**：
```
store/
├── gameStore.ts          # 組合層（Composition Root）
├── dungeonGen.ts         # 地城生成邏輯（extract from gameStore.ts）
├── combat.ts             # 戰鬥系統（resolveAttack, attack）
├── inventory.ts          # 道具/裝備系統（useItem, equipItem, unequipItem）
├── shop.ts               # 商店系統（buyItem, refreshShop）
└── save.ts               # 存檔/讀檔系統
```

**理由**：
- 地城生成 (`generateDungeon`, `hcor`, `vcor`, `rnd`) 是純函數，完全獨立
- 戰鬥系統 (`resolveAttack`, `attack`) 有明確邊界
- 裝備計算 (`getAtkBonus`, `getDefBonus`, `equipItem`, `unequipItem`) 自成體系
- 存檔邏輯可獨立測試

#### S2: 建立 TypeScript 路徑別名

**現狀**：`../types`，`../services/audio` 等相對路徑。

**建議**：在 `tsconfig.json` 中加入：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@store/*": ["./store/*"],
      "@screens/*": ["./screens/*"],
      "@components/*": ["./components/*"],
      "@services/*": ["./services/*"]
    }
  }
}
```

#### S3: 統一 Style 管理

**現狀**：每個 Screen/Component 各自定義 `StyleSheet.create`，色票分散在各檔案中（`#0a0a14` 出現 7 次、`#12122a` 出現 12 次）。

**建議**：
```
styles/
└── theme.ts              # 統一色票、字型、間距常數
```

### 4.2 中期改善（Phase 2-3）

#### S4: 資料與邏輯分離

**現狀**：`BASE_ENEMIES` 和 `BASE_ITEMS` 內聯在 `gameStore.ts` 中。

**建議**：
```
data/
├── enemies.ts      # BASE_ENEMIES 定義
├── items.ts        # BASE_ITEMS 定義
└── floors.ts       # 樓層配置
```

#### S5: 敵人物件模型（Enemy Model）強化

**現狀**：敵人的 `x, y` 座標未儲存（`MapScreen.tsx:57` 嘗試 `enemyOnTile` 但 `Enemy` 類型無座標）。地圖上的敵人可視覺化但無法找到對應位置。

**建議**：在 `Enemy` 類型中加入 `x` 和 `y` 座標欄位，並在生成時分配位置。

#### S6: 戰鬥日誌移入 Store

**現狀**：`BattleScreen.tsx` 中使用 `useState` 管理 `battleLog`，重整後會遺失。

**建議**：將 `battleLog: string[]` 加入 Store，確保跨頁面重整後日誌保留。

### 4.3 長期改善（Phase 4+）

#### S7: 事件系統（Event Bus）

**現狀**：所有邏輯直接呼叫 `set()` 更新狀態，難以追蹤。

**建議**：引入事件系統：
```
// 例如：
emit('enemy_killed', { enemy: currentEnemy, xp: xpGain });
// 可讓音效、存檔、UI 更新等獨立監聽
```

#### S8: 單元測試框架

**現狀**：`package.json` 無測試腳本。地城生成、戰鬥結算、裝備計算等純函數非常適合單元測試。

**建議**：引入 Jest 或 Vitest，至少為以下純函數撰寫測試：
- `resolveAttack()`
- `calcMovePoints()`
- `getAtkBonus()`, `getDefBonus()`
- `generateDungeon()`
- `spawnEnemiesForFloor()`

---

## 5. 新功能開發順序

### Phase 1 — Bug 修復 + 核心完善（1-2 天）

```
優先級 P0 → P1
├── B1: 勝利條件（GameCore Bug，影響通關體驗）
├── B2: 補 Boss（內容缺失，Boss 層無 Boss）
├── B3: 屬性計算（直接影響戰鬥數值）
├── B4: useItem 消耗行動點（機制不合理）
├── B5: 商店刷新（邏輯不一致）
├── B6: 清理 boss 引用（程式碼衛生）
└── S1: Store 拆分 dungeonGen.ts（地城生成純函數）
```

### Phase 2 — 新功能 MVP（3-5 天）

```
功能開發（按依賴關係排序）
├── 1. 敵人物件座標系統（S5）
│   └── 依賴：Enemy 類型擴充
├── 2. 戰利品掉落系統
│   ├── 擊敗敵人隨機掉落道具
│   └── 地圖上顯示可拾取物品
├── 3. Buff/Debuff 持續回合系統
│   ├── 力量藥劑效果計時器
│   └── UI 顯示剩餘回合
├── 4. 商店刷新機制完善（含 B5 修復）
│   ├── 每次進入商店時刷新
│   └── 根據樓層增加稀有度權重
└── 5. 戰鬥日誌持久化（S6）
```

### Phase 3 — 體驗提升（5-7 天）

```
├── 6. 角色升級技能選擇
│   ├── 升級時可選擇被動技能
│   └── 對應 Upgrade 類型實作
├── 7. 更多道具種類
│   ├── 戒指、項鍊等飾品
│   └── 特殊效果道具
├── 8. 裝備稀有度詞綴系統
│   ├── 隨機附加屬性
│   └── 傳奇裝備特殊效果
├── 9. 戰鬥動畫效果
│   ├── 攻擊/暴擊/Miss 視覺特效
│   └── 粒子系統實作
└── 10. 樓層氛圍視覺差異化
    ├── 根據樓層區間改變色調
    └── 迷霧/虛空效果
```

### Phase 4 — 完善與發布（3-5 天）

```
├── 11. 音效系統完善（更換為真實音檔）
├── 12. 遊戲設定（音效開關、重置進度）
├── 13. 成就系統
├── 14. 單元測試（S8）
├── 15. 效能優化（React.memo, useMemo 審查）
└── 16. 部署至 Vercel/App Store
```

---

## 6. 相依性圖

```
App.tsx
├── screens/DiceScreen.tsx
│   ├── components/D20Dice.tsx
│   └── store/gameStore.ts
├── screens/MapScreen.tsx
│   └── store/gameStore.ts
├── screens/BattleScreen.tsx
│   └── store/gameStore.ts
├── screens/ShopScreen.tsx
│   └── store/gameStore.ts
├── screens/InventoryScreen.tsx
│   └── store/gameStore.ts
├── components/TutorialOverlay.tsx
│   └── store/gameStore.ts
└── services/audio.ts

store/gameStore.ts
├── types.ts          （類型定義）
└── services/audio.ts （音效觸發）
```

**關鍵發現**：
- `App.tsx` 直接依賴所有 Screens 和 Components — 耦合度高
- `store/gameStore.ts` 是唯一的核心依賴 — 單點故障風險
- `types.ts` 中的 `Boss`、`FloorConfig`、`Upgrade` 類型 **未被使用**
- `audio.ts` 的 `playTone` 為 no-op（`expo-av` 不支援直接合成音色），音效實際上不會播放

---

## 7. 程式碼品質評估

### 7.1 優點

| 項目 | 說明 |
|------|------|
| 一致性 | 所有 Screen 使用相同狀態列樣式 (floor/HP/gold) |
| 命名清晰 | 函數/變數命名有意義（`calcMovePoints`, `spawnEnemiesForFloor`） |
| 類型安全 | 完整 TypeScript 類型定義 |
| 份量適中 | 最大檔案 639 行，Screen 皆在 250 行以下 |
| 單一職責（部分） | Screens 僅負責 UI 呈現，邏輯在 Store |

### 7.2 需改善的 Anti-patterns

| 問題 | 位置 | 建議 |
|------|------|------|
| Store 中內聯 UI 常數 | `TUTORIAL_STEPS` 存在 `gameStore.ts` | 移至 `components/tutorialData.ts` |
| Promise 未處理 | `saveGame()` 在 `attack()` 中 fire-and-forget | 加入 error boundary 或 toast |
| Stale closure 風險 | `attack()` 中 `currentEnemy` closure | 已部分修復（`enemyName` capture），但 `currentEnemy.currentHp` 在 `set` 前仍可能是舊值 |
| 無加載狀態 | `loadGame` 無 loading spinner | 加入 loading state |
| 地圖座標硬編碼 | W=30, H=20 散落各處 | 提取為常數 |
| Audio 虛設 | `playTone` 是 no-op | 更換為真實音檔或移除 |

---

## 8. 總結

### 立即行動事項（24 小時內）

1. **修復 3 個 P0 Bug**（勝利條件、Boss 定義、屬性計算）
2. **補上樓層 10/15 Boss 定義**
3. **修復 unequipItem 屬性計算**

### 本週行動事項

1. **Store 模組化拆分**（地城生成獨立）
2. **建立 theme.ts 統一色票**
3. **修復 P1 Bug**（useItem 行動點、商店刷新）

### 架構健康度評分

| 維度 | 評分 | 備註 |
|------|:----:|------|
| 可維護性 | ⭐⭐⭐✩✩ | 單一 Store 639 行，拆分後可提升 |
| 可測試性 | ⭐⭐✩✩✩ | 純函數可分離但無測試 |
| 可擴展性 | ⭐⭐⭐✩✩ | 新功能可加在 Store 中，但會日益膨脹 |
| 程式碼品質 | ⭐⭐⭐⭐✩ | 命名一致、類型安全、結構清晰 |
| Bug 密度 | ⭐⭐✩✩✩ | 6 個已知 Bug，含 3 個 P0 |

---

*報告完畢 — 由 🏛️ 架構規劃師自動產出*