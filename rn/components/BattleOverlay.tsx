// ============================================================
// ⚔️ BattleOverlay — 全螢幕戰鬥覆蓋層
// 從 BattleScreen.tsx 移植
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { SFX } from '../services/audio';

const MAX_BATTLE_LOG = 8;
const NEARBY_ENEMY_COUNT = 5;

export default function BattleOverlay() {
  const { enemies, player, attack, currentEnemy, encounterEnemy, floor, skipEnemy } = useGameStore();
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const nearbyEnemies = useMemo(() => enemies.slice(0, NEARBY_ENEMY_COUNT), [enemies]);

  const handleEngage = useCallback((enemy: typeof enemies[0]) => {
    encounterEnemy(enemy);
    setBattleLog(prev => [`⚔️ 遭遇 ${enemy.name}！`, ...prev].slice(0, MAX_BATTLE_LOG));
  }, [encounterEnemy]);

  const handleAttack = useCallback(() => {
    if (!currentEnemy) return;
    const enemyName = currentEnemy.name;
    const { result, playerHit } = attack();

    if (result.crit) {
      SFX.crit();
    } else if (result.hit) {
      SFX.hit();
    }

    const lines: string[] = [];
    lines.push(`🎲 D20 = ${result.d20Value}`);
    if (result.crit) lines.push('✨ 暴擊！');
    else if (!result.hit) lines.push('💨 Miss！');
    else lines.push(`⚔️ 命中！造成 ${result.dmg} 傷害`);

    if (playerHit > 0) {
      lines.push(`👹 ${enemyName} 反擊！受到 ${playerHit} 傷害`);
    }

    if (currentEnemy && currentEnemy.currentHp <= 0) {
      lines.push(`🏆 擊敗 ${enemyName}！`);
      SFX.enemyDie();
    }

    setBattleLog(prev => [...lines, ...prev].slice(0, MAX_BATTLE_LOG));
  }, [currentEnemy, attack]);

  const handleRetreat = useCallback(() => {
    skipEnemy();
    setBattleLog([]);
  }, [skipEnemy]);

  // If no current enemy, show nearby enemy selection
  if (!currentEnemy) {
    return (
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>第 {floor} 層</Text>
            <View style={styles.headerRight}>
              <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
              <Text style={styles.headerItem}>⚔️ {player.atk}</Text>
            </View>
          </View>

          <View style={styles.noEnemy}>
            <Text style={styles.noEnemyTitle}>👾 附近敵人</Text>
            {nearbyEnemies.length === 0 ? (
              <Text style={styles.noEnemyText}>這個區域很安全！</Text>
            ) : (
              nearbyEnemies.map(enemy => (
                <TouchableOpacity
                  key={enemy.id}
                  style={styles.enemyListItem}
                  onPress={() => handleEngage(enemy)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.enemyListIcon}>{enemy.icon}</Text>
                  <View style={styles.enemyListInfo}>
                    <Text style={styles.enemyListName}>{enemy.name}</Text>
                    <Text style={styles.enemyListHp}>HP {enemy.currentHp}/{enemy.hp}</Text>
                  </View>
                  <Text style={styles.engageBtn}>交戰 ▶</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={handleRetreat} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕ 關閉</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.backdrop} />
      <View style={styles.content}>
        {/* 玩家狀態 */}
        <View style={styles.playerCard}>
          <Text style={styles.playerEmoji}>🧙</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>冒險者 Lv.{player.lvl}</Text>
            <View style={styles.hpBarOuter}>
              <View style={[styles.hpBarInner, { width: `${Math.min(100, Math.max(0, (player.hp / player.maxHp) * 100))}%` }]} />
            </View>
            <Text style={styles.hpText}>{player.hp} / {player.maxHp} HP</Text>
          </View>
        </View>

        {/* 戰鬥區 */}
        <View style={styles.battleZone}>
          <View style={styles.enemyCard}>
            <View style={styles.enemyHeader}>
              <Text style={styles.enemyEmoji}>{currentEnemy.icon}</Text>
              <View>
                <Text style={styles.enemyName}>{currentEnemy.name}</Text>
                <Text style={styles.enemyType}>{currentEnemy.rarity.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.enemyHpBar}>
              <View style={[styles.enemyHpFill, { width: `${Math.min(100, Math.max(0, (currentEnemy.currentHp / currentEnemy.hp) * 100))}%` }]} />
            </View>
            <Text style={styles.enemyHpText}>
              {currentEnemy.currentHp} / {currentEnemy.hp} HP
            </Text>
            <Text style={styles.enemyStats}>
              ⚔️ 攻 {currentEnemy.damage} | 🛡️ 防 {currentEnemy.def}
            </Text>
          </View>

          <TouchableOpacity style={styles.attackBtn} onPress={handleAttack} activeOpacity={0.7}>
            <Text style={styles.attackBtnText}>⚔️ 攻擊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.escapeBtn} onPress={handleRetreat} activeOpacity={0.7}>
            <Text style={styles.escapeText}>撤退</Text>
          </TouchableOpacity>
        </View>

        {/* 戰鬥日誌 */}
        {battleLog.length > 0 && (
          <View style={styles.logBox}>
            <Text style={styles.logTitle}>📜 戰鬥日誌</Text>
            {battleLog.map((line, i) => {
              let logStyle = styles.logLine;
              if (line.includes('暴擊')) logStyle = styles.logCrit;
              else if (line.includes('命中')) logStyle = styles.logHit;
              else if (line.includes('Miss')) logStyle = styles.logMiss;
              else if (line.includes('反擊')) logStyle = styles.logEnemy;
              return <Text key={`log-${i}-${line.slice(0, 10)}`} style={logStyle}>{line}</Text>;
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 20, 0.85)',
  },
  content: {
    width: '90%',
    maxWidth: 340,
    maxHeight: '85%',
    backgroundColor: '#0a0a14',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e94560',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a5a',
  },
  headerTitle: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerItem: { color: '#e0e0e0', fontSize: 13 },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4fc3f7',
  },
  playerEmoji: { fontSize: 36, marginRight: 12 },
  playerInfo: { flex: 1 },
  playerName: { color: '#4fc3f7', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  hpBarOuter: { height: 10, backgroundColor: '#2a2a5a', borderRadius: 5, overflow: 'hidden' },
  hpBarInner: { height: '100%', backgroundColor: '#ef5350', borderRadius: 5 },
  hpText: { color: '#888', fontSize: 12, marginTop: 4 },
  battleZone: { marginBottom: 12 },
  enemyCard: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  enemyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  enemyEmoji: { fontSize: 34, marginRight: 12 },
  enemyName: { color: '#e0e0e0', fontSize: 15, fontWeight: 'bold' },
  enemyType: { color: '#e94560', fontSize: 11, marginTop: 1 },
  enemyHpBar: { height: 8, backgroundColor: '#2a2a5a', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  enemyHpFill: { height: '100%', backgroundColor: '#ef5350', borderRadius: 4 },
  enemyHpText: { color: '#888', fontSize: 12, marginBottom: 4 },
  enemyStats: { color: '#888', fontSize: 12 },
  attackBtn: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  attackBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  escapeBtn: {
    alignItems: 'center',
    padding: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  escapeText: { color: '#888', fontSize: 14 },
  noEnemy: { marginBottom: 12 },
  noEnemyTitle: { color: '#e94560', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  noEnemyText: { color: '#888', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  enemyListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4fc3f7',
  },
  enemyListIcon: { fontSize: 26, marginRight: 10 },
  enemyListInfo: { flex: 1 },
  enemyListName: { color: '#e0e0e0', fontSize: 14, fontWeight: 'bold' },
  enemyListHp: { color: '#888', fontSize: 12 },
  engageBtn: { color: '#4fc3f7', fontSize: 13, fontWeight: 'bold' },
  closeBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 14 },
  logBox: {
    backgroundColor: '#0d0d1a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  logTitle: { color: '#4fc3f7', fontSize: 12, marginBottom: 6 },
  logLine: { color: '#888', fontSize: 12, marginVertical: 1 },
  logCrit: { color: '#ffd700', fontSize: 12, marginVertical: 1, fontWeight: 'bold' },
  logHit: { color: '#e0e0e0', fontSize: 12, marginVertical: 1 },
  logMiss: { color: '#555', fontSize: 12, marginVertical: 1 },
  logEnemy: { color: '#e94560', fontSize: 12, marginVertical: 1 },
});