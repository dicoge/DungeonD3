# DungeonD3 RN — 手機格式重構方案

## 1. 目標架構圖

```
┌─────────────────────────────────────────────────┐
│  App.tsx  (根容器)                                │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Tab 容器 (無 react-navigation, 純 state)    │ │
│  │                                             │ │
│  │  ┌──────────────┐  ┌────────────────────┐  │ │
│  │  │  Tab 1:      │  │  Tab 2:            │  │ │
│  │  │  🎲 DiceScreen│  │  🗺️  MapScreen     │  │ │
│  │  │              │  │                    │  │ │
│  │  │  • D20 骰子  │  │  • 頂部狀態欄      │  │ │
│  │  │  • 狀態欄     │  │  • 地圖網格(Scroll)│  │ │
│  │  │  • 底部面板   │  │  • D-Pad 方向鍵   │  │ │
│  │  │              │  │  • 底部操作面板    │  │ │
│  │  └──────────────┘  └────────────────────┘  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  ❗ 底部自訂 Tab Bar (2 按鈕)                │ │
│  │  [🎲 骰子]    [🗺️ 地圖]                      │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────── overlay 層 ──────────────────┐ │
│  │  依序疊加 (由 Zustand UI state 控制):        │ │
│  │                                              │ │
│  │  1. ⚔️ BattleOverlay  (currentEnemy !== null)│ │
│  │     • 疊在地圖上, 半透明背景                 │ │
│  │     • 敵人卡片 + 攻擊/撤退 + 戰鬥日誌        │ │
│  │                                              │ │
│  │  2. 🛒 ShopModal     (showShop === true)     │ │
│  │     • Modal 彈窗, 可關閉                     │ │
│  │     • 購買道具清單                          │ │
│  │                                              │ │
│  │  3. 🎒 InventoryModal (showInventory === true)│ │
│  │     • Modal 彈窗, 可關閉                     │ │
│  │     • 道具使用/裝備/卸載                     │ │
│  │                                              │ │
│  │  4. 🏆 GameOverOverlay (over / win === true) │ │
│  │     • 全螢幕覆蓋, 最高層級                   │ │
│  │     • 勝利/失敗結算 + 重新開始               │ │
│  │                                              │ │
│  │  5. 📖 TutorialOverlay (tutorial not done)   │ │
│  │     • Modal 教學步驟導覽                     │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**State vs UI 的責任劃分：**

```
gameStore (Zustand)            uiStore (Zustand)
───────────────                ───────────────
• 所有遊戲邏輯                  • activeTab: 'dice' | 'map'
• player / enemies / map       • showShop: boolean
• rollDice / movePlayer / etc  • showInventory: boolean
• currentEnemy (←戰鬥 overlay  • shopPosition: {x,y} | null
  的觸發條件)                   • inventoryOpenFrom: 'map' | 'dice'
• over / win (←結算 overlay
  的觸發條件)
```

---

## 2. 檔案修改清單

### 修改的檔案 (8 個)

| 檔案 | 修改內容 | 行數變化 |
|------|---------|---------|
| `App.tsx` | 移除 `@react-navigation/bottom-tabs`，改用 state 切換 2 個 Tab + 自訂底部 Bar；加入 Overlay 層管理 | -20 行 |
| `screens/DiceScreen.tsx` | 移除 `SafeAreaView` 外層（由 App.tsx 統一管理），加入「背包」快捷按鈕 | -5 行 |
| `screens/MapScreen.tsx` | 移除底部的圖例 + 提示區；加入 D-Pad 方向鍵；加入底部操作面板（攻擊/道具/結束回合）；移除 `SafeAreaView` 外層 | +80 行 |
| `store/gameStore.ts` | **不修改遊戲邏輯**，只新增 `ui` namespace | +12 行 |
| `components/TutorialOverlay.tsx` | 不修改（已是 Modal） | 0 行 |

### 新增的檔案 (4 個)

| 檔案 | 說明 | 預計行數 |
|------|------|---------|
| `components/BattleOverlay.tsx` | 從 `BattleScreen.tsx` 抽取戰鬥 UI，改為覆蓋層元件 | ~200 行 |
| `components/ShopModal.tsx` | 從 `ShopScreen.tsx` 抽取商店 UI，改為 Modal | ~160 行 |
| `components/InventoryModal.tsx` | 從 `InventoryScreen.tsx` 抽取背包 UI，改為 Modal | ~210 行 |
| `components/Dpad.tsx` | 方向鍵 D-Pad 元件（上下左右 + 確認按鈕） | ~80 行 |

### 可刪除/不再引用的檔案 (1 個)

| 檔案 | 原因 |
|------|------|
| `screens/BattleScreen.tsx` | 內容已移至 `BattleOverlay.tsx` |
| `screens/ShopScreen.tsx` | 內容已移至 `ShopModal.tsx` |
| `screens/InventoryScreen.tsx` | 內容已移至 `InventoryModal.tsx` |

> 註：保留舊檔作為參考，最終清理時再刪除。

### 可移除的套件

| 套件 | 原因 |
|------|------|
| `@react-navigation/bottom-tabs` | 不再使用 bottom tab navigator |
| `@react-navigation/native` | 不再需要 navigation container |
| `react-native-screens` | react-navigation 不再使用 |

> 這些套件移除後可減少 bundle 大小約 15-20%。

---

## 3. 元件樹

```
App.tsx
├── StatusBar
├── GameContainer (flex:1, backgroundColor)
│   ├── [activeTab === 'dice']
│   │   └── DiceScreen
│   │       ├── StatusBarRow (樓層/HP/金幣/Lv)
│   │       ├── D20Dice (value, isRolling, onRoll)
│   │       ├── ResultCard (擲骰結果 + 行動點)
│   │       ├── HintText
│   │       └── BottomStats (ATK/DEF/EXP/道具)
│   │
│   ├── [activeTab === 'map']
│   │   └── MapScreen
│   │       ├── TopBar (樓層/行動點/HP/金幣)
│   │       ├── ScrollView (地圖)
│   │       │   └── Grid (9x11 可視範圍)
│   │       │       └── Cell (點擊移動)
│   │       ├── Dpad (方向鍵 + 確認)
│   │       │   ├── [↑] [↖] [↗]
│   │       │   ├── [←] [🧙] [→]
│   │       │   ├── [↓] [↙] [↘]
│   │       │   └── [確認/等待]
│   │       └── BottomActionPanel
│   │           ├── ⚔️ 攻擊 (打開戰鬥列表)
│   │           ├── 🎒 背包 (打開 InventoryModal)
│   │           ├── 🛒 商店 (打開 ShopModal)
│   │           └── ⏸ 結束回合
│   │
│   ├── BottomTabBar (自訂)
│   │   ├── 🎲 骰子 (setActiveTab('dice'))
│   │   └── 🗺️ 地圖 (setActiveTab('map'))
│   │
│   └── Overlay Layer (絕對定位, pointerEvents='box-none')
│       ├── [currentEnemy !== null]
│       │   └── BattleOverlay
│       │       ├── DimBackground (半透明)
│       │       ├── PlayerCard (HP條)
│       │       ├── EnemyCard (icon/名稱/HP條/數值)
│       │       ├── BattleLog
│       │       ├── ⚔️ 攻擊按鈕
│       │       └── 撤退按鈕
│       │
│       ├── [showShop === true]
│       │   └── ShopModal (React Native Modal)
│       │       ├── Header (商店名稱 + 金幣)
│       │       ├── ItemList (ScrollView)
│       │       │   └── ItemCard (icon/名稱/價格/購買)
│       │       └── CloseButton
│       │
│       ├── [showInventory === true]
│       │   └── InventoryModal (React Native Modal)
│       │       ├── Header (背包)
│       │       ├── EquipRow (武器/護甲槽位)
│       │       ├── ItemList (ScrollView)
│       │       │   └── ItemCard (使用/裝備)
│       │       └── CloseButton
│       │
│       ├── [over || win]
│       │   └── GameOverOverlay (全螢幕)
│       │
│       └── [tutorialVisible]
│           └── TutorialOverlay (Modal)
```

---

## 4. 過渡方案 (逐步遷移)

### Phase 1 — 基礎架構 (不破壞遊戲功能)
**目標：先改 App.tsx，確保遊戲仍可運行**

1. 在 `gameStore.ts` 新增 `ui` state：
   ```ts
   // 在 GameStore interface 新增
   activeTab: 'dice' | 'map';
   showShop: boolean;
   showInventory: boolean;
   uiOpen: boolean; // 任何 overlay 開啟時為 true
   setActiveTab: (tab: 'dice' | 'map') => void;
   setShowShop: (show: boolean) => void;
   setShowInventory: (show: boolean) => void;
   ```
2. 修改 `App.tsx`：
   - 移除 `NavigationContainer` 和 `Tab.Navigator`
   - 改用 `activeTab` state 切換顯示 DiceScreen / MapScreen
   - 自訂底部 2 按鈕 Bar（不依賴任何 navigation 套件）
   - 先保留所有 5 個 screens 的 import 但不顯示 Battle/Shop/Inventory tabs
3. 驗證：骰子頁 + 地圖頁功能正常

### Phase 2 — Battle Overlay (戰鬥遷移)
**目標：把戰鬥改為 overlay，不影響地圖操作**

1. 建立 `components/BattleOverlay.tsx`：
   - 從 `BattleScreen.tsx` 複製戰鬥 UI 邏輯
   - 外層 View 加上 `position: 'absolute'` + 半透明背景
   - 觸發條件：`currentEnemy !== null`
2. 在 `App.tsx` 疊加 BattleOverlay：
   ```tsx
   {currentEnemy && <BattleOverlay />}
   ```
3. 修改 `MapScreen.tsx`：點擊地圖上的敵人觸發 `encounterEnemy()`
4. 驗證：戰鬥可在 Map 上方的 overlay 中進行

### Phase 3 — Shop & Inventory Modals (商店/背包遷移)
**目標：把商店和背包改為 Modal**

1. 建立 `components/ShopModal.tsx`：
   - 從 `ShopScreen.tsx` 抽取 UI
   - 使用 React Native `<Modal>` 元件
   - 觸發條件：`showShop === true`
2. 建立 `components/InventoryModal.tsx`：
   - 從 `InventoryScreen.tsx` 抽取 UI
   - 使用 React Native `<Modal>` 元件
   - 觸發條件：`showInventory === true`
3. 在 MapScreen 底部操作面板加入「背包」按鈕
4. 商店觸發：地圖上遇到商店位置 或 按鈕
5. 驗證：Modals 可開啟/關閉，功能正常

### Phase 4 — D-Pad 與底部操作面板
**目標：改善手機操作手感**

1. 建立 `components/Dpad.tsx`
2. 整合到 `MapScreen.tsx`
3. 加入底部操作面板（攻擊/道具/結束回合按鈕）
4. 驗證：方向鍵移動 + 按鈕操作流暢

### Phase 5 — 清理與優化
**目標：移除舊程式碼，減小 bundle**

1. 刪除 `screens/BattleScreen.tsx`, `ShopScreen.tsx`, `InventoryScreen.tsx`
2. 從 `package.json` 移除 `@react-navigation/bottom-tabs`, `@react-navigation/native`, `react-native-screens`
3. 清理未使用的 import
4. 全面測試所有遊戲功能

---

## 5. 預計行數增減

| 類別 | 檔案 | 增/刪行數 | 說明 |
|------|------|-----------|------|
| 新增 | `components/BattleOverlay.tsx` | +200 | 戰鬥 overlay (從 BattleScreen 移植) |
| 新增 | `components/ShopModal.tsx` | +160 | 商店 modal (從 ShopScreen 移植) |
| 新增 | `components/InventoryModal.tsx` | +210 | 背包 modal (從 InventoryScreen 移植) |
| 新增 | `components/Dpad.tsx` | +80 | 方向鍵 D-Pad |
| 修改 | `App.tsx` | -20 | 移除 navigation 套件，改用 state |
| 修改 | `screens/MapScreen.tsx` | +80 | 加入 D-Pad + 底部面板 |
| 修改 | `screens/DiceScreen.tsx` | -5 | 微調 |
| 修改 | `store/gameStore.ts` | +12 | 新增 UI state |
| 刪除 | `screens/BattleScreen.tsx` | -244 | 內容移至 BattleOverlay |
| 刪除 | `screens/ShopScreen.tsx` | -190 | 內容移至 ShopModal |
| 刪除 | `screens/InventoryScreen.tsx` | -247 | 內容移至 InventoryModal |
| 刪除 | `package.json` 套件 | -3 | 移除 3 個 react-navigation 關聯套件 |
| **合計** | | **約 +33 行** | 大幅改善 UI 結構 |

> 實際程式碼行數增減約 +33 行，因為 overlay/modal 元件比獨立 screen 更精簡
> (不需要 header 重複宣告、不需要 SafeAreaView 外層)。

---

## 6. 關鍵實作細節

### 6.1 App.tsx 新結構 (概念)

```tsx
export default function App() {
  const activeTab = useGameStore(s => s.activeTab);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const showShop = useGameStore(s => s.showShop);
  const showInventory = useGameStore(s => s.showInventory);
  const over = useGameStore(s => s.over);
  const win = useGameStore(s => s.win);
  const tutorialVisible = !useGameStore(s => s.tutorialDone) && s.tutorialStep < 5;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Tab 內容 */}
        {activeTab === 'dice' ? <DiceScreen /> : <MapScreen />}

        {/* 自訂底部 Tab Bar */}
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />

        {/* Overlay 層 — 依序疊加 */}
        {currentEnemy && <BattleOverlay />}
        {showShop && <ShopModal />}
        {showInventory && <InventoryModal />}
        {(over || win) && <GameOverOverlay />}
        {tutorialVisible && <TutorialOverlay />}
      </View>
    </SafeAreaProvider>
  );
}
```

### 6.2 D-Pad 元件設計

```
┌─────────────────────────────┐
│        ┌───┐                │
│        │ ↑ │                │
│    ┌───┼───┼───┐            │
│    │ ← │ 🧙│ → │            │
│    └───┼───┼───┘            │
│        │ ↓ │                │
│        └───┘                │
│                             │
│    [⚔️ 攻擊] [🎒 背包]      │
│    [🛒 商店] [⏸ 結束回合]    │
└─────────────────────────────┘
```

- 方向鍵使用 `TouchableOpacity` (min 48x48)
- 長按支援（連續移動，利用 `onLongPress` + 間隔 timer）
- 灰色底色，按下時高亮

### 6.3 Store 新增 UI state

```ts
// 在 gameStore.ts 的 GameStore interface 中加入：
activeTab: 'dice' | 'map';
showShop: boolean;
showInventory: boolean;
setActiveTab: (tab: 'dice' | 'map') => void;
openShop: () => void;
closeShop: () => void;
openInventory: () => void;
closeInventory: () => void;

// 初始值：
activeTab: 'dice',
showShop: false,
showInventory: false,

// 實作：
setActiveTab: (tab) => set({ activeTab: tab }),
openShop: () => set({ showShop: true }),
closeShop: () => set({ showShop: false }),
openInventory: () => set({ showInventory: true }),
closeInventory: () => set({ showInventory: false }),
```

### 6.4 Battle Overlay 觸發流程

1. 玩家在地圖上點擊敵人圖標（或從底部面板按「攻擊」）
2. `MapScreen` 檢查該位置是否有敵人
3. 調用 `encounterEnemy(enemy)` → `currentEnemy` 被設置
4. `App.tsx` 檢測到 `currentEnemy !== null` → 渲染 `<BattleOverlay />`
5. 戰鬥結束（擊敗/撤退）→ `currentEnemy` 設為 `null` → overlay 消失
6. 玩家回到地圖視圖繼續遊戲

### 6.5 觸控區域規範

| 元件 | 最小尺寸 | 備註 |
|------|---------|------|
| Tab Bar 按鈕 | 60x44 | 底部導航按鈕 |
| D-Pad 按鈕 | 48x48 | 方向鍵 |
| 地圖格子 | 40x40 | 點擊移動 (保持現有尺寸) |
| 操作面板按鈕 | 80x44 | 底部按鈕 |
| Modal 關閉按鈕 | 44x44 | 左上/右上角 |

---

## 7. 風險與注意事項

### 7.1 潛在風險

1. **overlay z-index 順序**：多個 overlay 同時顯示時需注意層級
   - 解決方案：BattleOverlay 和 ShopModal/InventoryModal 互斥（戰鬥中無法開背包）
2. **tutorial 與 overlay 互動**：tutorial 步驟涉及戰鬥時，需確保 overlay 正確顯示
3. **地圖 scroll 與 D-Pad 衝突**：啟用 D-Pad 時應禁用 scroll 避免干擾
4. **expo-av 音效**：現有 no-op 實作不影響遷移

### 7.2 相容性保證

- **gameStore.ts 不修改任何遊戲邏輯**：`rollDice`, `movePlayer`, `attack`, `buyItem`, `useItem`, `equipItem` 等函數保持不變
- **types.ts 不修改**：型別定義完全保留
- **現有 save/load 機制不變**：AsyncStorage 格式不變
- **TutorialOverlay 不修改**：已經是獨立的 Modal 元件

---

## 8. 最終檔案結構 (完成後)

```
rn/
├── App.tsx                    ← 根容器 + overlay 管理
├── ARCHITECTURE_MOBILE.md     ← 本文件
├── package.json               ← 移除 3 個 navigation 套件
├── index.ts
├── tsconfig.json
├── app.json
│
├── screens/
│   ├── DiceScreen.tsx         ← 微調
│   └── MapScreen.tsx          ← 加入 D-Pad + 底部面板
│
├── components/
│   ├── D20Dice.tsx            ← 不變
│   ├── TutorialOverlay.tsx    ← 不變
│   ├── BottomTabBar.tsx       ← 新增 (自訂底部 2 Tab)
│   ├── BattleOverlay.tsx      ← 新增 (從 BattleScreen 移植)
│   ├── ShopModal.tsx          ← 新增 (從 ShopScreen 移植)
│   ├── InventoryModal.tsx     ← 新增 (從 InventoryScreen 移植)
│   └── Dpad.tsx               ← 新增 (方向鍵)
│
├── store/
│   └── gameStore.ts           ← +12 行 (UI state)
│
├── services/
│   └── audio.ts               ← 不變
│
└── types.ts                   ← 不變
```
