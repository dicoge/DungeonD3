// ============================================================
// 🎒 背包頁
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  uncommon: '#4caf50',
  rare: '#4fc3f7',
  legendary: '#ffd700',
};

function getEffectText(effect: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(effect)) {
    if (typeof value === 'number') {
      if (key === 'heal') parts.push(`恢復 ${value} HP`);
      if (key === 'damage') parts.push(`傷害 ${value}`);
      if (key === 'atk') parts.push(`攻擊 +${value}`);
      if (key === 'def') parts.push(`防禦 +${value}`);
    }
  }
  return parts.join('、') || '特殊效果';
}

export default function InventoryScreen() {
  const { player, useItem, equipItem, unequipItem, floor } = useGameStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerItem}>第 {floor} 層</Text>
        <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
        <Text style={styles.headerItem}>💰 {player.gold}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 角色屬性 */}
        <View style={styles.playerCard}>
          <Text style={styles.playerEmoji}>🧙</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>冒險者 Lv.{player.lvl}</Text>
            <View style={styles.hpBarOuter}>
              <View style={[styles.hpBarInner, { width: `${(player.hp / player.maxHp) * 100}%` }]} />
            </View>
            <Text style={styles.hpText}>{player.hp} / {player.maxHp} HP</Text>
          </View>
        </View>

        {/* 屬性數值 */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{player.atk}</Text>
            <Text style={styles.statLabel}>⚔️ 攻</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{player.def}</Text>
            <Text style={styles.statLabel}>🛡️ 防</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{player.xp}/{player.xpN}</Text>
            <Text style={styles.statLabel}>📊 經驗</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{player.gold}</Text>
            <Text style={styles.statLabel}>💰 金</Text>
          </View>
        </View>

        {/* 裝備區 */}
        <Text style={styles.sectionTitle}>⚔️ 裝備</Text>
        <View style={styles.equipRow}>
          <View style={[styles.equipSlot, player.eq.w && styles.equipSlotFilled]}>
            <Text style={styles.slotLabel}>武器</Text>
            {player.eq.w ? (
              <>
                <Text style={styles.equipIcon}>{player.eq.w.icon}</Text>
                <Text style={styles.equipName}>{player.eq.w.name}</Text>
                <TouchableOpacity
                  style={styles.unequipBtn}
                  onPress={() => unequipItem('w')}
                >
                  <Text style={styles.unequipText}>卸載</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.slotEmpty}>空</Text>
            )}
          </View>
          <View style={[styles.equipSlot, player.eq.a && styles.equipSlotFilled]}>
            <Text style={styles.slotLabel}>護甲</Text>
            {player.eq.a ? (
              <>
                <Text style={styles.equipIcon}>{player.eq.a.icon}</Text>
                <Text style={styles.equipName}>{player.eq.a.name}</Text>
                <TouchableOpacity
                  style={styles.unequipBtn}
                  onPress={() => unequipItem('a')}
                >
                  <Text style={styles.unequipText}>卸載</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.slotEmpty}>空</Text>
            )}
          </View>
        </View>

        {/* 道具背包 */}
        <Text style={styles.sectionTitle}>🎒 道具 ({player.inv.length})</Text>
        {player.inv.length === 0 ? (
          <Text style={styles.emptyText}>背包是空的，去商店購買吧！</Text>
        ) : (
          player.inv.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <View>
                    <Text style={[styles.itemName, { color: RARITY_COLORS[item.rarity] }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                  </View>
                </View>
                {item.type !== 'consumable' && (
                  <View style={styles.equipActions}>
                    {item.type === 'weapon' && !player.eq.w && (
                      <TouchableOpacity
                        style={styles.equipBtn}
                        onPress={() => equipItem(item.id, 'w')}
                      >
                        <Text style={styles.equipBtnText}>裝備武器</Text>
                      </TouchableOpacity>
                    )}
                    {item.type === 'armor' && !player.eq.a && (
                      <TouchableOpacity
                        style={styles.equipBtn}
                        onPress={() => equipItem(item.id, 'a')}
                      >
                        <Text style={styles.equipBtnText}>裝備護甲</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              <Text style={styles.itemEffect}>{getEffectText(item.effect)}</Text>
              {item.type === 'consumable' && (
                <TouchableOpacity
                  style={styles.useBtn}
                  onPress={() => useItem(item.id)}
                >
                  <Text style={styles.useBtnText}>使用</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#12122a',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
  },
  headerItem: { color: '#e0e0e0', fontSize: 13 },
  content: { flex: 1, padding: 16 },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4fc3f7',
  },
  playerEmoji: { fontSize: 40, marginRight: 14 },
  playerInfo: { flex: 1 },
  playerName: { color: '#4fc3f7', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  hpBarOuter: { height: 10, backgroundColor: '#2a2a5a', borderRadius: 5, overflow: 'hidden' },
  hpBarInner: { height: '100%', backgroundColor: '#ef5350', borderRadius: 5 },
  hpText: { color: '#888', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  statNum: { color: '#e0e0e0', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  sectionTitle: { color: '#e94560', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  equipRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  equipSlot: {
    flex: 1,
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a5a',
    minHeight: 100,
  },
  equipSlotFilled: { borderColor: '#4fc3f7' },
  slotLabel: { color: '#888', fontSize: 11, marginBottom: 6 },
  slotEmpty: { color: '#555', fontSize: 24, marginTop: 10 },
  equipIcon: { fontSize: 30, marginBottom: 4 },
  equipName: { color: '#e0e0e0', fontSize: 12, textAlign: 'center', marginBottom: 6 },
  unequipBtn: { backgroundColor: '#2a1a1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  unequipText: { color: '#ef5350', fontSize: 11 },
  equipActions: { marginTop: 4 },
  equipBtn: { backgroundColor: '#1a3a2a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#4fc3f7' },
  equipBtnText: { color: '#4fc3f7', fontSize: 11 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  itemCard: {
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIcon: { fontSize: 26, marginRight: 10 },
  itemName: { fontSize: 14, fontWeight: 'bold' },
  itemQty: { color: '#888', fontSize: 12 },
  itemEffect: { color: '#888', fontSize: 12, marginBottom: 8 },
  useBtn: { backgroundColor: '#4fc3f7', borderRadius: 6, padding: 8, alignItems: 'center' },
  useBtnText: { color: '#0a0a14', fontSize: 13, fontWeight: 'bold' },
});
