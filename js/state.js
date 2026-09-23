'use strict';
// Game state and the emotional simulation that drives the whole world.

let S = null; // the saved game state

const START_RES = { food: 280, fuel: 100, parts: 25, hull: 100, meds: 8 };
const RES_MAX = { food: 999, fuel: 150, parts: 99, hull: 100, meds: 30 };
const RES_INFO = {
  food: { name: 'Food', icon: '🌱' }, fuel: { name: 'Fuel', icon: '⛽' }, parts: { name: 'Parts', icon: '⚙' },
  hull: { name: 'Hull', icon: '🛡' }, meds: { name: 'Meds', icon: '✚' },
};

function newGame(playerName, seed) {
  S = {
    version: 1,
    seed: seed || Math.floor(Math.random() * 1e9),
    playerName: playerName || 'Rook',
    day: 1, minute: 8 * 60,
    loc: 0, // system index
    travel: null,
    jumps: 0,
    res: { ...START_RES },
    inv: [],
    crew: {},
    rel: {},
    bonds: [],
    flags: {},
    heart: Object.fromEntries(EMOS.map((k) => [k, 0])),
    log: [],
    visited: { 0: true }, scanned: {}, surveyed: {}, revealed: {}, planetState: {},
    dead: [],
    eventsSeen: {}, eventLast: {},
    lowMoraleDays: 0, starveDays: 0,
    tendedDay: 0, musicDay: 0, sparDay: 0, repairDay: 0,
    loreRead: 0,
    pendingEvents: [],
    newBond: null,
    assemblyFailDay: -99,
    ended: null,
  };
  for (const c of CREW) {
    S.crew[c.id] = { e: { ...c.base }, aff: 10, arc: 0, alive: true, talkDay: -1, talks: 0 };
  }
  // A few relationships that already exist when the story begins
  const seedRel = [['kenji', 'mateo', 40], ['sofia', 'jonah', -35], ['priya', 'yasmin', 45], ['cal', 'priya', 30], ['amara', 'zhao', 25], ['luka', 'jonah', 15], ['kenji', 'cal', 30], ['zhao', 'luka', -15], ['amara', 'priya', 20], ['mateo', 'yasmin', 20]];
  for (const [a, b, v] of seedRel) S.rel[relKey(a, b)] = v;
  logEv('The ISV Collins departed Tranquility Yards.', 'hope');
  return S;
}

// ---- lookups ----
const crewDef = (id) => CREW.find((c) => c.id === id);
const C = (id) => S.crew[id];
const N = (id) => crewDef(id).name.split(' ')[0];
const alive = (id) => !!(S.crew[id] && S.crew[id].alive);
const aliveIds = () => CREW.map((c) => c.id).filter(alive);
const hasFlag = (k) => !!S.flags[k];
function flag(k, v = true) { S.flags[k] = v; }

// ---- emotions ----
function emo(id, d) {
  if (!alive(id)) return;
  const e = C(id).e;
  for (const k in d) e[k] = U.clamp(e[k] + d[k], 0, 100);
}
function emoAll(d, filter) { aliveIds().forEach((id) => (!filter || filter(id)) && emo(id, d)); }
function dominant(id) {
  const e = C(id).e;
  let best = 'joy';
  for (const k of EMOS) if (e[k] > e[best]) best = k;
  return best;
}
function avgEmo(k) {
  const ids = aliveIds();
  return ids.length ? ids.reduce((s, id) => s + C(id).e[k], 0) / ids.length : 0;
}
function morale() {
  const a = (k) => avgEmo(k);
  const v = 48 + (a('joy') + a('hope') + a('love') * 0.5 + a('wonder') * 0.5 - a('sorrow') - a('anger') - a('fear') * 0.8 - a('greed') * 0.7) * 0.42;
  return U.clamp(Math.round(v), 0, 100);
}
function aff(id, n) { if (alive(id)) C(id).aff = U.clamp(C(id).aff + n, -100, 100); }

// ---- relationships ----
const relKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
function rel(a, b, d) {
  const k = relKey(a, b);
  if (d !== undefined) S.rel[k] = U.clamp((S.rel[k] || 0) + d, -100, 100);
  return S.rel[k] || 0;
}
function partnerOf(id) {
  const b = S.bonds.find((q) => q.type === 'partners' && (q.a === id || q.b === id) && alive(q.a) && alive(q.b));
  return b ? (b.a === id ? b.b : b.a) : null;
}
function makePartners(a, b) {
  if (partnerOf(a) || partnerOf(b)) return;
  S.bonds.push({ a, b, type: 'partners', since: S.day });
  rel(a, b, 20);
  logEv(`${N(a)} and ${N(b)} are together now.`, 'love');
}
function calCrush() {
  if (!alive('cal')) return null;
  return aliveIds().filter((id) => id !== 'cal' && !partnerOf(id)).sort((p, q) => rel('cal', q) - rel('cal', p))[0] || null;
}

// ---- resources, items, log ----
function res(d) {
  for (const k in d) S.res[k] = U.clamp(Math.round(S.res[k] + d[k]), 0, RES_MAX[k]);
}
function giveItem(id) { if (ITEMS[id]) S.inv.push(id); }
function takeItem(id) { const i = S.inv.indexOf(id); if (i >= 0) S.inv.splice(i, 1); }
function logEv(text, emoKey) {
  S.log.push({ day: S.day, text, emo: emoKey || 'hope' });
  if (S.log.length > 200) S.log.shift();
}
function heart(tag, n = 1) { if (tag && S.heart[tag] !== undefined) S.heart[tag] += n; }
function heartDominant() {
  let best = 'hope';
  for (const k of EMOS) if (S.heart[k] > S.heart[best]) best = k;
  return best;
}

function killCrew(id, cause) {
  if (!alive(id)) return;
  C(id).alive = false;
  S.dead.push({ id, day: S.day, cause });
  const p = S.bonds.find((q) => q.type === 'partners' && (q.a === id || q.b === id));
  if (p) { const o = p.a === id ? p.b : p.a; emo(o, { sorrow: 45, love: 10, joy: -30 }); flag('widowed_' + o); }
  emoAll({ sorrow: 25, fear: 12, joy: -15 });
  logEv(`${crewDef(id).name} died: ${cause}.`, 'sorrow');
  S.pendingEvents.push('funeral');
  if (typeof Ship !== 'undefined') Ship.removeCrew(id);
}

function revealSpecial() {
  const g = Galaxy.get();
  const target = g.systems.find((s) => s.special && s.special !== 'sol' && !S.revealed[s.id] && !S.visited[s.id]);
  if (target) S.revealed[target.id] = true;
}

// Snapshot/diff so every choice can show what it changed.
function snapshot() {
  const s = { res: { ...S.res }, emo: {}, aff: {} };
  for (const k of EMOS) s.emo[k] = avgEmo(k);
  for (const id of aliveIds()) s.aff[id] = C(id).aff;
  return s;
}
function diffSummary(before) {
  const out = [];
  for (const k in S.res) {
    const d = S.res[k] - before.res[k];
    if (d) out.push(`<span class="chip ${d > 0 ? 'up' : 'down'}">${RES_INFO[k].icon} ${d > 0 ? '+' : ''}${d} ${RES_INFO[k].name}</span>`);
  }
  for (const k of EMOS) {
    const d = avgEmo(k) - before.emo[k];
    if (Math.abs(d) >= 1.5) out.push(`<span class="chip" style="border-color:${EMO[k].color};color:${EMO[k].color}">${d > 0 ? '▲' : '▼'} ${EMO[k].name}</span>`);
  }
  for (const id in before.aff) {
    if (!alive(id)) { out.push(`<span class="chip down">✝ ${N(id)}</span>`); continue; }
    const d = C(id).aff - before.aff[id];
    if (Math.abs(d) >= 1) out.push(`<span class="chip ${d > 0 ? 'up' : 'down'}">${N(id)} ${d > 0 ? '♥+' : '♥'}${d}</span>`);
  }
  return out.join(' ');
}

// ---- the daily heartbeat of the ship ----
function hangoutRoom(id) {
  return EMO[dominant(id)].room;
}

function hydroYield() {
  let y = 4.5 + avgEmo('hope') / 15;
  if (S.tendedDay === S.day) y += 3;
  if (alive('amara')) y += 1 + C('amara').e.hope / 50;
  if (hasFlag('amara_shipgarden')) y += 2;
  if (morale() < 25) y -= 2;
  return Math.max(0, y);
}

function dayTick(ambient) {
  const ids = aliveIds();
  const eaters = ids.length + 1;
  S.res.food = Math.max(0, S.res.food - eaters + hydroYield());
  S.res.food = Math.round(S.res.food * 10) / 10;

  // Starvation and damage pressures
  if (S.res.food <= 0) { S.starveDays++; emoAll({ fear: 10, anger: 6, joy: -10, hope: -6 }); } else S.starveDays = 0;
  if (S.res.food < 60) emoAll({ fear: 2 });
  if (S.res.hull < 35) emoAll({ fear: 3 });

  // Drift towards each person's natural temperament; good feelings fade a little faster than bad ones
  for (const id of ids) {
    const e = C(id).e, base = crewDef(id).base;
    for (const k of EMOS) {
      const up = e[k] > base[k] && (k === 'joy' || k === 'love' || k === 'wonder');
      e[k] = U.clamp(e[k] + (base[k] - e[k]) * (up ? 0.16 : 0.1) + (Math.random() - 0.5) * 4, 0, 100);
    }
  }
  // Cabin fever: the longer the voyage, the heavier the dark
  const fatigue = Math.min(1.2, S.day / 100);
  emoAll({ sorrow: 1.6 * fatigue, anger: 1.1 * fatigue, fear: 0.8 * fatigue, joy: -1.4 * fatigue, hope: -0.8 * fatigue });

  // Emotional contagion: people who spend evenings in the same room pull each other's moods together
  const rooms = {};
  for (const id of ids) (rooms[hangoutRoom(id)] = rooms[hangoutRoom(id)] || []).push(id);
  if (typeof Ship !== 'undefined' && Ship.catRoom && hasFlag('cat')) {
    (rooms[Ship.catRoom()] || []).forEach((id) => emo(id, { joy: 2, love: 1, sorrow: -1 }));
  }
  for (const room in rooms) {
    const g = rooms[room];
    if (g.length < 2) { g.forEach((id) => emo(id, { sorrow: 1.2, love: -0.8 })); continue; } // loneliness
    const avg = {};
    for (const k of EMOS) avg[k] = g.reduce((s, id) => s + C(id).e[k], 0) / g.length;
    for (const id of g) for (const k of EMOS) C(id).e[k] += (avg[k] - C(id).e[k]) * 0.1;
    for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
      const A = C(g[i]).e, B = C(g[j]).e;
      const d = (A.joy + B.joy + A.love + B.love) / 110 - (A.anger + B.anger + A.greed + B.greed) / 120 + (Math.random() - 0.4);
      rel(g[i], g[j], d * 1.6);
    }
  }

  // Partners comfort each other; bonds form and break
  for (const b of S.bonds) if (b.type === 'partners' && alive(b.a) && alive(b.b)) { emo(b.a, { love: 2, joy: 1, fear: -1 }); emo(b.b, { love: 2, joy: 1, fear: -1 }); }
  if (!S.newBond) {
    for (let i = 0; i < ids.length && !S.newBond; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      if (partnerOf(a) || partnerOf(b)) continue;
      if (rel(a, b) >= 62 && C(a).e.love >= 42 && C(b).e.love >= 42 && U.chance(0.35)) {
        makePartners(a, b); S.newBond = [a, b]; S.pendingEvents.push('romance'); break;
      }
    }
  }

  // Morale and its consequences
  const m = morale();
  S.lowMoraleDays = m < 18 ? S.lowMoraleDays + 1 : 0;

  if (ambient) {
    const k = EMOS.reduce((best, x) => (avgEmo(x) + Math.random() * 25 > avgEmo(best) + Math.random() * 25 ? x : best), 'joy');
    const pool = ids.filter((id) => C(id).e[k] > 35);
    if (pool.length >= 1 && ids.length >= 2) {
      const a = U.pick(pool), b = U.pick(ids.filter((x) => x !== a));
      return { text: U.pick(AMBIENT[k]).replace('{a}', N(a)).replace('{b}', N(b)), emo: k };
    }
  }
  return null;
}

function checkFailure() {
  if (S.ended) return null;
  if (S.res.hull <= 0) return 'destroyed';
  if (S.starveDays >= 4) return 'starved';
  if (S.lowMoraleDays >= 5) return 'mutiny';
  if (aliveIds().length === 0) return 'alone';
  return null;
}

// ---- events ----
function eventById(id) { return EVENTS.find((e) => e.id === id); }
function eventEligible(ev) {
  if (ev.once && S.eventsSeen[ev.id]) return 0;
  if (ev.cooldown && S.eventLast[ev.id] !== undefined && S.day - S.eventLast[ev.id] < ev.cooldown) return 0;
  return ev.when ? ev.when() : 0;
}
function rollEvent() {
  if (S.pendingEvents.length) return S.pendingEvents.shift();
  const pool = EVENTS.map((ev) => [ev, eventEligible(ev)]).filter((x) => x[1] > 0);
  const total = pool.reduce((s, x) => s + x[1], 0);
  if (!total) return null;
  let r = Math.random() * total;
  for (const [ev, w] of pool) { if ((r -= w) <= 0) return ev.id; }
  return null;
}
function markEvent(id) { S.eventsSeen[id] = (S.eventsSeen[id] || 0) + 1; S.eventLast[id] = S.day; }

// ---- save / load ----
const SAVE_KEY = 'after_tranquility_save_v1';
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
}
function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; S = JSON.parse(raw); return true; } catch (e) { return false; }
}
function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
