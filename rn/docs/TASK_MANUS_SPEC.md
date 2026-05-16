# Manus 規格書製作任務

## 背景
DungeonD3 是一款用 D20 骰子決定命運的地城爬塔 RPG，使用 React Native + Expo 開發，已部署到 https://rn-ivory.vercel.app。

遊戲核心機制：
- 回合制 Roguelike，通過 15 層地城
- 擲 D20 骰子獲得行動點數（1~7 點）
- 在地城地圖上點擊移動，擊敗敵人
- 商店購買道具，背包管理裝備
- 每 5 層有 Boss 戰

UI 採用「手機格式」：
- 底部 2 個 Tab：🎲 骰子 / 🗺️ 地圖
- 戰鬥/商店/背包為 overlay/modal
- 地圖可以點擊鄰近格子移動（無 D-Pad）

## 現有文件（請先閱讀）
- /home/dicoge/game-studio/DungeonD3/rn/SPEC_v3.md — 現有完整規格書 v3.0
- /home/dicoge/game-studio/DungeonD3/rn/store/gameStore.ts — 遊戲邏輯（Tutorial Steps 定義在約 186-218 行）
- /home/dicoge/game-studio/DungeonD3/rn/ARCHITECTURE_MOBILE.md — 手機格式重構方案
- /home/dicoge/game-studio/DungeonD3/rn/components/TutorialOverlay.tsx — 現有教學 overlay 實作

## 需製作的規格

### 1. 新手教學系統規格書 (path: /home/dicoge/game-studio/DungeonD3/rn/docs/TUTORIAL_SPEC.md)

用戶對現有教學的回饋問題：
1. ❌ 「不應該教我」— 教學不應該只是被動的文字解說，應該引導玩家實際操作
2. ❌ 「怎麼只有文字說明」— 現有教學全是文字，缺乏互動引導
3. ❌ 「我希望一步一步引導」— 玩家想做一步、教學引導一步，而非一次性全部看完
4. ❌ 「最後還得按跳過教學才能關閉」— 教學完成後應自動關閉，不需要「跳過」按鈕

請參照以下設計原則產出規格書：

#### 新教學系統設計原則
1. **操作引導取代文字說明**：教學應該告訴玩家「下一步做什麼」，而不是「遊戲的規則是什麼」
2. **強制步驟引導**：玩家必須完成當前步驟才能進行下一步（不能跳過）
3. **高亮提示**：當前要操作的 UI 元素應該被高亮/發光，其他地方變暗
4. **自動進度**：完成動作後自動到下一步，不需要按按鈕
5. **可重播**：教學可以從設定中重播
6. **簡短集中**：不超過 6 個步驟，每一步只教一個動作

#### 建議教學流程
1. 歡迎畫面（1 張卡片，按「開始」進入）
2. 引導擲骰（高亮骰子按鈕，玩家按了才繼續）
3. 引導移動（切到地圖頁、高亮可移動的格子，玩家點擊移動後繼續）
4. 引導攻擊（遇到敵人後高亮攻擊按鈕，玩家攻擊後繼續）
5. 引導使用道具（高亮道具按鈕/背包，玩家使用後繼續）
6. 教學完成自動關閉（顯示「開始冒險！」動畫後自動消失）

#### 規格書應包含
1. 步驟流程設計（每一步的 UI 狀態、玩家操作、觸發條件）
2. 高亮系統設計（Hightlight 元件規格、遮罩、動畫）
3. 與 gameStore 的整合方式（state 設計）
4. 與現有 BattleOverlay/ShopModal/InventoryModal 的相容性
5. 錯誤處理（玩家亂點時的行為）

### 2. 更新遊戲規格書 v4.0 (path: /home/dicoge/game-studio/DungeonD3/rn/SPEC_v4.md)

基於 SPEC_v3.md 更新，加入以下變更：
- UI 已從 5 Tab 改為 2 Tab + Overlay 模式
- 移除 D-Pad 方向鍵，改為純點擊移動
- 新增新手教學系統規格
- 更新畫面清單（移除 BattleScreen/ShopScreen/InventoryScreen 獨立頁面）
- 更新技術架構章節（移除 react-navigation 依賴）

## 檔案路徑規範
所有新文件請放在：
- /home/dicoge/game-studio/DungeonD3/rn/docs/TUTORIAL_SPEC.md（教學規格）
- /home/dicoge/game-studio/DungeonD3/rn/SPEC_v4.md（更新規格）

## 注意事項
- 使用繁體中文
- 保持專業、清晰的遊戲設計文件風格
- 每個步驟的 UI mockup 可用文字描述（如：「步驟2：地圖上可移動的格子發出藍色光芒，其他部分變暗」）
- 參考現有 SPEC_v3.md 的格式和深度