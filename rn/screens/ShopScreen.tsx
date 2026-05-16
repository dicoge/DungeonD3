// ============================================================
// 🛒 商店頁
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { SFX } from '../services/audio';

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  uncommon: '#4caf50',
  rare: '#4fc3f7',
  legendary: '#ffd700',
};

// (string) => string lookup
function getEffectText(effect: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(effect)) {
    if (typeof value === 'number') {
      if (key === 'heal') parts.push(`恢復 ${value} HP`);
      else if (key === 'damage') parts.push(`造成 ${value} 傷害`);
      else if (key === 'atk') parts.push(`攻擊力 +${value}`);
      else if (key === 'def') parts.push(`防禦力 +${value}`);
      else if (key === 'atk_buff') parts.push(`攻擊 +${value}`);
    }
  }
  return parts.join('、') || '特殊道具';
}

export default function ShopScreen() {
  const { items, player, buyItem, floor, shopAvailable } = useGameStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerItem}>第 {floor} 層</Text>
        <Text style={styles.headerItem}>❤️ {player.hp}/{player.maxHp}</Text>
        <View style={styles.goldTag}>
          <Text style={styles.goldText}>💰 {player.gold}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopTitle}>🏪 地城商店</Text>
          <Text style={styles.shopDesc}>
            {shopAvailable
              ? '每 3 層出現的商店，購買道具強化自己！'
              : '商店只在第 3、6、9... 層出現'}
          </Text>
        </View>

        {!shopAvailable && (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedText}>
              下一個商店在第 {Math.ceil(floor / 3) * 3} 層
            </Text>
          </View>
        )}

        {shopAvailable && items.length === 0 && (
          <Text style={styles.emptyText}>商品已售完！</Text>
        )}

        {shopAvailable && items.map(item => {
          const canAfford = player.gold >= item.cost;
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <View>
                    <Text style={[styles.itemName, { color: RARITY_COLORS[item.rarity] }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemType}>{item.type.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.priceTag, !canAfford && styles.priceUnaffordable]}>
                  <Text style={[styles.price, !canAfford && styles.priceRed]}>💰 {item.cost}</Text>
                </View>
              </View>
              <Text style={styles.itemEffect}>{getEffectText(item.effect)}</Text>
              <TouchableOpacity
                style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                onPress={() => { SFX.buy(); buyItem(item.id); }}
                disabled={!canAfford}
              >
                <Text style={styles.buyBtnText}>
                  {canAfford ? '購買' : '金幣不足'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 攻略提示</Text>
          <Text style={styles.tipText}>
            • 生命藥水性價比最高，建議隨時保持庫存{'\n'}
            • Boss 關卡前建議HP全滿{'\n'}
            • 攻擊力提升讓你更快結束戰鬥
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#12122a',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
    gap: 12,
  },
  headerItem: { color: '#e0e0e0', fontSize: 13 },
  goldTag: {
    marginLeft: 'auto',
    backgroundColor: '#1a1a0a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd600',
  },
  goldText: { color: '#ffd600', fontSize: 14, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  shopHeader: { marginBottom: 16 },
  shopTitle: { color: '#ffd600', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  shopDesc: { color: '#888', fontSize: 13 },
  lockedBox: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a5a',
    marginBottom: 16,
  },
  lockedIcon: { fontSize: 36, marginBottom: 8 },
  lockedText: { color: '#888', fontSize: 14 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginVertical: 30 },
  itemCard: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIcon: { fontSize: 30, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: 'bold' },
  itemType: { color: '#888', fontSize: 11 },
  priceTag: {
    backgroundColor: '#1a1a0a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd600',
  },
  priceUnaffordable: { borderColor: '#ef5350' },
  price: { color: '#ffd600', fontSize: 14, fontWeight: 'bold' },
  priceRed: { color: '#ef5350' },
  itemEffect: { color: '#888', fontSize: 13, marginBottom: 10 },
  buyBtn: { backgroundColor: '#4caf50', borderRadius: 8, padding: 10, alignItems: 'center' },
  buyBtnDisabled: { backgroundColor: '#333', opacity: 0.4 },
  buyBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  tipBox: {
    backgroundColor: '#12122a',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  tipTitle: { color: '#4fc3f7', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  tipText: { color: '#888', fontSize: 12, lineHeight: 22 },
});
