// ============================================================
// 🗺️ 地圖頁 — D-Pad + 底部操作面板
// 手機格式重構
// ============================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';

const CELL = 40;
const VIEW_W = 9;
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
  const {
    map, player, floor, movePlayer, initGame, movePoints, enemies, isRolling,
    encounterEnemy, openInventory, rollDice,
    hasRolledThisTurn,
  } = useGameStore();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!map) initGame();
  }, []);

  // 點擊瓷磚移動
  const handleTileClick = (mx: number, my: number) => {
    if (movePoints <= 0) return;
    const dx = mx - player.x;
    const dy = my - player.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      const moved = movePlayer(dx, dy);
      if (moved) {
        useGameStore.getState().useMovePoint();
      }
    }
  };

  // 攻擊按鈕 — 觸發戰鬥 overlay
  const handleAttack = () => {
    if (movePoints <= 0 || enemies.length === 0) return;
    encounterEnemy(enemies[0]);
  };

  // 結束回合
  const handleEndTurn = () => {
    if (movePoints > 0) {
      useGameStore.setState({
        movePoints: 0,
        hasRolledThisTurn: false,
        diceValue: null,
      });
    } else if (!hasRolledThisTurn) {
      rollDice();
    }
  };

  if (!map) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>載入地城...</Text>
      </SafeAreaView>
    );
  }

  const startX = Math.max(0, Math.min(player.x - Math.floor(VIEW_W / 2), 30 - VIEW_W));
  const startY = Math.max(0, Math.min(player.y - Math.floor(VIEW_H / 2), 20 - VIEW_H));

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部狀態 */}
      <View style={styles.header}>
        <Text style={styles.headerItem}>🏰 第 {floor} 層</Text>
        <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
        <Text style={styles.headerItem}>💰 {player.gold}</Text>
        <View style={[styles.moveTag, movePoints > 0 ? styles.tagActive : styles.tagEmpty]}>
          <Text style={styles.moveTagText}>
            {movePoints > 0 ? `📍 ${movePoints}` : '⏸ 結束'}
          </Text>
        </View>
      </View>

      {/* 地圖網格 */}
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

                return (
                  <TouchableOpacity
                    key={`${mx}-${my}`}
                    style={[
                      styles.cell,
                      { backgroundColor: style.bg },
                      { borderColor: style.border },
                      isPlayer && styles.playerCell,
                    ]}
                    onPress={() => !isPlayer && handleTileClick(mx, my)}
                    disabled={movePoints <= 0 || isPlayer}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cellChar}>
                      {isPlayer ? '🧙' : style.char}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部操作面板 */}
      <View style={styles.bottomArea}>
        {/* 操作按鈕列 */}
        <View style={styles.actionPanel}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.atkBtn]}
            onPress={handleAttack}
            disabled={movePoints <= 0 || enemies.length === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>⚔️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => useGameStore.getState().openShop()}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={openInventory}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>🎒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.endTurnBtn]}
            onPress={handleEndTurn}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>
              {movePoints > 0 ? '⏸' : '🎲'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 精簡提示行 */}
        <Text style={styles.hint}>
          {movePoints > 0
            ? '👆 點擊相鄰格子移動 | 攻擊敵人或使用道具'
            : '⏸ 行動點耗盡 — 按「🎲」擲骰開始下一回合'}
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
  headerItem: { color: '#e0e0e0', fontSize: 13 },
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
  moveTagText: { fontSize: 12, fontWeight: 'bold', color: '#e0e0e0' },
  mapScroll: { flex: 1 },
  mapScrollContent: { justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
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
  cellChar: { fontSize: 16, textAlign: 'center' },
  // 底部操作面板
  bottomArea: {
    backgroundColor: '#12122a',
    borderTopWidth: 2,
    borderTopColor: '#2a2a5a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  // 操作面板
  actionPanel: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1a1a3a',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  atkBtn: {
    borderColor: '#e94560',
  },
  endTurnBtn: {
    borderColor: '#4fc3f7',
  },
  actionBtnText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hint: {
    color: '#4fc3f7',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  loading: { color: '#e0e0e0', fontSize: 16, textAlign: 'center', marginTop: 40 },
});