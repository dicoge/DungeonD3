# Detailed Test Plan - DungeonD3

## Test Environment
- Browser: Any modern browser with JavaScript enabled
- Platform: HTML5 single-file game (client/index.html)
- Test User: LocalStorage-based save system

---

## 1. DICE SYSTEM TESTS

### TC-001: D3 Roll Distribution
```
Action: Click "Roll D3" button 1000 times
Expected: Values {1,2,3} with ~33% each (±5% variance acceptable)
Pass Criteria: Chi-square test p-value > 0.01
```

### TC-002: D6 Roll Distribution
```
Action: Click "Roll D6" button 1000 times
Expected: Values {1,2,3,4,5,6} with ~16.67% each
Pass Criteria: Chi-square test p-value > 0.01
```

### TC-003: D20 Roll Distribution
```
Action: Click "Roll D20" button 1000 times
Expected: Values {1..20} with ~5% each
Pass Criteria: Chi-square test p-value > 0.01
```

### TC-004: Attack Roll Natural 1
```
Action: Initiate combat, observe d20 roll = 1
Expected: Attack always misses regardless of attack bonus
Pass Criteria: "miss" displayed in combat log
```

### TC-005: Attack Roll Natural 20
```
Action: Initiate combat, observe d20 roll = 20
Expected: Critical hit, damage doubled
Pass Criteria: "CRITICAL HIT!" displayed, damage × 2
```

### TC-006: Attack vs Defense Hit Calculation
```
Action: Set player attack=5, enemy defense=5, multiple attacks
Expected: Hit if (d20 roll + 5) > 5
Pass Criteria: ~80% hit rate observed over 100 attacks
```

---

## 2. COMBAT SYSTEM TESTS

### TC-010: Player vs Goblin (Level 1)
```
Setup: New game, no equipment
Action: Move to goblin and attack
Expected: Player has 20 HP, Goblin has 10 HP, player attacks first
Pass Criteria: Player wins 70%+ of encounters
```

### TC-011: Damage Calculation
```
Setup: attackBonus=5, weapon attack=3
Action: Attack enemy
Expected: Damage = (5+3) + rollD6()
Pass Criteria: Damage range 9-17 (if D6=1-6)
```

### TC-012: Enemy Counterattack
```
Setup: Player attacks and kills enemy
Expected: Enemy does not counterattack when killed
Pass Criteria: Combat log shows no enemy damage after kill
```

### TC-013: Critical Hit Damage Doubling
```
Setup: Get natural 20 on attack roll
Expected: Base damage × 2
Pass Criteria: Crit damage = 2 × (attackBonus + D6)
```

---

## 3. MOVEMENT & TILE INTERACTION TESTS

### TC-020: Wall Collision
```
Action: Move toward wall
Expected: Movement blocked, no turn consumed
Pass Criteria: "You cannot move there." message
```

### TC-021: Trap Trigger
```
Action: Step on trap tile
Expected: Take damage (D6 + floor), trap destroyed
Pass Criteria: HP reduced, tile changes to floor
```

### TC-022: Stairs Descent
```
Action: Move onto stairs tile
Expected: Generate new floor, increment floor counter
Pass Criteria: Floor increases, new dungeon generated
```

### TC-023: Door Passage
```
Action: Move through door tile
Expected: Pass without action
Pass Criteria: Player moves to new tile, no damage
```

---

## 4. INVENTORY TESTS

### TC-030: Item Pickup
```
Action: Move onto item tile
Expected: Item added to inventory, removed from ground
Pass Criteria: Item appears in inventory panel
```

### TC-031: Weapon Equip
```
Action: Click weapon in inventory
Expected: Weapon equipped, stats updated
Pass Criteria: Attack stat increases by weapon value
```

### TC-032: Armor Equip
```
Action: Click armor in inventory
Expected: Armor equipped, stats updated
Pass Criteria: Defense stat increases by armor value
```

### TC-033: Potion Use
```
Action: Click potion in inventory
Expected: HP restored, potion consumed
Pass Criteria: HP increases, item removed from inventory
```

### TC-034: Chest Opening
```
Action: Move onto chest tile
Expected: Random item added, chest consumed
Pass Criteria: Item added to inventory
```

---

## 5. DUNGEON GENERATION TESTS

### TC-040: Room Generation
```
Action: Generate new dungeon
Expected: 5-10 rooms connected by corridors
Pass Criteria: All floor tiles reachable from start
```

### TC-041: Enemy Placement
```
Action: Generate floor 1
Expected: 5 enemies placed on floor tiles
Pass Criteria: No enemies on walls/void/stairs
```

### TC-042: Trap Count Scaling
```
Action: Generate floors 1-5
Expected: Trap count = floor/2 + 1
Pass Criteria: Floor 1=2 traps, Floor 5=3 traps
```

---

## 6. SAVE/LOAD TESTS

### TC-050: Game Save
```
Action: Click Save button
Expected: Game state persisted to localStorage
Pass Criteria: localStorage contains 'dungeonD3_save'
```

### TC-051: Game Load
```
Action: Refresh page, click Load
Expected: Full game state restored
Pass Criteria: HP, XP, position, inventory all match pre-save
```

### TC-052: Corrupted Save
```
Action: Inject invalid JSON into save
Expected: Graceful error handling
Pass Criteria: "Game loaded!" does not appear, no crash
```

---

## 7. LEVELING TESTS

### TC-060: XP Gain
```
Action: Defeat multiple enemies totaling 100 XP
Expected: Level up modal appears
Pass Criteria: Modal with +10 HP / +2 ATK / +2 DEF options
```

### TC-061: XP Scaling
```
Action: Level up multiple times
Expected: xpToNext increases 1.5× per level
Pass Criteria: Level 2 = 150 XP, Level 3 = 225 XP required
```

### TC-062: HP on Level Up
```
Action: Level up choosing HP
Expected: maxHp += 10, current HP = maxHp
Pass Criteria: HP fully restored and max increased
```

---

## 8. EDGE CASE TESTS

### TC-070: Zero HP Capping
```
Action: Take fatal damage
Expected: HP clamped to 0, game over triggered
Pass Criteria: Game over screen appears
```

### TC-071: Negative Defense
```
Setup: Equip item that reduces defense below 0
Action: Enemy attacks
Expected: Still takes damage normally
Pass Criteria: No divide-by-zero or infinity
```

### TC-072: Simultaneous Enemy Attack
```
Setup: Two enemies adjacent to player
Action: Player attacks one
Expected: Other enemy attacks player
Pass Criteria: Both enemies deal damage in same turn
```

### TC-073: Empty Dungeon
```
Setup: Force 0 rooms generation
Action: Attempt to play
Expected: Graceful handling or default rooms
Pass Criteria: No infinite loop, at least 1 room
```

---

## 9. BOSS SYSTEM TESTS (Currently Failing)

### TC-080: Boss Spawn
```
Action: Reach floor 5 (Shadow Realm)
Expected: Boss encounter initiates
Pass Criteria: Lich King appears with phases
```

### TC-081: Boss Phase Transition
```
Action: Reduce boss HP below 50%
Expected: Phase 2 behavior activates
Pass Criteria: New attack patterns, increased speed
```

### TC-082: Boss Defeat
```
Action: Defeat Lich King
Expected: Victory state, loot dropped
Pass Criteria: Crown of the Lich obtained, game continues or ends
```

---

## 10. RESULTS SUMMARY

| Test Category | Total | Pass | Fail | Blocked |
|--------------|-------|------|------|---------|
| Dice System | 6 | 4 | 0 | 2 |
| Combat | 4 | 3 | 0 | 1 |
| Movement | 4 | 4 | 0 | 0 |
| Inventory | 5 | 5 | 0 | 0 |
| Dungeon Gen | 3 | 3 | 0 | 0 |
| Save/Load | 3 | 2 | 0 | 1 |
| Leveling | 3 | 3 | 0 | 0 |
| Edge Cases | 4 | 3 | 0 | 1 |
| **BOSS** | **3** | **0** | **0** | **3** |
| **TOTAL** | **35** | **27** | **0** | **8** |

**Overall Status:** 77% tests passing. Boss system requires implementation.
