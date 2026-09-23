'use strict';
// The ISV Collins: a small open world of rooms, crew with their own lives, and things to do.

const T = 24; // tile size in world pixels

const ROOMS = {
  engine:   { name: 'Engineering',         col: '#3a2f2a', r: [2, 12, 9, 12] },
  cargo:    { name: 'Cargo Hold',          col: '#39352b', r: [14, 3, 11, 8] },
  hydro:    { name: 'Hydroponics',         col: '#243a2a', r: [28, 2, 12, 9] },
  archive:  { name: 'Earth Archive',       col: '#2b2d3d', r: [43, 4, 8, 7] },
  dome:     { name: 'Observation Dome',    col: '#1b2440', r: [54, 2, 9, 9] },
  quarters: { name: 'Crew Quarters',       col: '#33293a', r: [14, 25, 11, 9] },
  lounge:   { name: 'Mess & Lounge',       col: '#3d2d25', r: [28, 25, 12, 9] },
  medbay:   { name: 'Medbay',              col: '#26393c', r: [43, 25, 8, 7] },
  gym:      { name: 'Zero-G Gym',          col: '#2f2f36', r: [54, 25, 9, 7] },
  bridge:   { name: 'Bridge',              col: '#1f2c3a', r: [66, 12, 8, 12] },
};
const CORRIDORS = [[11, 17, 55, 2], [19, 11, 2, 6], [33, 11, 2, 6], [46, 11, 2, 6], [58, 11, 2, 6], [19, 19, 2, 6], [33, 19, 2, 6], [46, 19, 2, 6], [58, 19, 2, 6]];
const MAP_W = 76, MAP_H = 36;

const Ship = {
  grid: null, roomAt: null, layer: null, ents: [], player: null, cat: null, t: 0, stars: null,
  interact: [],

  build() {
    this.grid = [];
    this.roomAt = [];
    for (let y = 0; y < MAP_H; y++) { this.grid.push(new Array(MAP_W).fill(0)); this.roomAt.push(new Array(MAP_W).fill(null)); }
    const fill = (x, y, w, h, id) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { this.grid[j][i] = 2; this.roomAt[j][i] = id; } };
    for (const c of CORRIDORS) fill(...c, 'corridor');
    for (const id in ROOMS) fill(...ROOMS[id].r, id);
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (this.grid[y][x]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const g = this.grid[y + dy] && this.grid[y + dy][x + dx];
        if (g === 2) this.grid[y][x] = 1;
      }
    }
    this.buildInteract();
    this.render();
    this.stars = [];
    for (let i = 0; i < 260; i++) this.stars.push({ x: Math.random() * 3000, y: Math.random() * 2000, z: 0.15 + Math.random() * 0.85, c: U.pick(['#fff', '#cfe0ff', '#ffe9c9', '#ffd0d0']) });
  },

  buildInteract() {
    const I = (room, tx, ty, label, act, icon) => this.interact.push({ room, x: (tx + 0.5) * T, y: (ty + 0.5) * T, label, act, icon });
    this.interact = [];
    I('bridge', 71, 17, 'Helm: open star map', () => Game.openMap(true), '◎');
    I('bridge', 68, 13, 'Comms: listen to Earth', () => Game.listenEarth(), '📡');
    I('hydro', 33, 5, 'Tend the garden', () => Game.tendGarden(), '🌱');
    I('lounge', 30, 27, 'Jukebox: play music', () => Game.playMusic(), '♫');
    I('lounge', 36, 31, 'The bar', () => Game.bar(), '🍶');
    I('quarters', 16, 27, 'Your bunk: sleep until morning', () => Game.sleep(), '☾');
    I('archive', 45, 6, 'Archive terminal: read history', () => Game.readLore(), '▤');
    I('archive', 49, 9, 'Memorial wall', () => Game.memorial(), '✝');
    I('dome', 58, 4, 'Gaze out at the stars', () => Game.gaze(), '✧');
    I('engine', 4, 14, 'Repair station: patch hull', () => Game.repair(), '🔧');
    I('engine', 6, 20, 'Fold reactor', () => Game.reactor(), '☢');
    I('cargo', 16, 5, 'Ship stores & items', () => Game.stores(), '▣');
    I('medbay', 48, 27, 'Synthesise medicine', () => Game.synthMeds(), '✚');
    I('gym', 58, 28, 'Organise a sparring match', () => Game.spar(), '🥊');
  },

  // Pre-render the static ship so each frame is cheap.
  render() {
    const c = document.createElement('canvas');
    c.width = MAP_W * T; c.height = MAP_H * T;
    const g = c.getContext('2d');
    // One hull around everything, with the dome cut out so the stars show through
    g.fillStyle = '#161a22';
    g.beginPath();
    g.moveTo(0.4 * T, 0.6 * T); g.lineTo(64 * T, 0.6 * T); g.lineTo(75.6 * T, 10 * T); g.lineTo(75.6 * T, 26 * T); g.lineTo(64 * T, 35.4 * T); g.lineTo(0.4 * T, 35.4 * T); g.closePath();
    g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1;
    for (let x = 0; x < MAP_W * T; x += 48) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, MAP_H * T); g.stroke(); }
    for (let y = 0; y < MAP_H * T; y += 36) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(MAP_W * T, y + 0.5); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 12; x < MAP_W * T; x += 48) for (let y = 9; y < MAP_H * T; y += 36) g.fillRect(x, y, 2, 2);
    g.restore();
    g.strokeStyle = '#5c6475'; g.lineWidth = 3; g.stroke();
    g.clearRect(54 * T, 2 * T, 9 * T, 9 * T);
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      const v = this.grid[y][x], px = x * T, py = y * T;
      if (v === 1) {
        g.fillStyle = '#4a5160'; g.fillRect(px, py, T, T);
        g.fillStyle = '#5c6475'; g.fillRect(px, py, T, 4);
        g.fillStyle = '#353a45'; g.fillRect(px, py + T - 3, T, 3);
      } else if (v === 2) {
        const id = this.roomAt[y][x];
        const base = id === 'corridor' ? '#2a2e37' : ROOMS[id].col;
        if (id === 'dome') { g.fillStyle = 'rgba(40,60,110,0.28)'; g.fillRect(px, py, T, T); g.strokeStyle = 'rgba(140,180,255,0.15)'; g.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1); continue; }
        g.fillStyle = (x + y) % 2 ? base : U.shade(base, 6);
        g.fillRect(px, py, T, T);
        g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T);
        if (id === 'corridor' && x % 4 === 0) { g.fillStyle = 'rgba(120,200,255,0.12)'; g.fillRect(px + T / 2 - 1, py + T / 2 - 1, 2, 2); }
      }
    }
    this.furnish(g);
    this.layer = c;
  },

  furnish(g) {
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x * T, y * T, w * T, h * T); };
    const box = (x, y, w, h, col, edge) => { R(x, y, w, h, col); g.strokeStyle = edge || 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.strokeRect(x * T + 1, y * T + 1, w * T - 2, h * T - 2); };
    // Hydroponics: grow racks
    for (let i = 0; i < 4; i++) {
      box(29 + i * 3, 7, 2, 3, '#2d5a36');
      for (let k = 0; k < 6; k++) { g.fillStyle = ['#5fcf6a', '#8fe36b', '#4cae5a'][k % 3]; g.beginPath(); g.arc((29 + i * 3) * T + 12 + (k % 2) * 24, 7 * T + 12 + Math.floor(k / 2) * 24, 8, 0, 7); g.fill(); }
    }
    g.fillStyle = '#ff5b5b'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(30 * T + k * 70, 7 * T + 40, 2.5, 0, 7); g.fill(); }
    // Cargo: crates
    for (const [x, y, c] of [[20, 4, '#7a5c3a'], [22, 4, '#6b5033'], [22, 6, '#7a5c3a'], [15, 8, '#5d6b3a'], [17, 8, '#7a5c3a'], [23, 9, '#6b5033']]) box(x, y, 2, 2, c, '#3a2a1a');
    // Quarters: bunks
    for (let i = 0; i < 5; i++) { box(15 + i * 2, 25, 1.6, 2.4, '#4b3d57'); R(15 + i * 2, 25, 1.6, 0.6, '#d9d2e6'); box(15 + i * 2, 30.6, 1.6, 2.4, '#4b3d57'); R(15 + i * 2, 32.4, 1.6, 0.6, '#d9d2e6'); }
    // Lounge: tables & bar
    for (const [x, y] of [[30, 29], [33, 28], [36, 27], [31, 32]]) { g.fillStyle = '#6d4c3a'; g.beginPath(); g.arc(x * T + T / 2, y * T + T / 2, 16, 0, 7); g.fill(); g.strokeStyle = '#2a1a12'; g.stroke(); }
    box(34, 31, 5, 1, '#5a3b2b'); R(34, 31, 5, 0.25, '#a37a55');
    // Archive: shelves
    for (let i = 0; i < 3; i++) box(44 + i * 2.4, 8, 1.6, 1, '#3d4060');
    box(43.2, 4.2, 5, 0.8, '#39406a');
    R(48.4, 9.1, 2.4, 1.6, '#555');
    // Medbay beds
    for (let i = 0; i < 3; i++) { box(44 + i * 2.3, 29, 1.6, 2.4, '#dfe8ea'); R(44 + i * 2.3, 29, 1.6, 0.5, '#9fd1d6'); }
    // Gym: mats & weights
    box(55, 29, 4, 2, '#3b4d7a'); box(60, 26, 2, 1, '#555a66'); box(60, 29, 2, 1, '#555a66');
    // Bridge consoles
    box(72, 14, 1.2, 8, '#28405a'); box(67, 12.4, 3, 1, '#28405a'); box(67, 22.6, 3, 1, '#28405a');
    for (let i = 0; i < 3; i++) { g.fillStyle = '#6cf'; g.fillRect(72 * T + 6, (15 + i * 2.5) * T, 8, 10); }
    // Engineering: reactor housing
    g.fillStyle = '#2a2320'; g.beginPath(); g.arc(6.5 * T, 18 * T, 60, 0, 7); g.fill();
    g.strokeStyle = '#7a5a3a'; g.lineWidth = 4; g.stroke();
    // Dome ring
    g.strokeStyle = 'rgba(160,200,255,0.45)'; g.lineWidth = 3; g.strokeRect(54 * T + 2, 2 * T + 2, 9 * T - 4, 9 * T - 4);
  },

  // ---- crew bodies ----
  spawnCrew() {
    this.ents = [];
    for (const id of aliveIds()) {
      const t = this.randomTile(this.targetRoom(id));
      this.ents.push({ id, x: (t[0] + 0.5) * T, y: (t[1] + 0.5) * T, path: [], wait: Math.random() * 5, face: 1, bob: Math.random() * 6 });
    }
    if (hasFlag('cat')) this.spawnCat();
  },
  spawnCat() {
    const t = this.randomTile('lounge');
    this.cat = { x: (t[0] + 0.5) * T, y: (t[1] + 0.5) * T, path: [], wait: 2, face: 1, room: 'lounge' };
  },
  removeCrew(id) { this.ents = this.ents.filter((e) => e.id !== id); },
  catRoom() { return this.cat ? this.cat.room : 'lounge'; },

  targetRoom(id) {
    const h = (S.minute / 60) % 24;
    if (h >= 23 || h < 7) return 'quarters';
    const p = partnerOf(id);
    if (h >= 19 && p && Math.random() < 0.5) return 'dome';
    if (h >= 9 && h < 17 && Math.random() < 0.65) return crewDef(id).work;
    return hangoutRoom(id);
  },
  randomTile(room) {
    const [x, y, w, h] = ROOMS[room].r;
    for (let i = 0; i < 30; i++) {
      const tx = x + 1 + Math.floor(Math.random() * Math.max(1, w - 2)), ty = y + 1 + Math.floor(Math.random() * Math.max(1, h - 2));
      if (this.grid[ty][tx] === 2) return [tx, ty];
    }
    return [x + 1, y + 1];
  },
  path(sx, sy, tx, ty) {
    const key = (x, y) => y * MAP_W + x;
    const prev = new Map([[key(sx, sy), -1]]);
    const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (this.grid[ny] && this.grid[ny][nx] === 2 && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), key(x, y)); q.push([nx, ny]); }
      }
    }
    if (!prev.has(key(tx, ty))) return [];
    const out = [];
    let k = key(tx, ty);
    while (k !== -1) { out.push([(k % MAP_W + 0.5) * T, (Math.floor(k / MAP_W) + 0.5) * T]); k = prev.get(k); }
    return out.reverse();
  },
  walk(e, dt, speed) {
    if (!e.path.length) return true;
    const [tx, ty] = e.path[0];
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d < 2) { e.path.shift(); return !e.path.length; }
    const s = Math.min(d, speed * dt);
    e.x += (dx / d) * s; e.y += (dy / d) * s;
    if (Math.abs(dx) > 0.5) e.face = dx > 0 ? 1 : -1;
    e.bob += dt * 10;
    return false;
  },

  // ---- player ----
  placePlayer(room = 'quarters') {
    const t = room === 'dome' ? [58, 7] : this.randomTile(room);
    this.player = { x: (t[0] + 0.5) * T, y: (t[1] + 0.5) * T, face: 1, bob: 0 };
  },
  solid(px, py) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    return !(this.grid[y] && this.grid[y][x] === 2);
  },
  movePlayer(dx, dy, dt) {
    const p = this.player, sp = 140, r = 7;
    if (!dx && !dy) return;
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const nx = p.x + dx * sp * dt, ny = p.y + dy * sp * dt;
    const ok = (x, y) => !this.solid(x - r, y - r) && !this.solid(x + r, y - r) && !this.solid(x - r, y + r) && !this.solid(x + r, y + r);
    if (ok(nx, p.y)) p.x = nx;
    if (ok(p.x, ny)) p.y = ny;
    if (dx) p.face = dx > 0 ? 1 : -1;
    p.bob += dt * 12;
  },
  playerRoom() {
    const x = Math.floor(this.player.x / T), y = Math.floor(this.player.y / T);
    return (this.roomAt[y] && this.roomAt[y][x]) || 'corridor';
  },
  roomOfEnt(e) { const r = this.roomAt[Math.floor(e.y / T)][Math.floor(e.x / T)]; return r || 'corridor'; },

  nearest() {
    const p = this.player;
    let best = null, bd = 34;
    for (const e of this.ents) { const d = U.dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = { kind: 'crew', id: e.id, label: `Talk to ${crewDef(e.id).name}` }; } }
    if (this.cat && U.dist(p.x, p.y, this.cat.x, this.cat.y) < 26) best = { kind: 'cat', label: 'Pet Buzz' };
    for (const it of this.interact) { const d = U.dist(p.x, p.y, it.x, it.y); if (d < 30 && d < bd) { bd = d; best = { kind: 'obj', it, label: it.label }; } }
    return best;
  },

  update(dt) {
    this.t += dt;
    for (const e of this.ents) {
      const arrived = this.walk(e, dt, 62);
      if (arrived) {
        e.wait -= dt;
        if (e.wait <= 0) {
          const room = this.targetRoom(e.id);
          const [tx, ty] = this.randomTile(room);
          e.path = this.path(Math.floor(e.x / T), Math.floor(e.y / T), tx, ty);
          e.wait = 6 + Math.random() * 14;
        }
      }
    }
    if (this.cat) {
      const c = this.cat;
      if (this.walk(c, dt, 45)) {
        c.wait -= dt;
        if (c.wait <= 0) {
          c.room = U.pick(Object.keys(ROOMS));
          const [tx, ty] = this.randomTile(c.room);
          c.path = this.path(Math.floor(c.x / T), Math.floor(c.y / T), tx, ty);
          c.wait = 10 + Math.random() * 20;
        }
      }
    }
  },

  zoom(W, H) { return U.clamp(Math.min(H / (20 * T), W / (15 * T)), 0.9, 2); },

  draw(ctx, W, H) {
    const zoom = this.zoom(W, H);
    const vw = W / zoom, vh = H / zoom;
    const p = this.player;
    const cx = U.clamp(p.x - vw / 2, -T * 2, MAP_W * T - vw + T * 2), cy = U.clamp(p.y - vh / 2, -T * 2, MAP_H * T - vh + T * 2);
    // Stars flow past (faster while in fold)
    ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, W, H);
    const speed = S.travel ? 220 : 12;
    for (const s of this.stars) {
      const x = ((s.x - this.t * speed * s.z - cx * s.z * 0.3) % 3000 + 3000) % 3000 * (W / 3000 + 0.2);
      const y = ((s.y - cy * s.z * 0.3) % 2000 + 2000) % 2000 * (H / 2000 + 0.2);
      ctx.fillStyle = s.c; ctx.globalAlpha = 0.3 + s.z * 0.7;
      if (S.travel) ctx.fillRect(x, y, 2 + s.z * 16, 1.2); else ctx.fillRect(x, y, s.z * 2, s.z * 2);
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-Math.round(cx), -Math.round(cy));
    ctx.drawImage(this.layer, 0, 0);

    // Reactor pulse
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 2.2);
    const rg = ctx.createRadialGradient(6.5 * T, 18 * T, 4, 6.5 * T, 18 * T, 58);
    rg.addColorStop(0, `rgba(120,220,255,${0.8 + pulse * 0.2})`); rg.addColorStop(0.5, `rgba(60,140,255,${0.25 + pulse * 0.2})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(6.5 * T, 18 * T, 58, 0, 7); ctx.fill();

    // Interactables
    const near = this.nearest();
    for (const it of this.interact) {
      const hi = near && near.it === it;
      ctx.fillStyle = hi ? 'rgba(255,230,140,0.35)' : 'rgba(140,200,255,0.12)';
      ctx.beginPath(); ctx.arc(it.x, it.y, hi ? 13 : 10 + Math.sin(this.t * 3) * 1.5, 0, 7); ctx.fill();
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText(it.icon, it.x, it.y + 1);
    }

    // People, sorted by y for depth
    const drawList = this.ents.map((e) => ({ y: e.y, f: () => this.drawCrew(ctx, e) }));
    drawList.push({ y: p.y, f: () => drawPerson(ctx, p.x, p.y, { suit: '#e8e8f0', skin: '#c99a73', hair: '#4a3020' }, p.face, p.bob, '#ffffff', false, true) });
    if (this.cat) drawList.push({ y: this.cat.y, f: () => drawCat(ctx, this.cat) });
    drawList.sort((a, b) => a.y - b.y).forEach((d) => d.f());

    // Names of nearby crew
    for (const e of this.ents) {
      const d = U.dist(p.x, p.y, e.x, e.y);
      if (d < 110) {
        ctx.globalAlpha = U.clamp((110 - d) / 50, 0, 1);
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#000'; ctx.fillText(N(e.id), e.x + 1, e.y - 25);
        ctx.fillStyle = EMO[dominant(e.id)].color; ctx.fillText(N(e.id), e.x, e.y - 26);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // Night dimming
    const h = (S.minute / 60) % 24;
    if (h >= 22 || h < 6) { ctx.fillStyle = 'rgba(5,8,30,0.35)'; ctx.fillRect(0, 0, W, H); }
  },

  drawCrew(ctx, e) {
    const d = crewDef(e.id), dom = dominant(e.id);
    const h = (S.minute / 60) % 24;
    const asleep = (h >= 23 || h < 7) && !e.path.length && this.roomOfEnt(e) === 'quarters';
    drawPerson(ctx, e.x, e.y, d, e.face, e.bob, EMO[dom].color, asleep, false, C(e.id).e[dom]);
    // mood glyph floats occasionally
    const phase = (this.t * 0.5 + e.bob * 0.01 + e.id.length) % 6;
    if (phase < 2.2 && !asleep) {
      ctx.globalAlpha = Math.sin((phase / 2.2) * Math.PI);
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = EMO[dom].color; ctx.fillText(EMO[dom].glyph, e.x + 10, e.y - 16 - phase * 4);
      ctx.globalAlpha = 1;
    }
    if (asleep) { ctx.font = '10px sans-serif'; ctx.fillStyle = '#aab'; ctx.fillText('z', e.x + 9, e.y - 14 - (this.t * 6 % 8)); }
  },
};

function drawPerson(ctx, x, y, d, face, bob, aura, asleep, isPlayer, intensity = 50) {
  const b = asleep ? 0 : Math.sin(bob) * 1.2;
  // emotional aura
  const a = 0.18 + (intensity / 100) * 0.35;
  const g = ctx.createRadialGradient(x, y, 2, x, y, isPlayer ? 18 : 20);
  g.addColorStop(0, U.hexA(aura.startsWith('#') && aura.length === 7 ? aura : '#ffffff', a)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 9, 8, 3, 0, 0, 7); ctx.fill();
  // body
  ctx.fillStyle = d.suit; ctx.beginPath(); ctx.ellipse(x, y + 2 + b, 7, 8, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.stroke();
  // head
  ctx.fillStyle = d.skin; ctx.beginPath(); ctx.arc(x, y - 8 + b, 5.5, 0, 7); ctx.fill();
  ctx.fillStyle = d.hair; ctx.beginPath(); ctx.arc(x - face * 1, y - 10 + b, 5.6, Math.PI * 1.05, Math.PI * 2.0); ctx.fill();
  if (!asleep) { ctx.fillStyle = '#111'; ctx.fillRect(x + face * 2 - 0.5, y - 8 + b, 1.4, 1.6); }
  if (isPlayer) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y + 2, 11, 0.2, Math.PI - 0.2); ctx.stroke(); }
}

function drawCat(ctx, c) {
  const b = Math.sin(c.bob || 0) * 0.8;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 5, 6, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8a8f99'; ctx.beginPath(); ctx.ellipse(c.x, c.y + b, 6, 4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x + c.face * 6, c.y - 2 + b, 3.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(c.x + c.face * 4, c.y - 4); ctx.lineTo(c.x + c.face * 5, c.y - 8); ctx.lineTo(c.x + c.face * 7, c.y - 5); ctx.fill();
  ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x - c.face * 6, c.y); ctx.quadraticCurveTo(c.x - c.face * 11, c.y - 6, c.x - c.face * 9, c.y - 9); ctx.stroke();
}
