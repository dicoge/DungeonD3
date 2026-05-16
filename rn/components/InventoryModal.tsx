// ============================================================
// 🎒 InventoryModal — 背包 Modal
// 從 InventoryScreen.tsx 移植
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
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

export default function InventoryModal() {
  const { player, useItem, equipItem, unequipItem, floor, closeInventory } = useGameStore();

  return (
    <Modal transparent visible animationType="fade" onRequestClose={closeInventory}>
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>第 {floor} 層</Text>
              <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
            </View>
            <Text style={styles.headerGold}>💰 {player.gold}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeInventory} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
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
                      activeOpacity={0.7}
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
                      activeOpacity={0.7}
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
                            activeOpacity={0.7}
                          >
                            <Text style={styles.equipBtnText}>裝備武器</Text>
                          </TouchableOpacity>
                        )}
                        {item.type === 'armor' && !player.eq.a && (
                          <TouchableOpacity
                            style={styles.equipBtn}
                            onPress={() => equipItem(item.id, 'a')}
                            activeOpacity={0.7}
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
                      activeOpacity={0.7}
                    >
                      <Text style={styles.useBtnText}>使用</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 340,
    maxHeight: '85%',
    backgroundColor: '#0a0a14',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4fc3f7',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#12122a',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
    gap: 10,
  },
  headerTitle: { color: '#e0e0e0', fontSize: 14, fontWeight: 'bold' },
  headerItem: { color: '#e0e0e0', fontSize: 13 },
  headerGold: {
    marginLeft: 'auto',
    color: '#ffd600',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a5a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#e0e0e0', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
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
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  statNum: { color: '#e0e0e0', fontSize: 14, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 10, marginTop: 2 },
  sectionTitle: { color: '#e94560', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  equipRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  equipSlot: {
    flex: 1,
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a5a',
    minHeight: 90,
  },
  equipSlotFilled: { borderColor: '#4fc3f7' },
  slotLabel: { color: '#888', fontSize: 11, marginBottom: 4 },
  slotEmpty: { color: '#555', fontSize: 22, marginTop: 8 },
  equipIcon: { fontSize: 28, marginBottom: 4 },
  equipName: { color: '#e0e0e0', fontSize: 11, textAlign: 'center', marginBottom: 6 },
  unequipBtn: { backgroundColor: '#2a1a1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, minHeight: 28, justifyContent: 'center' },
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
  itemIcon: { fontSize: 24, marginRight: 8 },
  itemName: { fontSize: 14, fontWeight: 'bold' },
  itemQty: { color: '#888', fontSize: 12 },
  itemEffect: { color: '#888', fontSize: 12, marginBottom: 8 },
  useBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  useBtnText: { color: '#0a0a14', fontSize: 13, fontWeight: 'bold' },
});