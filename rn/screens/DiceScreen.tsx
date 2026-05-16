// ============================================================
// 🎲 骰子頁 — 遊戲主入口
// ============================================================
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import D20Dice from '../components/D20Dice';
import { useGameStore, TUTORIAL_STEPS } from '../store/gameStore';
import { SFX } from '../services/audio';

export default function DiceScreen() {
  const { diceValue, isRolling, rollDice, player, floor, movePoints, hasRolledThisTurn } = useGameStore();
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const tutorialDone = useGameStore(s => s.tutorialDone);

  const handleRoll = () => {
    SFX.roll();
    rollDice();
  };

  // 可以骰的條件：還沒骰過 + 行動點已歸零（上一回合結束）
  const canRoll = !hasRolledThisTurn && movePoints === 0 && !isRolling;

  // 根據骰值給予提示
  const getHint = () => {
    // 回合進行中，禁止骰
    if (hasRolledThisTurn) {
      return '⚔️ 回合進行中 — 消耗完行動點才能再骰！';
    }
    if (diceValue === null) {
      if (!tutorialDone && tutorialStep < TUTORIAL_STEPS.length) {
        const s = TUTORIAL_STEPS[tutorialStep];
        if (s.id === 'roll_dice') {
          return '🎯 ' + s.content.split('\n')[0];
        }
        return s.title + ' — 前往地圖頁！';
      }
      return '按「擲骰」開始你的回合！';
    }
    if (diceValue === 1) return '💀 大凶！行動點數 1 點...';
    if (diceValue === 20) return '🎉 完美 20！極高行動點數！';
    if (diceValue <= 6) return '😅 普通骰值，保守行動吧';
    if (diceValue <= 12) return '👍 還不錯的行動點數！';
    return '🔥 大骰值！盡情探索！';
  };

  const getMoveHint = () => {
    if (movePoints > 0) {
      return `📍 你有 ${movePoints} 點行動力！\n去「地圖」頁移動吧！`;
    }
    if (diceValue !== null) {
      return '⚠️ 行動點數已用完\n攻擊敵人或等下一回合';
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部狀態列 */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>樓層</Text>
          <Text style={styles.statusValue}>第 {floor} 層</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>❤️ HP</Text>
          <Text style={[styles.statusValue, styles.hpValue]}>
            {player.hp}/{player.maxHp}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>💰 金幣</Text>
          <Text style={styles.statusValue}>{player.gold}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Lv</Text>
          <Text style={[styles.statusValue, styles.lvlValue]}>{player.lvl}</Text>
        </View>
      </View>

      {/* 骰子區 */}
      <View style={styles.diceArea}>
        <D20Dice
          value={diceValue}
          isRolling={isRolling}
          onRoll={handleRoll}
          disabled={!canRoll}
        />

        {/* 骰值結果 */}
        {diceValue !== null && !isRolling && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              {diceValue === 20 ? '🌟 暴擊！' :
               diceValue === 1 ? '💀 大凶...' :
               `🎲 擲出 ${diceValue}！`}
            </Text>
            <Text style={styles.movePoints}>
              {movePoints > 0 ? `📍 獲得 ${movePoints} 點行動力` : ''}
            </Text>
          </View>
        )}

        {/* 提示文字 */}
        <Text style={styles.hint}>{getHint()}</Text>
        {getMoveHint() !== '' && (
          <View style={styles.moveHintBox}>
            <Text style={styles.moveHintText}>{getMoveHint()}</Text>
          </View>
        )}
      </View>

      {/* 底部狀態 */}
      <View style={styles.stats}>
        <View style={styles.statCol}>
          <Text style={styles.statIcon}>⚔️</Text>
          <Text style={styles.statNum}>{player.atk}</Text>
          <Text style={styles.statLabel}>攻擊力</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statIcon}>🛡️</Text>
          <Text style={styles.statNum}>{player.def}</Text>
          <Text style={styles.statLabel}>防禦力</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statNum}>{player.xp}/{player.xpN}</Text>
          <Text style={styles.statLabel}>經驗</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statIcon}>🎒</Text>
          <Text style={styles.statNum}>{player.inv.length}</Text>
          <Text style={styles.statLabel}>道具</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#12122a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 2,
  },
  statusValue: {
    color: '#ffd600',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hpValue: {
    color: '#ef5350',
  },
  lvlValue: {
    color: '#4fc3f7',
  },
  diceArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultCard: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ab47bc',
    minWidth: 200,
  },
  resultTitle: {
    color: '#ab47bc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movePoints: {
    color: '#4fc3f7',
    fontSize: 16,
  },
  hint: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  moveHintBox: {
    backgroundColor: '#12122a',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4fc3f7',
  },
  moveHintText: {
    color: '#4fc3f7',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#12122a',
    paddingVertical: 14,
    borderTopWidth: 2,
    borderTopColor: '#2a2a5a',
  },
  statCol: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statNum: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
});
