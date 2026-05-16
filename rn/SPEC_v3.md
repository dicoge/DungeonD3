# DungeonD3 — 完整遊戲規格書 v3.0

> 版本：3.0 | 目標：上架 iOS/Android App Store + 網頁
> 最後更新：2026-05-14
> 程式碼基礎：React Native + Expo SDK 54, Zustand, TypeScript
> 參考文件：SPEC.md (v2.0), DESIGN.md, STYLE.md, README.md

---

## 目錄

1. [遊戲概述](#1-遊戲概述)
2. [核心循環](#2-核心循環)
3. [系統詳解](#3-系統詳解)
   - 3.1 D20 骰子系統
   - 3.2 行動消耗規則
   - 3.3 戰鬥系統
   - 3.4 地城生成
   - 3.5 樓層系統
   - 3.6 敵人系統
   - 3.7 道具系統
   - 3.8 商店系統
   - 3.9 背包 & 裝備系統
   - 3.10 升級系統
   - 3.11 存檔系統
4. [視覺風格](#4-視覺風格)
   - 4.1 色票
   - 4.2 稀有度視覺
   - 4.3 樓層氛圍
   - 4.4 粒子系統
   - 4.5 動畫規格
5. [UI/UX 頁面](#5-uiux-頁面)
   - 5.1 底部 Tab 導航
   - 5.2 各頁面細節
   - 5.3 新手教學
   - 5.4 結算畫面
6. [技術架構](#6-技術架構)
   - 6.1 目錄結構
   - 6.2 狀態管理 (Zustand)
   - 6.3 音效系統
   - 6.4 關鍵類型定義
7. [已知問題 & 待修正 Bug](#7-已知問題--待修正-bug)
8. [開發任務分配](#8-開發任務分配)
9. [部署流程](#9-部署流程)
10. [功能進度追蹤](#10-功能進度追蹤)

---

## 1. 遊戲概述

**「用 D20 骰子決定命運的地城爬塔 RPG」**

- **類型**：回合制 Roguelike 地城爬塔
- **目標**：通過 15 層地城，擊敗最終 Boss（第 15 層深淵之巔）
- **單局時間**：15-30 分鐘
- **語言**：繁體中文
- **支援平台**：Web（Vercel）、iOS（App Store）、Android（Google Play）
- **目標用戶**：休閒玩家、D&D/桌遊愛好者、RPG 爬塔粉絲

---

## 2. 核心循環

```
[進入地城] → [新手教學] → [第1層開始]
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
    [🎲 擲 D20 骰子]                        [⚔️ 戰鬥結算]
         ↓                                         ↓
    [獲得 MOVE 點數]                         [經驗值/金幣]
    MOVE = max(1, floor(骰值÷3))                  ↓
         ↓                                    [升級檢查]
    [🗺️ 地圖移動]  ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
         ↓
    [遭遇事件]
    ┌─────┬──────┬──────┬──────┐
    ↓     ↓      ↓      ↓      ↓
  道具  敵人   商店   樓梯   BOSS
    ↓     ↓      ↓      ↓      ↓
  拾取  戰鬥   購買  下一層  特殊戰
         ↓
    [重複直到 15 層或死亡]
         ↓
    [結算畫面]
```

### 每回合流程

```
[行動點=0] → [擲D20] → [獲得MOVE點] → [移動/攻擊/道具] → [行動點=0] → 回到[擲D20]
```

- 玩家永遠先手
- MOVE = max(1, floor(D20 ÷ 3)) → 1~7 點
- 行動點用完後自動結束回合，擲骰按鈕恢復可用
- 禁止在行動點 > 0 或本回合已骰時重複骰

---

## 3. 系統詳解

### 3.1 D20 骰子系統

| 項目 | 說明 | 程式碼參考 |
|------|------|-----------|
| 骰值範圍 | 1~20（均勻隨機 `Math.random()*20+1`） | `gameStore.ts:11-13` |
| MOVE 計算 | `max(1, floor(骰值÷3))` → 1~7 點 | `gameStore.ts:20-22` |
| 防重複骰 | `hasRolledThisTurn` flag（`movePoints > 0` 時也禁止） | `gameStore.ts:291-295` |
| 視覺 | SVG 二十面體（六邊形外框+6外圈三角+內圈六邊+中央三角），220×220px | `D20Dice.tsx` |
| 滾動動畫 | 1.5 秒 Animated.loop 旋轉 + 隨機數字切換（80ms 間隔） | `D20Dice.tsx:81-100` |
| 骰值提示 | 根據骰值顯示不同評語（大凶/普通/不錯/大骰/完美20） | `DiceScreen.tsx:25-41` |
| 回合重置 | `hasRolledThisTurn = false` + `diceValue = null` 當 `movePoints` 歸零 | `gameStore.ts:391-395` |

### 3.2 行動消耗

| 行動 | 消耗 MOVE | 結束回合？ | 說明 |
|------|:---------:|:----------:|------|
| 移動 1 格 | 1 | 否 | 可連續移動直到 MOVE 用盡 |
| 攻擊敵人 | 1 | **是** | `gameStore.ts:402` 攻擊後對比結果不影響 MOVE |
| 使用道具 | 2 | 是（設計上） | 目前 `useItem` 不檢查 MOVE |
| 待機/結束 | 0 | 是 | 略過該回合 |

> **註**：目前 `useItem` 實作中未檢查 `movePoints` 或自動結束回合，此為 Phase 2 待辦事項。

### 3.3 戰鬥系統

#### 攻擊結算 (`gameStore.ts:25-37`)

| 結果 | 條件 | 傷害公式 |
|------|:----:|:--------:|
| Miss | D20 = 1 | 0 傷害 |
| 命中 | D20 + ATK > 敵人 DEF | ATK + D6 |
| 暴擊 | D20 = 20 | ATK + (D6 × 2) |

#### 戰鬥流程

1. 玩家選擇敵人 → `encounterEnemy()` → 設定 `currentEnemy`
2. 玩家攻擊 → `attack()` → 結算命中 → 傷害敵人
3. **敵人反擊**（若存活）：`resolveAttack(敵.damage, 玩家.def)`
4. 擊敗敵人獲得：`XP = enemy.xp_reward`, `金幣 = floor(xp_reward / 2)`
5. 升級檢查：`XP >= xpN` → 升級
6. 玩家 HP ≤ 0 → `over = true`（遊戲結束）

#### 戰鬥日誌 (`BattleScreen.tsx`)

- 最多保留 8 條記錄
- 樣式分類：暴擊(金色)、命中(白色)、Miss(暗灰)、反擊(紅色)
- 音效：crit/hit/miss/enemyDie 對應不同音效

### 3.4 地城生成 (`gameStore.ts:70-113`)

| 項目 | 數值 | 說明 |
|------|:----:|------|
| 地圖尺寸 | 30×20 | `W=30, H=20` |
| 房間數量 | 8~12 | `target = 8 + random(4)` |
| 房間尺寸 | w:4~8, h:3~6 | 隨機生成 |
| 走廊連接 | 自動 | 順序連接（L 型：水平→垂直 或 垂直→水平） |
| 牆壁自動偵測 | 鄰接 floor 的 void → wall | 8 方向檢查 |
| 樓梯位置 | 最遠房間中心 | `rooms[last].center` |
| 玩家起始 | 第一個房間中心 | `rooms[0].center` |
| 可視範圍 | 9×11 視窗 | 以玩家為中心，`startX/startY` 計算邊界 |

### 3.5 樓層系統

| 樓層 | 名稱 | 敵人數量 | 難度倍率 | Boss | 氛圍色調 |
|:----:|------|:--------:|:--------:|:----:|----------|
| 1-3 | 地底深處 | 3-5 | 1.0x | — | 冷藍灰 `#3d3d5c` / `#2a2a4a` |
| 4-6 | 遺忘墓穴 | 4-6 | 1.3x | 第5層 Boss | 暗紫 `#353355` / `#282848` |
| 7-9 | 惡魔深淵 | 5-7 | 1.6x | 第10層 Boss | 深紅 `#2d2d4a` / `#222240` |
| 10-14 | 虛空裂隙 | 6-8 | 2.0x | — | 近黑紫 `#252540` / `#1a1a35` |
| 15 | 深淵之巔 | Boss | 3.0x | 最終Boss 深淵領主 | 虛空紫（最終戰） |

**BOSS 出現規則** (`gameStore.ts:142-154`)：
- 樓層數 5、10、15 → Boss 層
- Boss 單獨出現（無小怪）
- Boss HP/傷害 × 難度倍率
- **動態 Boss ID**：`{floor}_boss`（如 `5_boss`、`10_boss`、`15_boss`）
- 目前只有 `floor1_boss`（深淵領主）在 `BASE_ENEMIES` 中定義

### 3.6 敵人系統

#### 9 種基礎敵人 (`gameStore.ts:120-130`)

| 敵人 | ID | 圖示 | HP | 傷害 | DEF | XP | 樓層需求 |
|------|:--:|:----:|:--:|:----:|:---:|:--:|:--------:|
| 史萊姆 | slime | 🟢 | 30 | 5 | 2 | 10 | 1 |
| 哥布林 | goblin | 👺 | 35 | 6 | 3 | 12 | 1 |
| 洞穴蝙蝠 | bat | 🦇 | 25 | 7 | 1 | 8 | 1 |
| 毒鼠 | rat | 🐀 | 28 | 5 | 2 | 9 | 1 |
| 骨骸戰士 | skeleton | 💀 | 50 | 10 | 5 | 20 | 2 |
| 獸人 | orc | 👹 | 60 | 12 | 4 | 22 | 2 |
| 巨魔 | troll | 🧌 | 100 | 18 | 8 | 40 | 3 |
| 幼龍 | dragon_spawn | 🐉 | 200 | 30 | 15 | 80 | 4 |
| 深淵領主 | floor1_boss | 👿 | 300 | 25 | 10 | 150 | 5（Boss） |

**生成規則**：
- 過濾 `e.floor <= ceil(currentFloor / 2)`（隨樓層解鎖更強敵人）
- 數量：`min(3 + floor/2, 8)`
- 屬性 × 樓層難度倍率（HP、傷害、DEF）
- 隨機選取（排序後 slice）

**缺少的 Boss**：樓層 10、15 的 Boss 未在 `BASE_ENEMIES` 中定義，`spawnEnemiesForFloor` 中的 `bossFloor` 邏輯會找不到對應 Boss 而回傳空陣列。此為 **已知 Bug**。

### 3.7 道具系統 (`gameStore.ts:170-180`)

#### 消耗品

| 道具 | ID | 效果 | 價格 | 稀有度 |
|------|:--:|:----:|:----:|:------:|
| 生命藥水 | health_potion | 恢復 30 HP | $15 | common |
| 炸彈 | bomb | 造成 40 傷害 | $30 | uncommon |
| 火球卷軸 | fire_scroll | 造成 35 傷害 | $35 | uncommon |
| 力量藥劑 | strength_buff | ATK+5（3回合）| $50 | rare |
| 鳳凰羽毛 | phoenix_feather | 復活 | $200 | legendary |

#### 武器

| 道具 | ID | 效果 | 價格 | 稀有度 |
|------|:--:|:----:|:----:|:------:|
| 鐵劍 | iron_sword | ATK +5 | $50 | common |
| 鋼鐵劍 | steel_sword | ATK +10 | $100 | uncommon |

#### 護甲

| 道具 | ID | 效果 | 價格 | 稀有度 |
|------|:--:|:----:|:----:|:------:|
| 皮甲 | leather_armor | DEF +3 | $40 | common |
| 鎖子甲 | chainmail | DEF +7 | $90 | uncommon |

**稀有度顏色映射** (ShopScreen/InventoryScreen)：
- common: `#888` (灰色)
- uncommon: `#4caf50` (綠色)
- rare: `#4fc3f7` (藍色)
- legendary: `#ffd700` (金色)

### 3.8 商店系統

- **出現規則**：每 3 層（3/6/9/12/15），`floor % 3 === 0`
- **金幣購買**（來源：擊敗敵人）
- **庫存管理**：購買後該商品從商店移除
- **非商店樓層**：顯示 🔒 鎖定圖示 + 提示下一個商店樓層
- **商店刷新**：每次進入新樓層時 `BASE_ITEMS.slice(0, 3 + floor/3)` 隨樓層增加商品種類
- **金幣不足**：購買按鈕禁用 + 紅色價格標示

### 3.9 背包 & 裝備系統

| 功能 | 說明 | 狀態 |
|------|------|:----:|
| 消耗品使用 | `useItem()` → 即時效果（補血/傷害/ Buff） | ✅ |
| 武器裝備 | `equipItem(id, 'w')` → 永久 ATK 加成 | ✅ |
| 護甲裝備 | `equipItem(id, 'a')` → 永久 DEF 加成 | ✅ |
| 卸載裝備 | `unequipSlot('w'/'a')` → 裝備回背包 | ✅ |
| 數量管理 | 堆疊數量 + 使用後減少 | ✅ |
| 角色屬性總覽 | HP/ATK/DEF/經驗/金幣/裝備欄 | ✅ |

**屬性計算**：
- 基礎 ATK = 5，基礎 DEF = 2
- 裝備 ATK = 5 + 武器 atkBonus + 護甲 defBonus
- 裝備 DEF = 2 + 護甲 defBonus + 武器 atkBonus
- **(Bug)** `unequipItem` 中 `getDefBonus` 和 `getAtkBonus` 調用互換（line 586-588）

### 3.10 升級系統 (`gameStore.ts:442-453`)

| 項目 | 說明 |
|------|------|
| 所需經驗公式 | `xpN = Math.floor(xpN * 1.5)`，初始 50 |
| 升級效果 | HP+10, ATK+2, 滿血回補 |
| 等級限制 | 無上限（但最多 15 層敵人有限） |

### 3.11 存檔系統 (`gameStore.ts:629-638`)

- **儲存方式**：AsyncStorage（key: `dungeonD3_save`）
- **存檔內容**：
  ```typescript
  { player, floor, enemies, items, map, boss, version: '1.0.0', timestamp }
  ```
- **自動存檔時機**：
  - 戰鬥結束（attack 成功）
  - 購買道具
  - 使用道具
  - 樓層變更
- **讀檔**：`loadGame()` → 解析 JSON → `set({ ...saved })`
- **版本號含 timestamp 便於 troubleshooting**

---

## 4. 視覺風格

參考 `art/STYLE.md` 完整風格指南，以下是整合進 SPEC 的核心要點。

### 4.1 色票

| 用途 | Hex | 使用位置 |
|------|:---:|----------|
| 頁面背景 | `#0a0a14` | 所有頁面容器 |
| 面板/卡片背景 | `#12122a` | 狀態列、結果卡、商店/背包卡片 |
| 邊框 | `#2a2a5a` | 面板分隔線、卡片邊框 |
| 紫色主題（骰子） | `#ab47bc` | 擲骰按鈕、教學框邊框、骰子結果 |
| 藍色強調（資訊） | `#4fc3f7` | HP 條框架、提示文字、裝備邊框 |
| 紅色強調（危險） | `#e94560` / `#ef5350` | 攻擊按鈕、敵人卡片、HP 條填滿 |
| 金色（稀有/金幣） | `#ffd600` / `#ffd700` | 金幣標籤、稀有道具、商店標題 |
| 綠色（治癒/充足） | `#4caf50` | 購買按鈕、稀有度( uncommon)、開始按鈕 |

### 4.2 稀有度視覺

| 稀有度 | 文字顏色 | 發光效果 | 代表道具 |
|:------:|:--------:|:---------:|:--------:|
| Common | `#888` | 無 | 鐵劍、皮甲、生命藥水 |
| Uncommon | `#4caf50` | 柔和呼吸脈動（2s） | 鋼鐵劍、鎖子甲、炸彈 |
| Rare | `#4fc3f7` | 中等脈動 + 輕微縮放（1s） | 力量藥劑 |
| Legendary | `#ffd700` | 強烈脈動 + 持續粒子 | 鳳凰羽毛 |

### 4.3 樓層氛圍（視覺風格）

| 樓層區間 | 牆壁顏色 | 地板顏色 | 氛圍描述 |
|:--------:|:--------:|:--------:|----------|
| 1-3 | `#3d3d5c` | `#2a2a4a` | 相對明亮，石造工藝較新 |
| 4-7 | `#353355` | `#282848` | 視野降低，可見古老骨骸 |
| 8-12 | `#2d2d4a` | `#222240` | 偶爾閃爍的紅光 |
| 13+ | `#252540` | `#1a1a35` | 迷霧效果，粒子飄散，虛空氛圍 |

### 4.4 粒子系統（設計規格）

| 粒子類型 | 顏色 | 大小 | 速度 | 觸發時機 |
|----------|:----:|:----:|:----:|----------|
| 戰鬥火花 | `#ffaa00`→`#ff6600` | 2-4px | 快速 3-6px | 武器攻擊 |
| 魔法粒子 | `#4a90d9`→`#9a4ad9` | 3-6px | 慢速漂流 | 法術/稀有道具拾取 |
| 血液/傷害 | `#d94a4a`→`#8b0000` | 2-5px | 爆發向外 | 敵人受擊 |
| 環境灰塵 | `#888888` (30%) | 1-2px | 極慢漂流 | 底層持續 |
| 虛空迷霧 (13F+) | 紫黑漸層 | 8-12px | 超慢水平飄移 | 持續效果 |

### 4.5 動畫規格

| 動畫 | 時間 | 效果 |
|------|:----:|------|
| 玩家移動 | 0.15s | 順暢瓷磚過渡，ease-out |
| 攻擊動畫 | 0.2s | 縮放脈衝 1.0→1.15→1.0 |
| 受傷閃爍 | 0.3s | 紅色疊加層 `rgba(255,0,0,0.4)` |
| 道具拾取 | 0.25s | 縮小淡出 + 向上漂移 |
| 樓梯脈動 | 2s cycle | 徑向漸層脈衝 |
| 死亡動畫 | 0.5s | 淡出 + 縮小 |

---

## 5. UI/UX 頁面

### 5.1 底部 Tab 導航

| Tab | 功能 | 元件 |
|:---:|------|:----:|
| 🎲 骰子 | D20 視覺 + 狀態 + 擲骰（*預設首頁*） | `DiceScreen.tsx` |
| 🗺️ 地圖 | 地城迷宮 + 點擊移動（9×11 視窗） | `MapScreen.tsx` |
| ⚔️ 戰鬥 | 敵人清單 + 交戰 + 攻擊 + 日誌 | `BattleScreen.tsx` |
| 🛒 商店 | 商品列表 + 購買（每 3 層開放） | `ShopScreen.tsx` |
| 🎒 背包 | 道具清單 + 裝備管理 + 角色屬性 | `InventoryScreen.tsx` |

### 5.2 各頁面細節

#### 🎲 骰子頁 (`DiceScreen.tsx`)

- **頂部狀態列**：樓層、❤️HP、💰金幣、Lv
- **D20 骰子**：SVG 動畫骰子（220×220px）
- **「擲骰」按鈕**：紫色圓角，禁用時灰色（`movePoints > 0 || hasRolledThisTurn`）
- **擲骰結果卡片**：顯示骰值 + MOVE 點數
- **動態提示文字**：根據遊戲狀態顯示引導
- **底部屬性列**：⚔️攻擊力 / 🛡️防禦力 / 📊經驗 / 🎒道具數

#### 🗺️ 地圖頁 (`MapScreen.tsx`)

- **頂部狀態**：樓層、HP、金幣、行動點標籤
- **地圖渲染**：9×11 可視範圍（以玩家為中心），40px 大格子
- **圖示對應**：
  - void/未探索：`#0a0a14` 黑色
  - wall：`▓` `#1a1a3a`
  - floor：`·` `#12122a`
  - stairs：`🚪` `#1a3a1a`
  - enemy：`👾` `#2a1010` 紅框
  - player：`🧙` 藍色高亮
- **點擊移動**：僅相鄰格（上下左右一步），消耗 1 MOVE
- **圖例 + 操作提示**

#### ⚔️ 戰鬥頁 (`BattleScreen.tsx`)

- **玩家狀態卡**：🧙 + HP 條
- **敵人清單**（非戰鬥狀態）：附近敵人列表（最多 5 個），可選交戰
- **戰鬥狀態**：
  - 敵人資訊卡（名稱、HP 條、屬性、稀有度標示）
  - 「⚔️ 攻擊」按鈕（紅色大按鈕）
  - 「撤退」按鈕（灰底小字）
- **戰鬥日誌**：滾動日誌，保留 8 條，按事件類型著色

#### 🛒 商店頁 (`ShopScreen.tsx`)

- **非商店樓層**：顯示 🔒 鎖定畫面 + 下個商店樓層提示
- **商店樓層**：
  - 「🏪 地城商店」標題
  - 商品卡片（圖示 + 名稱 + 稀有度著色 + 價格 + 效果說明）
  - 🟢「購買」按鈕（金幣不足改為灰色「金幣不足」）
  - 缺貨顯示「商品已售完！」
- **攻略提示**：底部固定提示

#### 🎒 背包頁 (`InventoryScreen.tsx`)

- **角色屬性卡片**：🧙 冒險者 Lv + HP 條 + 屬性面板
- **裝備區**：武器（左）/ 護甲（右）插槽，已裝備顯示「卸載」按鈕
- **道具列表**：消耗品 + 可裝備道具，支援使用/裝備
- **稀有度顏色**：道具名稱按稀有度著色

### 5.3 新手教學（5 步驟強制引導）

| 步驟 | ID | 標題 | 互動要求 | 按鈕文字 |
|:----:|:---:|------|:--------:|:--------:|
| 1 | welcome | 歡迎來到地城！ | 無（僅閱讀） | 下一頁→ |
| 2 | dice_intro | 🎲 認識 D20 骰子 | 需要擲骰 | 🎲去擲骰子！ |
| 3 | map_intro | 🗺️ 認識地圖 | 需要移動 | 🗺️去地圖移動！ |
| 4 | battle_intro | ⚔️ 戰鬥教學 | 需要攻擊敵人 | ⚔️去戰鬥！ |
| 5 | done | 準備出發！ | 無（僅閱讀） | 🚀開始冒險！ |

- **UI**：Modal 覆蓋層（`rgba(10,10,20,0.92)` + 紫色邊框卡片）
- **進度指示**：圓點進度條 + 「2/5」數字指示
- **可跳過**：每步驟右上角 ✕ 關閉按鈕 + 底部「跳過教學」連結
- **儲存**：完成後 `tutorialDone = true`，不再顯示

### 5.4 結算畫面 (`App.tsx:30-69`)

| 狀態 | 標題 | 邊框顏色 | 按鈕顏色 |
|:----:|:----:|:--------:|:--------:|
| 勝利 | 🏆 勝利！ | 金色 `#ffd700` | 綠色 `#4caf50` |
| 失敗 | 💀 遊戲結束 | 藍色 `#4fc3f7` | 紫色 `#ab47bc` |

- **統計資訊**：等級 / 金幣 / 層數
- **動作**：重新開始（`initGame()`）

---

## 6. 技術架構

### 6.1 目錄結構

```
rn/
├── App.tsx                      # 主入口 + Tab Navigation + GameOverOverlay(內聯)
├── store/
│   └── gameStore.ts             # Zustand 遊戲狀態管理（639行，核心邏輯）
├── screens/
│   ├── DiceScreen.tsx           # 🎲 骰子頁（241行）
│   ├── MapScreen.tsx            # 🗺️ 地圖頁（239行）
│   ├── BattleScreen.tsx         # ⚔️ 戰鬥頁（244行）
│   ├── ShopScreen.tsx           # 🛒 商店頁（190行）
│   └── InventoryScreen.tsx      # 🎒 背包頁（247行）
├── components/
│   ├── D20Dice.tsx              # D20 骰子 SVG 元件（206行）
│   └── TutorialOverlay.tsx      # 新手教學覆蓋層（232行）
├── services/
│   └── audio.ts                 # 音效服務（107行，12種音效）
├── types.ts                     # TypeScript 類型定義
├── SPEC_v3.md                   # 本文件
├── SPEC.md                      # 舊版規格書 (v2.0)
└── README.md                    # 專案說明
```

### 6.2 狀態管理（Zustand Store）

**Store Interface** (`gameStore.ts:221-267`)：

```typescript
interface GameStore extends GameState {
  // 骰子系統
  rollDice: () => void;
  diceValue: number | null;
  isRolling: boolean;
  movePoints: number;
  hasRolledThisTurn: boolean;

  // 教學系統
  tutorialStep: number;
  tutorialDone: boolean;
  completeTutorialStep: (stepId: string) => void;

  // 初始化 & 存檔
  initGame: () => void;
  loadGame: () => Promise<boolean>;
  saveGame: () => Promise<void>;

  // 移動
  movePlayer: (dx: number, dy: number) => boolean;
  useMovePoint: () => void;

  // 戰鬥
  currentEnemy: Enemy | null;
  encounterEnemy: (enemy: Enemy) => void;
  attack: () => { result: AttackResult; playerHit: number };
  skipEnemy: () => void;

  // 道具
  useItem: (itemId: string) => void;
  equipItem: (itemId: string, slot: 'w' | 'a') => void;
  unequipItem: (slot: 'w' | 'a') => void;

  // 商店
  buyItem: (itemId: string) => void;

  // 樓層
  nextFloor: () => void;

  // 結算
  checkGameOver: () => void;

  // 狀態
  shopAvailable: boolean;
  over: boolean;
  win: boolean;
  boss: Enemy | null;
  map: DungeonMap | null;
}
```

**關鍵邏輯流程**：

```
rollDice()
  → 檢查 hasRolledThisTurn / movePoints
  → isRolling = true
  → 1.5s 後：diceValue = random(1-20), movePoints = calc(diceValue)

movePlayer(dx, dy)
  → 檢查 movePoints > 0
  → 邊界/牆壁碰撞偵測
  → 更新 player.x/y
  → 若踩到 stairs → nextFloor()
  → (注意：不自動扣 MOVE，由 MapScreen 手動呼叫 useMovePoint)

attack()
  → resolveAttack(player.atk, enemy.def)
  → 若擊中且敵人存活 → 敵人反擊
  → 敵人死亡 → 取得 XP + 金幣
  → 升級檢查
  → 玩家 HP <= 0 → over = true
```

### 6.3 音效系統 (`audio.ts`)

**12 種音效效果**（目前皆為 no-op，需實際音檔）：

| 音效 | 觸發時機 | 設計音符序列 |
|:----:|----------|:------------:|
| roll | 擲骰 | G4 → C5 |
| hit | 攻擊命中 | A3 |
| miss | 攻擊 Miss | C3 |
| playerHit | 玩家受傷 | E3 |
| pickup | 拾取道具 | G5 → C5 → E5 |
| levelUp | 升級 | C5 → E5 → G5 → C5 |
| enemyDie | 擊敗敵人 | A3 → E3 → A3 |
| floor | 進入新樓層 | C5 → E5 → G5 |
| crit | 暴擊 | C4 → E4 → G4 |
| btn | 按鈕音效 | C5 |
| heal | 補血 | E4 → G4 → C5 |
| buy | 購買 | G4 → C5 |
| equip | 裝備 | E4 → G4 |

### 6.4 關鍵類型定義 (`types.ts`)

```typescript
interface Player {
  x, y, hp, maxHp, atk, def, gold, xp, xpN, lvl;
  inv: InventoryItem[];
  eq: { w: EquipItem | null; a: EquipItem | null };
  done: string[];
}

interface Enemy {
  id, name, icon, floor, hp, damage, def, xp_reward;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  currentHp: number;
}

interface Item {
  id, name, icon;
  type: 'consumable' | 'weapon' | 'armor' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effect: { heal?, damage?, buff?, revive?, ... };
  cost: number;
}

interface DungeonMap {
  cells: string[][];  // 'void' | 'wall' | 'floor' | 'stairs'
  px, py: number;      // player start
  sx, sy: number;      // stairs position
  rooms: Room[];
}
```

---

## 7. 已知問題 & 待修正 Bug

### 🐛 Bug 1：Win 條件永遠不會觸發

**位置**：`gameStore.ts:460`
```typescript
const win = get().floor > 15 && newEnemies.length === 0 && !get().boss;
```
**問題**：遊戲從 floor 1 到 15，`floor > 15` 永遠為 false。Win 條件永遠不會變 true。

**正確邏輯**：使用者在第 15 層擊敗最終 Boss 後應觸發勝利。應改為：
```typescript
const win = get().floor >= 15 && newEnemies.length === 0 && !get().currentEnemy;
```
且應該在 `nextFloor` 中檢查 `floor >= 15` 時設定 `win = true`。

### 🐛 Bug 2：缺少樓層 10 和 15 的 Boss 定義

**位置**：`gameStore.ts:120-130`
**問題**：`BASE_ENEMIES` 僅定義 `floor1_boss`（id: `floor1_boss`, floor: 5）。`spawnEnemiesForFloor` 中尋找 `{floor}_boss`（如 `10_boss`、`15_boss`）會找不到，導致 Boss 層無敵人。

**修正**：需新增 `floor2_boss`（第10層）和 `floor3_boss`（第15層）。

### 🐛 Bug 3：`unequipItem` 屬性計算錯誤

**位置**：`gameStore.ts:586-588`
```typescript
if (slot === 'w') {
  newPlayer.atk = 5 + getDefBonus(player.eq.a || { effect: {} });  // ❌ 應為 getAtkBonus??
} else {
  newPlayer.def = 2 + getAtkBonus(player.eq.w || { effect: {} });  // ❌ 應為 getDefBonus??
}
```
**問題**：卸載武器時用 `getDefBonus`（應用 `getAtkBonus`），卸載護甲時用 `getAtkBonus`（應用 `getDefBonus`）。雖然兩者都會回傳 0 若 key 不存在，但語義錯誤。

### 🐛 Bug 4：`useItem` 未消耗 MOVE 或結束回合

**問題**：使用道具不消耗行動點，也不自動結束回合。應消耗 2 MOVE 並結束回合（如 SPEC 設計）。

### 🐛 Bug 5：商店道具種類隨樓層增加

**位置**：`gameStore.ts:610`
```typescript
items: BASE_ITEMS.slice(0, 3 + Math.floor(nextFloor / 3)).map(i => ({ ...i, quantity: 1 }))
```
**問題**：商品是「庫存移除式」（買完就沒了），但每次進入樓層會刷新。這與商店設計意圖可能衝突。

### 🐛 Bug 6：`attack()` 中 win 條件引用 `get().boss` 但多餘

`get().boss` 只在 `nextFloor()` 中設定，但在 `attack()` 中 `enemies` 已經包含 Boss。`get().boss` 可能為 null，導致 `!get().boss` 永遠為 true。

### ⚠️ 已知限制

1. **音效系統**：`playTone` 目前為 no-op（expo-av 不支援合成音），需實際音檔
2. **無觸控滑動移動**：地圖僅支援點擊移動
3. **無 Fog of War**：地圖顯示全範圍可視
4. **無 Boss 多階段戰鬥**：Boss 僅為高 HP 敵人
5. **無道具稀有度發光動畫**：目前僅文字顏色區分

---

## 8. 開發任務分配

### Phase 1 — 架構規劃（Codex）
- [x] 審查 current codebase 結構
- [x] 提出需要重構或優化的部分
- [x] 規劃實作順序
- [x] **已完成**（即本 SPEC v3.0 文件）

### Phase 2 — 開發實作（Claude Code）

#### P0 — 嚴重 Bug 修正
- [ ] **修正 Win 條件邏輯** (`gameStore.ts:460`)
  - 在 `attack()` 中檢查 `floor >= 15 && 最終 Boss 死亡`
  - 在 `nextFloor()` 中檢查 `floor > 15` 直接設 win
- [ ] **新增樓層 10 和 15 的 Boss** (`gameStore.ts:120-130`)
  - 第 10 層 Boss：`floor2_boss`（如「咒縛巫妖」👁️）
  - 第 15 層 Boss：`floor3_boss`（如「深淵魔王」👿）
- [ ] **修正 `unequipItem` 屬性計算** (`gameStore.ts:586-588`)

#### P1 — 功能完善
- [ ] **音效整合 P3**：替換 `playTone` 為真實音效檔案（.wav/.mp3，Web Audio API 或 expo-av）
- [ ] **道具使用消耗 MOVE**：`useItem` 檢查並消耗 2 MOVE，自動結束回合
- [ ] **API 整合商店庫存**：商店刷新時考慮已購買商品

#### P3 — 增強功能
- [ ] **Boss 多階段戰鬥**：Boss 在 HP < 50% 時進入第二階段
- [ ] **觸控滑動移動**：地圖頁支援 pan gesture
- [ ] **道具稀有度視覺**：根據 `rarity` 顯示不同發光/顏色效果
- [ ] **Roll 歷史記錄**：骰子頁記錄最近 5-10 次擲骰
- [ ] **Fog of War**：只顯示已探索區域
- [ ] **戰鬥日誌動態滾動**：自動滾到最新
- [ ] **商店缺貨視覺效果**：售完商品有明確標示

### Phase 3 — Code Review（Codex）
- [ ] 審查所有新實作的程式碼
- [ ] 檢查 TypeScript 型別正確性
- [ ] 確認效能無重大問題

### Phase 4 — Bug 修正與優化（OpenCode）
- [ ] 修正 Code Review 發現的問題
- [ ] 效能優化（減少不必要的 re-render）
- [ ] 程式碼品質改善

### Phase 5 — 多角色測試（OpenClaw + 184）
- **企劃人格**：驗證遊戲設計是否符合 SPEC
- **軟體人格**：檢查程式碼正確性與穩定性
- **美術人格**：檢查 UI 一致性與視覺品質
- **測試人格**：執行完整 testing checklist

### Phase 6 — 迭代修正
- [ ] 根據測試回報修正問題
- [ ] 重複測試直到通過

---

## 9. 部署流程

| 平台 | 指令 | 備註 |
|:----:|:----|------|
| Web | `npx expo export --platform web` → `vercel --prod` | 自動從 `dist/` 部署 |
| iOS | `npx eas build --platform ios` | 需 Mac + Apple Developer |
| Android | `npx eas build --platform android` | 需 Google Play Console |

**目前部署**：https://rn-44ypqnwu4-dicoges-projects.vercel.app

---

## 10. 功能進度追蹤

| 功能 | 優先級 | 狀態 | 備註 |
|------|:------:|:----:|------|
| **P0 — 核心系統** |
| 新手教學 | P0 | ✅ | 5 步驟強制引導 Modal（TutorialOverlay），含互動要求 |
| 骰子系統 | P0 | ✅ | SVG D20 + Animated 旋轉動畫 + hasRolledThisTurn 防重複 + MOVE 計算 |
| 地圖移動 | P0 | ✅ | 點擊相鄰格移動（9×11 視窗），牆壁碰撞偵測，行動點消耗 |
| 戰鬥系統 | P0 | ✅ | D20 命中/暴擊/Miss + 敵人反擊 + 戰鬥日誌（8條）+ 音效 |
| 樓層生成 | P0 | ✅ | 30×20 地圖，8-12 房間，走廊自動連接，牆壁自動偵測，樓梯最遠 |
| 敵人系統 | P0 | ✅ | 9 種敵人，樓層難度倍率（1.0~3.0），Boss 每 5 層 |
| **P1 — 基礎功能** |
| 道具系統 | P1 | ✅ | 9 種道具（5 消耗品 + 2 武器 + 2 護甲），稀有度區分 |
| 商店系統 | P1 | ✅ | 每 3 層出現，金幣購買，庫存管理，鎖定提示 |
| 背包系統 | P1 | ✅ | 消耗品使用、武器/護甲裝備卸載、數量管理、屬性總覽 |
| 存檔系統 | P1 | ✅ | AsyncStorage 自動存檔（戰鬥/購買/樓層變更），含版本號與時間戳 |
| 升級系統 | P1 | ✅ | 經驗值累積（xpN × 1.5 遞增），升級 HP+10 / ATK+2 |
| 結算畫面 | P1 | ✅ | 勝利/失敗畫面，等級/金幣/層數統計，重新開始 |
| 跨平台部署 | P1 | ✅ | Web（Vercel）/ iOS / Android（EAS Build） |
| **P2 — 輔助功能** |
| 音效框架 | P2 | ⚠️ 部分 | expo-av 音效系統已建立（12 種音效），但 playTone 為 no-op（需實際音檔） |
| **P3 — 增強功能** |
| 音效檔案整合 | P3 | ❌ | 需替換為真實 .wav/.mp3 音效檔 |
| Boss 多階段戰鬥 | P3 | ❌ | 目前 Boss 僅為高 HP 敵人，無多階段技能系統 |
| 觸控滑動移動 | P3 | ❌ | 目前僅支援點擊移動 |
| 道具稀有度動畫 | P3 | ❌ | 目前無稀有度發光/粒子效果 |
| Fog of War | P3 | ❌ | 目前顯示全視野 |
| Roll 歷史記錄 | P3 | ❌ | 骰子頁無歷史記錄 |
| **🐛 待修正 Bug** |
| Win 條件永不觸發 | P0 | ❌ | `gameStore.ts:460`：`floor > 15` 永遠 false |
| 缺少樓層 10/15 Boss | P0 | ❌ | `BASE_ENEMIES` 僅含 floor1_boss |
| unequipItem 屬性混淆 | P0 | ❌ | `gameStore.ts:586-588` getDefBonus/getAtkBonus 互換 |
| useItem 未消耗 MOVE | P1 | ❌ | 使用道具不消耗行動點 |
| 商店刷新邏輯待驗證 | P1 | ❌ | 每次進樓層刷新商品 vs 庫存移除式 |

---

> **文件維護者**：DungeonD3 開發團隊
> **下一階段目標**：修正 P0 Bug → 完成 P1 功能完善 → 進入 P3 增強功能
> **相關文件**：[SPEC.md](./SPEC.md) (v2.0) | [DESIGN.md](../DESIGN.md) | [STYLE.md](../art/STYLE.md) | [README.md](./README.md)