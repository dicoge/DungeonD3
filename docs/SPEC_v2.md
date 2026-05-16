# DungeonD3 — 技術規格書 v2.0

> 版本：2.0 | 最後更新：2026-05-13 | 目標：上架 iOS/Android App Store + 網頁

---

## 1. 專案概述

### 1.1 一句話描述
**「用 D20 骰子決定命運的地城爬塔 RPG」**

玩家在自動生成的地城迷宮中探索，透過 D20 骰子戰鬥系統與敵人戰鬥，購買道具強化自己，挑戰每 5 層的 Boss，最終通過 15 層。

### 1.2 技術棧
| 技術 | 版本 | 用途 |
|------|------|------|
| React Native | 0.76+ | 跨平台 UI 框架 |
| Expo | SDK 54 | 開發工具鏈與建置 |
| TypeScript | 5.x | 型別安全 |
| Zustand | 4.x | 狀態管理 |
| @react-navigation/bottom-tabs | 6.x | 底部 Tab 導航 |
| react-native-svg | 15.x | D20 骰子 SVG 渲染 |
| expo-av | ~13.x | 音效播放 |
| @react-native-async-storage | 1.x | 本地持久化存檔 |

### 1.3 支援平台
- **Web**（開發測試）— Vercel 部署
- **iOS** — App Store 目標
- **Android** — Google Play 目標

---

## 2. 專案結構

```
rn/
├── App.tsx                    # 主入口 + Tab Navigation + GameOverOverlay
├── store/
│   └── gameStore.ts           # Zustand 遊戲狀態管理（核心邏輯）
├── screens/
│   ├── DiceScreen.tsx         # 🎲 骰子頁
│   ├── MapScreen.tsx          # 🗺️ 地圖頁
│   ├── BattleScreen.tsx       # ⚔️ 戰鬥頁
│   ├── ShopScreen.tsx         # 🛒 商店頁
│   └── InventoryScreen.tsx    # 🎒 背包頁
├── components/
│   └── D20Dice.tsx            # D20 骰子 SVG 動畫元件
│   └── TutorialOverlay.tsx    # 新手教學覆蓋層
├── data/
│   └── *.json                 # 遊戲資料（道具、敵人等）
├── services/
│   ├── audio.ts               # 音效服務
│   └── storage.ts             # AsyncStorage 存檔服務
├── types.ts                   # TypeScript 型別定義
├── app.json                   # Expo 設定
├── eas.json                   # EAS Build 設定
└── vercel.json                # Vercel 部署設定
```

---

## 3. 資料結構

### 3.1 Player
```typescript
interface Player {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  xp: number;
  level: number;
  equippedWeapon: Item | null;
  equippedArmor: Item | null;
  inventory: Item[];
}
```

### 3.2 Enemy
```typescript
interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xp: number;
  gold: number;
  emoji: string;
  isBoss?: boolean;
  description?: string;
}
```

### 3.3 Item
```typescript
interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'weapon' | 'armor';
  description: string;
  price: number;
  effect?: string;
  atkBonus?: number;
  defBonus?: number;
  healAmount?: number;
  quantity?: number;
}
```

### 3.4 GameState（核心）
```typescript
interface GameState {
  player: Player;
  floor: number;
  dungeon: DungeonMap;
  movePoints: number;
  hasRolledThisTurn: boolean;
  isRolling: boolean;
  currentEnemy: Enemy | null;
  battleLog: string[];
  gameOver: boolean;
  isVictory: boolean;
  tutorialStep: number;
  isTutorial: boolean;
  shopItems: Item[];
  shopLocked: boolean;
  level: number;
}
```

### 3.5 DungeonMap
```typescript
interface DungeonMap {
  width: number;
  height: number;
  tiles: TileType[];
  rooms: Room[];
  playerPos: Position;
  stairsPos: Position;
  enemies: Enemy[];
  items: Item[];
}
```

---

## 4. 核心系統設計

### 4.1 D20 骰子系統
| 機制 | 說明 |
|------|------|
| 骰值範圍 | 1 ~ 20（均勻隨機） |
| 行動點計算 | MOVE = max(1, floor(diceValue ÷ 3)) |
| 禁用規則 | hasRolledThisTurn flag，行動點 > 0 時不可骰 |
| 視覺 | SVG 二十面體，1.5 秒滾動動畫，紫色主題 |
| 每回合 | 只能擲骰一次，行動點歸零後恢復 |

### 4.2 戰鬥系統
| 情況 | 條件 | 傷害 |
|------|------|------|
| Miss | D20 = 1 | 0 |
| 命中 | D20 + ATK > DEF | ATK + D6 |
| 暴擊 | D20 = 20 | ATK + (D6 × 2) |

- 玩家永遠先手
- 攻擊後消耗 1 行動點，自動結束回合
- 敵人存活則反擊（同樣 D20 判定）
- 擊敗敵人獲得 XP + 金幣

### 4.3 地城生成
- 地圖尺寸：30 × 20 格
- 房間數量：8 ~ 12 個
- 房間連接：走廊自動生成
- 牆壁：自動偵測房間邊界生成
- 樓梯：恆定在最遠房間
- 可視範圍：9 × 11 視窗（ScrollView）

### 4.4 商店系統
| 規則 | 說明 |
|------|------|
| 出現頻率 | 每 3 層（3/6/9/12/15） |
| 貨幣 | 金幣（擊敗敵人取得） |
| 商品 | 消耗品 + 武器 + 護甲 |
| 鎖定 | 非商店樓層顯示 🔒 + 提示下一商店樓層 |

### 4.5 道具系統
**消耗品：**
| 道具 | 效果 | 價格 |
|------|------|:----:|
| 生命藥水 | 恢復 30 HP | $15 |
| 炸彈 | 對敵人造成 40 傷害 | $30 |
| 火球卷軸 | 對敵人造成 35 傷害 | $35 |
| 力量藥劑 | ATK +5（3 回合） | $50 |
| 鳳凰羽毛 | 死亡復活一次 | $200 |

**武器：**
| 道具 | ATK 加成 | 價格 |
|------|:--------:|:----:|
| 鐵劍 | +5 | $50 |
| 鋼鐵劍 | +10 | $100 |

**護甲：**
| 道具 | DEF 加成 | 價格 |
|------|:--------:|:----:|
| 皮甲 | +3 | $40 |
| 鎖子甲 | +7 | $90 |

### 4.6 升級系統
- XP 需求 = 上一級 × 1.5（遞增）
- 升級效果：HP 上限 +10、ATK +2、部分 HP 恢復

### 4.7 存檔系統
- 儲存引擎：AsyncStorage
- 存檔時機：進入新樓層、購買道具、使用道具、戰鬥結束
- 存檔內容：Player + Floor + DungeonMap + Enemies + Items + Timestamp

---

## 5. 遊戲流程

### 5.1 核心循環
```
[進入地城] → [新手教學] → [第1層開始]
                             ↓
                    ┌────────┴────────┐
                 [擲骰子]        [戰鬥結算]
                    ↓               ↓
              [獲得行動點數]   [經驗/金幣]
                    ↓               ↓
              [地圖移動] ← ← ← [敵人受傷]
                    ↓
              [遭遇事件]
         ┌────┬────┴────┬────┐
       道具  敵人  商店  樓梯
         ↓     ↓       ↓    ↓
      拾取  戰鬥  進入  下一層
                    ↓
              [重複直到15層或死亡]
                    ↓
               [結算畫面]
```

### 5.2 樓層系統
| 樓層 | 名稱 | 敵人倍率 | Boss |
|:----:|------|:--------:|:----:|
| 1-3 | 地底深處 | 1.0x | — |
| 4-6 | 遺忘墓穴 | 1.3x | 第5層 |
| 7-9 | 惡魔深淵 | 1.6x | 第10層 |
| 10-14 | 虛空裂隙 | 2.0x | — |
| 15 | 深淵之巔 | 3.0x | 最終Boss |

---

## 6. UI/UX 設計

### 6.1 底部 Tab 導航
| Tab | 圖示 | 功能 |
|:---:|:----:|------|
| 骰子 | 🎲 | 骰子視覺 + 角色狀態 + 擲骰按鈕 |
| 地圖 | 🗺️ | 地城迷宮 + 點擊移動 |
| 戰鬥 | ⚔️ | 敵人列表 + 攻擊 + 戰鬥日誌 |
| 商店 | 🛒 | 商品列表 + 購買（每3層） |
| 背包 | 🎒 | 道具管理 + 裝備區 + 角色屬性 |

### 6.2 新手教學（5 步驟）
1. **歡迎** — 嚮導介紹
2. **認識骰子** — 要求擲骰
3. **認識地圖** — 要求移動
4. **戰鬥教學** — 要求擊敗敵人
5. **開始冒險** — 完成提示

---

## 7. 效能目標
| 指標 | 目標 |
|------|:----:|
| 首屏載入 | < 3 秒 |
| 動畫幀率 | 60 FPS |
| 離線支援 | 完整本地存檔 |

---

## 8. 版本歷程
| 版本 | 日期 | 變更內容 |
|:----:|:----:|----------|
| 2.0 | 2026-05-13 | 完整系統實作（戰鬥、商店、背包、存檔、音效、教學、結算） |
| 1.1 | 2026-05-06 | 規格定義，核心系統設計 |
| 1.0 | 2026-05-04 | 初始規格，D20 骰子 + 地城生成 |

---

## 9. 部署方式

### 9.1 Web → Vercel
```bash
cd rn
npx expo export --platform web
vercel --prod
```

### 9.2 Android → EAS Build
```bash
expo init --force
eas build --profile preview --platform android
```

### 9.3 iOS
```bash
npx expo run:ios  # 需 Mac + Xcode
```

---

## 10. 未實作 / 改進項目
| 項目 | 優先級 | 說明 |
|------|:------:|------|
| 音效檔案整合 | P3 | 替換 playTone 為真實音檔 |
| Boss 多階段戰鬥 | P3 | 特殊技能系統 |
| 觸控滑動移動 | P3 | 支援滑動操作 |
| 道具稀有度動畫 | P3 | 發光/粒子效果 |
