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
- [x] 地城迷宮自動生成
- [x] 5 層 Tab 導航
- [x] 玩家屬性（HP/ATK/DEF/金幣/經驗/等級）
- [x] 敵人系統
- [x] 道具系統（消耗品/武器/護甲）
- [x] 商店購買
- [x] 背包管理
- [ ] 音效
- [ ] 存檔/讀檔
- [ ] 遊戲存檔持久化（AsyncStorage）
- [ ] 觸摸滑動移動

## 📌 注意

- Web 版本：https://rn-44ypqnwu4-dicoges-projects.vercel.app
- 原始 HTML/JS 版本在 `client/` 目錄（保留）
- React Native 版本在 `rn/` 目錄（新開發）
