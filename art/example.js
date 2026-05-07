/**
 * DungeonD3 Canvas Renderer - Usage Examples
 * 
 * This file demonstrates various ways to use the DungeonRenderer
 */

// Example 1: Basic Setup and Rendering
function exampleBasic() {
    const canvas = document.getElementById('dungeon-canvas');
    const renderer = new DungeonRenderer(canvas, {
        tileSize: 32,
        width: 20,
        height: 15
    });

    // Simple dungeon layout
    const dungeon = [
        ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
        ['wall','floor','floor','floor','floor','floor','wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','door','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','stairs','wall'],
        ['wall','floor','floor','floor','floor','floor','wall','wall','wall','wall','wall','door','wall','wall','wall','wall','wall','wall','wall','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','floor','wall'],
        ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
    ];

    const entities = [
        { type: 'player', x: 2, y: 2, direction: 'south', hp: 20, maxHp: 20 },
        { type: 'enemy', x: 9, y: 2, hp: 35, maxHp: 35, behavior: 'aggressive' },
        { type: 'enemy', x: 15, y: 4, hp: 22, maxHp: 22, behavior: 'skittish' },
        { type: 'item', x: 5, y: 5, rarity: 'common', itemType: 'potion' },
        { type: 'item', x: 18, y: 5, rarity: 'legendary', itemType: 'weapon' },
    ];

    renderer.renderMap(dungeon, entities);
}

// Example 2: Combat Effects
function exampleCombatEffects(renderer) {
    // Damage numbers
    renderer.addFloatingText(9, 2, '-12', '#e94560');
    renderer.addFloatingText(9, 2, '-3', '#e94560'); // Overkill
    
    // Healing numbers
    setTimeout(() => {
        renderer.addFloatingText(2, 2, '+15', '#4ad94a');
    }, 500);
    
    // Particles for hit effect
    for (let i = 0; i < 8; i++) {
        renderer.addParticle(9, 2, '#e94560', { speed: 4, decay: 0.03 });
    }
}

// Example 3: Discovery Effects
function exampleDiscovery(renderer, x, y) {
    // Reveal item with sparkle particles
    for (let i = 0; i < 12; i++) {
        renderer.addParticle(x, y, '#d9d94a', { speed: 2, decay: 0.02 });
    }
    
    // Flash the tile
    renderer.flashTile(x, y, '#d9d94a', 300);
}

// Example 4: Fog of War
function exampleFogOfWar(renderer, dungeon) {
    const revealed = [];
    for (let y = 0; y < dungeon.length; y++) {
        revealed[y] = [];
        for (let x = 0; x < dungeon[y].length; x++) {
            // Example: only reveal tiles within 5 of player
            const distToPlayer = Math.abs(x - 2) + Math.abs(y - 2);
            revealed[y][x] = distToPlayer <= 5;
        }
    }
    
    renderer.renderFogOfWar(revealed);
}

// Example 5: Animation Loop
function exampleAnimationLoop() {
    const canvas = document.getElementById('dungeon-canvas');
    const renderer = new DungeonRenderer(canvas);
    
    let gameState = {
        dungeon: generateDungeon(),
        entities: [],
        effects: []
    };
    
    function gameLoop() {
        renderer.renderMap(gameState.dungeon, gameState.entities);
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

// Example 6: Mouse Interaction
function exampleMouseInteraction() {
    const canvas = document.getElementById('dungeon-canvas');
    const renderer = new DungeonRenderer(canvas);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const tile = renderer.getTileAt(x, y);
        console.log(`Hovering over tile: ${tile.x}, ${tile.y}`);
        
        // Could highlight tile here
        // renderer.highlightTile(tile.x, tile.y);
    });
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const tile = renderer.getTileAt(x, y);
        handleTileClick(tile.x, tile.y);
    });
}

// Example 7: Responsive Canvas
function exampleResponsive() {
    window.addEventListener('resize', () => {
        const canvas = document.getElementById('dungeon-canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        renderer.resize();
    });
}

// Example 8: Custom Entity Rendering
function exampleCustomEntity() {
    const renderer = new DungeonRenderer(canvas);
    
    // Add a custom entity type
    renderer.renderEntity = function(x, y, size, entity) {
        const ctx = this.ctx;
        
        switch (entity.customType) {
            case 'boss':
                // Large pulsing boss with aura
                const time = Date.now() / 1000;
                const pulse = 0.8 + 0.2 * Math.sin(time * 2);
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
                gradient.addColorStop(0, `rgba(233, 69, 96, ${0.5 * pulse})`);
                gradient.addColorStop(0.5, `rgba(154, 74, 217, ${0.3 * pulse})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x - size * 1.5, y - size * 1.5, size * 3, size * 3);
                
                // Boss body
                ctx.fillStyle = '#e94560';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                // Fall back to default rendering
                this.renderEntityDefault(x, y, size, entity);
        }
    };
}

// Helper: Generate a random dungeon (stub)
function generateDungeon() {
    const width = 20;
    const height = 15;
    const dungeon = [];
    
    for (let y = 0; y < height; y++) {
        dungeon[y] = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                dungeon[y][x] = 'wall';
            } else if (Math.random() < 0.15) {
                dungeon[y][x] = 'wall';
            } else {
                dungeon[y][x] = 'floor';
            }
        }
    }
    
    return dungeon;
}
