// ============================================================
// DungeonD3 — React Native 主入口 v2
// ============================================================
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DiceScreen from './screens/DiceScreen';
import MapScreen from './screens/MapScreen';
import BattleScreen from './screens/BattleScreen';
import ShopScreen from './screens/ShopScreen';
import InventoryScreen from './screens/InventoryScreen';
import TutorialOverlay from './components/TutorialOverlay';
import { useGameStore } from './store/gameStore';
import { initAudio, SFX } from './services/audio';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabIconText}>{emoji}</Text>
    </View>
  );
}

function GameOverOverlay() {
  const { over, win, player, initGame } = useGameStore();
  if (!over && !win) return null;
  return (
    <View style={styles.gameOver}>
      <View style={styles.gameOverCard}>
        <Text style={styles.gameOverTitle}>{win ? '🏆 勝利！' : '💀 遊戲結束'}</Text>
        <Text style={styles.gameOverText}>
          {win ? '你成功通過了所有 15 層地城！' : '你在第 ' + useGameStore.getState().floor + ' 層倒下...'}
        </Text>
        <View style={styles.gameOverStats}>
          <Text style={styles.gameOverStat}>等級 {player.lvl}</Text>
          <Text style={styles.gameOverStat}>金幣 {player.gold}</Text>
          <Text style={styles.gameOverStat}>通過 {useGameStore.getState().floor} 層</Text>
        </View>
        <TouchableOpacity style={styles.restartBtn} onPress={initGame}>
          <Text style={styles.restartBtnText}>重新開始</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const initGame = useGameStore(s => s.initGame);
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const tutorialVisible = !tutorialDone && tutorialStep < 5;
  const player = useGameStore(s => s.player);
  const prevLvl = React.useRef(player.lvl);

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
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: '#12122a',
                borderTopWidth: 2,
                borderTopColor: '#2a2a5a',
                height: 60,
                paddingBottom: 6,
                paddingTop: 6,
              },
              tabBarActiveTintColor: '#4fc3f7',
              tabBarInactiveTintColor: '#666',
              tabBarLabelStyle: {
                fontSize: 10,
                marginTop: 2,
              },
            }}
          >
            <Tab.Screen
              name="骰子"
              component={DiceScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎲" focused={focused} /> }}
            />
            <Tab.Screen
              name="地圖"
              component={MapScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} /> }}
            />
            <Tab.Screen
              name="戰鬥"
              component={BattleScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚔️" focused={focused} /> }}
            />
            <Tab.Screen
              name="商店"
              component={ShopScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} /> }}
            />
            <Tab.Screen
              name="背包"
              component={InventoryScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎒" focused={focused} /> }}
            />
          </Tab.Navigator>
          <GameOverOverlay />
          <TutorialOverlay visible={tutorialVisible} />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  tabIcon: {
    width: 30,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  tabIconActive: {
    backgroundColor: '#1a1a3a',
  },
  tabIconText: {
    fontSize: 16,
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
    borderColor: '#4fc3f7',
    maxWidth: 310,
  },
  gameOverTitle: {
    color: '#4fc3f7',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gameOverText: {
    color: '#e0e0e0',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  gameOverStat: {
    color: '#888',
    fontSize: 13,
  },
  restartBtn: {
    backgroundColor: '#ab47bc',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  restartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
