# DungeonD3 — 完整遊戲規格書 v4.0

> 版本：4.0 | 目標：上架 iOS/Android App Store + 網頁
> 最後更新：2026-05-14
> 程式碼基礎：React Native + Expo SDK 54, Zustand, TypeScript
> 參考文件：SPEC_v3.md, ARCHITECTURE_MOBILE.md, TUTORIAL_SPEC.md

---

## v4.0 主要變更（相較 v3.0）

| 變更項目 | v3.0 | v4.0 |
|:--------:|:----:|:----:|
| **UI 架構** | 5 Tab (react-navigation) | **2 Tab + Overlay** (純 Zustand state) |
| **導航** | @react-navigation/bottom-tabs | 自訂底部 Bar（無套件依賴） |
| **戰鬥** | 獨立 Tab (BattleScreen) | **BattleOverlay** 全螢幕 overlay |
| **商店** | 獨立 Tab (ShopScreen) | **ShopModal** 彈窗 Modal |
| **背包** | 獨立 Tab (InventoryScreen) | **InventoryModal** 彈窗 Modal |
| **移動方式** | 點擊移動 + D-Pad 方向鍵 | **純點擊移動**（移除 D-Pad） |
| **新手教學** | 5 步文字解說 + 按鈕推進 | **6 步互動引導** + 自動進度 + 無跳過 |
| **地圖操作** | ScrollView 地圖 + 圖例區 | ScrollView 地圖 + **底部操作面板**（⚔️🛒🎒⏸） |

## 畫面清單

### 主畫面（2 Tab）
| Tab | 名稱 | 內容 |
|:---:|:----:|------|
| 🎲 | 骰子頁 | D20 骰子擲骰 + 狀態列 + 底部屬性 |
| 🗺️ | 地圖頁 | 地城地圖 + 點擊移動 + 底部操作面板 |

### Overlay/Modal（取代獨立 Tab）
| 元件 | 觸發時機 | 功能 |
|:----:|:--------:|------|
| ⚔️ BattleOverlay | 遭遇敵人 (`currentEnemy !== null`) | 戰鬥 + 攻擊/撤退 + 戰鬥日誌 |
| 🛒 ShopModal | 點擊底部 🛒 按鈕 | 購買道具 |
| 🎒 InventoryModal | 點擊底部 🎒 按鈕 | 道具使用/裝備管理 |
| 🏆 GameOverOverlay | 玩家死亡或通關 | 結算畫面 + 重新開始 |
| 📖 TutorialOverlay | 初次進入遊戲 | 互動引導式 6 步驟教學 |

## 核心循環（不變）

```
[擲 D20 骰子] → [獲得 MOVE 點數] → [地圖點擊移動] → [戰鬥/道具/商店] → [重複或死亡]
```

## 技術架構（更新）

### 目錄結構
```
rn/
├── App.tsx                    # 根容器 + overlay 管理（無 react-navigation）
├── ARCHITECTURE_MOBILE.md     # 手機格式重構方案
├── screens/
│   ├── DiceScreen.tsx         # 🎲 骰子頁（不變）
│   └── MapScreen.tsx          # 🗺️ 地圖頁（點擊移動 + 操作面板）
├── components/
│   ├── D20Dice.tsx            # D20 骰子 SVG 元件
│   ├── TutorialOverlay.tsx    # 互動引導式新手教學
│   ├── BattleOverlay.tsx      # 戰鬥 overlay
│   ├── ShopModal.tsx          # 商店 modal
│   └── InventoryModal.tsx     # 背包 modal
├── store/
│   └── gameStore.ts           # Zustand（遊戲邏輯 + UI state）
├── services/
│   └── audio.ts
└── types.ts
```

### 移除的套件
- `@react-navigation/bottom-tabs`
- `@react-navigation/native`
- `react-native-screens`

## 新手教學系統（v4.0 新功能）

請參閱 `docs/TUTORIAL_SPEC.md` 完整規格。

6 步驟流程：歡迎 → 引導擲骰 → 引導移動 → 引導攻擊 → 引導使用道具 → 完成自動關閉

## 部署

- **Web 測試**：https://rn-ivory.vercel.app
- **建置方式**：`npx expo export --platform web`
- **Android APK**：`eas build --profile preview --platform android`
