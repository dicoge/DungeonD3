# DungeonD3 Art Package

This directory contains the visual style guide and Canvas renderer for DungeonD3.

## Files

| File | Description |
|------|-------------|
| `STYLE.md` | Complete visual style guide with colors, typography, and effects |
| `renderer.js` | HTML5 Canvas 2D renderer for the dungeon view |
| `example.js` | Usage examples for the renderer |
| `sprites.js` | Entity sprite drawing utilities |

## Quick Start

```javascript
// Get canvas element
const canvas = document.getElementById('dungeon-view');

// Create renderer
const renderer = new DungeonRenderer(canvas, {
    tileSize: 32,
    width: 20,
    height: 15
});

// Example dungeon map
const dungeon = [
    ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
    ['wall','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
    ['wall','floor','player','floor','floor','floor','floor','enemy','floor','wall'],
    ['wall','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
    ['wall','floor','floor','floor','stairs','floor','floor','floor','floor','wall'],
    ['wall','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
    ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
];

// Entities on the map
const entities = [
    { type: 'player', x: 2, y: 2, direction: 'south', hp: 20, maxHp: 20 },
    { type: 'enemy', x: 7, y: 2, hp: 15, maxHp: 15, behavior: 'aggressive' },
    { type: 'item', x: 4, y: 4, rarity: 'rare', itemType: 'potion' },
];

// Render the dungeon
renderer.renderMap(dungeon, entities);

// Add effects
renderer.addFloatingText(7, 2, '-12', '#e94560'); // Damage number
renderer.addParticle(7, 2, '#e94560', { speed: 3 }); // Blood particles
```

## Features

### Tile Rendering
- Wall tiles with beveled stone texture
- Floor tiles with subtle grid pattern
- Animated stairs glow (green beacon)
- Pulsing trap warnings (orange)
- Detailed chest rendering

### Entity Rendering
- **Player**: Blue hero with bobbing animation and direction indicator
- **Enemies**: Color intensity based on HP, shapes vary by behavior:
  - Aggressive: Triangular
  - Skittish/evasive: Diamond
  - Tank/guardian: Square/blocky
  - Swarm: Multiple small dots
- **Items**: Glow based on rarity, distinct shapes per item type

### Effects System
- Floating damage/heal numbers
- Particle system for blood, magic, dust
- Fog of war overlay support
- Tile highlighting for hover/selection
- Damage flash feedback

### Canvas Utilities
- `getTileAt(x, y)`: Convert canvas coords to tile coords
- `flashTile(x, y, color)`: Quick visual feedback
- `renderFogOfWar(revealed)`: Hide unexplored areas
- `resize()`: Auto-fit to container

## Integration

Replace the CSS grid dungeon view with a `<canvas>` element:

```html
<canvas id="dungeon-canvas"></canvas>
```

Then in your game code:

```javascript
const canvas = document.getElementById('dungeon-canvas');
const renderer = new DungeonRenderer(canvas);

// In your game loop:
function render() {
    renderer.renderMap(gameState.dungeon, gameState.entities);
    requestAnimationFrame(render);
}
```

## Color Palette Summary

| Usage | Color |
|-------|-------|
| Void/Background | `#0a0a0f` |
| Walls | `#3d3d5c` |
| Floor | `#2a2a4a` |
| Player | `#4a90d9` |
| Enemy | `#d94a4a` |
| Items | `#d9d94a` |
| Accent | `#e94560` |
| Stairs | `#4ad94a` |

## Next Steps

- [ ] Add sprite sheets for entities
- [ ] Implement lighting/visibility cones
- [ ] Add ambient particle effects (dust motes, magic sparkles)
- [ ] Create minimap renderer
- [ ] Add animation tweening system
