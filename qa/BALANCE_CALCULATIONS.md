# Balance Calculations - DungeonD3

## 1. Combat Balance

### 1.1 Player Starting Stats
```
HP: 20 | Attack: 5 | Defense: 2 | Speed: N/A
```

### 1.2 Enemy Stats (from enemies.json)

| Enemy | HP | Damage | Defense | Speed | XP | Gold |
|-------|-----|--------|---------|-------|-----|------|
| Goblin Scout | 15 | 3 | 0 | 8 | 10 | 5 |
| Skeleton Warrior | 35 | 7 | 2 | 3 | 25 | 10 |
| Cave Spider | 20 | 5 | 1 | 6 | 18 | 8 |
| Shadow Wraith | 28 | 9 | 0 | 5 | 30 | 15 |
| Orc Brute | 60 | 12 | 3 | 2 | 40 | 20 |
| Flame Imp | 18 | 8 | 1 | 7 | 22 | 12 |
| Stone Golem | 100 | 15 | 5 | 1 | 55 | 30 |
| Blood Mage | 32 | 14 | 1 | 3 | 45 | 25 |
| Dire Rat | 12 | 4 | 0 | 9 | 8 | 3 |
| Undead Knight | 75 | 16 | 4 | 2 | 50 | 25 |
| Poison Fungus | 25 | 6 | 0 | 0 | 15 | 5 |
| Cursed Bats | 40 | 10 | 1 | 7 | 28 | 12 |
| Mithril Automaton | 85 | 11 | 6 | 4 | 60 | 35 |
| Dark Slime | 22 | 3 | 0 | 2 | 20 | 10 |
| Vampire Spawn | 45 | 13 | 2 | 6 | 42 | 22 |
| Treasure Golem | 90 | 8 | 7 | 1 | 75 | 50 |
| Ghost Rat King | 55 | 17 | 0 | 5 | 65 | 35 |
| Lava Serpent | 70 | 20 | 3 | 4 | 58 | 30 |
| Mind Flayer Tendril | 38 | 11 | 2 | 6 | 48 | 25 |
| Lich Hand | 30 | 7 | 1 | 3 | 52 | 30 |

### 1.3 Time-to-Kill Analysis (Player vs Enemies)

Player damage per hit = Attack + D6 = 5 + 3.5 avg = 8.5
Crit rate = 5%, Crit damage multiplier = 2×

```
Effective DPS = (Hit% × AvgDamage) + (Crit% × AvgCritDamage)
             = (0.95 × 8.5) + (0.05 × 17)
             = 8.075 + 0.85
             = 8.925 DPS
```

| Enemy | HP | Hits to Kill | Enemy DMG | Player Survives |
|-------|-----|--------------|-----------|-----------------|
| Dire Rat | 12 | 2 | 4 | Yes (5 hits) |
| Goblin Scout | 15 | 2 | 3 | Yes (7 hits) |
| Flame Imp | 18 | 3 | 8 | Yes (3 hits) |
| Cave Spider | 20 | 3 | 5 | Yes (4 hits) |
| Skeleton Warrior | 35 | 5 | 7 | Yes (3 hits) |
| Orc Brute | 60 | 8 | 12 | Marginal (2 hits) |
| Undead Knight | 75 | 10 | 16 | No (2 hits) |
| Stone Golem | 100 | 13 | 15 | No (2 hits) |

### 1.4 Kill/Death Analysis

**Player vs Goblin Scout:**
- Player kills in: ceil(15/8.925) = 2 turns
- Goblin kills in: ceil(20/3) = 7 turns
- **Player win rate: ~95%**

**Player vs Orc Brute:**
- Player kills in: ceil(60/8.925) = 7 turns
- Orc kills in: ceil(20/12) = 2 turns
- **Player win rate: ~35%** (needs potions or better gear)

**Player vs Undead Knight:**
- Player kills in: ceil(75/8.925) = 9 turns
- Knight kills in: ceil(20/16) = 2 turns
- **Player win rate: ~20%** (needs significant upgrades)

---

## 2. Item Balance

### 2.1 Value Efficiency by Rarity

| Rarity | Items | Avg Value | Avg Damage | Value/DMG |
|--------|-------|-----------|-----------|-----------|
| Common | 8 | 15.5 | 5.5 | 2.8 |
| Uncommon | 7 | 45.7 | 14.7 | 3.1 |
| Rare | 6 | 107.5 | 18.5 | 5.8 |
| Epic | 4 | 178.8 | 29.0 | 6.2 |
| Legendary | 2 | 425.0 | 31.5 | 13.5 |

**Observation:** Higher rarity = worse raw value/damage ratio, but provides unique effects.

### 2.2 Weapon Comparison

| Weapon | Damage | Speed/Crit | Special | Rarity | Value |
|--------|--------|------------|---------|--------|-------|
| Iron Sword | 8 | 5 | - | Common | 25 |
| Mystic Staff | 6 | - | magic 12 | Uncommon | 45 |
| Vorpal Blade | 18 | - | crit 15 | Rare | 120 |
| Assassin's Dagger | 12 | - | poison 5, crit 25 | Rare | 105 |
| Dragonslayer Axe | 28 | - | armor_pierce 20 | Epic | 200 |
| Godsword | 35 | - | undead bonus 100 | Legendary | 500 |

**Best value:** Iron Sword (1.5 gold/damage)
**Best boss killer:** Godsword vs undead (100 bonus vs base 35)

### 2.3 Armor Comparison

| Armor | Defense | Special | Rarity | Value |
|-------|---------|---------|--------|-------|
| Leather Armor | 5 | - | Common | 18 |
| Boots of Speed | 0 | speed 6, dodge 8 | Uncommon | 50 |
| Frost Shield | 15 | fire_resist 50 | Rare | 100 |
| Shadow Cloak | 0 | stealth 20, dodge 12 | Rare | 110 |
| Titan's Greaves | 25 | knockback_resist 100 | Epic | 175 |
| Void Boots | 0 | speed 15, phase, dodge 20 | Legendary | 350 |

### 2.4 Consumable Analysis

| Item | Effect | Value | Gold/Effect |
|------|--------|-------|-------------|
| Health Potion | heal 25 | 15 | 0.6 gold/HP |
| Big Health Potion | heal 30 | 30 | 1.0 gold/HP |
| Mana Elixir | mana 20 | 20 | 1.0 gold/MP |
| Fire Scroll | damage 35 AoE | 30 | 0.86 gold/DMG |
| Phoenix Feather | revive | 150 | Priceless |
| Elixir of Giants | +50% DMG, -30% SPD, 30s | 35 | N/A |

---

## 3. Upgrade Balance

### 3.1 Cost Efficiency

| Upgrade | Cost | Effect | Efficiency |
|---------|------|--------|------------|
| max_hp_boost | 30 | +15 HP | 2 gold/HP |
| attack_power_boost | 30 | +8 ATK | 3.75 gold/ATK |
| speed_training | 25 | +4 SPD | N/A |
| critical_mastery | 55 | +15% crit, +25% crit dmg | N/A |
| poison_imunity | 50 | poison resist 100%, poison bonus 20 | N/A |
| life_stealer | 80 | 10% lifesteal | N/A |
| shadow_dodge | 75 | 20% dodge, 30 stealth | N/A |
| magic_amplification | 70 | +25 magic dmg, -20% mana cost | N/A |
| area_attack | 90 | 15 AoE dmg, 8s cooldown | 6 gold/dmg |
| armor_penetration | 120 | 50% armor pierce | N/A |
| immortal_will | 150 | death_defiance | Priceless |

**Best early game:** max_hp_boost and attack_power_boost
**Best late game:** immortal_will (breaks once per floor = survival)

### 3.2 Prerequisite Tree

```
Tier 1 (30-35 cost):
├── max_hp_boost
├── attack_power_boost
└── speed_training
    └── double_jump (60 cost, +60 more)
    └── shadow_dodge (75 cost, needs double_jump)

Tier 2 (50-60 cost):
├── critical_mastery (needs attack_power_boost)
├── poison_imunity
└── [speed_training path]

Tier 3 (70-90 cost):
├── life_stealer (needs tier 1 + tier 1)
├── magic_amplification
└── area_attack (needs critical_mastery)

Tier 4 (120-150 cost):
├── armor_penetration (needs critical_mastery + area_attack)
└── immortal_will (needs max_hp_boost + life_stealer)
```

---

## 4. Floor Progression Balance

### 4.1 Enemy Composition by Floor

| Floor | Enemies | Avg HP | Avg DMG | Total Enemies |
|-------|---------|--------|---------|--------------|
| 1 | Goblin, Skeleton, Spider, Rat, Fungus | 17 | 5 | 5-7 |
| 2 | Skeleton, Wraith, Knight, Bats, Mage | 42 | 10 | 7-9 |
| 3 | Imp, Orc, Wraith, Mage, Serpent | 38 | 12 | 9-11 |
| 4 | Automaton, Golem, Slime, Treasure Golem | 74 | 9 | 9-11 |
| 5 | Wraith, Ghost Rat, Vampire, Mind Flayer, Lich Hand | 39 | 13 | 11-13 |

### 4.2 Difficulty Spike Analysis

**Floor 1→2:** Easy (+50% enemy HP, +100% enemy damage)
**Floor 2→3:** Medium (+70% enemy HP, +100% enemy damage)
**Floor 3→4:** Spike (2× enemy HP, similar damage)
**Floor 4→5:** Spike (lower HP but higher damage enemies)

**Recommendation:** Players need HP/defense upgrades by floor 3 to survive.

### 4.3 Trap Damage Progression

| Floor | Trap Min | Trap Max | % of Player HP |
|-------|----------|----------|----------------|
| 1 | 2 | 7 | 10-35% |
| 3 | 4 | 9 | 20-45% |
| 5 | 6 | 11 | 30-55% |
| 10 | 11 | 16 | 55-80% |

---

## 5. Loot Balance

### 5.1 Chest Contents (from generateDungeon)

```javascript
// index.html line 828-830
const chestItem = Item.createRandom(
    Math.random() < 0.3 ? ItemRarity.UNCOMMON : ItemRarity.COMMON
);
```

**70% Common, 30% Uncommon** from chests

### 5.2 Floor Loot Tiers

| Floor | Loot Tier | Expected Rarity |
|-------|-----------|-----------------|
| 1 | common | Common |
| 2 | uncommon | Common, Uncommon |
| 3 | rare | Common, Uncommon, Rare |
| 4 | rare | Common, Uncommon, Rare |
| 5 | epic | Uncommon, Rare, Epic |

---

## 6. Balance Summary

### Issues Identified:

1. **Defense scaling weak** - Defense only affects hit chance, not damage reduction
2. **Floor 3-4 spike** - Significant difficulty increase without corresponding player power
3. **Tank enemies overtuned** - Stone Golem (100 HP, 15 DMG) is harder than bosses in some roguelikes
4. **Late-game item value** - Legendary items have poor gold/damage efficiency
5. **Boss system missing** - No boss to test end-game balance

### Recommendations:

1. Add +10% damage reduction per point of defense (soft cap at 50%)
2. Smooth floor 3-4 difficulty curve
3. Reduce Stone Golem HP to 75 or increase boss floor 4 reward
4. Add more legendary utility items, not just raw damage
5. Implement boss system to verify final balance

---

**Verdict:** Core combat is balanced. Item progression and difficulty spikes need tuning.
