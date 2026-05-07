# DungeonD3 Visual Style Guide

## Overview
DungeonD3 embraces a **dark fantasy dungeon-crawler aesthetic** with rich atmospheric lighting, layered particle effects, and responsive design optimized for mobile-first gameplay. The visual language evokes classic roguelikes (NetHack, Cogmind) while incorporating modern glow, pulse, and particle effects.

---

## Color Palette

### Core Dungeon Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Void Black** | `#0a0a0f` | Unexplored areas, true darkness |
| **Wall Stone** | `#3d3d5c` | Dungeon walls with purple-gray undertone |
| **Floor Base** | `#2a2a4a` | Standard walkable floor |
| **Floor Variation A** | `#252545` | Floor tile variation (darker) |
| **Floor Variation B** | `#2f2f52` | Floor tile variation (lighter) |
| **Door Brown** | `#8b4513` | Wooden doors |
| **Stairs Green** | `#4ad94a` | Exit stairs (pulsing glow) |
| **Trap Orange** | `#ff6600` | Floor traps (warning pulse) |
| **Chest Purple** | `#9a4ad9` | Treasure containers |

### Entity Colors
| Entity | Hex | Notes |
|--------|-----|-------|
| **Player** | `#4a90d9` | Heroic blue - protagonist |
| **Enemy** | `#d94a4a` | Danger red - hostile creatures |
| **Item** | `#d9d94a` | Gold/yellow - loot and treasure |
| **Boss** | `#ff1744` | Intense red - boss encounters |

### UI & Accent Colors
| Purpose | Hex | Usage |
|---------|-----|-------|
| **Panel Background** | `#16213e` | Dark blue panel base |
| **Panel Border** | `#0f3460` | Subtle borders |
| **Crimson Accent** | `#e94560` | Critical actions, health, CTAs |
| **Healing** | `#4ad94a` | HP restore, buffs |
| **Damage** | `#e94560` | Damage dealt |
| **Info Text** | `#888888` | Secondary logs |

### Rarity Colors (Items)
| Rarity | Hex | Glow Intensity | Notes |
|--------|-----|----------------|-------|
| **Common** | `#888888` | None | Basic items |
| **Uncommon** | `#4ad94a` | Soft (blur: 8px) | Green shimmer |
| **Rare** | `#4a90d9` | Medium (blur: 12px) | Blue shimmer |
| **Epic** | `#9a4ad9` | Strong (blur: 18px) | Purple shimmer |
| **Legendary** | `#e94560` | Intense (blur: 25px) | Red-orange shimmer with particles |

---

## Dungeon Atmosphere by Floor

### Floor 1-3: The Depths (Entry Level)
- **Tone**: Cool blue-gray
- **Wall Color**: `#3d3d5c`
- **Floor Color**: `#2a2a4a`
- **Atmosphere**: Relatively bright, stonework is newer
- **Enemy Types**: Rats, slimes, goblins

### Floor 4-7: The Catacombs
- **Tone**: Dim purple
- **Wall Color**: `#353355`
- **Floor Color**: `#282848`
- **Atmosphere**: Reduced visibility, older bones visible
- **Enemy Types**: Skeletons, zombies, bats

### Floor 8-12: The Abyss
- **Tone**: Deep crimson undertone
- **Wall Color**: `#2d2d4a`
- **Floor Color**: `#222240`
- **Atmosphere**: Occasional red flickering
- **Enemy Types**: Demons, wraiths, liches

### Floor 13+: The Void
- **Tone**: Near-black with void purple
- **Wall Color**: `#252540`
- **Floor Color**: `#1a1a35`
- **Atmosphere**: Fog effects, particles drift
- **Enemy Types**: Eldritch horrors, BOSS encounters

---

## Entity Emoji Mapping

### Player
- **Hero**: 🧙 (wizard), 🗡️ (warrior representation via weapon)

### Enemies
| Enemy Type | Emoji | Behavior |
|------------|-------|----------|
| Rat | 🐀 | Aggressive, swarm |
| Slime | 🟢 | Evasive, splits |
| Goblin | 👺 | Aggressive |
| Skeleton | 💀 | Tank/Guardian |
| Zombie | 👻 | Evasive, slow |
| Bat | 🦇 | Swarm, fast |
| Demon | 😈 | Aggressive, tank |
| Wraith | 👻 | Evasive, phasing |
| Lich | 🧙‍♂️ | Aggressive, mage |
| BOSS | 👹 | All behaviors, large |

### Items
| Item Type | Emoji | Notes |
|-----------|-------|-------|
| Weapon | ⚔️ | Swords, daggers |
| Armor | 🛡️ | Shields, helmets |
| Potion | 🧪 | Health, mana, buffs |
| Gold | 🪙 | Currency |
| Key | 🔑 | Door keys |
| Scroll | 📜 | Spells |
| Food | 🍖 | Health restoration |

### Dungeon Features
| Feature | Emoji |
|---------|-------|
| Stairs | 🚪 |
| Door | 🚪 |
| Chest | 📦 |
| Trap | ⚠️ |
| Exit | 🏆 |

---

## Animation Specifications

### Core Animations

#### Player Movement
- **Type**: Smooth tile transition
- **Duration**: 0.15s (150ms)
- **Easing**: `ease-out`
- **Effect**: CSS transform with translate, player smoothly slides between tiles

#### Attack Animation
- **Duration**: 0.2s
- **Effect**: Brief scale pulse (1.0 → 1.15 → 1.0)
- **Screen shake**: Subtle 2px shake on hit

#### Damage Flash (Injury)
- **Duration**: 0.3s (300ms)
- **Color**: Red overlay `rgba(255, 0, 0, 0.4)`
- **Pattern**: Opacity pulse (0.4 → 0.1 → 0.4)
- **Applicability**: Player and enemies

#### Item Pickup
- **Duration**: 0.25s
- **Effect**: Item scales down and fades (1.0 → 0 → 0) with upward drift
- **Particles**: 5-8 small particles burst outward

#### Stairs Pulse
- **Duration**: 2s cycle
- **Effect**: Radial gradient pulse (glow intensity oscillates)

#### Trap Warning
- **Duration**: 0.5s cycle (rapid pulse)
- **Color**: Orange `rgba(255, 102, 0, 0.3)`

#### Boss Room Indicator
- **Location**: Tiles adjacent to stairs
- **Effect**: Red pulse radiating outward
- **Duration**: 1.5s cycle
- **Color**: `rgba(255, 23, 68, 0.3)` to `rgba(255, 23, 68, 0)`

#### Death Animation
- **Duration**: 0.5s
- **Effect**: Entity fades + shrinks simultaneously

### Item Rarity Glow Animation
| Rarity | Animation |
|--------|-----------|
| Common | Static, no glow |
| Uncommon | Soft breathing pulse (0.8-1.0 opacity, 2s) |
| Rare | Medium pulse with slight size change (1s) |
| Epic | Strong pulse + occasional sparkle particles |
| Legendary | Intense pulse + constant particle emission |

---

## Particle System

### Particle Types

#### Combat Sparks
- **Color**: Yellow-orange `#ffaa00` to `#ff6600`
- **Size**: 2-4px
- **Speed**: Fast, 3-6px/frame
- **Decay**: 0.03/frame
- **Trigger**: Weapon attacks

#### Magic Particles
- **Color**: Blue-purple `#4a90d9` to `#9a4ad9`
- **Size**: 3-6px
- **Speed**: Slow drift, 1-2px/frame
- **Decay**: 0.015/frame
- **Trigger**: Spell casting, rare item pickup

#### Blood/Damage
- **Color**: Deep red `#d94a4a` to `#8b0000`
- **Size**: 2-5px
- **Speed**: Burst outward from impact
- **Decay**: 0.04/frame
- **Trigger**: Enemy hit

#### Ambient Dust
- **Color**: Gray `#888888` at 30% opacity
- **Size**: 1-2px
- **Speed**: Very slow drift
- **Decay**: 0.005/frame
- **Trigger**: Continuous in deep floors

#### Void Fog (Floor 13+)
- **Color**: Purple-black gradient
- **Size**: Large sprites (8-12px)
- **Speed**: Very slow horizontal drift
- **Opacity**: 10-20%
- **Effect**: Layers of drifting fog sprites

### Particle Parameters
```javascript
{
  x: number,           // Start X position (tile * tileSize + offset)
  y: number,           // Start Y position
  vx: number,          // Velocity X (-2 to 2 typical)
  vy: number,          // Velocity Y
  color: string,       // Hex color
  size: number,        // Radius in pixels
  life: number,        // 1.0 to 0.0
  decay: number,       // Life reduction per frame (0.01-0.05)
  gravity?: number     // Optional Y acceleration
}
```

---

## Responsive Design

### Mobile-First Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 600px | Full-screen canvas, bottom HUD |
| **Tablet** | 600-899px | Canvas with side panel (collapsed) |
| **Desktop** | 900px+ | Canvas (20:15 ratio) + right sidebar |

### Canvas Scaling Rules
1. **Aspect Ratio**: Always maintain 20:15 (4:3)
2. **Max Width**: 900px for canvas on desktop
3. **Min Tile Size**: 24px (below this, entities become unclear)
4. **Preferred Tile Size**: 32px (desktop), scales down on mobile

### Tile Size Calculation
```javascript
tileSize = min(
  (containerWidth - 10) / dungeonWidth,
  (containerHeight - 10) / dungeonHeight
)
// Minimum enforced at 24px
```

### Touch Targets (Mobile)
- Minimum touch target: 44x44px
- Floor tiles should map to at least this size on mobile

### Font Scaling
| Context | Desktop | Mobile |
|---------|---------|--------|
| HUD Stats | 14px | 12px |
| Combat Log | 12px | 10px |
| Damage Numbers | 16px bold | 14px bold |
| Floor Numbers | 20px | 16px |

---

## Tile Rendering Specifications

### Base Tile (32x32 virtual pixels)

#### Wall Tile
- Beveled edges (light from top-left)
- Top/left: 2px darker overlay
- Bottom/right: 2px lighter overlay
- Stone pattern: Central darker rectangle at 30% size

#### Floor Tile
- Subtle grid lines (5% white)
- Seeded variation based on position:
  - Seed 0: Dark crack detail
  - Seed 1-4: Base floor only
- Color shifts ±5% based on seeded random

#### Stairs Tile
- Pulsing radial gradient (green)
- 3 descending line symbols
- Beacon glow extends beyond tile

#### Trap Tile
- Rapid orange pulse
- Triangle spike pattern in center
- Warning state visible before trigger

#### Door Tile
- Brown rectangle base
- Lighter top edge (lid effect)
- Gold lock rectangle

#### Chest Tile
- Purple body
- Lighter lid section
- Gold lock accent

### Entity Rendering Order (Z-Index)
1. Floor/Void base
2. Floor variation overlays
3. Items on floor
4. Enemies
5. Player (always on top)
6. Effects/overlays (fog, damage numbers)
7. Particles (topmost)

### Glow Implementation
```javascript
ctx.shadowColor = color;
ctx.shadowBlur = intensity; // Based on rarity
```

---

## Accessibility

### Color Blind Considerations
- Rarity is communicated by:
  - Color (primary)
  - Glow intensity (secondary)
  - Particle effects (legendary only)
- Combat messages use icons + color
- Enemy types distinguished by shape (not just color)

### Contrast Requirements
- Primary text: 4.5:1 minimum
- UI elements: 3:1 minimum
- Floor tiles against void: 2:1 minimum

### Screen Reader Support
- Entity hover shows tooltip
- Damage numbers announced
- Floor transitions announced

---

## Visual Checklist

### MVP Features
- [x] Core tile rendering (wall, floor, void, door, stairs, trap, chest)
- [x] Player character with glow
- [x] Enemy rendering with health bars
- [x] Item rendering with rarity colors
- [x] Basic particle system
- [x] Floating damage/heal numbers
- [x] Floor tile variation (seeded)
- [x] Player movement animation (smooth 0.15s)
- [x] Damage flash effect (0.3s red)
- [x] Rarity-based item glow
- [x] Boss room proximity indicator (red pulse)

### Enhanced Features
- [ ] Combat sparks particle system
- [ ] Magic particle system
- [ ] Void fog for deep floors
- [ ] Ambient dust particles
- [ ] Screen shake on critical hits
- [ ] Weather effects (fog layers)
