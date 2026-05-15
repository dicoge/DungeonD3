
// ============================================================
// DUNGEOND3 — 手機優先中文版
// ============================================================

// ============================================================
// D20 3D 骰子渲染器 — Canvas 2D Icosahedron 投影
// ============================================================
class D20Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.R = 75; // 外半徑
    this.centerR = this.R * 0.55; // 中央三角形半徑
    this.rolling = false;
    this.value = 1;
    this.progress = 0;
    this.startTime = 0;
    this.duration = 1500; // 1.5秒
    this.finalValue = 1;
    this.animFrame = null;
    
    // 20 面的投影三角形配置（icosahedron 投影簡化為六邊形周圍的小三角形）
    // 六個方向，各有外圈和內圈
    this.directions = [
      { angle: -90 },  // 上
      { angle: -30 },  // 右上
      { angle: 30 },   // 右下
      { angle: 90 },   // 下
      { angle: 150 },  // 左下
      { angle: -150 }, // 左上
    ];
    
    // 初始化繪製
    this.draw(false, 1, 1.0);
  }
  
  // 開始滾動動畫
  startRoll() {
    this.rolling = true;
    this.progress = 0;
    this.startTime = performance.now();
    this.value = Math.floor(Math.random() * 20) + 1;
    this.animate();
  }
  
  // 動畫循環
  animate() {
    // 如果 stopRoll() 已呼叫，立即停止動畫更新
    if (this._stopped) {
      this._stopped = false; // 重置旗標供下次 startRoll 使用
      return;
    }
    
    const now = performance.now();
    const elapsed = now - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    // 最後 0.3 秒停在最終值
    const settleStart = 0.8; // 80% 後開始settle
    if (this.progress < settleStart) {
      // 快速切換數字
      this.value = Math.floor(Math.random() * 20) + 1;
    }
    
    this.draw(true, this.value, this.progress);
    
    if (this.progress < 1) {
      this.animFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.rolling = false;
      // 只有在 stopRoll() 還沒設 _stopped 時才自己 draw
      // 否則 stopRoll() 已經用正確值畫過了，避免再畫一次覆蓋
      if (!this._stopped) this.draw(false, this.finalValue, 1.0);
    }
  }
  
  // 停止滾動，顯示最終值
  stopRoll(finalValue) {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.finalValue = finalValue;
    this.value = finalValue;
    this._stopped = true;  // 防止 animate() 最後一幀覆蓋正確值
    this.rolling = false;
    this.progress = 1.0;
    this.draw(false, finalValue, 1.0);
  }
  
  // 繪製 D20 骰子
  draw(rolling, value, progress) {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const R = this.R;
    const cR = this.centerR;
    
    // 清除畫布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 計算旋轉效果（滾動時）
    let rotX = 0, rotY = 0, rotZ = 0;
    let scale = 1;
    
    if (rolling && progress < 0.8) {
      const t = progress / 0.8;
      rotX = Math.sin(t * Math.PI * 12) * 0.4;
      rotY = Math.cos(t * Math.PI * 8) * 0.3;
      rotZ = t * Math.PI * 6;
      scale = 1 + Math.sin(t * Math.PI * 3) * 0.08;
    }
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.rotate(rotZ);
    
    // 繪製六邊形外框
    this.drawHexagon(ctx, R, rolling, progress);
    
    // 繪製周圍的小三角形（外圈）
    this.drawOuterTriangles(ctx, R, rolling, progress);
    
    // 繪製內圈小三角形
    this.drawInnerTriangles(ctx, cR, rolling, progress);
    
    // 繪製中央大三角形（顯示當前數字）
    this.drawCenterTriangle(ctx, cR, rolling, progress, value);
    
    ctx.restore();
  }
  
  // 繪製六邊形外框
  drawHexagon(ctx, R, rolling, progress) {
    const sides = 6;
    const angleOffset = -Math.PI / 2; // 從上方開始
    
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = angleOffset + (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * R;
      const y = Math.sin(angle) * R;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // 填充漸變
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    grad.addColorStop(0, '#9b30d0');
    grad.addColorStop(0.7, '#6a0dad');
    grad.addColorStop(1, '#4a0080');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // 外框線
    ctx.strokeStyle = '#bf5fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 外框雙重發光效果
    ctx.shadowColor = '#bf5fff';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 30;
    ctx.strokeStyle = 'rgba(191,95,255,0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // 繪製外圈小三角形（六邊形六個顶点处）
  drawOuterTriangles(ctx, R, rolling, progress) {
    const sides = 6;
    const angleOffset = -Math.PI / 2;
    
    for (let i = 0; i < sides; i++) {
      const angle = angleOffset + (i / sides) * Math.PI * 2;
      const nextAngle = angleOffset + ((i + 1) / sides) * Math.PI * 2;
      
      // 計算頂點
      const cx = Math.cos(angle) * R * 0.7;
      const cy = Math.sin(angle) * R * 0.7;
      const nx = Math.cos(nextAngle) * R * 0.7;
      const ny = Math.sin(nextAngle) * R * 0.7;
      
      // 小三角形 - 朝外的三角形
      const triAngle = angle + Math.PI / sides;
      const dist = R * 0.85;
      const tx = Math.cos(triAngle) * dist;
      const ty = Math.sin(triAngle) * dist;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.lineTo(tx, ty);
      ctx.closePath();
      
      // 深淺交替的紫色
      const shade = i % 2 === 0 ? '#5a0fa0' : '#7a20c0';
      ctx.fillStyle = shade;
      ctx.fill();
      
      ctx.strokeStyle = '#9933ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  
  // 繪製內圈小三角形（位於中央三角形和外圈之間）
  drawInnerTriangles(ctx, cR, rolling, progress) {
    const sides = 6;
    const angleOffset = -Math.PI / 2;
    
    for (let i = 0; i < sides; i++) {
      const angle = angleOffset + (i / sides) * Math.PI * 2;
      const nextAngle = angleOffset + ((i + 1) / sides) * Math.PI * 2;
      
      // 內圈三角形頂點在 cR * 1.2 位置
      const cx = Math.cos(angle) * cR * 1.2;
      const cy = Math.sin(angle) * cR * 1.2;
      const nx = Math.cos(nextAngle) * cR * 1.2;
      const ny = Math.sin(nextAngle) * cR * 1.2;
      
      // 中央三角形的一個角
      const triAngle = angle + Math.PI / sides;
      const tx = Math.cos(triAngle) * cR * 0.9;
      const ty = Math.sin(triAngle) * cR * 0.9;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.lineTo(tx, ty);
      ctx.closePath();
      
      // 深淺交替
      const shade = i % 2 === 0 ? '#7a20c0' : '#6a10b0';
      ctx.fillStyle = shade;
      ctx.fill();
      
      ctx.strokeStyle = '#aa44ff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  // 繪製中央大三角形（顯示數字）
  drawCenterTriangle(ctx, cR, rolling, progress, value) {
    const sides = 3;
    const angleOffset = -Math.PI / 2;
    
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = angleOffset + (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * cR;
      const y = Math.sin(angle) * cR;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // 高光效果的漸變填充
    const grad = ctx.createRadialGradient(0, -cR * 0.3, 0, 0, 0, cR);
    grad.addColorStop(0, '#c060ff');
    grad.addColorStop(0.5, '#9b30d0');
    grad.addColorStop(1, '#7a20c0');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // 邊框
    ctx.strokeStyle = '#dd88ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // 發光
    ctx.shadowColor = '#dd88ff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // 繪製數字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 數字外發光
    ctx.shadowColor = '#bf5fff';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    const displayValue = rolling ? value : value;
    ctx.fillText(String(displayValue), 0, 2);
    
    // 取消陰影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

let DB = { enemies: {}, items: {}, floors: {}, upgrades: [], boss: null };

// ============================================================
// 音效系統 — Web Audio API 內嵌合成
// ============================================================
let _ctx = null;
const getCtx = () => { if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)(); return _ctx; };

const SFX = {
  // 合成一個 tone
  tone(freq, type, duration, vol = 0.3) {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  },
  roll()  { this.tone(440, 'sine', 0.1, 0.15); setTimeout(() => this.tone(660, 'sine', 0.1, 0.12), 80); },
  hit()   { this.tone(180, 'sawtooth', 0.15, 0.25); },
  miss()  { this.tone(200, 'square', 0.1, 0.08); },
  playerHit() { this.tone(120, 'sawtooth', 0.2, 0.3); },
  pickup() { this.tone(880, 'sine', 0.1, 0.2); setTimeout(() => this.tone(1100, 'sine', 0.1, 0.15), 60); setTimeout(() => this.tone(1320, 'sine', 0.15, 0.1), 120); },
  levelUp() { this.tone(523, 'sine', 0.15, 0.25); setTimeout(() => this.tone(659, 'sine', 0.15, 0.25), 100); setTimeout(() => this.tone(784, 'sine', 0.2, 0.25), 200); setTimeout(() => this.tone(1047, 'sine', 0.3, 0.2), 300); },
  enemyDie() { this.tone(300, 'sawtooth', 0.1, 0.2); setTimeout(() => this.tone(200, 'sawtooth', 0.15, 0.15), 60); setTimeout(() => this.tone(100, 'sawtooth', 0.2, 0.1), 140); },
  floor() { this.tone(440, 'sine', 0.2, 0.2); setTimeout(() => this.tone(550, 'sine', 0.2, 0.2), 150); setTimeout(() => this.tone(660, 'sine', 0.3, 0.2), 300); },
  crit()  { this.tone(200, 'square', 0.08, 0.3); setTimeout(() => this.tone(300, 'square', 0.08, 0.25), 50); setTimeout(() => this.tone(400, 'square', 0.1, 0.2), 100); },
  btn()   { this.tone(600, 'sine', 0.05, 0.1); },
};

const D3 = {
  d20() { return Math.floor(Math.random() * 20) + 1; },
  d6() { return Math.floor(Math.random() * 6) + 1; },
  map(v) { if (v <= 3) return 3; if (v <= 12) return 4; return 6; },
  atk(base, def) {
    const r = this.d20();
    if (r === 1) return { d20: r, hit: false, crit: false, dmg: 0 };
    if (r === 20) return { d20: r, hit: true, crit: true, dmg: base + this.d6() * 2 };
    const tot = r + base;
    return { d20: r, hit: tot > def, crit: false, dmg: base + this.d6() };
  }
};

function rnd(n) { return Math.floor(Math.random() * n); }
function hcor(m, x1, x2, y) { for (let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++) if (y > 0 && y < m.length-1 && x > 0 && x < m[0].length-1) m[y][x] = 'floor'; }
function vcor(m, y1, y2, x) { for (let y = Math.min(y1,y2); y <= Math.max(y1,y2); y++) if (y > 0 && y < m.length-1 && x > 0 && x < m[0].length-1) m[y][x] = 'floor'; }

class DungeonGen {
  constructor(w=30, h=20) { this.w = w; this.h = h; }
  generate(floor) {
    const map = Array.from({length: this.h}, () => Array(this.w).fill('void'));
    const rooms = [];
    const target = 8 + rnd(4);
    for (let a = 0; a < target * 5 && rooms.length < target; a++) {
      const rw = 4 + rnd(5), rh = 3 + rnd(4);
      const rx = 2 + rnd(this.w - rw - 4), ry = 2 + rnd(this.h - rh - 4);
      if (rooms.some(r => rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y)) continue;
      rooms.push({x: rx, y: ry, w: rw, h: rh});
      for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) map[y][x] = 'floor';
    }
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i-1], b = rooms[i];
      const ax = Math.floor(a.x + a.w/2), ay = Math.floor(a.y + a.h/2);
      const bx = Math.floor(b.x + b.w/2), by = Math.floor(b.y + b.h/2);
      if (rnd(2) === 0) { hcor(map,ax,bx,ay); vcor(map,ay,by,bx); }
      else { vcor(map,ay,by,ax); hcor(map,ax,bx,by); }
    }
    for (let y = 1; y < this.h - 1; y++) for (let x = 1; x < this.w - 1; x++) {
      if (map[y][x] !== 'void') continue;
      let adj = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (map[y+dy] && map[y+dy][x+dx] === 'floor') { adj = true; break; }
      if (adj) map[y][x] = 'wall';
    }
    const last = rooms[rooms.length-1];
    const sx = Math.floor(last.x + last.w/2), sy = Math.floor(last.y + last.h/2);
    map[sy][sx] = 'stairs';
    const first = rooms[0];
    return {map, px: Math.floor(first.x + first.w/2), py: Math.floor(first.y + first.h/2), sx, sy, rooms};
  }
}

class State {
  constructor() { this.reset(); }
  reset() {
    this.p = {x:0,y:0,hp:30,maxHp:30,atk:5,def:2,gold:0,xp:0,xpN:50,lvl:1,inv:[],eq:{w:null,a:null},done:[]};
    this.map=[]; this.enemies=[]; this.items=[]; this.floor=1;
    this.over=false; this.win=false; this.boss=null;
  }
}

class Game {
  constructor() {
    this.s = new State(); this.gen = new DungeonGen();
    this.logs=[]; this.pts=null; this.turn=0;
    this.floats=[]; // 浮動文字管理器
    this.init();
  }

  async init() {
    try {
      const [en,it,fl,up,bo] = await Promise.all([
        fetch('./enemies.json').then(r=>r.json()),
        fetch('./items.json').then(r=>r.json()),
        fetch('./floor_configs.json').then(r=>r.json()),
        fetch('./upgrades.json').then(r=>r.json()),
        fetch('./boss.json').then(r=>r.json())
      ]);
      en.enemies.forEach(e=>DB.enemies[e.id]=e);
      it.items.forEach(i=>DB.items[i.id]=i);
      fl.floor_configs.forEach(f=>DB.floors[f.depth]=f);
      DB.upgrades=up.upgrades; DB.boss=bo.bosses[0];
    } catch(e) { this.fallback(); }
    this.bindUI();
if (!this.load()) this.new();
    tutorial.show(); // new() 內部已呼叫，init() 只在讀檔後多呼叫一次
    this.log('按「擲 D20」開始回合！', 'action');
  }

  fallback() {
    const e = {
      goblin_scout:{id:'goblin_scout',name:'哥布林斥候',hp:15,damage:3,xp_reward:10,behavior:'skittish'},
      skeleton_warrior:{id:'skeleton_warrior',name:'骸骨戰士',hp:35,damage:7,xp_reward:25,behavior:'aggressive'},
      cave_spider:{id:'cave_spider',name:'洞穴蜘蛛',hp:20,damage:5,xp_reward:18,behavior:'ambush'},
      shadow_wraith:{id:'shadow_wraith',name:'暗影幽魂',hp:28,damage:9,xp_reward:30,behavior:'haunting'},
      orc_brute:{id:'orc_brute',name:'獸人蠻兵',hp:60,damage:12,xp_reward:40,behavior:'aggressive'},
      flame_imp:{id:'flame_imp',name:'火焰惡魔',hp:18,damage:8,xp_reward:22,behavior:'chaotic'},
    };
    Object.assign(DB.enemies, e);
    DB.floors={
      1:{name:'地城入口',depth:1,enemy_tier:['goblin_scout','cave_spider'],loot_tier:'common'},
      2:{name:'遺忘墓穴',depth:2,enemy_tier:['skeleton_warrior','cave_spider','shadow_wraith'],loot_tier:'uncommon'},
      3:{name:'惡魔深淵',depth:3,enemy_tier:['shadow_wraith','orc_brute','flame_imp'],loot_tier:'rare'},
      4:{name:'遠古工場',depth:4,enemy_tier:['orc_brute','flame_imp','shadow_wraith'],loot_tier:'rare'},
      5:{name:'暗影國度',depth:5,enemy_tier:['shadow_wraith','orc_brute','flame_imp'],loot_tier:'epic'},
    };
    DB.items={
      health_potion:{id:'health_potion',name:'生命藥水',type:'consumable',rarity:'common',effect:{heal:25},icon:'❤️'},
      iron_sword:{id:'iron_sword',name:'鐵劍',type:'weapon',rarity:'common',effect:{damage:8},icon:'⚔️'},
      leather_armor:{id:'leather_armor',name:'皮甲',type:'armor',rarity:'common',effect:{defense:5},icon:'🛡️'},
    };
    DB.upgrades=[
      {id:'max_hp_boost',name:'體能訓練',desc:'最大生命 +15',tier:1,effect:{max_hp:15}},
      {id:'atk_boost',name:'殘暴打擊',desc:'攻擊力 +8',tier:1,effect:{damage:8}},
      {id:'heal_now',name:'快速治療',desc:'立即恢復 15 HP',tier:1,effect:{heal:15}},
    ];
    DB.boss={id:'the_lich_king',name:'巫妖王',description:'黑暗與死亡的主宰，最終的守關者。',phases:[{hp:180,attacks:[{name:'骨矛風暴',damage:15,cooldown:3},{name:'靈魂收割',damage:22,cooldown:6}]}]};
  }

  new() { this.s.reset(); this.logs=[]; this.pts=null; this.turn=0;
    // 教學追蹤旗標
    this._tutIntroDone=false; this._tutMoved=false; this._tutAttacked=false; this._tutItemPicked=false; this._tutTurnEnded=false;
    if (tutorial.active) { this.s.floor = 0; tutorial.step = 0; tutorial.active = true; tutorial.show(); }
    this.genFloor(); this.update(); }
  restart() { this.new(); tutorial.show(); }

  genFloor() {
    // ---- 教學關卡 floor 0：固定地圖 ----
    if (this.s.floor === 0) {
      this.s.map = [
        "############",
        "#..........#",
        "#..S.......#",   // S = 玩家起點 (3,2)
        "#..E.......#",   // E = 敵人 (3,3)，直接在玩家下方一步！
        "#..........#",   // (3,4) = 階梯：殺完敵人往下一步就到（往東可繞路拿道具）
        "#..........#",   // (4,3) = 道具（殺完敵人往東一步可拿，不拿直接往南走階梯）
        "#..........#",
        "#..........#",
        "#..........#",
        "############"
      ].map(row => row.split(''));
      this.s.p.x = 3; this.s.p.y = 2;  // 玩家起點 (3,2)
      this.s.enemies = [];
      this.s.items = [];
      this.s.boss = null;
      // 教學敵人：就在玩家正下方一步！任何點數都能立即攻擊
      this.s.enemies.push({ id:'tut_enemy', name:'練習敵人', icon:'👹', x:3, y:3, maxHp:5, hp:5, atk:1, def:0, isBoss:false, xpR:5 });
      // 教學道具：殺死敵人後可撿（可選，往東走一步就到）
      this.s.items.push({ x:4, y:3, item:{ id:'tut_item', name:'生命藥水', type:'consumable', rarity:'common', effect:{heal:15}, icon:'❤️' }});
      // 教學階梯：在敵人正下方一步（殺完敵人後直接可達）
      this.s.map[4][3] = 'stairs';  // 地圖上第5行第4列 = 階梯 (3,4)
      document.getElementById('floor-name-bar').textContent = '🏰 教學關卡';
      document.getElementById('lore-text').textContent = '跟隨箭頭指引完成實戰教學！';
      return;
    }
    // ---- 正常關卡生成 ----
    const r = this.gen.generate(this.s.floor);
    this.s.map = r.map; this.s.p.x = r.px; this.s.p.y = r.py;
    this.s.enemies=[]; this.s.items=[]; this.s.boss=null;
    const cfg = DB.floors[this.s.floor];
    const tier = cfg ? cfg.enemy_tier : ['goblin_scout'];
    const loot = cfg ? cfg.loot_tier : 'common';

    if (this.s.floor < 5) {
      for (let i = 0; i < 5 + this.s.floor*2; i++) { const p = this.findEmpty(); if (p) this.spawnEnemy(p.x,p.y,tier); }
    } else {
      const p = this.findEmpty();
      if (p) {
        const b = DB.boss;
        this.s.boss = {id:b.id,name:b.name,icon:'💀',x:p.x,y:p.y,maxHp:b.phases[0].hp,hp:b.phases[0].hp,atk:12,def:5,isBoss:true,attacks:b.phases[0].attacks,cooldowns:{}};
        this.s.enemies.push(this.s.boss);
        document.getElementById('boss-name').textContent = '💀 '+b.name;
        document.getElementById('boss-desc').textContent = b.description || '';
        document.getElementById('boss-hp-text').textContent = 'HP: '+b.phases[0].hp;
        document.getElementById('boss-hp-bar').style.width = '100%';
        document.getElementById('boss-modal').classList.add('show');
      }
    }
    for (let i = 0; i < 2+rnd(3); i++) { const p = this.findEmpty(); if (p) this.spawnItem(p.x,p.y,loot); }
    const fc = DB.floors[this.s.floor];
    document.getElementById('floor-name-bar').textContent = fc ? fc.name : '第'+this.s.floor+'層';
    document.getElementById('lore-text').textContent = fc ? (fc.description || '') : '';
  }

  spawnEnemy(x,y,tier) {
    if (!tier||tier.length===0) return;
    const t = DB.enemies[tier[rnd(tier.length)]];
    if (!t) return;
    const sc = 0.8 + this.s.floor*0.15;
    this.s.enemies.push({id:t.id,name:t.name,icon:'👹',x,y,maxHp:Math.floor(t.hp*sc),hp:Math.floor(t.hp*sc),atk:Math.floor(t.damage*(0.8+this.s.floor*0.1)),def:2,isBoss:false,xpR:t.xp_reward||10});
  }

  spawnItem(x,y,tier) {
    const pool = {common:['common'],uncommon:['common','uncommon'],rare:['uncommon','rare'],epic:['rare','epic']}[tier]||['common'];
    const r = pool[rnd(pool.length)];
    const cands = Object.values(DB.items).filter(i=>i.rarity===r);
    if (cands.length===0) return;
    const t = cands[rnd(cands.length)];
    this.s.items.push({x,y,item:{id:t.id,name:t.name,type:t.type,rarity:t.rarity,effect:t.effect,icon:t.icon||'📦'}});
  }

  findEmpty() {
    for (let i = 0; i < 80; i++) {
      const x = 2+rnd(this.s.map[0].length-4), y = 2+rnd(this.s.map.length-4);
      if (this.s.map[y][x]!=='floor') continue;
      if (x===this.s.p.x&&y===this.s.p.y) continue;
      if (this.s.enemies.some(e=>e.x===x&&e.y===y)) continue;
      if (this.s.items.some(it=>it.x===x&&it.y===y)) continue;
      return {x,y};
    }
    return null;
  }

  rollDice() {
    if (this.s.over) return;
    if (this.pts !== null) { this.toast('已經擲過了！'); return; }
    
    // 防止重複點擊
    if (this._diceRolling) return;
    this._diceRolling = true;

    // 確保 D20Renderer 已初始化
    const canvas = document.getElementById('dice-canvas');
    if (canvas && !this.d20Renderer) {
      this.d20Renderer = new D20Renderer(canvas);
    }

    const finishRoll = (r, v) => {
      this.pts = v;
      this.lastRoll = r;
      if (this.d20Renderer) this.d20Renderer.stopRoll(r);
      const resText = document.getElementById('dice-result-text');
      if (resText) { resText.textContent = '🎲 骰出 ' + r + ' → ' + v + ' 點行動力！'; resText.style.color = 'var(--cyan)'; }
      this.log('🎲 骰出 ' + r + ' → ' + v + ' 點！', 'action');
      SFX.roll();
      try { this.update(); } catch (e) { /* ignore */ }
      tutorial.checkStep(this);

      // 骰完自動跳轉移動頁（教學模式）
      if (tutorial.active) {
        switchScreen('move');
      } else {
        this.showDiceContinueBtn();
      }

      // 動畫鎖解除
      this._diceRolling = false;
    };

    if (this.d20Renderer) {
      this.d20Renderer.startRoll();
      setTimeout(() => {
        const r = D3.d20(), v = D3.map(r);
        finishRoll(r, v);
      }, 1500);
    } else {
      const r = D3.d20(), v = D3.map(r);
      finishRoll(r, v);
    }
  }

  showDiceContinueBtn() {
    // 隱藏骰子按鈕，顯示「繼續」按鈕
    const btn = document.getElementById('btn-roll');
    const hint = document.getElementById('dice-ready-hint');
    if (btn) {
      btn.textContent = '▶️ 前往移動 →';
      btn.onclick = () => {
        if (typeof switchScreen === 'function') switchScreen('move');
        // 恢復按鈕原狀
        btn.textContent = '🎲 重新擲骰';
        btn.onclick = () => game.rollDice();
      };
    }
    if (hint) hint.style.display = 'none';
  }

  doMove(dx,dy) {
    if (this.s.over) return;
    if (this.pts===null || this.pts<=0) { this.toast('沒有行動點！'); return; }
    const nx=this.s.p.x+dx, ny=this.s.p.y+dy;
    if (nx<0||nx>=this.s.map[0].length||ny<0||ny>=this.s.map.length) return;
    const tile=this.s.map[ny][nx];
    // 牆壁：DungeonGen 用 'wall'，教學關卡用 '#'
    if (tile==='#'||tile==='wall'||tile==='void') { this.toast('🚫 被牆壁阻擋！'); this.log('被牆壁阻擋','info'); return; }
    const enemy=this.s.enemies.find(e=>e.x===nx&&e.y===ny);
    if (enemy) { this.attackEnemy(enemy); return; }
    this.pts--;
    this.s.p.x=nx; this.s.p.y=ny;
    const dirs = {'-1,0':'西','1,0':'東','0,-1':'北','0,1':'南'};
    this.log('移動到'+dirs[dx+','+dy],'info');
    this.checkTile(nx,ny);
    this.render(); this.update();
    // 如果沒有行動點了，自動結束回合
    if (this.pts !== null && this.pts <= 0) {
      this.toast('行動點用盡！');
      setTimeout(() => this.endTurn(), 300);
    }
  }

  doAttack() {
    // 教學模式下，攻擊按鈕的提示
    if (this.pts !== null && this.pts < 1) { this.toast('沒有行動點了！'); return; }
    if (this.s.over||this.pts===null||this.pts<1) { this.toast('無法攻擊！'); return; }
    const p=this.s.p;
    const adj=this.s.enemies.filter(e=>Math.abs(e.x-p.x)<=1&&Math.abs(e.y-p.y)<=1);
    if (adj.length===0) { this.toast('附近沒有敵人！'); return; }
    this.attackEnemy(adj[0]);
  }

  attackEnemy(en) {
    const p=this.s.p;
    const wAtk=p.eq.w?(p.eq.w.effect.damage||0):0;
    const res=D3.atk(p.atk+wAtk,en.def);
    if (!res.hit) { this.log('攻擊 '+en.name+'...Miss！ (D20:'+res.d20+')','info'); SFX.miss(); }
    else {
      let dmg=res.dmg;
      const isCrit = res.crit;
      if (isCrit) { dmg*=2; this.log('💥 爆擊！對 '+en.name+' 造成 '+dmg+' 傷害！ (D20:'+res.d20+')','dmg'); SFX.crit(); }
      else { this.log('攻擊 '+en.name+'，造成 '+dmg+' 傷害！ (D20:'+res.d20+')','dmg'); SFX.hit(); }
      en.hp -= dmg;
      // P1-5: 顯示傷害數值浮動文字
      this.showFloat('-'+dmg, isCrit?'#ffff00':'#ff6666', en.x, en.y);
      if (en.hp<=0) {
        this.log('✨ '+en.name+' 被擊敗！','action');
        SFX.enemyDie();
        // P1-5: 敵人死亡特效
        this.showEnemyDeathEffect(en);
        if (en.isBoss) { this.winGame(); return; }
        this.s.enemies=this.s.enemies.filter(e=>e!==en);
        p.xp += en.xpR||10;
        // P1-4: 顯示獲得 XP 浮動文字
        this.showFloat('+'+en.xpR+' XP', '#aa88ff', en.x, en.y);
        // 敵人掉落金幣
        const goldDrop = 10 + Math.floor(Math.random() * 21); // 10-30 gold
        p.gold += goldDrop;
        this.showFloat('+'+goldDrop+' 💰', '#ffd700', en.x, en.y);
        this.log('💰 擊敗 '+en.name+'，獲得 '+goldDrop+' 金幣！','action');
        this.checkLvl();
      }
    }
    // 攻擊後直接結束回合（攻擊是最後一步）
    if (this.pts!==null) this.pts--;
    this.render(); this.update();
    this.toast('⚔️ 攻擊後本回合結束！攻擊是每回合的最後一步！');
    setTimeout(() => this.endTurn(), 400);
  }

  doWait() { this.endTurn(); }

  unequipW() {
    const p = this.s.p;
    if (!p.eq.w) { this.toast('沒有裝備武器'); return; }
    p.inv.push(p.eq.w);
    this.log('卸下武器：' + p.eq.w.name, 'item');
    p.eq.w = null;
    this.update();
  }

  unequipA() {
    const p = this.s.p;
    if (!p.eq.a) { this.toast('沒有裝備護甲'); return; }
    p.inv.push(p.eq.a);
    this.log('卸下護甲：' + p.eq.a.name, 'item');
    p.eq.a = null;
    this.update();
  }

  useItem(idx) {
    if (this.s.over||this.pts===null||this.pts<2) { this.toast('使用道具需要 2 點！'); return; }
    const it=this.s.p.inv[idx];
    if (!it) return;
    const e=it.effect||{};
    if (e.heal) { const old=this.s.p.hp; this.s.p.hp=Math.min(this.s.p.maxHp,this.s.p.hp+e.heal); this.log('使用 '+it.name+'，恢復 '+(this.s.p.hp-old)+' HP！','heal'); }
    this.s.p.inv.splice(idx,1);
    this.pts-=2;
    this.endTurn();
  }

  checkTile(x,y) {
    const ii=this.s.items.findIndex(i=>i.x===x&&i.y===y);
    if (ii!==-1) {
      const it=this.s.items[ii].item;
      const e=it.effect||{};
      if (it.type==='consumable'&&e.heal) { const o=this.s.p.hp; this.s.p.hp=Math.min(this.s.p.maxHp,this.s.p.hp+e.heal); this.log('拾取 '+it.name+'，恢復 '+(this.s.p.hp-o)+' HP！','heal'); SFX.pickup(); }
      else { this.s.p.inv.push(it); this.log('拾取 '+(it.icon||'')+' '+it.name+'！','item'); SFX.pickup(); }
      this.s.items.splice(ii,1);
    }
    if (this.s.map[y][x]==='stairs') {
      if (this.s.floor===5&&this.s.enemies.some(e=>e.isBoss)) { this.toast('必須先打敗BOSS！'); return; }
      this.nextFloor();
    }
  }

  nextFloor() {
    this.s.floor++;
    if (this.s.floor>5) { this.winGame(); return; }
    this.toast('下降到第 '+this.s.floor+' 層...');
    SFX.floor();
    this.s.p.maxHp+=5;
    this.s.p.hp=Math.min(this.s.p.maxHp,this.s.p.hp+5);
    this.pts=null;
    this.genFloor();
    this.render(); this.update();
    // 顯示商店畫面（不打斷遊戲流程，shopShown 回呼後再升級）
    this.showShop();
  }

  // ============================================================
  // 商店系統
  // ============================================================
  showShop() {
    // 教學關卡不顯示商店
    if (this.s.floor <= 1) {
      this.showUpgrade();
      return;
    }
    const shopItems = this.generateShopItems();
    this._shopItems = shopItems;

    const list = document.getElementById('shop-list');
    list.innerHTML = '';
    shopItems.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'shop-card';
      const canAfford = this.s.p.gold >= item.price;
      div.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-price ${canAfford ? '' : 'cannot-afford'}">💰 ${item.price}</div>
      `;
      div.style.opacity = canAfford ? '1' : '0.5';
      div.onclick = () => {
        if (!canAfford) { this.toast('金幣不足！'); return; }
        this.buyShopItem(idx);
      };
      list.appendChild(div);
    });

    document.getElementById('shop-gold').textContent = this.s.p.gold;
    document.getElementById('shop-modal').classList.add('show');
  }

  generateShopItems() {
    const items = [];
    const p = this.s.p;

    // 固定商品：生命藥水（性價比最高）
    items.push({
      id: 'shop_health_potion',
      icon: '❤️',
      name: '生命藥水',
      desc: '恢復 30 HP',
      price: 15,
      type: 'heal',
      effect: { heal: 30 }
    });

    // 固定商品：攻擊強化（臨時 buff，持續到下層）
    items.push({
      id: 'shop_atk_boost',
      icon: '⚔️',
      name: '攻擊強化',
      desc: '攻擊力 +5（永久）',
      price: 30,
      type: 'buff',
      effect: { atk: 5 }
    });

    // 固定商品：防禦強化（臨時 buff，持續到下層）
    items.push({
      id: 'shop_def_boost',
      icon: '🛡️',
      name: '防禦強化',
      desc: '防禦力 +3（永久）',
      price: 25,
      type: 'buff',
      effect: { def: 3 }
    });

    // 隨機商品：神秘卡片（從 DB.items 隨機選一個）
    const allItems = Object.values(DB.items);
    if (allItems.length > 0) {
      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
      const price = randomItem.cost || 20;
      items.push({
        id: 'shop_mystery_' + randomItem.id,
        icon: randomItem.icon || '🎁',
        name: '神秘卡片',
        desc: '隨機獲得：' + randomItem.name,
        price: Math.max(10, Math.floor(price * 0.8)),
        type: 'mystery',
        mysteryItem: randomItem
      });
    }

    return items;
  }

  buyShopItem(idx) {
    const item = this._shopItems[idx];
    if (!item) return;
    const p = this.s.p;

    if (p.gold < item.price) {
      this.toast('金幣不足！');
      return;
    }

    p.gold -= item.price;

    switch (item.type) {
      case 'heal':
        p.hp = Math.min(p.maxHp, p.hp + item.effect.heal);
        this.log('❤️ 購買 ' + item.name + '，恢復 ' + item.effect.heal + ' HP！', 'heal');
        SFX.pickup();
        break;
      case 'buff':
        if (item.effect.atk) p.atk += item.effect.atk;
        if (item.effect.def) p.def += item.effect.def;
        this.log('✨ 購買 ' + item.name + '！', 'action');
        SFX.levelUp();
        break;
      case 'mystery':
        if (item.mysteryItem) {
          p.inv.push({ ...item.mysteryItem });
          this.log('🎁 購買神秘卡片，獲得 ' + item.mysteryItem.name + '！', 'item');
          SFX.pickup();
        }
        break;
    }

    // 標記已購買
    this._shopItems[idx] = null;
    document.getElementById('shop-gold').textContent = p.gold;
    this.update();
    this.toast('購買成功！');
  }

  closeShop() {
    document.getElementById('shop-modal').classList.remove('show');
    // 關閉商店後顯示升級選擇
    this.showUpgrade();
  }

  showUpgrade() {
    // floor 0 教學關卡不觸發升級選擇
    if (this.s.floor === 0 || _skipUpgrade) return;
    if (!this.s.p || !this.s.p.done) return;
    const pool=DB.upgrades.filter(u=>!this.s.p.done.includes(u.id));
    if (pool.length===0) return;
    const pick=pool.sort(()=>rnd(3)-1).slice(0,3);
    const list=document.getElementById('upgrade-list');
    list.innerHTML='';
    pick.forEach(u=>{
      const div=document.createElement('div');
      div.className='upgrade-card';
      div.innerHTML='<span class="u-tier tier-'+u.tier+'">第'+u.tier+'層</span> <span class="u-name">'+u.name+'</span><div class="u-desc">'+u.desc+'</div>';
      div.onclick=()=>{ this.applyUpgrade(u); document.getElementById('upgrade-modal').classList.remove('show'); };
      list.appendChild(div);
    });
    document.getElementById('upgrade-modal').classList.add('show');
  }

  applyUpgrade(u) {
    const e=u.effect;
    if (e.max_hp) { this.s.p.maxHp+=e.max_hp; this.s.p.hp+=e.max_hp; this.log('最大生命 +'+e.max_hp+'！','heal'); }
    if (e.damage) { this.s.p.atk+=e.damage; this.log('攻擊力 +'+e.damage+'！','action'); }
    if (e.heal) { this.s.p.hp=Math.min(this.s.p.maxHp,this.s.p.hp+e.heal); this.log('恢復 '+e.heal+' HP！','heal'); }
    if (e.defense) { this.s.p.def+=e.defense; this.log('防禦力 +'+e.defense+'！','action'); }
    this.s.p.done.push(u.id);
    this.update();
  }

  checkLvl() {
    while (this.s.p.xp >= this.s.p.xpN) {
      this.s.p.xp -= this.s.p.xpN;
      this.s.p.lvl++;
      this.s.p.xpN = Math.floor(this.s.p.xpN * 1.5);
      this.s.p.maxHp += 8; this.s.p.hp = this.s.p.maxHp; this.s.p.atk += 2;
      this.log('⬆️ 等級提升！目前 '+this.s.p.lvl+' 級！','action');
      SFX.levelUp();
      // P1-4: 顯示升級浮動文字
      this.showFloat('⬆️ LV.'+this.s.p.lvl, '#ffff00', this.s.p.x, this.s.p.y);
    }
  }

  endTurn() {
    this.turn++;
    this.enemyTurn();
    if (this.s.p.hp<=0) { this.loseGame(); return; }
    this.pts=null;
    this.render(); this.update();
  }

  enemyTurn() {
    for (const e of this.s.enemies) {
      if (e.hp<=0) continue;
      const p=this.s.p;
      const dx=Math.sign(p.x-e.x), dy=Math.sign(p.y-e.y);
      if (Math.abs(e.x-p.x)<=1&&Math.abs(e.y-p.y)<=1) {
        const aDef=p.eq.a?(p.eq.a.effect.defense||0):0;
        const res=D3.atk(e.atk,p.def+aDef);
        if (res.hit) {
          let dmg=res.dmg; if (res.crit) dmg*=2;
          p.hp-=dmg;
          SFX.playerHit();
          // P1-5: 玩家受到傷害浮動文字
          this.showFloat('-'+dmg, '#ff4444', p.x, p.y);
          if (e.isBoss) this.log('💀 '+e.name+' 攻擊你，造成 '+dmg+' 傷害！','boss');
          else this.log(e.name+' 攻擊你，造成 '+dmg+' 傷害！','dmg');
        } else this.log(e.name+' 攻擊失敗！','info');
      } else {
        const nx=e.x+dx, ny=e.y+dy;
        if (this.s.map[ny]&&this.s.map[ny][nx]==='floor'&&!this.s.enemies.some(o=>o!==e&&o.x===nx&&o.y===ny)) { e.x=nx; e.y=ny; }
      }
    }
  }

  winGame() { this.s.win=true; this.s.over=true; this.showGameover(true); }
  loseGame() { this.s.over=true; this.showGameover(false); }

  showGameover(win) {
    const m=document.getElementById('gameover-modal');
    document.getElementById('go-title').textContent=win?'🏆 勝利！':'💀 你死了';
    document.getElementById('go-title').className='gameover-title '+(win?'win':'lose');
    document.getElementById('go-msg').textContent=win?'恭喜擊敗巫妖王，逃出地城！':'你在地城中倒下...';
    document.getElementById('go-stats').textContent='樓層：'+this.s.floor+' | 回合：'+this.turn;
    m.classList.add('show');
  }

  unequip(slot) {
    const item=slot==='w'?this.s.p.eq.w:this.s.p.eq.a;
    if (item) { this.s.p.inv.push(item); this.log('脫下 '+item.name,'info'); }
    if (slot==='w') this.s.p.eq.w=null; else this.s.p.eq.a=null;
    this.update();
  }

  update() {
    try {
    if (!this.s.p) return;
    const p=this.s.p;
    document.getElementById('cur-floor').textContent=this.s.floor;
    document.getElementById('cur-hp').textContent=p.hp;
    document.getElementById('max-hp').textContent=p.maxHp;
    document.getElementById('cur-gold').textContent=p.gold;
    document.getElementById('c-hp').textContent=p.hp;
    document.getElementById('c-max').textContent=p.maxHp;
    document.getElementById('hp-bar').style.width=((p.hp/p.maxHp)*100)+'%';
    document.getElementById('c-atk').textContent='⚔️ '+(p.atk+(p.eq.w?(p.eq.w.effect.damage||0):0));
    document.getElementById('c-def').textContent='🛡️ '+(p.def+(p.eq.a?(p.eq.a.effect.defense||0):0));
    document.getElementById('c-xp').textContent=p.xp;
    document.getElementById('c-xp-next').textContent=p.xpN;
    document.getElementById('xp-bar').style.width=((p.xp/p.xpN)*100)+'%';

    const invEl=document.getElementById('inventory-bar');
    invEl.innerHTML='';
    for (let i=0;i<12;i++) {
      const it=p.inv[i];
      const s=document.createElement('div');
      s.className='inv-slot'+(it?'':' empty');
      if (it) {
        s.textContent=it.icon||'📦';
        s.title=it.name+' ('+it.rarity+')';
        s.style.borderColor={common:'#888',uncommon:'#4caf50',rare:'#4fc3f7',epic:'#ab47bc',legendary:'#e94560'}[it.rarity]||'#888';
        s.onclick=()=>this.useItem(i);
      }
      invEl.appendChild(s);
    }

    const wEq=p.eq.w, aEq=p.eq.a;
    document.getElementById('eq-weapon-icon').textContent=wEq?(wEq.icon||'⚔️'):'⚔️';
    document.getElementById('eq-armor-icon').textContent=aEq?(aEq.icon||'🛡️'):'🛡️';
    document.getElementById('eq-weapon').className='equip-btn'+(wEq?' equipped':'');
    document.getElementById('eq-armor').className='equip-btn'+(aEq?' equipped':'');

    const has=this.pts!==null&&this.pts>0;
    document.getElementById('btn-attack').disabled=!has;
    document.getElementById('btn-end').disabled=(this.pts===null);
    document.getElementById('btn-item').disabled=!has||p.inv.length===0;
    document.getElementById('btn-roll').disabled=(this.pts!==null);

    const boss=this.s.enemies.find(e=>e.isBoss);
    if (boss) {
      document.getElementById('boss-hp-bar').style.width=Math.max(0,(boss.hp/boss.maxHp)*100)+'%';
      document.getElementById('boss-hp-text').textContent='HP: '+boss.hp+' / '+boss.maxHp;
    }
    } catch(e) { /* suppress update errors */ }
  }

  render() {
    const mapEl=document.getElementById('map-grid');
    if (!this.s.map||this.s.map.length===0) return;
    if (!this.s.p) return;
    mapEl.innerHTML='';

    // 攝影機系統：只渲染玩家周圍 11×11 區域
    const CAM=11;
    const hw=Math.floor(CAM/2), hh=Math.floor(CAM/2);
    const px=this.s.p.x, py=this.s.p.y;
    const mw=this.s.map[0]?.length||15, mh=this.s.map.length;
    const startX=Math.max(0,px-hw), startY=Math.max(0,py-hh);
    const endX=Math.min(mw,px+hw+1), endY=Math.min(mh,py+hh+1);
    const visW=endX-startX, visH=endY-startY;

    // 根據容器寬度計算瓷磚大小（強制最小 32px）
    const container=document.getElementById('dungeon-map');
    const containerW=container.offsetWidth||480;
    const availH=container.offsetHeight||400;
    const rawTile = Math.floor(Math.min(containerW, availH)/CAM);
    const tileSize = Math.max(rawTile, 32); // 強制最小 32px
    const gridPixelW=tileSize*visW+(visW-1);
    const gridPixelH=tileSize*visH+(visH-1);

    mapEl.style.gridTemplateColumns='repeat('+visW+','+tileSize+'px)';
    mapEl.style.gridTemplateRows='repeat('+visH+','+tileSize+'px)';
    mapEl.style.width=Math.ceil(tileSize*visW+(visW-1)*1)+'px';
    mapEl.style.height=Math.ceil(tileSize*visH+(visH-1)*1)+'px';

    for (let y=startY;y<endY;y++) {
      for (let x=startX;x<endX;x++) {
        const div=document.createElement('div');
        div.setAttribute('data-x', x);
        div.setAttribute('data-y', y);
        const tile=this.s.map[y][x];
        const isPlayer=(x===px&&y===py);
        const enemy=this.s.enemies.find(e=>e.x===x&&e.y===y);
        const item=this.s.items.find(i=>i.x===x&&i.y===y);
        if (isPlayer) {
          div.className='map-tile tile-player'; div.textContent='🧙';
        } else if (enemy) {
          div.className='map-tile '+(enemy.isBoss?'tile-boss':'tile-enemy'); div.textContent=enemy.icon||'👹';
        } else if (item) {
          div.className='map-tile tile-item'; div.textContent=item.item.icon||'💎';
        } else {
          // 地形瓷磚：地圖字元 → CSS class 名稱
          const tileClass = {'.':'tile-floor','#':'tile-wall',void:'tile-void','P':'tile-stairs','stairs':'tile-stairs'}[tile] || 'tile-floor';
          div.className='map-tile '+tileClass;
          if (tile==='stairs'||tile==='P') div.textContent='⬇️';
          else if (tile==='trap') div.textContent='⚡';
        }

        // P0-1: Adjacent walkable tile glow (floor tiles adjacent to player, not walls/void)
        if (!isPlayer && !enemy && !item) {
          const dx = x - px, dy = y - py;
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist === 1 && (tile === '.' || tile === 'floor' || tile === 'stairs' || tile === 'trap')) {
            div.classList.add('tile-adjacent');
          }
        }

        // P0-3: Enemy attack range highlight — tiles in range of any enemy (Chebyshev distance <= 2)
        if (!isPlayer && !enemy && !item) {
          for (const en of this.s.enemies) {
            if (en.hp <= 0) continue;
            const edx = Math.abs(x - en.x), edy = Math.abs(y - en.y);
            const edist = Math.max(edx, edy); // Chebyshev distance for attack range
            if (edist <= 2) {
              div.classList.add('tile-enemy-range');
              break;
            }
          }
        }

        div.style.cursor = 'pointer';
        div.onclick = () => {
          if (!game || !game.s) return;
          const dx = x - game.s.p.x;
          const dy = y - game.s.p.y;
          if (dx === 0 && dy === 0) return; // 點自己：不做任何事
          if (Math.abs(dx) + Math.abs(dy) === 1) {
            game.doMove(dx, dy);
          }
          // 太遠的格子：提示
          else if (game.pts !== null && game.pts > 0) {
            game.toast('只能移動到相鄰格子！');
          }
        };
        mapEl.appendChild(div);
      }
    }

    // 滾動地圖容器讓玩家在中央（transform 將網格移到正確位置）
    requestAnimationFrame(() => {
      const realTileW=mapEl.offsetWidth/visW;
      const realTileH=mapEl.offsetHeight/visH;
      const offX=(hw+startX-px)*realTileW;
      const offY=(hh+startY-py)*realTileH;
      mapEl.style.transform='translate('+offX+'px,'+offY+'px)';
    });

    // 更新日誌：寫入 #tut-log (在 #tut-hint 內)
    const logHTML = this.logs.slice(-8).map(l=>'<div class="log-line log-'+l.type+'">'+l.text+'</div>').join('');
    const tutLogEl = document.getElementById('tut-log');
    if (tutLogEl) { tutLogEl.innerHTML = logHTML; tutLogEl.scrollTop = tutLogEl.scrollHeight; }
  }

  log(text,type='info') { this.logs.push({text,type}); if(this.logs.length>100) this.logs.shift(); this.render(); }
  toast(text) { const t=document.getElementById('toast'); t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); }

  // ============================================================
  // 浮動文字系統 — P1-6
  // ============================================================
  showFloat(text, color, cx, cy) {
    // cx, cy 是地圖座標，轉換為螢幕座標後顯示
    const mapEl = document.getElementById('map-grid');
    const container = document.getElementById('dungeon-map');
    if (!mapEl || !container) return;
    const rect = mapEl.getBoundingClientRect();
    const tileSize = rect.width / (parseInt(mapEl.style.gridTemplateColumns.replace('repeat(','').split(',')[0]) || 11);
    const relX = cx - this.s.p.x;
    const relY = cy - this.s.p.y;
    const sx = rect.left - container.getBoundingClientRect().left + (relX + 5) * tileSize;
    const sy = rect.top - container.getBoundingClientRect().top + (relY + 5) * tileSize;
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.color = color;
    el.style.left = sx + 'px';
    el.style.top = sy + 'px';
    container.appendChild(el);
    // 動畫結束後移除
    el.addEventListener('animationend', () => el.remove());
  }

  // ============================================================
  // 敵人死亡特效 — P1-5
  // ============================================================
  showEnemyDeathEffect(en) {
    const mapEl = document.getElementById('map-grid');
    const container = document.getElementById('dungeon-map');
    if (!mapEl || !container) return;
    const rect = mapEl.getBoundingClientRect();
    const tileSize = rect.width / 11;
    const relX = en.x - this.s.p.x;
    const relY = en.y - this.s.p.y;
    const sx = rect.left - container.getBoundingClientRect().left + (relX + 5) * tileSize;
    const sy = rect.top - container.getBoundingClientRect().top + (relY + 5) * tileSize;
    // 建立爆炸粒子
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'death-particle';
      const angle = (i / 6) * Math.PI * 2;
      const dist = 20 + Math.random() * 20;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      p.style.left = sx + tileSize/2 + 'px';
      p.style.top = sy + tileSize/2 + 'px';
      p.style.background = i % 2 === 0 ? '#ff4444' : '#ffaa00';
      container.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  bindUI() {
    document.addEventListener('keydown', e => {
      if (this.s.over) return;
      const k=e.key.toLowerCase();
      if (k==='enter') this.rollDice();
      else if (k==='w'||k==='arrowup') this.doMove(0,-1);
      else if (k==='s'||k==='arrowdown') this.doMove(0,1);
      else if (k==='d'||k==='arrowright') this.doMove(1,0);
      else if (k==='a'||k==='arrowleft') this.doMove(-1,0);
      else if (k==='r'||k===' ') this.doAttack();
    });
    document.getElementById('menu-row').children[0].onclick=()=>this.saveGame();
    document.getElementById('menu-row').children[1].onclick=()=>{if(!this.load()) this.toast('沒有存檔！');};
    document.getElementById('menu-row').children[2].onclick=()=>this.restart();
  }

  saveGame() {
    try { localStorage.setItem('d3_save',JSON.stringify({p:this.s.p,floor:this.s.floor,turn:this.turn})); this.toast('💾 存檔成功！'); } catch { this.toast('存檔失敗！'); }
  }

  load() {
    const str=localStorage.getItem('d3_save');
    if (!str) return false;
    try {
      const d=JSON.parse(str);
      this.s.p=d.p; this.s.floor=d.floor; this.turn=d.turn;
      this.genFloor(); this.update(); this.log('讀取存檔成功！','action');
      return true;
    } catch { return false; }
  }
}

// ---- 實戰教學系統（場景介紹優先）----
const tutorial = {
  active: true,
  step: 0,
  version: 5,  // d3_tut_v5

  // 步驟定義：intro → 骰子 → 移動 → 攻擊 → 階梯
  steps: [
    {
      id: 'intro',
      title: '🏰 歡迎來到地城',
      hint: '📌 目標：完成新手教學，進入真正的地城冒險！\n\n【你在做什麼】\n你是 🧙 巫師角色，準備探索 5 層地城，挑戰最終 Boss 巫妖王！\n\n【遊戲基本規則】\n🎲 每回合先擲 D20 骰子，決定行動點\n⚔️ 行動點用來移動和攻擊敵人\n⬇️ 走到綠色階梯進入下一層\n💎 踩到道具自動撿起\n❤️ 生命歸 0 = 遊戲結束\n\n【操作方式】\n⬆️⬇️⬅️➡️ 方向鍵 / 點擊地圖格子 移動\n⚔️ 點攻擊按鈕 攻擊敵人\n💊 點道具按鈕 使用背包道具\n\n👇 按「開始教學」繼續 →',
      lockMove: true,
    },
    {
      id: 'dice',
      title: '🎲 擲 D20 命運之骰',
      hint: '📌 目的：擲骰子獲得本回合的行動點！\n\n【你在做什麼】\n點擊「🎲 擲 D20 骰子」按鈕，決定這回合能走幾步。\n\n【為什麼要這樣做】\n沒有行動點 = 無法移動、無法攻擊。\nD20 擲得越高，行動點越多！\n\n【行動點對照表】\n擲出 1-3  ＝ 3 點行動力（低）\n擲出 4-12 ＝ 4 點行動力（中）\n擲出 13-20 ＝ 6 點行動力（高！）\n\n👇 按鈕已亮起，點它擲骰子！',
      lockMove: true,
    },
    {
      id: 'move',
      title: '🗺️ 移動到敵人身邊',
      hint: '📌 目的：靠近敵人，進行戰鬥！\n\n【你在做什麼】\n用方向鍵或點擊格子，走到 👹 敵人旁邊（綠色閃爍的格子 = 可走）。\n\n【為什麼要這樣做】\n攻擊按鈕只有敵人在你旁邊時才能按。\n你離敵人只有一步，行動點夠用！\n\n【教學目標】\n走到 👹 練習敵人旁邊的格子，\n然後就可以進入「攻擊」步驟了。\n\n👇 按 ⬇️ 或點下方的綠色格子！',
      lockMove: false,
    },
    {
      id: 'attack',
      title: '⚔️ 攻擊敵人！',
      hint: '📌 目的：消滅練習敵人，學會戰鬥！\n\n【你在做什麼】\n👹 敵人就在你旁邊了！\n點「⚔️ 攻擊」按鈕，自動計算命中和傷害。\n\n【為什麼要這樣做】\n✅ 消滅敵人可獲得經驗值（XP）升級\n✅ 進入下一層才能繼續冒險\n⚠️ 注意：攻擊後本回合立刻結束！\n\n【戰鬥說明】\nD20 + 你的攻擊力 > 敵人防禦 = 命中\n💥 骰到 20 = 爆擊，傷害 × 2！\n\n👇 按 ⚔️ 攻擊按鈕！',
      lockMove: false,
    },
    {
      id: 'stairs',
      title: '🚪 前往下一層！',
      hint: '📌 目的：離開教學關卡，進入真正的地城！\n\n【你在做什麼】\n✨ 敵人被消滅了！\n往南走到 ⬇️ 綠色階梯，進入第 1 層。\n\n【為什麼要這樣做】\n✅ 教學關卡只是讓你熟悉操作\n✅ 第 1 層開始才有真正的挑戰\n✅ 越深層的敵人越強，獎勵也越好\n\n【前方等著你】\n🗺️ 5 層隨機生成的地城\n👹 越來越強的敵人\n💎 豐富的道具和升級\n👑 最終 Boss：巫妖王\n\n👇 走到綠色階梯，開始冒險！',
      lockMove: false,
    },
  ],

  checks: [
    (game) => game._tutIntroDone,      // 0: intro 完成
    (game) => game.pts !== null,       // 1: dice 完成（擲過骰子）
    (game) => game._tutMoved,          // 2: move 完成（移動到敵人身邊）
    (game) => game._tutAttacked,       // 3: attack 完成（攻擊過敵人）
    (game) => game.s.floor > 0,        // 4: 走到階梯離開教學關卡
  ],

  show() {
    if (localStorage.getItem('d3_tut_v5') === 'true') {
      this.active = false;
      return;
    }
    this._showIntroModal();
  },

  // 顯示場景介紹 modal（步驟 0）
  _showIntroModal() {
    const s = this.steps[0];
    const box = document.getElementById('generic-box');
    box.innerHTML = `
      <h2>${s.title}</h2>
      <pre style="text-align:left;font-size:0.72em;line-height:1.8;color:#c0b0e0;background:#0a0a14;border-radius:8px;padding:12px;margin:12px 0;white-space:pre-wrap;">${s.hint}</pre>
      <p style="font-size:0.75em;color:var(--muted);margin-bottom:12px;">👆 按下面的按鈕開始！</p>
      <button class="modal-btn" id="tut-intro-btn" onclick="tutorial._startDice()">🎲 擲 D20 開始冒險！</button>
    `;
    document.getElementById('generic-modal').classList.add('show');
    // 教學第一步：箭頭指向 modal 按鈕
    setTimeout(() => {
      const btn = document.getElementById('tut-intro-btn');
      if (btn && tutorial.active) {
        btn.classList.add('tut-highlight-gold');
        let ptr = document.getElementById('tut-pointer');
        if (!ptr) {
          ptr = document.createElement('div');
          ptr.id = 'tut-pointer';
          ptr.textContent = '👉';
          document.body.appendChild(ptr);
        }
        ptr.classList.add('show');
        _tutPointer = ptr;
        _tutHighlightEl = btn;
        const r = btn.getBoundingClientRect();
        ptr.style.left = (r.left + r.width / 2 - 14) + 'px';
        ptr.style.top = (r.top - 20) + 'px';
      }
    }, 200);
  },

  // 從 intro modal 跳轉到骰子畫面（步驟 1）
  _startDice() {
    document.getElementById('generic-modal').classList.remove('show');
    hideTutPointer();
    this._tutIntroDone = true;
    this.step = 1;
    switchScreen('dice');
    this._updateHint();
  },

  // 更新 HUD 提示框
  _updateHint() {
    const el = document.getElementById('tut-hint');
    if (!el) return;
    if (!this.active || this.step >= this.steps.length) {
      el.classList.add('hidden');
      hideTutPointer();
      // 關閉強 制道模式
      document.getElementById('game').classList.remove('tut-forced');
      document.getElementById('tutorial-overlay').classList.remove('visible');
      return;
    }
    const s = this.steps[this.step];
    // 替換動態內容
    let hint = s.hint;
    if (this.step === 2 && game.pts !== null) {
      hint = hint.replace('{pts}', game.pts);
    }
    el.querySelector('.hint-title').textContent = s.title;
    el.querySelector('.hint-body').innerHTML = hint.replace(/\n/g, '<br>');
    el.classList.remove('hidden');
    // 開啟強 制道模式：暗色遮罩 + 禁用非目標 UI
    document.getElementById('game').classList.add('tut-forced');
    document.getElementById('tutorial-overlay').classList.add('visible');
    // 更新指向箭頭
    if (typeof updateTutPointer === 'function') updateTutPointer();
  },

  checkStep(game) {
    if (!this.active) return;
    if (this.step >= this.steps.length) return;
    if (this.checks[this.step](game)) {
      this.step++;
      this._updateHint();
    }
  },

  complete(game) {
    this.active = false;
    localStorage.setItem('d3_tut_v5', 'true');
    this.step = this.steps.length;
    const el = document.getElementById('tut-hint');
    if (el) el.classList.add('hidden');
    hideTutPointer();
    game.log('🎓 教學完成！', 'action');
  },

  // 綁定遊戲行為追蹤
  bindGame(game) {
    const origDoMove = game.doMove.bind(game);
    game.doMove = function(dx, dy) {
      if (tutorial.active && tutorial.step === 0) {
        game.toast('👆 先看環境介紹，再擲骰子！');
        return;
      }
      if (tutorial.active && tutorial.step === 1) {
        game.toast('🎲 先擲 D20 決定行動力！');
        return;
      }
      origDoMove(dx, dy);
      game._tutMoved = true;
      tutorial.checkStep(game);
    };

    const origAttack = game.attackEnemy.bind(game);
    game.attackEnemy = function(en) {
      origAttack(en);
      game._tutAttacked = true;
      tutorial.checkStep(game);
    };

    // 讓 doAttack 也使用 wrapper
    const origDoAttack = game.doAttack.bind(game);
    game.doAttack = function() { origDoAttack(); };

    const origCheckTile = game.checkTile.bind(game);
    game.checkTile = function(x, y) {
      origCheckTile(x, y);
      tutorial.checkStep(game);
    };

    const origEndTurn = game.endTurn.bind(game);
    game.endTurn = function() {
      origEndTurn();
      tutorial.checkStep(game);
    };
  }
};

// 初始化遊戲
const game = new Game();

// 綁定教學追蹤
tutorial.bindGame(game);

// 舊版結束綁定（覆寫 doWait）
const _origDoWait = game.doWait.bind(game);
game.doWait = function() {
  _origDoWait();
  if (this._tutTurnEnded === undefined) this._tutTurnEnded = true;
  tutorial.checkStep(this);
};

// 教學完成後重置為第一層
let _tutLeaving = false; // 防止 nextFloor 多次觸發
let _skipUpgrade = false; // 防止 floor 0 觸發升級選項
const _origNextFloor = game.nextFloor.bind(game);
game.nextFloor = function() {
  // 離開 floor 0 教學關卡：complete() 重新生成 floor 1 地圖
  if (this.s.floor === 0) { _tutLeaving = true; _skipUpgrade = true; }
  _origNextFloor();
  if (_tutLeaving) {
    _tutLeaving = false;
    tutorial.complete(this);
    const savedFloor = this.s.floor; // = 1（nextFloor 已遞增）
    this.s.floor = 1;
    this.genFloor();
    this.s.floor = 0;
    this.render(); this.update();
    this.s.floor = savedFloor; // 恢復（=1）
    _skipUpgrade = false;
  }
};
