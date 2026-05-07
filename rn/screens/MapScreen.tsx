// ============================================================
// 🗺️ 地圖頁 — 點擊移動 + 大格子
// ============================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';

const CELL = 38; // 加大格子，方便點擊
const VIEW_W = 9;  // 可視範圍
const VIEW_H = 11;

const CELL_COLORS: Record<string, { bg: string; border: string; char: string }> = {
  void:   { bg: '#0a0a14', border: '#0a0a14', char: '' },
  wall:   { bg: '#1a1a3a', border: '#2a2a5a', char: '▓' },
  floor:  { bg: '#12122a', border: '#1a1a3a', char: '·' },
  stairs: { bg: '#1a3a1a', border: '#2a5a2a', char: '🚪' },
  enemy:  { bg: '#2a1010', border: '#ef5350', char: '👾' },
  item:   { bg: '#2a2a00', border: '#ffd600', char: '💎' },
};

export default function MapScreen() {
  const { map, player, floor, movePlayer, initGame, movePoints, enemies, isRolling } = useGameStore();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!map) initGame();
  }, []);

  // 點擊瓷磚移動
  const handleTileClick = (mx: number, my: number) => {
    if (movePoints <= 0) return;
    const dx = mx - player.x;
    const dy = my - player.y;
    // 只允許上下左右一步
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      const moved = movePlayer(dx, dy);
      if (moved) {
        useGameStore.getState().useMovePoint();
      }
    }
  };

  if (!map) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>載入地城...</Text>
      </SafeAreaView>
    );
  }

  // 計算可視範圍（以玩家為中心）
  const startX = Math.max(0, Math.min(player.x - Math.floor(VIEW_W / 2), 30 - VIEW_W));
  const startY = Math.max(0, Math.min(player.y - Math.floor(VIEW_H / 2), 20 - VIEW_H));

  // 檢查瓷磚上是否有敵人或道具
  const enemyOnTile = (x: number, y: number) => enemies.find(e => e.x === x && e.y === y);
  const itemOnTile = (x: number, y: number) => {
    // 簡化：沒有物品地圖，用 floor 上的隨機判断
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部狀態 */}
      <View style={styles.header}>
        <Text style={styles.headerItem}>🏰 第 {floor} 層</Text>
        <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
        <Text style={styles.headerItem}>💰 {player.gold}</Text>
        <View style={[styles.moveTag, movePoints > 0 ? styles.tagActive : styles.tagEmpty]}>
          <Text style={styles.moveTagText}>
            {movePoints > 0 ? `📍 ${movePoints} 行動點` : '⏸ 回合結束'}
          </Text>
        </View>
      </View>

      {/* 地圖（ScrollView 包住，可滑動） */}
      <ScrollView
        ref={scrollRef}
        style={styles.mapScroll}
        contentContainerStyle={styles.mapScrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.mapFrame}>
          {Array.from({ length: VIEW_H }, (_, vy) => (
            <View key={vy} style={styles.row}>
              {Array.from({ length: VIEW_W }, (_, vx) => {
                const mx = startX + vx;
                const my = startY + vy;
                const isPlayer = mx === player.x && my === player.y;
                const cell = (map.cells[my] && map.cells[my][mx]) || 'void';
                const style = CELL_COLORS[cell] || CELL_COLORS.void;
                const enemy = enemyOnTile(mx, my);
                const hasEnemy = !!enemy;

                return (
                  <TouchableOpacity
                    key={`${mx}-${my}`}
                    style={[
                      styles.cell,
                      { backgroundColor: hasEnemy ? '#2a1010' : style.bg },
                      { borderColor: hasEnemy ? '#ef5350' : style.border },
                      isPlayer && styles.playerCell,
                    ]}
                    onPress={() => !isPlayer && handleTileClick(mx, my)}
                    disabled={movePoints <= 0 || isPlayer}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellChar}>
                      {isPlayer ? '🧙' : hasEnemy ? enemy.icon : style.char}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 圖例 + 提示 */}
      <View style={styles.footer}>
        <View style={styles.legend}>
          <Text style={styles.legendText}>🧙 你</Text>
          <Text style={styles.legendText}>🚪 樓梯</Text>
          <Text style={styles.legendText}>👾 敵人</Text>
          <Text style={styles.legendText}>▓ 牆 · 地板</Text>
        </View>
        <Text style={styles.hint}>
          {movePoints > 0
            ? '👆 點擊相鄰格子移動（消耗行動點）'
            : '⏸ 行動點耗盡！去骰子頁骰下一回合'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#12122a',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
    gap: 10,
    flexWrap: 'wrap',
  },
  headerItem: {
    color: '#e0e0e0',
    fontSize: 13,
  },
  moveTag: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagActive: {
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#4fc3f7',
  },
  tagEmpty: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  moveTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  mapScroll: {
    flex: 1,
  },
  mapScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mapFrame: {
    borderWidth: 2,
    borderColor: '#2a2a5a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL,
    height: CELL,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  playerCell: {
    backgroundColor: '#1a2a4a',
    borderColor: '#4fc3f7',
    borderWidth: 2,
  },
  cellChar: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#12122a',
    borderTopWidth: 2,
    borderTopColor: '#2a2a5a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  legendText: {
    color: '#888',
    fontSize: 11,
  },
  hint: {
    color: '#4fc3f7',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loading: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
