# DungeonD3 — React Native 版本

地城爬塔 RPG 遊戲，使用 React Native + Expo 開發，支援 Web / iOS / Android。

## 🏗️ 技術棧

- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript
- **State**: Zustand
- **Navigation**: @react-navigation/bottom-tabs
- **Rendering**: react-native-svg
- **Audio**: expo-av

## 📱 運行方式

### Web（開發測試）
```bash
cd rn
npm install
npx expo start --web
```

### iOS（需 Mac + Xcode）
```bash
npx expo run:ios
```

### Android
```bash
npx expo run:android
```

## 🌐 部署

### Web → Vercel
```bash
cd rn
npx expo export --platform web
vercel --prod
```

Vercel 會自動從 `dist/` 目錄部署靜態網站。

## 📂 目錄結構

```
rn/
├── App.tsx              # 主入口 + Tab Navigation
├── store/
│   └── gameStore.ts     # Zustand 遊戲狀態管理
├── screens/
│   ├── DiceScreen.tsx   # 🎲 骰子頁
│   ├── MapScreen.tsx    # 🗺️ 地圖頁
│   ├── BattleScreen.tsx  # ⚔️ 戰鬥頁
│   ├── ShopScreen.tsx    # 🛒 商店頁
│   └── InventoryScreen.tsx # 🎒 背包頁
├── components/
│   └── D20Dice.tsx       # D20 骰子 SVG 元件
└── types.ts              # TypeScript 類型定義
```

## 🎮 遊戲功能

- [x] D20 骰子滾動動畫（SVG + Animated）
- [x] 地城迷宮自動生成（30×20，8-12 房間）
- [x] 5 層 Tab 導航（骰子/地圖/戰鬥/商店/背包）
- [x] 玩家屬性（HP/ATK/DEF/金幣/經驗/等級）
- [x] 敵人系統（9 種敵人，樓層難度倍率）
- [x] 道具系統（消耗品/武器/護甲，9 種道具）
- [x] 商店購買（每 3 層開放）
- [x] 背包管理（裝備/卸載/使用）
- [x] 音效系統（expo-av，12 種音效，需實際音檔）
- [x] 存檔/讀檔（AsyncStorage 自動存檔）
- [x] 遊戲結算畫面（勝利/失敗）
- [x] 新手教學（5 步驟引導）
- [x] 升級系統（經驗累積，HP+10 / ATK+2）
- [ ] 觸控滑動移動

## 📌 注意

- Web 版本：https://rn-44ypqnwu4-dicoges-projects.vercel.app
- 原始 HTML/JS 版本在 `client/` 目錄（保留）
- React Native 版本在 `rn/` 目錄（新開發）
