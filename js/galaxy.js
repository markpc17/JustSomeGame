'use strict';
// The galaxy: star systems, planets, and what makes a world worth calling home.

const JUMP_RANGE = 17;

const PLANET_TYPES = {
  barren:   { name: 'Barren Rock',  col: '#9e9587', temp: [-120, 140], atmo: ['none', 'thin'], water: [0, 5], life: ['none'], hazard: [1, 1], rich: { ore: 0.9, ice: 0.2, bio: 0 } },
  ice:      { name: 'Ice World',    col: '#cfe8ff', temp: [-190, -40], atmo: ['none', 'thin'], water: [60, 100], life: ['none', 'microbial'], hazard: [1, 2], rich: { ore: 0.3, ice: 1, bio: 0.05 } },
  desert:   { name: 'Desert World', col: '#e0b36a', temp: [15, 75], atmo: ['thin', 'breathable', 'toxic'], water: [0, 15], life: ['none', 'microbial', 'flora'], hazard: [1, 2], rich: { ore: 0.7, ice: 0.1, bio: 0.2 } },
  ocean:    { name: 'Ocean World',  col: '#3f8fd6', temp: [2, 38], atmo: ['breathable', 'dense', 'thin'], water: [85, 100], life: ['microbial', 'flora', 'fauna'], hazard: [1, 2], rich: { ore: 0.2, ice: 0.6, bio: 0.9 } },
  jungle:   { name: 'Jungle World', col: '#3fae5a', temp: [22, 48], atmo: ['breathable', 'dense', 'toxic'], water: [50, 85], life: ['flora', 'fauna'], hazard: [2, 3], rich: { ore: 0.3, ice: 0.1, bio: 1 } },
  toxic:    { name: 'Toxic World',  col: '#b5c43f', temp: [40, 380], atmo: ['toxic'], water: [0, 30], life: ['none', 'microbial'], hazard: [3, 3], rich: { ore: 0.8, ice: 0, bio: 0.1 } },
  volcanic: { name: 'Volcanic',     col: '#d8552d', temp: [150, 700], atmo: ['toxic', 'thin'], water: [0, 3], life: ['none'], hazard: [3, 3], rich: { ore: 1, ice: 0, bio: 0 } },
  tundra:   { name: 'Tundra World', col: '#9fb8a8', temp: [-35, 8], atmo: ['breathable', 'thin'], water: [30, 60], life: ['microbial', 'flora'], hazard: [1, 1], rich: { ore: 0.5, ice: 0.7, bio: 0.4 } },
  garden:   { name: 'Garden World', col: '#5fcf8a', temp: [9, 27], atmo: ['breathable'], water: [40, 75], life: ['flora', 'fauna'], hazard: [0, 1], rich: { ore: 0.4, ice: 0.3, bio: 0.9 } },
  gas:      { name: 'Gas Giant',    col: '#c9a27a', temp: [-160, -60], atmo: ['dense'], water: [0, 0], life: ['none'], hazard: [3, 3], rich: { ore: 0, ice: 0, bio: 0 } },
  ruin:     { name: 'Scarred World', col: '#b58a6a', temp: [12, 34], atmo: ['breathable'], water: [25, 45], life: ['flora'], hazard: [1, 1], rich: { ore: 0.8, ice: 0.3, bio: 0.4 } },
};

const STAR_TYPES = [
  { k: 'Red dwarf', col: '#ff7b5c', r: 5 }, { k: 'Orange dwarf', col: '#ffb36b', r: 6 },
  { k: 'Yellow star', col: '#ffe58a', r: 7 }, { k: 'White star', col: '#f4f6ff', r: 7 }, { k: 'Blue giant', col: '#9ec5ff', r: 9 },
];

const SYL_A = ['Ka', 'Ve', 'Tor', 'Ish', 'Mer', 'Al', 'Zen', 'Or', 'Qua', 'Lys', 'Dra', 'Sel', 'Ny', 'Pax', 'Rho', 'Tal', 'Wen', 'Cy', 'Ari', 'Eos'];
const SYL_B = ['rin', 'dor', 'thys', 'ane', 'ix', 'ora', 'mon', 'vel', 'ka', 'ris', 'tur', 'len', 'oth', 'sa', 'dun', 'mir', 'ael', 'eon'];

function habitability(p) {
  if (p.type === 'gas') return 0;
  let s = 30 * Math.max(0, 1 - Math.abs(p.temp - 18) / 40);
  s += { breathable: 30, dense: 14, thin: 12, toxic: 0, none: 0 }[p.atmo];
  s += p.water >= 25 && p.water <= 85 ? 20 : p.water > 85 ? 12 : p.water / 2;
  s += 10 * Math.max(0, 1 - Math.abs(p.gravity - 1) / 0.8);
  s += { none: 0, microbial: 4, flora: 10, fauna: 8, sentient: 10 }[p.life];
  s -= p.hazard * 8;
  return Math.round(U.clamp(s, 0, 100));
}

const Galaxy = {
  _cache: null,
  get() {
    if (!this._cache || this._cache.seed !== S.seed) this._cache = this.gen(S.seed);
    return this._cache;
  },

  gen(seed) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const g = this._try(seed + attempt * 7919);
      if (g) { g.seed = seed; return g; }
    }
    throw new Error('galaxy generation failed');
  },

  _try(seed) {
    const r = U.rng(seed);
    const systems = [{ x: 4, y: 30, name: 'Sol', special: 'sol', star: STAR_TYPES[2] }];
    let tries = 0;
    while (systems.length < 28 && tries++ < 4000) {
      const x = r.range(10, 98), y = r.range(4, 56);
      if (systems.every((s) => U.dist(s.x, s.y, x, y) > 8)) systems.push({ x, y });
    }
    // Connectivity from Sol, within jump range
    const reach = new Set([0]), q = [0];
    while (q.length) {
      const i = q.shift();
      systems.forEach((s, j) => { if (!reach.has(j) && U.dist(s.x, s.y, systems[i].x, systems[i].y) <= JUMP_RANGE) { reach.add(j); q.push(j); } });
    }
    if (!systems.some((s, j) => reach.has(j) && s.x > 90)) return null;
    const conn = systems.filter((s, j) => reach.has(j));

    const used = new Set(['Sol']);
    conn.forEach((s, i) => {
      s.id = i;
      if (i === 0) return;
      let n;
      do { n = r.pick(SYL_A) + r.pick(SYL_B); } while (used.has(n));
      used.add(n);
      s.name = n;
      s.star = r.pick(STAR_TYPES);
    });

    // Special worlds sit progressively deeper in the dark
    const claim = (tx, key, name) => {
      const c = conn.filter((s) => !s.special).sort((a, b) => Math.abs(a.x - tx) - Math.abs(b.x - tx))[0];
      c.special = key; c.name = name;
    };
    claim(56, 'ashfall', 'Cinder');
    claim(75, 'thalassa', 'Pelagos');
    claim(96, 'eden', 'Lumen');

    for (const s of conn) s.planets = this._planets(s, r);
    return { systems: conn };
  },

  _planets(sys, r) {
    const out = [];
    const mk = (type, extra = {}) => {
      const t = PLANET_TYPES[type];
      const p = {
        id: `${sys.id}-${out.length}`, sys: sys.id, idx: out.length, type,
        name: `${sys.name} ${U.roman(out.length)}`,
        temp: Math.round(r.range(t.temp[0], t.temp[1])), atmo: r.pick(t.atmo),
        water: Math.round(r.range(t.water[0], t.water[1])), life: r.pick(t.life),
        hazard: r.int(t.hazard[0], t.hazard[1]), gravity: Math.round(r.range(0.4, 1.7) * 100) / 100,
        rich: { ...t.rich }, seed: Math.floor(r() * 1e9), special: null, orbit: out.length,
        ...extra,
      };
      p.hab = habitability(p);
      out.push(p);
      return p;
    };

    if (sys.special === 'sol') {
      mk('gas', { name: 'Neptune', temp: -214, gravity: 1.14, visited: true });
      return out;
    }
    const n = r.int(2, 5);
    const specialIdx = sys.special ? r.int(0, n - 1) : -1;
    for (let i = 0; i < n; i++) {
      if (i === specialIdx) {
        if (sys.special === 'ashfall') mk('ruin', { name: 'Ashfall', temp: 31, atmo: 'breathable', water: 38, life: 'flora', hazard: 2, gravity: 0.96, special: 'ashfall' });
        if (sys.special === 'thalassa') mk('ocean', { name: 'Thalassa', temp: 19, atmo: 'breathable', water: 94, life: 'fauna', hazard: 1, gravity: 1.08, special: 'thalassa' });
        if (sys.special === 'eden') mk('garden', { name: 'Eden\'s Echo', temp: 21, atmo: 'breathable', water: 58, life: 'sentient', hazard: 0, gravity: 0.93, special: 'eden' });
        continue;
      }
      const roll = r();
      let type;
      if (roll < 0.2) type = 'gas';
      else if (roll < 0.34) type = 'barren';
      else if (roll < 0.48) type = 'ice';
      else if (roll < 0.6) type = 'desert';
      else if (roll < 0.68) type = 'toxic';
      else if (roll < 0.76) type = 'volcanic';
      else if (roll < 0.85) type = 'tundra';
      else if (roll < 0.92) type = 'ocean';
      else if (roll < 0.98) type = 'jungle';
      else type = 'garden';
      mk(type);
    }
    return out;
  },

  sys(i) { return this.get().systems[i]; },
  planet(pid) { const [s, p] = pid.split('-').map(Number); return this.get().systems[s].planets[p]; },
  dist(a, b) { const A = this.sys(a), B = this.sys(b); return U.dist(A.x, A.y, B.x, B.y); },
  fuelCost(a, b) { return Math.ceil(this.dist(a, b) * 0.85); },
  travelDays(a, b) { return Math.ceil(this.dist(a, b) * 0.6) + 2; },
  isCandidate(p) { return p.type !== 'gas' && p.hab >= 50; },

  describe(p) {
    const t = PLANET_TYPES[p.type];
    const atmo = { none: 'No atmosphere', thin: 'Thin atmosphere', dense: 'Crushing atmosphere', toxic: 'Toxic atmosphere', breathable: 'Breathable air' }[p.atmo];
    const life = { none: 'Lifeless', microbial: 'Microbial life', flora: 'Plant life', fauna: 'Animal life', sentient: 'Intelligent life' }[p.life];
    return { typeName: t.name, atmo, life, temp: `${p.temp}°C`, grav: `${p.gravity}g`, water: `${p.water}% water` };
  },
};
