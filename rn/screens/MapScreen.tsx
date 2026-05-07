// ============================================================
// 🗺️ 地圖頁 — 帶 D-Pad 移動控制 + 滑動觸摸
// ============================================================
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';

const CELL = 12; // 地圖格子大小
const MAP_W = 30;
const MAP_H = 20;

const CELL_COLORS: Record<string, { bg: string; char: string }> = {
  void:  { bg: '#0a0a14', char: '' },
  wall:  { bg: '#1a1a3a', char: '▓' },
  floor: { bg: '#12122a', char: '·' },
  stairs:{ bg: '#1a3a1a', char: '🚪' },
};

export default function MapScreen() {
  const { map, player, floor, movePlayer, initGame, movePoints, enemies, isRolling } = useGameStore();
  const scrollRef = useRef<ScrollView>(null);
  const animPlayerPos = useRef(new Animated.ValueXY()).current;
  const animKey = useRef(0);

  useEffect(() => {
    if (!map) initGame();
  }, []);

  // PanResponder for swipe movement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond if there's meaningful movement
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Prevent movement during dice rolling or no move points
        if (isRolling || movePoints <= 0) return;

        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Determine swipe direction (prioritize larger axis)
        let moved = false;
        if (absDx > absDy && absDx > 20) {
          // Horizontal swipe
          moved = movePlayer(dx > 0 ? 1 : -1, 0);
        } else if (absDy > absDx && absDy > 20) {
          // Vertical swipe
          moved = movePlayer(0, dy > 0 ? 1 : -1);
        }

        if (moved) {
          useGameStore.getState().useMovePoint();
          // Trigger animation
          animKey.current += 1;
          animPlayerPos.setValue({ x: 0, y: 0 });
          Animated.timing(animPlayerPos, {
            toValue: { x: 0, y: 0 },
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleMove = (dx: number, dy: number) => {
    if (movePoints <= 0) return;
    const moved = movePlayer(dx, dy);
    if (moved) {
      useGameStore.getState().useMovePoint();
    }
  };

  // 計算視野範圍（以玩家為中心 10x10 格）
  const viewW = 20;
  const viewH = 15;
  const startX = Math.max(0, Math.min(player.x - Math.floor(viewW / 2), MAP_W - viewW));
  const startY = Math.max(0, Math.min(player.y - Math.floor(viewH / 2), MAP_H - viewH));

  if (!map) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>載入地城...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部狀態 */}
      <View style={styles.header}>
        <Text style={styles.headerItem}>第 {floor} 層</Text>
        <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
        <Text style={styles.headerItem}>💰 {player.gold}</Text>
        <View style={[styles.moveTag, movePoints > 0 ? styles.moveTagActive : styles.moveTagEmpty]}>
          <Text style={styles.moveTagText}>
            {movePoints > 0 ? `📍 ${movePoints} 行動點` : '⏸ 行動點耗盡'}
          </Text>
        </View>
      </View>

      {/* 地圖（支援滑動） */}
      <View style={styles.mapContainer} {...panResponder.panHandlers}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapScroll}
        >
          <View style={styles.mapFrame} key={`map-${animKey.current}`}>
            {Array.from({ length: viewH }, (_, vy) => (
              <View key={vy} style={styles.row}>
                {Array.from({ length: viewW }, (_, vx) => {
                  const mx = startX + vx;
                  const my = startY + vy;
                  const isPlayer = mx === player.x && my === player.y;
                  const cell = (map.cells[my] && map.cells[my][mx]) || 'void';
                  const style = CELL_COLORS[cell] || CELL_COLORS.void;
                  return (
                    <View
                      key={`${mx}-${my}`}
                      style={[
                        styles.cell,
                        { backgroundColor: style.bg },
                        isPlayer && styles.playerCell,
                      ]}
                    >
                      <Text style={styles.cellChar}>
                        {isPlayer ? '🧙' : style.char}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 圖例 */}
        <View style={styles.legend}>
          <Text style={styles.legendText}>🧙 你</Text>
          <Text style={styles.legendText}>🚪 樓梯</Text>
          <Text style={styles.legendText}>· 地板</Text>
          <Text style={styles.legendText}>▓ 牆</Text>
          <Text style={styles.legendText}>👾 敵人</Text>
        </View>
      </View>

      {/* D-Pad 控制 */}
      <View style={styles.controls}>
        <View style={styles.dpadContainer}>
          {/* 上 */}
          <TouchableOpacity
            style={[styles.dpadBtn, styles.dpadUp, movePoints <= 0 && styles.dpadDisabled]}
            onPress={() => handleMove(0, -1)}
            disabled={movePoints <= 0}
          >
            <Text style={styles.dpadArrow}>▲</Text>
          </TouchableOpacity>

          <View style={styles.dpadMiddle}>
            {/* 左 */}
            <TouchableOpacity
              style={[styles.dpadBtn, styles.dpadLeft, movePoints <= 0 && styles.dpadDisabled]}
              onPress={() => handleMove(-1, 0)}
              disabled={movePoints <= 0}
            >
              <Text style={styles.dpadArrow}>◀</Text>
            </TouchableOpacity>

            {/* 中心 */}
            <View style={styles.dpadCenter}>
              <Text style={styles.dpadCenterText}>
                {movePoints > 0 ? `📍 ${movePoints}` : '⏸'}
              </Text>
            </View>

            {/* 右 */}
            <TouchableOpacity
              style={[styles.dpadBtn, styles.dpadRight, movePoints <= 0 && styles.dpadDisabled]}
              onPress={() => handleMove(1, 0)}
              disabled={movePoints <= 0}
            >
              <Text style={styles.dpadArrow}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* 下 */}
          <TouchableOpacity
            style={[styles.dpadBtn, styles.dpadDown, movePoints <= 0 && styles.dpadDisabled]}
            onPress={() => handleMove(0, 1)}
            disabled={movePoints <= 0}
          >
            <Text style={styles.dpadArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {movePoints > 0
              ? `滑動或按方向鍵移動，消耗 1 行動點（剩餘 ${movePoints}）`
              : '行動點已耗盡！擲骰子獲得行動點'}
          </Text>
        </View>
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
    gap: 12,
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
  moveTagActive: {
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#4fc3f7',
  },
  moveTagEmpty: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  moveTagText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    padding: 8,
  },
  mapScroll: {
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  playerCell: {
    backgroundColor: '#1a2a3a',
  },
  cellChar: {
    fontSize: 8,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    paddingVertical: 8,
  },
  legendText: {
    color: '#888',
    fontSize: 11,
  },
  controls: {
    backgroundColor: '#12122a',
    borderTopWidth: 2,
    borderTopColor: '#2a2a5a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dpadContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dpadMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#1a1a3a',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a5a',
  },
  dpadDisabled: {
    backgroundColor: '#0d0d1a',
    borderColor: '#1a1a2a',
    opacity: 0.5,
  },
  dpadUp: {},
  dpadDown: {},
  dpadLeft: {},
  dpadRight: {},
  dpadArrow: {
    color: '#4fc3f7',
    fontSize: 22,
  },
  dpadCenter: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  dpadCenterText: {
    color: '#4fc3f7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    alignItems: 'center',
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  loading: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
