// ============================================================
// DungeonD3 — React Native 主入口 v3 (手機格式重構)
// 2 Tab + Overlay 模式
// ============================================================
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DiceScreen from './screens/DiceScreen';
import MapScreen from './screens/MapScreen';
import BattleOverlay from './components/BattleOverlay';
import ShopModal from './components/ShopModal';
import InventoryModal from './components/InventoryModal';
import TutorialOverlay from './components/TutorialOverlay';
import { useGameStore } from './store/gameStore';
import { initAudio, SFX } from './services/audio';

function BottomTabBar() {
  const activeTab = useGameStore(s => s.activeTab);
  const setActiveTab = useGameStore(s => s.setActiveTab);

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'dice' && styles.tabBtnActive]}
        onPress={() => setActiveTab('dice')}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>🎲</Text>
        <Text style={[styles.tabLabel, activeTab === 'dice' && styles.tabLabelActive]}>骰子</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'map' && styles.tabBtnActive]}
        onPress={() => setActiveTab('map')}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>🗺️</Text>
        <Text style={[styles.tabLabel, activeTab === 'map' && styles.tabLabelActive]}>地圖</Text>
      </TouchableOpacity>
    </View>
  );
}

function GameOverOverlay() {
  const over = useGameStore(s => s.over);
  const win = useGameStore(s => s.win);
  const player = useGameStore(s => s.player);
  const floor = useGameStore(s => s.floor);
  const initGame = useGameStore(s => s.initGame);
  if (!over && !win) return null;
  return (
    <View style={styles.gameOver}>
      <View style={[styles.gameOverCard, win ? styles.winCard : styles.loseCard]}>
        <Text style={styles.gameOverTitle}>{win ? '🏆 勝利！' : '💀 遊戲結束'}</Text>
        <Text style={styles.gameOverText}>
          {win
            ? '🎉 恭喜！你成功通過了所有 15 層地城！\n你是真正的地城探險家！'
            : `😭 你在第 ${floor} 層倒下了...\n但失敗只是通往成功的墊腳石！`}
        </Text>
        <View style={styles.gameOverStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{player.lvl}</Text>
            <Text style={styles.statLabel}>等級</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{player.gold}</Text>
            <Text style={styles.statLabel}>金幣</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🏰</Text>
            <Text style={styles.statValue}>{floor}</Text>
            <Text style={styles.statLabel}>層數</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.restartBtn, win ? styles.winBtn : styles.loseBtn]} onPress={initGame}>
          <Text style={styles.restartBtnText}>重新開始</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const initGame = useGameStore(s => s.initGame);
  const activeTab = useGameStore(s => s.activeTab);
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const showShop = useGameStore(s => s.showShop);
  const showInventory = useGameStore(s => s.showInventory);
  const over = useGameStore(s => s.over);
  const win = useGameStore(s => s.win);
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const player = useGameStore(s => s.player);
  const prevLvl = React.useRef(player.lvl);

  const tutorialVisible = !tutorialDone && tutorialStep < 6;

  useEffect(() => {
    initGame();
    initAudio();
  }, []);

  // Play level up sound when player levels up
  useEffect(() => {
    if (player.lvl > prevLvl.current) {
      SFX.levelUp();
    }
    prevLvl.current = player.lvl;
  }, [player.lvl]);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Tab 內容 — 根據 activeTab 切換 */}
        {activeTab === 'dice' ? <DiceScreen /> : <MapScreen />}

        {/* 自訂底部 Tab Bar (2 按鈕) */}
        <BottomTabBar />

        {/* Overlay 層 — 疊加在 Tab 內容之上 */}
        {currentEnemy && <BattleOverlay />}
        {showShop && <ShopModal />}
        {showInventory && <InventoryModal />}
        {over && <GameOverOverlay />}
        {tutorialVisible && <TutorialOverlay visible={tutorialVisible} />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderTopWidth: 2,
    borderTopColor: '#2a2a5a',
    height: 56,
    paddingBottom: 4,
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabBtnActive: {
    backgroundColor: '#1a1a3a',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#4fc3f7',
    fontWeight: 'bold',
  },
  gameOver: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,20,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    maxWidth: 310,
  },
  winCard: {
    borderColor: '#ffd700',
  },
  loseCard: {
    borderColor: '#4fc3f7',
  },
  gameOverTitle: {
    color: '#4fc3f7',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gameOverText: {
    color: '#e0e0e0',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  restartBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
  },
  winBtn: {
    backgroundColor: '#4caf50',
  },
  loseBtn: {
    backgroundColor: '#ab47bc',
  },
  restartBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});