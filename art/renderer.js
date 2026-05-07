/**
 * DungeonD3 Canvas Renderer
 * A tile-based 2D renderer using HTML5 Canvas
 */

class DungeonRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Configuration
        this.tileSize = options.tileSize || 32;
        this.width = options.width || 20;
        this.height = options.height || 15;
        
        // Colors from style guide
        this.colors = {
            void: '#0a0a0f',
            wall: '#3d3d5c',
            floor: '#2a2a4a',
            door: '#8b4513',
            stairs: '#4ad94a',
            trap: '#ff6600',
            chest: '#9a4ad9',
            player: '#4a90d9',
            enemy: '#d94a4a',
            item: '#d9d94a',
            
            // UI
            panelBg: '#16213e',
            panelBorder: '#0f3460',
            accent: '#e94560',
            
            // Rarity
            common: '#888888',
            uncommon: '#4ad94a',
            rare: '#4a90d9',
            epic: '#9a4ad9',
            legendary: '#e94560'
        };
        
        // Animation state
        this.animations = [];
        this.lastTime = 0;
        
        // Particle system
        this.particles = [];
        
        this.resize();
    }
    
    resize() {
        const container = this.canvas.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.tileSize = Math.min(
                (this.canvas.width - 10) / this.width,
                (this.canvas.height - 10) / this.height
            );
        }
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.void;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Render a single tile
     */
    renderTile(x, y, type, highlights = []) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const size = this.tileSize;
        
        // Base fill
        this.ctx.fillStyle = this.colors[type] || this.colors.void;
        this.ctx.fillRect(px, py, size, size);
        
        // Tile-specific effects
        switch (type) {
            case 'wall':
                this.renderWallTexture(px, py, size);
                break;
            case 'floor':
                this.renderFloorTexture(px, py, size);
                break;
            case 'stairs':
                this.renderStairsGlow(px, py, size);
                break;
            case 'trap':
                this.renderTrapWarning(px, py, size);
                break;
            case 'chest':
                this.renderChestDetail(px, py, size);
                break;
        }
        
        // Render highlights (player, enemies, items)
        if (highlights.length > 0) {
            this.renderHighlights(px, py, size, highlights);
        }
    }
    
    /**
     * Wall texture with beveled edges
     */
    renderWallTexture(px, py, size) {
        const ctx = this.ctx;
        const inset = 2;
        
        // Darker top/left edges (light from top-left)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px, py, size, inset);
        ctx.fillRect(px, py, inset, size);
        
        // Lighter bottom/right edges
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px, py + size - inset, size, inset);
        ctx.fillRect(px + size - inset, py, inset, size);
        
        // Stone pattern
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(px + size * 0.3, py + size * 0.3, size * 0.4, size * 0.4);
    }
    
    /**
     * Floor texture with subtle grid
     */
    renderFloorTexture(px, py, size) {
        const ctx = this.ctx;
        
        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
        
        // Random floor variation (seeded by position)
        const seed = (x * 7 + y * 13) % 5;
        if (seed === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(px + size * 0.1, py + size * 0.6, size * 0.2, size * 0.15);
        }
    }
    
    /**
     * Stairs glow effect
     */
    renderStairsGlow(px, py, size) {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        const pulse = 0.5 + 0.5 * Math.sin(time * 3);
        
        // Green glow
        const gradient = ctx.createRadialGradient(
            px + size / 2, py + size / 2, 0,
            px + size / 2, py + size / 2, size
        );
        gradient.addColorStop(0, `rgba(74, 217, 74, ${0.3 + pulse * 0.2})`);
        gradient.addColorStop(1, 'rgba(74, 217, 74, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(px - size / 2, py - size / 2, size * 2, size * 2);
        
        // Stairs symbol (descending lines)
        ctx.strokeStyle = this.colors.stairs;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const lineY = py + size * 0.25 + i * (size * 0.2);
            ctx.beginPath();
            ctx.moveTo(px + size * 0.2, lineY);
            ctx.lineTo(px + size * 0.8, lineY);
            ctx.stroke();
        }
    }
    
    /**
     * Trap warning animation
     */
    renderTrapWarning(px, py, size) {
        const ctx = this.ctx;
        const time = Date.now() / 500;
        const pulse = 0.5 + 0.5 * Math.sin(time * 5);
        
        // Orange warning glow
        ctx.fillStyle = `rgba(255, 102, 0, ${0.2 + pulse * 0.2})`;
        ctx.fillRect(px, py, size, size);
        
        // Spike pattern
        ctx.fillStyle = this.colors.trap;
        ctx.beginPath();
        ctx.moveTo(px + size * 0.5, py + size * 0.3);
        ctx.lineTo(px + size * 0.7, py + size * 0.7);
        ctx.lineTo(px + size * 0.3, py + size * 0.7);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Chest detail
     */
    renderChestDetail(px, py, size) {
        const ctx = this.ctx;
        
        // Chest body
        ctx.fillStyle = this.colors.chest;
        ctx.fillRect(px + size * 0.15, py + size * 0.3, size * 0.7, size * 0.5);
        
        // Chest lid
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(px + size * 0.15, py + size * 0.25, size * 0.7, size * 0.15);
        
        // Lock
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px + size * 0.4, py + size * 0.45, size * 0.2, size * 0.15);
    }
    
    /**
     * Render highlights (entities on tile)
     */
    renderHighlights(px, py, size, highlights) {
        const ctx = this.ctx;
        const centerX = px + size / 2;
        const centerY = py + size / 2;
        
        highlights.forEach(entity => {
            switch (entity.type) {
                case 'player':
                    this.renderPlayer(centerX, centerY, size, entity);
                    break;
                case 'enemy':
                    this.renderEnemy(centerX, centerY, size, entity);
                    break;
                case 'item':
                    this.renderItem(centerX, centerY, size, entity);
                    break;
            }
        });
    }
    
    /**
     * Render player character
     */
    renderPlayer(x, y, size, entity) {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        const bob = Math.sin(time * 4) * 2;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, size * 0.8);
        gradient.addColorStop(0, 'rgba(74, 144, 217, 0.4)');
        gradient.addColorStop(1, 'rgba(74, 144, 217, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size, y - size + bob, size * 2, size * 2);
        
        // Player character (simple hero shape)
        ctx.fillStyle = this.colors.player;
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1 + bob, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillRect(x - size * 0.25, y + size * 0.15 + bob, size * 0.5, size * 0.35);
        
        // Direction indicator
        if (entity.direction) {
            const dirOffset = this.getDirectionOffset(entity.direction, size * 0.15);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + dirOffset.x, y + bob + dirOffset.y, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Render enemy
     */
    renderEnemy(x, y, size, entity) {
        const ctx = this.ctx;
        const healthPercent = entity.hp / entity.maxHp;
        
        // Health-based color intensity
        const red = Math.floor(217 * (0.5 + 0.5 * healthPercent));
        const color = `rgb(${red}, 74, 74)`;
        
        // Subtle pulsing glow
        const time = Date.now() / 1000;
        const pulse = 0.8 + 0.2 * Math.sin(time * 3 + x);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.6);
        gradient.addColorStop(0, `rgba(217, 74, 74, ${0.3 * pulse})`);
        gradient.addColorStop(1, 'rgba(217, 74, 74, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 0.6, y - size * 0.6, size * 1.2, size * 1.2);
        
        // Enemy body (varies by behavior/type)
        ctx.fillStyle = color;
        this.drawEnemyShape(ctx, x, y, size, entity.behavior || 'aggressive');
        
        // Health bar
        if (entity.hp && entity.maxHp) {
            const barWidth = size * 0.7;
            const barHeight = 4;
            const barX = x - barWidth / 2;
            const barY = y - size * 0.5;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = healthPercent > 0.5 ? '#4ad94a' : healthPercent > 0.25 ? '#d9d94a' : '#e94560';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }
    
    /**
     * Draw enemy shapes based on behavior
     */
    drawEnemyShape(ctx, x, y, size, behavior) {
        switch (behavior) {
            case 'aggressive':
                // Angry aggressive shape (triangle)
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.3);
                ctx.lineTo(x + size * 0.3, y + size * 0.25);
                ctx.lineTo(x - size * 0.3, y + size * 0.25);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'skittish':
            case 'evasive':
                // Small, quick shape (diamond)
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.25);
                ctx.lineTo(x + size * 0.25, y);
                ctx.lineTo(x, y + size * 0.25);
                ctx.lineTo(x - size * 0.25, y);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'tank':
            case 'guardian':
                // Large, blocky shape (square)
                ctx.fillRect(x - size * 0.3, y - size * 0.25, size * 0.6, size * 0.5);
                break;
                
            case 'swarm':
                // Multiple small dots
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(
                        x + (i - 1) * size * 0.15,
                        y + (i % 2) * size * 0.1,
                        size * 0.1,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
                break;
                
            default:
                // Default circle
                ctx.beginPath();
                ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
                ctx.fill();
        }
    }
    
    /**
     * Render item
     */
    renderItem(x, y, size, entity) {
        const ctx = this.ctx;
        
        // Gold glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5);
        gradient.addColorStop(0, 'rgba(217, 217, 74, 0.4)');
        gradient.addColorStop(1, 'rgba(217, 217, 74, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        
        // Item glow based on rarity
        if (entity.rarity) {
            const rarityColor = this.colors[entity.rarity] || this.colors.common;
            ctx.shadowColor = rarityColor;
            ctx.shadowBlur = 10;
        }
        
        // Item representation
        ctx.fillStyle = entity.rarity 
            ? this.colors[entity.rarity] 
            : this.colors.item;
        
        // Draw based on item type
        switch (entity.itemType) {
            case 'weapon':
                this.drawWeapon(ctx, x, y, size);
                break;
            case 'armor':
                this.drawArmor(ctx, x, y, size);
                break;
            case 'potion':
                this.drawPotion(ctx, x, y, size);
                break;
            case 'gold':
            case 'key':
            case 'chest':
                this.drawCoin(ctx, x, y, size);
                break;
            default:
                ctx.beginPath();
                ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.shadowBlur = 0;
    }
    
    drawWeapon(ctx, x, y, size) {
        // Sword shape
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.3);
        ctx.lineTo(x + size * 0.1, y - size * 0.1);
        ctx.lineTo(x + size * 0.05, y + size * 0.3);
        ctx.lineTo(x - size * 0.05, y + size * 0.3);
        ctx.lineTo(x - size * 0.1, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
    }
    
    drawArmor(ctx, x, y, size) {
        // Shield shape
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.3);
        ctx.lineTo(x + size * 0.25, y - size * 0.1);
        ctx.lineTo(x + size * 0.2, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.35);
        ctx.lineTo(x - size * 0.2, y + size * 0.25);
        ctx.lineTo(x - size * 0.25, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
    }
    
    drawPotion(ctx, x, y, size) {
        // Potion bottle
        ctx.beginPath();
        ctx.arc(x, y + size * 0.05, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - size * 0.08, y - size * 0.25, size * 0.16, size * 0.2);
        ctx.fillRect(x - size * 0.12, y - size * 0.3, size * 0.24, size * 0.08);
    }
    
    drawCoin(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(x - size * 0.05, y - size * 0.05, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Get direction offset for player indicator
     */
    getDirectionOffset(direction, distance) {
        const offsets = {
            north: { x: 0, y: -distance },
            south: { x: 0, y: distance },
            east: { x: distance, y: 0 },
            west: { x: -distance, y: 0 }
        };
        return offsets[direction] || { x: 0, y: 0 };
    }
    
    /**
     * Render the full dungeon map
     */
    renderMap(dungeon, entities = [], effects = []) {
        this.clear();
        
        // Render base tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = dungeon[y]?.[x] || 'void';
                const tileEntities = entities.filter(e => e.x === x && e.y === y);
                this.renderTile(x, y, tile, tileEntities);
            }
        }
        
        // Render effects (damage numbers, particles)
        this.renderEffects(effects);
    }
    
    /**
     * Add a floating damage/heal number
     */
    addFloatingText(x, y, text, color = '#e94560') {
        this.animations.push({
            type: 'floatingText',
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize + this.tileSize / 2,
            text: text,
            color: color,
            life: 1.0,
            vy: -1
        });
    }
    
    /**
     * Add a particle effect
     */
    addParticle(x, y, color, options = {}) {
        this.particles.push({
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize + this.tileSize / 2,
            vx: (Math.random() - 0.5) * (options.speed || 2),
            vy: (Math.random() - 0.5) * (options.speed || 2),
            color: color,
            size: options.size || 3,
            life: 1.0,
            decay: options.decay || 0.02
        });
    }
    
    /**
     * Render effects layer
     */
    renderEffects(effects) {
        const ctx = this.ctx;
        
        // Update and render floating texts
        this.animations = this.animations.filter(anim => {
            anim.y += anim.vy;
            anim.life -= 0.02;
            
            if (anim.life <= 0) return false;
            
            ctx.globalAlpha = anim.life;
            ctx.fillStyle = anim.color;
            ctx.font = 'bold 16px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = anim.color;
            ctx.shadowBlur = 5;
            ctx.fillText(anim.text, anim.x, anim.y);
            ctx.shadowBlur = 0;
            
            return true;
        });
        
        // Update and render particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            
            if (p.life <= 0) return false;
            
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            
            return true;
        });
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Flash a tile (for damage, discovery, etc.)
     */
    flashTile(x, y, color, duration = 200) {
        const originalTile = this.currentMap?.[y]?.[x];
        this.renderTile(x, y, originalTile || 'void', []);
        
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
        this.ctx.globalAlpha = 1;
        
        setTimeout(() => {
            this.renderTile(x, y, originalTile || 'void', []);
        }, duration);
    }
    
    /**
     * Render fog of war overlay
     */
    renderFogOfWar(revealed = [][]) {
        const ctx = this.ctx;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!revealed[y]?.[x]) {
                    ctx.fillStyle = 'rgba(10, 10, 15, 0.7)';
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
    }
    
    /**
     * Highlight a tile (hover, selection)
     */
    highlightTile(x, y, color = 'rgba(255,255,255,0.2)') {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }
    
    /**
     * Get tile at canvas coordinates
     */
    getTileAt(canvasX, canvasY) {
        const x = Math.floor(canvasX / this.tileSize);
        const y = Math.floor(canvasY / this.tileSize);
        return { x, y };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DungeonRenderer;
}
