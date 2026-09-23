'use strict';
// Planet surfaces: procedurally generated open worlds you walk with a crewmate at your side.

const PT = 20, PW = 100, PH = 76;

const PALETTE = {
  barren:   { low: '#6f6a62', mid: '#8a8378', high: '#a79e91', water: '#4b4f55', deep: '#2f3237', rock: '#4a453f', flora: '#7d7a70', sky: 'rgba(0,0,0,0)', fx: 'dust' },
  ice:      { low: '#a8c6de', mid: '#cfe3f2', high: '#eef7ff', water: '#5f93c0', deep: '#2e5c8a', rock: '#7d98b0', flora: '#9ee6e0', sky: 'rgba(160,210,255,0.08)', fx: 'snow' },
  desert:   { low: '#c79a5a', mid: '#dcb06d', high: '#ecc98a', water: '#5f8f8f', deep: '#3a6464', rock: '#8e6a3e', flora: '#9aa95a', sky: 'rgba(255,190,120,0.08)', fx: 'dust' },
  ocean:    { low: '#d8c690', mid: '#7fb86a', high: '#5a9a55', water: '#3a88c8', deep: '#1d5690', rock: '#4f6a5a', flora: '#2f8f4f', sky: 'rgba(120,180,255,0.06)', fx: 'rain' },
  jungle:   { low: '#3f7a3a', mid: '#2f6a32', high: '#27552a', water: '#3a7a70', deep: '#1f4f4a', rock: '#3a4a36', flora: '#1d8f3a', sky: 'rgba(80,200,120,0.07)', fx: 'rain' },
  toxic:    { low: '#8a8f3a', mid: '#a3a84a', high: '#b8b86a', water: '#9fbf2a', deep: '#6f8f10', rock: '#5f5f2a', flora: '#c8d84a', sky: 'rgba(200,230,40,0.14)', fx: 'spores' },
  volcanic: { low: '#3a2a26', mid: '#4a3430', high: '#5a403a', water: '#ff6a2a', deep: '#d8401a', rock: '#241a18', flora: '#6a3a2a', sky: 'rgba(255,90,40,0.12)', fx: 'ash' },
  tundra:   { low: '#8fa596', mid: '#a7b9a6', high: '#c9d4c6', water: '#6a8fa8', deep: '#3f6680', rock: '#6a766e', flora: '#6f9a6a', sky: 'rgba(200,220,255,0.06)', fx: 'snow' },
  garden:   { low: '#6fbf5a', mid: '#58a84a', high: '#8fcf6a', water: '#4aa8d8', deep: '#2a7ab0', rock: '#6a7a6a', flora: '#ff9fd0', sky: 'rgba(255,240,200,0.06)', fx: 'pollen' },
  ruin:     { low: '#9a8266', mid: '#8a735a', high: '#a89274', water: '#5a7a78', deep: '#3a5856', rock: '#4f4238', flora: '#7a8a4a', sky: 'rgba(255,170,110,0.1)', fx: 'ash' },
};

// Vignettes found on planet surfaces. Each can hold an item, and every find asks what kind of people we are.
const POIS = {
  probe:   { name: 'Crashed probe', item: 'probe_chip', text: 'A survey drone, human-made, 2040s. It must have been launched by one of the old private expeditions. Its memory core is intact.' },
  crystal: { name: 'Crystal cave', item: 'geode', text: 'A cave mouth, lined with opal. When your helmet light touches it the whole cave lights up like the inside of a sunset.' },
  fossil:  { name: 'Fossil bed', item: 'fossil_shell', text: 'Spiral shells in the rock, thousands of them. Something swam here once, when this place had seas.' },
  singing: { name: 'Singing rocks', item: 'singing_stone', text: 'The wind moves through holes in these stones and they hum, a low chord that you feel in your ribs.' },
  moss:    { name: 'Glowing grotto', item: 'glow_moss', text: 'A hollow full of moss that pulses with a soft blue light, slowly, like something breathing in its sleep.' },
  crater:  { name: 'Impact crater', item: 'meteor_iron', text: 'A crater, perfectly round, and at the bottom a lump of star-iron that fell here a billion years ago.' },
  tide:    { name: 'Tide pools', item: 'sea_glass', text: 'Pools full of tiny translucent creatures, and smooth glassy pebbles tumbled by an alien sea.' },
  seedtree:{ name: 'Seed tree', item: 'alien_seed', text: 'A lone tree, taller than the ship, dropping seed pods that spin down like sycamore keys.' },
  storm:   { name: 'Storm nest', item: 'pearl', text: 'A nest of woven kelp at the waterline, and in it something that shines like a captured lightning bolt.' },
};
const POI_BY_TYPE = {
  barren: ['probe', 'crater', 'fossil'], ice: ['crystal', 'probe', 'crater'], desert: ['fossil', 'singing', 'crater', 'probe'],
  ocean: ['tide', 'storm', 'seedtree'], jungle: ['seedtree', 'moss', 'fossil'], toxic: ['crystal', 'probe', 'crater'],
  volcanic: ['crater', 'crystal'], tundra: ['moss', 'fossil', 'probe'], garden: ['seedtree', 'moss', 'tide'], ruin: ['fossil', 'crystal'],
};

const ASHFALL_LOGS = [
  'A carved wall, half buried. Yasmin\'s translation software struggles, then offers: “WE BUILT UNTIL THE SKY TURNED. WE SAID: THERE WILL ALWAYS BE MORE.”',
  'A city of spires, all leaning the same way, as if something vast pushed them. On a doorway: “The rivers were sold on the eleventh day of the long summer.”',
  'Ships. Hundreds of ships, rusted to lace, still sitting on their launch towers. None of them ever left. On one hull: “Places reserved for those who can pay.”',
  'A garden, walled, gone wild. On a stone bench, a message: “To whoever comes after. We were not wicked. We were busy. Please be less busy than us.”',
];
const EDEN_LOGS = [
  'Tall translucent beings drift between the trees like jellyfish in the air. They glow when they look at you. They are, unmistakably, looking at you.',
  'The Lumen gather around the shuttle. One reaches out a ribbon of light and touches your visor. Your suit\'s speakers play back, very softly, Cal\'s coffee-machine song. They have been listening to your radio.',
  'A clearing with circles of stones, arranged with care. Graves, maybe. Or gardens. Or art. The Lumen hum in chords when you approach, then fall silent, waiting to see what you will do.',
];
const THALASSA_LOGS = [
  'Something enormous surfaces a kilometre offshore: a creature like a floating island, trailing gardens of kelp. It sings, and the singing goes on for an hour.',
  'Black sand beaches, warm water, and a storm on the horizon the size of a continent. It will be here in a day. This world is beautiful and it does not care about you at all.',
];

const Planet = {
  p: null, tiles: null, layer: null, nodes: [], mobs: [], player: null, comp: null, shuttle: null,
  o2: 0, o2Max: 0, suit: 100, haul: null, t: 0, bubble: null, particles: [], hitCd: 0, warned: false, specialIdx: 0,

  land(pid, companionId) {
    const p = Galaxy.planet(pid);
    this.p = p;
    this.t = 0; this.hitCd = 0; this.warned = false; this.specialIdx = 0;
    this.gen(p);
    this.player = { x: this.shuttle.x + 30, y: this.shuttle.y + 10, face: 1, bob: 0 };
    this.comp = companionId ? { id: companionId, x: this.shuttle.x - 20, y: this.shuttle.y + 16, face: 1, bob: 0 } : null;
    this.o2Max = (p.atmo === 'breathable' ? 420 : p.atmo === 'thin' ? 230 : 170) - p.hazard * 18;
    this.o2 = this.o2Max;
    this.suit = 100;
    this.haul = { food: 0, fuel: 0, parts: 0, items: [] };
    this.particles = [];
    if (companionId) this.companionArrive();
    S.planetState[pid] = S.planetState[pid] || { taken: {} };
  },

  gen(p) {
    const r = U.rng(p.seed);
    const pal = PALETTE[p.type] || PALETTE.barren;
    const nE = U.makeNoise(p.seed), nM = U.makeNoise(p.seed + 99), nD = U.makeNoise(p.seed + 7);
    const wl = p.type === 'ocean' ? 0.52 : p.type === 'volcanic' ? 0.3 : 0.2 + (p.water / 100) * 0.3;
    this.tiles = [];
    const cx = PW / 2, cy = PH / 2;
    for (let y = 0; y < PH; y++) {
      const row = [];
      for (let x = 0; x < PW; x++) {
        let e = nE(x / 16, y / 16, 4);
        const dc = Math.hypot(x - cx, y - cy);
        if (dc < 6) e = Math.max(e, wl + 0.08); // flat landing zone
        const edge = Math.min(x, y, PW - 1 - x, PH - 1 - y);
        if (edge < 2) e = 1;
        const m = nM(x / 12, y / 12, 3);
        let k;
        if (e < wl - 0.05) k = 'deep';
        else if (e < wl) k = 'water';
        else if (e > 0.74) k = 'rock';
        else if (e > 0.62) k = 'high';
        else if (e > wl + 0.08) k = 'mid';
        else k = 'low';
        if ((k === 'mid' || k === 'low') && p.life !== 'none' && p.life !== 'microbial' && m > 0.58 && dc > 5) k = 'flora';
        row.push({ k, v: nD(x / 3, y / 3, 2) });
      }
      this.tiles.push(row);
    }
    this.shuttle = { x: cx * PT, y: cy * PT };

    // Everything is placed only where you can actually walk to it
    const reach = new Set();
    const q = [[cx, cy]]; reach.add(cy * PW + cx);
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, key = ny * PW + nx;
        if (nx < 0 || ny < 0 || nx >= PW || ny >= PH || reach.has(key) || !this.walkable(nx, ny)) continue;
        reach.add(key); q.push([nx, ny]);
      }
    }
    const spots = [...reach].filter((k) => { const x = k % PW, y = Math.floor(k / PW); return Math.hypot(x - cx, y - cy) > 7; });
    const take = () => { const i = Math.floor(r() * spots.length); const k = spots.splice(i, 1)[0]; return { x: (k % PW + 0.5) * PT, y: (Math.floor(k / PW) + 0.5) * PT }; };
    this.nodes = [];
    const add = (kind, n, extra = {}) => { for (let i = 0; i < n && spots.length; i++) this.nodes.push({ kind, ...take(), ...extra, idx: this.nodes.length }); };
    add('ore', Math.round(3 + p.rich.ore * 9));
    add('ice', Math.round(2 + p.rich.ice * 9));
    if (p.rich.bio > 0.05) add('bio', Math.round(2 + p.rich.bio * 10));
    const poiList = POI_BY_TYPE[p.type] || ['probe'];
    const nPoi = p.special ? 2 : r.int(2, 3);
    for (let i = 0; i < nPoi; i++) add('poi', 1, { poi: poiList[i % poiList.length] });
    if (p.special) add('special', p.special === 'ashfall' ? 4 : p.special === 'eden' ? 3 : 2);
    this.nodes.forEach((n, i) => (n.idx = i));

    // Creatures
    this.mobs = [];
    const mob = (kind) => { if (!spots.length) return; const s = take(); this.mobs.push({ kind, x: s.x, y: s.y, vx: 0, vy: 0, t: r() * 5, hx: s.x, hy: s.y }); };
    if (p.life === 'fauna' || p.life === 'sentient') for (let i = 0; i < 6; i++) mob(p.special === 'eden' ? 'lumen' : 'grazer');
    if (p.hazard >= 2 && p.type !== 'garden') for (let i = 0; i < p.hazard + 1; i++) mob('crawler');

    // Pre-render the ground
    const c = document.createElement('canvas');
    c.width = PW * PT; c.height = PH * PT;
    const g = c.getContext('2d');
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const t = this.tiles[y][x];
      const base = pal[t.k === 'flora' ? 'mid' : t.k];
      g.fillStyle = U.shade(base, (t.v - 0.5) * 22);
      g.fillRect(x * PT, y * PT, PT, PT);
      const h = U.hashStr(x + ',' + y);
      if (t.k !== 'deep' && t.k !== 'water') { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x * PT + (h % 17), y * PT + ((h >> 5) % 17), 2, 2); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(x * PT + ((h >> 9) % 17), y * PT + ((h >> 13) % 17), 3, 2); }
      if (t.k === 'flora') {
        g.fillStyle = pal.flora;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x * PT + 4 + ((t.v * 97 + i * 7) % 13), y * PT + 4 + ((t.v * 53 + i * 5) % 13), 3 + (i % 2), 0, 7); g.fill(); }
      }
      if (t.k === 'rock') { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x * PT, y * PT + PT - 5, PT, 5); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x * PT, y * PT, PT, 3); }
      if (t.k === 'water' && t.v > 0.55) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x * PT + 4, y * PT + 8, 10, 2); }
    }
    // Ashfall's ruined spires
    if (p.special === 'ashfall') {
      for (let i = 0; i < 40; i++) {
        const x = r.range(40, PW * PT - 40), y = r.range(40, PH * PT - 40);
        g.fillStyle = 'rgba(40,30,26,0.55)'; g.save(); g.translate(x, y); g.rotate(0.4); g.fillRect(-4, -26, 8, 30); g.restore();
      }
    }
    this.layer = c;
  },

  walkable(x, y) {
    const t = this.tiles[y] && this.tiles[y][x];
    return !!t && t.k !== 'deep' && t.k !== 'rock';
  },
  solidPx(px, py) { return !this.walkable(Math.floor(px / PT), Math.floor(py / PT)); },

  say(text, dur = 4.5) { this.bubble = { text, t: dur }; },

  companionArrive() {
    const p = this.p, id = this.comp.id;
    let line;
    if (p.special === 'eden') { emo(id, { wonder: 25, love: 12, hope: 15 }); line = 'They\'re... they\'re people. Aren\'t they? Oh my God. We\'re not alone.'; }
    else if (p.special === 'ashfall') { emo(id, { sorrow: 18, fear: 8, wonder: 8 }); line = 'Someone lived here. Someone like us. What happened to them?'; }
    else if (p.special === 'thalassa') { emo(id, { wonder: 18, hope: 12, fear: 5 }); line = 'Listen. That\'s the sea. A real sea. I haven\'t heard one since I was a kid.'; }
    else if (p.hab >= 60) { emo(id, { hope: 12, wonder: 10, joy: 6 }); line = U.pick(['Could we live here? I mean it. Could we?', 'Smell that. Well, don\'t, helmets. But imagine it.', 'I didn\'t think it would feel like this. Like... arriving.']); }
    else if (p.hazard >= 3) { emo(id, { fear: 14, wonder: 4 }); line = U.pick(['Let\'s be quick. This place wants us dead.', 'Suit readings are ugly. Stay close, yeah?', 'Nope. Nope. Okay. Fine. Quick in, quick out.']); }
    else if (p.life === 'flora' || p.life === 'fauna') { emo(id, { wonder: 14, joy: 6 }); line = U.pick(['Things are growing. Actual things, growing, on another world!', 'Look at that. Nobody has ever seen this before. Nobody.']); }
    else { emo(id, { wonder: 6, sorrow: 4 }); line = U.pick(['So quiet. Like the whole planet is holding its breath.', 'Nobody has ever walked here. We\'re the first footprints. Ever.', 'Beautiful, in a lonely way.']); }
    this.say(`${N(id)}: “${line}”`, 6);
  },

  nearest() {
    const P = this.player;
    if (U.dist(P.x, P.y, this.shuttle.x, this.shuttle.y) < 34) return { kind: 'shuttle', label: 'Return to the shuttle' };
    let best = null, bd = 28;
    const st = S.planetState[this.p.id];
    for (const n of this.nodes) {
      if (st.taken[n.idx]) continue;
      const d = U.dist(P.x, P.y, n.x, n.y);
      if (d < bd) { bd = d; best = { kind: 'node', n, label: { ore: 'Mine ore (parts)', ice: 'Harvest ice (fuel)', bio: 'Gather edible growth (food)', poi: `Investigate: ${POIS[n.poi] ? POIS[n.poi].name : '???'}`, special: 'Investigate' }[n.kind] }; }
    }
    return best;
  },

  use(target) {
    if (!target) return;
    if (target.kind === 'shuttle') { Game.leavePlanet(false); return; }
    const n = target.n, st = S.planetState[this.p.id];
    const zh = hasFlag('zhao_preserve');
    if (n.kind === 'ore') { const v = U.rint(2, 4); this.haul.parts += v; st.taken[n.idx] = true; UI.toast(`+${v} parts in the shuttle hold`); Audio2.blip(300); }
    if (n.kind === 'ice') { const v = U.rint(3, 6); this.haul.fuel += v; st.taken[n.idx] = true; UI.toast(`+${v} fuel in the shuttle hold`); Audio2.blip(500); }
    if (n.kind === 'bio') { const v = U.rint(6, 12); this.haul.food += v; st.taken[n.idx] = true; UI.toast(`+${v} food in the shuttle hold`); Audio2.blip(400); if (this.comp && U.chance(0.3)) this.say(`${N(this.comp.id)}: “${U.pick(['Amara is going to lose her mind over this.', 'Is it weird that it smells like basil?', 'Can we eat it? Priya will know. Probably.'])}”`); }
    if (n.kind === 'poi') {
      const poi = POIS[n.poi];
      const compLine = this.comp ? `<br><br><em>${N(this.comp.id)} ${U.pick(['crouches beside you, very quiet.', 'lets out a long breath.', 'reaches out, then stops, and looks at you.'])}</em>` : '';
      UI.modal({
        title: poi.name, body: poi.text + compLine,
        choices: [
          { label: `Take the ${ITEMS[poi.item].name}.`, tag: 'greed', fx: () => { this.haul.items.push(poi.item); st.taken[n.idx] = true; if (this.comp) emo(this.comp.id, { joy: 5, greed: 3 }); if (this.comp && this.comp.id === 'zhao') { emo('zhao', { anger: 8 }); aff('zhao', -3); } return `You carefully pack the ${ITEMS[poi.item].name} into the shuttle hold.`; } },
          { label: 'Record it, and leave it exactly as it is.', tag: 'wonder', fx: () => { st.taken[n.idx] = true; if (this.comp) { emo(this.comp.id, { wonder: 8, love: 3 }); aff(this.comp.id, 2); } if (alive('zhao')) { aff('zhao', zh ? 3 : 1); emo('zhao', { hope: 3 }); } return 'You log the find for the archive and walk on. Somewhere behind you, it goes on being exactly itself.'; } },
        ],
      });
    }
    if (n.kind === 'special') this.specialFind(n, st);
  },

  specialFind(n, st) {
    const sp = this.p.special;
    st.taken[n.idx] = true;
    const idx = this.specialIdx++;
    if (sp === 'ashfall') {
      const txt = ASHFALL_LOGS[idx % ASHFALL_LOGS.length];
      const last = idx >= ASHFALL_LOGS.length - 1;
      if (last) this.haul.items.push('ash_journal');
      if (this.comp) emo(this.comp.id, { sorrow: 6, hope: 3 });
      UI.modal({ title: 'The Ruins of Ashfall', body: txt + (last ? '<br><br>Beneath the bench, sealed in resin, a journal. You bring it back for Yasmin.' : ''), choices: [{ label: 'Continue', tag: 'sorrow', fx: () => '' }] });
      flag('ashfall_seen');
    } else if (sp === 'eden') {
      const txt = EDEN_LOGS[idx % EDEN_LOGS.length];
      flag('met_lumen');
      UI.modal({
        title: 'The Lumen', body: txt,
        choices: [
          { label: 'Open your hands. Show them you mean no harm.', tag: 'love', fx: () => { flag('lumen_friend'); if (!this.haul.items.includes('lumen_petal')) this.haul.items.push('lumen_petal'); if (this.comp) emo(this.comp.id, { love: 12, wonder: 10 }); return 'The nearest Lumen folds down until it is level with your visor, and leaves something in your open palms: a petal of light. A gift. Or a question.'; } },
          { label: 'Back away slowly. Give them space.', tag: 'fear', fx: () => { if (this.comp) emo(this.comp.id, { fear: 6, wonder: 8 }); return 'They watch you go. They do not follow. Their light dims a little, as if disappointed, or relieved.'; } },
          { label: 'Take a sample of one. For science.', tag: 'greed', fx: () => { flag('lumen_harmed'); if (this.comp) { emo(this.comp.id, { fear: 12, sorrow: 10 }); aff(this.comp.id, -6); } emoAll({ sorrow: 3 }); return 'You cut a ribbon of light from the nearest one. The whole forest goes dark. It stays dark, for a long time, and when it lights again it is further away.'; } },
        ],
      });
    } else if (sp === 'thalassa') {
      if (this.comp) emo(this.comp.id, { wonder: 10, hope: 6 });
      if (idx === 0) this.haul.items.push('pearl');
      UI.modal({ title: 'Thalassa', body: THALASSA_LOGS[idx % THALASSA_LOGS.length], choices: [{ label: 'Continue', tag: 'wonder', fx: () => '' }] });
    }
  },

  update(dt, input) {
    this.t += dt;
    const P = this.player;
    // move
    let dx = input.x, dy = input.y;
    if (dx || dy) {
      const len = Math.hypot(dx, dy); dx /= len; dy /= len;
      const tile = this.tiles[Math.floor(P.y / PT)][Math.floor(P.x / PT)];
      const sp = (tile && tile.k === 'water' ? 70 : 125) / Math.sqrt(this.p.gravity);
      const r = 6, ok = (x, y) => !this.solidPx(x - r, y - r) && !this.solidPx(x + r, y - r) && !this.solidPx(x - r, y + r) && !this.solidPx(x + r, y + r);
      const nx = P.x + dx * sp * dt, ny = P.y + dy * sp * dt;
      if (ok(nx, P.y)) P.x = nx;
      if (ok(P.x, ny)) P.y = ny;
      if (dx) P.face = dx > 0 ? 1 : -1;
      P.bob += dt * 12;
    }
    // oxygen
    const nearShip = U.dist(P.x, P.y, this.shuttle.x, this.shuttle.y) < 60;
    this.o2 = nearShip ? Math.min(this.o2Max, this.o2 + dt * 30) : this.o2 - dt;
    if (this.o2 < this.o2Max * 0.25 && !this.warned && this.comp) { this.warned = true; this.say(`${N(this.comp.id)}: “Your O₂ is getting low. We should head back.”`); }
    if (this.o2 <= 0 || this.suit <= 0) { Game.leavePlanet(true); return; }
    // companion follows
    if (this.comp) {
      const c = this.comp, d = U.dist(c.x, c.y, P.x, P.y);
      if (d > 34) { const s = Math.min(d - 30, (d > 120 ? 220 : 120) * dt); c.x += ((P.x - c.x) / d) * s; c.y += ((P.y - c.y) / d) * s; c.face = P.x > c.x ? 1 : -1; c.bob += dt * 12; }
    }
    // creatures
    this.hitCd -= dt;
    for (const m of this.mobs) {
      m.t += dt;
      const d = U.dist(m.x, m.y, P.x, P.y);
      let tx = m.hx + Math.cos(m.t * 0.4) * 50, ty = m.hy + Math.sin(m.t * 0.3) * 50, sp = 30;
      if (m.kind === 'crawler' && d < 140) { tx = P.x; ty = P.y; sp = 78; }
      if (m.kind === 'grazer' && d < 70) { tx = m.x + (m.x - P.x); ty = m.y + (m.y - P.y); sp = 80; }
      if (m.kind === 'lumen' && d < 160) { tx = P.x + Math.cos(m.t) * 50; ty = P.y + Math.sin(m.t) * 50; sp = 40; }
      const md = U.dist(m.x, m.y, tx, ty);
      if (md > 1) {
        const nx = m.x + ((tx - m.x) / md) * sp * dt, ny = m.y + ((ty - m.y) / md) * sp * dt;
        if (!this.solidPx(nx, ny) || m.kind === 'lumen') { m.x = nx; m.y = ny; } else { m.hx = m.x; m.hy = m.y; }
      }
      if (m.kind === 'crawler' && d < 14 && this.hitCd <= 0) {
        this.suit -= 18; this.hitCd = 1.2; Audio2.blip(120, 0.2);
        const k = d || 1; P.x += ((P.x - m.x) / k) * 18; P.y += ((P.y - m.y) / k) * 18;
        if (this.solidPx(P.x, P.y)) { P.x = this.shuttle.x + 30; P.y = this.shuttle.y; }
        UI.toast('Suit breach! Integrity ' + Math.max(0, Math.round(this.suit)) + '%');
        if (this.comp) { emo(this.comp.id, { fear: 4 }); if (U.chance(0.5)) this.say(`${N(this.comp.id)}: “${U.pick(['Get away from it!', 'Run! RUN!', 'Are you okay?!'])}”`); }
      }
    }
    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
    // weather particles
    const fx = (PALETTE[this.p.type] || PALETTE.barren).fx;
    if (this.particles.length < 120) this.particles.push({ x: Math.random(), y: -0.05, s: 0.2 + Math.random() * 0.8, w: Math.random() * 6 });
    for (const q of this.particles) { q.y += dt * (fx === 'rain' ? 1.2 : fx === 'snow' ? 0.12 : 0.05) * q.s; q.x += dt * (fx === 'dust' || fx === 'ash' ? 0.08 : 0.01) * Math.sin(this.t + q.w); }
    this.particles = this.particles.filter((q) => q.y < 1.05);
  },

  draw(ctx, W, H) {
    const zoom = U.clamp(Math.min(H / (24 * PT), W / (18 * PT)), 0.9, 2.2);
    const vw = W / zoom, vh = H / zoom, P = this.player;
    const cx = U.clamp(P.x - vw / 2, 0, PW * PT - vw), cy = U.clamp(P.y - vh / 2, 0, PH * PT - vh);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.scale(zoom, zoom); ctx.translate(-Math.round(cx), -Math.round(cy));
    ctx.drawImage(this.layer, 0, 0);
    // animated water shimmer
    const st = S.planetState[this.p.id];
    // shuttle
    const s = this.shuttle;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 14, 26, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d8dde6'; ctx.beginPath(); ctx.moveTo(s.x - 26, s.y + 8); ctx.lineTo(s.x + 30, s.y); ctx.lineTo(s.x - 26, s.y - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6cf'; ctx.fillRect(s.x + 6, s.y - 3, 10, 4);
    ctx.fillStyle = '#e84'; ctx.fillRect(s.x - 30, s.y - 4, 5, 8);
    ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('SHUTTLE', s.x, s.y - 16);
    // nodes
    const near = this.nearest();
    for (const n of this.nodes) {
      if (st.taken[n.idx]) continue;
      const pulse = 1 + Math.sin(this.t * 3 + n.idx) * 0.15;
      const hi = near && near.n === n;
      if (n.kind === 'ore') { ctx.fillStyle = '#b0703a'; ctx.beginPath(); ctx.moveTo(n.x, n.y - 7); ctx.lineTo(n.x + 7, n.y + 4); ctx.lineTo(n.x - 7, n.y + 5); ctx.fill(); ctx.fillStyle = '#ffcf7a'; ctx.fillRect(n.x - 1, n.y - 2, 3, 3); }
      if (n.kind === 'ice') { ctx.fillStyle = '#bff'; ctx.beginPath(); ctx.moveTo(n.x, n.y - 9); ctx.lineTo(n.x + 5, n.y + 5); ctx.lineTo(n.x - 5, n.y + 5); ctx.fill(); ctx.strokeStyle = '#5ac'; ctx.stroke(); }
      if (n.kind === 'bio') { ctx.fillStyle = '#e85a9a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(n.x + (i - 1) * 5, n.y - (i % 2) * 4, 3.5, 0, 7); ctx.fill(); } ctx.fillStyle = '#3a8a3a'; ctx.fillRect(n.x - 1, n.y, 2, 6); }
      if (n.kind === 'poi' || n.kind === 'special') {
        const col = n.kind === 'special' ? '#ffd26a' : '#9fdcff';
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.y, 9 * pulse, 0, 7); ctx.stroke();
        ctx.fillStyle = col; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', n.x, n.y + 1);
      }
      if (hi) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, 14, 0, 7); ctx.stroke(); }
    }
    // creatures
    for (const m of this.mobs) {
      if (m.kind === 'crawler') { ctx.fillStyle = '#301818'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 8, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ff4a4a'; ctx.fillRect(m.x + 3, m.y - 2, 2, 2); ctx.fillRect(m.x + 3, m.y + 1, 2, 2); for (let i = -1; i <= 1; i++) { ctx.strokeStyle = '#301818'; ctx.beginPath(); ctx.moveTo(m.x + i * 4, m.y); ctx.lineTo(m.x + i * 5, m.y + 8 + Math.sin(this.t * 12 + i) * 2); ctx.stroke(); } }
      if (m.kind === 'grazer') { ctx.fillStyle = '#c9b38a'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 10, 6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(m.x + 9, m.y - 4, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#6a5a3a'; ctx.fillRect(m.x + 10, m.y - 9, 1.5, 4); }
      if (m.kind === 'lumen') { const a = 0.5 + 0.3 * Math.sin(this.t * 2 + m.hx); const g = ctx.createRadialGradient(m.x, m.y - 10, 1, m.x, m.y - 10, 22); g.addColorStop(0, `rgba(210,240,255,${a})`); g.addColorStop(1, 'rgba(120,180,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y - 10, 22, 0, 7); ctx.fill(); ctx.strokeStyle = `rgba(200,240,255,${a})`; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(m.x + i * 2, m.y - 6); ctx.quadraticCurveTo(m.x + i * 4 + Math.sin(this.t * 2 + i) * 3, m.y + 4, m.x + i * 3, m.y + 12); ctx.stroke(); } }
    }
    // people
    if (this.comp) drawPerson(ctx, this.comp.x, this.comp.y, crewDef(this.comp.id), this.comp.face, this.comp.bob, EMO[dominant(this.comp.id)].color, false, false);
    drawPerson(ctx, P.x, P.y, { suit: '#e8e8f0', skin: '#c99a73', hair: '#4a3020' }, P.face, P.bob, '#ffffff', false, true);
    // helmet visors
    for (const q of [this.comp, P]) if (q) { ctx.strokeStyle = 'rgba(180,230,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y - 8, 7.5, 0, 7); ctx.stroke(); }
    if (this.bubble && this.comp) {
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      const lines = wrapText(ctx, this.bubble.text, 220);
      const bw = Math.min(236, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16), bh = lines.length * 14 + 10;
      const bx = this.comp.x - bw / 2, by = this.comp.y - 30 - bh;
      ctx.globalAlpha = Math.min(1, this.bubble.t);
      ctx.fillStyle = 'rgba(10,14,24,0.88)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = EMO[dominant(this.comp.id)].color; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#eef'; lines.forEach((l, i) => ctx.fillText(l, this.comp.x, by + 16 + i * 14));
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // atmosphere tint, particles, vignette
    const pal = PALETTE[this.p.type] || PALETTE.barren;
    ctx.fillStyle = pal.sky; ctx.fillRect(0, 0, W, H);
    for (const q of this.particles) {
      if (pal.fx === 'rain') { ctx.strokeStyle = 'rgba(180,210,255,0.35)'; ctx.beginPath(); ctx.moveTo(q.x * W, q.y * H); ctx.lineTo(q.x * W - 3, q.y * H + 12); ctx.stroke(); }
      else { ctx.fillStyle = { snow: 'rgba(255,255,255,0.7)', dust: 'rgba(230,200,150,0.35)', ash: 'rgba(60,50,50,0.6)', spores: 'rgba(220,255,90,0.5)', pollen: 'rgba(255,240,170,0.7)' }[pal.fx] || 'rgba(255,255,255,0.3)'; ctx.fillRect(q.x * W, q.y * H, 2 * q.s + 1, 2 * q.s + 1); }
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  },
};

function wrapText(ctx, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
