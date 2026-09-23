'use strict';
// DOM layer: dialogue windows, the HUD, the journal, toasts.

const $ = (id) => document.getElementById(id);

const UI = {
  queue: [], active: false, current: null, hudTimer: 0,

  // A modal is a moment: text, a set of choices, and the consequences shown afterwards.
  modal(m) { this.queue.push(m); if (!this.active) this.next(); },
  next() {
    const m = this.queue.shift();
    if (!m) { this.active = false; this.current = null; $('modal').classList.add('hidden'); if (typeof Game !== 'undefined') Game.onModalsClosed(); return; }
    this.active = true; this.current = m;
    const el = $('modal');
    el.classList.remove('hidden');
    $('mTitle').textContent = m.title || '';
    const port = $('mPortrait');
    port.innerHTML = '';
    if (m.portrait) { port.appendChild(portrait(m.portrait)); port.style.display = 'block'; } else port.style.display = 'none';
    $('mBody').innerHTML = m.body || '';
    $('mExtra').innerHTML = m.extra || '';
    this.renderChoices(m);
    $('modalCard').scrollTop = 0;
    Audio2.blip(520, 0.06);
  },
  renderChoices(m) {
    const box = $('mChoices');
    box.innerHTML = '';
    (m.choices || [{ label: 'Continue', raw: () => {} }]).forEach((ch, i) => {
      const b = document.createElement('button');
      const ok = !ch.req || ch.req();
      b.className = 'choice' + (ok ? '' : ' disabled');
      if (ch.tag) b.style.borderLeftColor = EMO[ch.tag].color;
      b.innerHTML = `<span class="num">${i + 1}</span>${ch.tag ? `<span class="tag" style="color:${EMO[ch.tag].color}">${EMO[ch.tag].glyph}</span>` : ''}${ch.label}`;
      if (ok) b.onclick = () => this.pick(m, ch);
      box.appendChild(b);
    });
  },
  pick(m, ch) {
    Audio2.blip(700, 0.05);
    if (ch.raw) { this.close(); ch.raw(); return; }
    const before = snapshot();
    const out = ch.fx ? ch.fx() : '';
    heart(ch.tag);
    if (m.onPick) m.onPick(ch);
    const diff = diffSummary(before);
    if (!out && !diff) { this.close(); if (m.onDone) m.onDone(); return; }
    $('mBody').innerHTML = `<p class="result">${out || ''}</p>`;
    $('mExtra').innerHTML = diff ? `<div class="diff">${diff}</div>` : '';
    const box = $('mChoices');
    box.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = '<span class="num">↵</span>Continue';
    b.onclick = () => { this.close(); if (m.onDone) m.onDone(); };
    box.appendChild(b);
    b.focus();
  },
  close() { this.next(); },
  // keyboard shortcuts for choices
  key(k) {
    if (!this.active) return false;
    const btns = [...$('mChoices').querySelectorAll('button.choice:not(.disabled)')];
    const all = [...$('mChoices').querySelectorAll('button.choice')];
    if (k === 'Enter' || k === ' ' || k === 'e' || k === 'E') { if (all.length === 1 && btns[0]) btns[0].click(); return true; }
    const n = parseInt(k, 10);
    if (n >= 1 && n <= all.length && !all[n - 1].classList.contains('disabled')) all[n - 1].click();
    return true;
  },

  toast(text, col) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = text;
    if (col) t.style.borderColor = col;
    $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3200);
  },

  prompt(text) {
    const el = $('prompt');
    if (text) { el.innerHTML = `<b>E</b> ${text}`; el.classList.remove('hidden'); } else el.classList.add('hidden');
  },

  hud(force) {
    if (!S) return;
    const now = performance.now();
    if (!force && now - this.hudTimer < 250) return;
    this.hudTimer = now;
    const sys = Galaxy.sys(S.loc);
    const where = S.travel ? `In fold → ${Galaxy.sys(S.travel.to).name}` : Game.mode === 'planet' ? `${Planet.p.name} (surface)` : `${sys.name} system`;
    const room = Game.mode === 'ship' ? ` · ${Ship.playerRoom() === 'corridor' ? 'Corridor' : ROOMS[Ship.playerRoom()].name}` : '';
    $('hudL').innerHTML = `<b>Day ${S.day}</b> · ${U.fmtTime(S.minute)}<br><span class="dim">${where}${room}</span>`;
    const r = S.res, low = (k, v) => (k === 'food' && v < 60) || (k === 'fuel' && v < 20) || (k === 'hull' && v < 35) || (k === 'parts' && v < 5) ? ' low' : '';
    $('hudC').innerHTML = Object.keys(RES_INFO).map((k) => `<span class="res${low(k, r[k])}" title="${RES_INFO[k].name}">${RES_INFO[k].icon} ${Math.floor(r[k])}${k === 'hull' ? '%' : ''}</span>`).join('');
    const m = morale();
    const avgs = EMOS.map((k) => [k, avgEmo(k)]);
    const tot = avgs.reduce((s, x) => s + x[1], 0) || 1;
    const bar = avgs.map(([k, v]) => `<i style="width:${(v / tot) * 100}%;background:${EMO[k].color}" title="${EMO[k].name} ${Math.round(v)}"></i>`).join('');
    const dom = avgs.sort((a, b) => b[1] - a[1])[0][0];
    $('hudR').innerHTML = `<div class="moraleTop"><span>Morale <b style="color:${m > 60 ? '#8f8' : m > 30 ? '#fd6' : '#f66'}">${m}</b></span><span class="dim">Ship feels <b style="color:${EMO[dom].color}">${EMO[dom].name.toLowerCase()}</b></span></div><div class="weather">${bar}</div>`;
    Audio2.setMood(dom);
    if (Game.mode === 'planet') {
      const o = Math.max(0, Planet.o2 / Planet.o2Max), s = Math.max(0, Planet.suit / 100);
      $('suit').classList.remove('hidden');
      $('suit').innerHTML = `<div>O₂ <div class="meter"><i style="width:${o * 100}%;background:${o < 0.25 ? '#f55' : '#6cf'}"></i></div></div><div>Suit <div class="meter"><i style="width:${s * 100}%;background:${s < 0.35 ? '#f55' : '#9f9'}"></i></div></div><div class="dim">Hold: 🌱${Planet.haul.food} ⛽${Planet.haul.fuel} ⚙${Planet.haul.parts}${Planet.haul.items.length ? ' · ' + Planet.haul.items.length + ' finds' : ''}</div>`;
    } else $('suit').classList.add('hidden');
  },

  emoBars(id) {
    const e = C(id).e;
    return `<div class="bars">${EMOS.map((k) => `<div class="bar"><span style="color:${EMO[k].color}">${EMO[k].glyph} ${EMO[k].name}</span><div class="meter"><i style="width:${e[k]}%;background:${EMO[k].color}"></i></div></div>`).join('')}</div>`;
  },

  // ---- the journal: crew, your heart, the log ----
  journal(tab = 'crew') {
    Game.setPaused(true);
    const el = $('journal');
    el.classList.remove('hidden');
    const tabs = { crew: 'Crew', bonds: 'Bonds', heart: 'Your Heart', log: 'Ship Log', items: 'Items', help: 'How to Play' };
    $('jTabs').innerHTML = Object.entries(tabs).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('') + '<button class="close" id="jClose">✕</button>';
    $('jTabs').querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => this.journal(b.dataset.tab)));
    $('jClose').onclick = () => this.closeJournal();
    const body = $('jBody');
    if (tab === 'crew') {
      body.innerHTML = CREW.map((d) => {
        const c = C(d.id);
        if (!c.alive) { const dd = S.dead.find((x) => x.id === d.id); return `<div class="crewCard dead"><h3>✝ ${d.name}</h3><p class="dim">${d.role}. Died on day ${dd ? dd.day : '?'}: ${dd ? dd.cause : ''}.</p></div>`; }
        const dom = dominant(d.id), p = partnerOf(d.id);
        const arcTxt = c.arc >= 3 ? 'Story complete' : `Story ${c.arc}/3 · next at ♥${ARC_AFF[c.arc]}`;
        return `<div class="crewCard" style="border-color:${EMO[dom].color}"><div class="cc-head"><div class="pp" data-id="${d.id}"></div><div><h3>${d.name} <span class="dim">${d.age}</span></h3><div class="dim">${d.role} · ${d.from}</div><div>Feeling <b style="color:${EMO[dom].color}">${EMO[dom].verb}</b> · ♥ ${Math.round(c.aff)} · ${arcTxt}${p ? ` · with ${N(p)}` : ''}</div></div></div><p class="bio">${d.bio}</p>${this.emoBars(d.id)}<p class="dim small">Loves gifts that are: ${d.likes.join(', ')}</p></div>`;
      }).join('');
      body.querySelectorAll('.pp').forEach((p) => p.appendChild(portrait(p.dataset.id, 2)));
    } else if (tab === 'bonds') {
      const ids = aliveIds();
      const pairs = [];
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j], rel(ids[i], ids[j])]);
      pairs.sort((a, b) => Math.abs(b[2]) - Math.abs(a[2]));
      const partners = S.bonds.filter((b) => b.type === 'partners' && alive(b.a) && alive(b.b));
      body.innerHTML = `<p class="dim">Relationships grow from where people spend their evenings and how they feel while they\'re there. People who share a room share a mood.</p>` +
        (partners.length ? `<h3>Couples</h3>${partners.map((b) => `<div class="pair love">♥ ${N(b.a)} &amp; ${N(b.b)}${b.wed ? ' (married)' : ''} · since day ${b.since}</div>`).join('')}` : '') +
        `<h3>Strongest feelings</h3>` + pairs.slice(0, 14).map(([a, b, v]) => `<div class="pair"><span>${N(a)} &amp; ${N(b)}</span><div class="meter rel"><i style="width:${Math.abs(v) / 2}%;${v >= 0 ? 'left:50%' : `right:50%`};background:${v >= 0 ? '#ff8fcf' : '#ef476f'}"></i></div><span class="dim">${v > 55 ? 'devoted' : v > 25 ? 'close' : v > 5 ? 'friendly' : v > -15 ? 'wary' : v > -45 ? 'at odds' : 'enemies'}</span></div>`).join('');
    } else if (tab === 'heart') {
      const tot = EMOS.reduce((s, k) => s + S.heart[k], 0);
      const dom = heartDominant();
      body.innerHTML = `<p>Every choice you make is coloured by a feeling. The ship remembers how you chose. So will the ending.</p><h3 style="color:${EMO[dom].color}">${tot ? HEART_TEXT[dom].title : 'Unwritten'}</h3><p>${tot ? HEART_TEXT[dom].now : 'You have not chosen much yet. The voyage is young.'}</p>` +
        `<div class="bars">${EMOS.map((k) => `<div class="bar"><span style="color:${EMO[k].color}">${EMO[k].glyph} ${EMO[k].name}</span><div class="meter"><i style="width:${tot ? (S.heart[k] / tot) * 100 : 0}%;background:${EMO[k].color}"></i></div><span class="dim">${S.heart[k]}</span></div>`).join('')}</div>`;
    } else if (tab === 'log') {
      body.innerHTML = S.log.slice().reverse().map((l) => `<div class="logline"><span class="dim">Day ${l.day}</span> <span style="color:${EMO[l.emo] ? EMO[l.emo].color : '#fff'}">${EMO[l.emo] ? EMO[l.emo].glyph : '•'}</span> ${l.text}</div>`).join('');
    } else if (tab === 'items') {
      body.innerHTML = S.inv.length ? S.inv.map((it) => `<div class="item"><b>${ITEMS[it].name}</b> <span class="dim">(${ITEMS[it].tags.join(', ')})</span><br><span class="small">${ITEMS[it].desc}</span></div>`).join('') : '<p class="dim">You carry nothing yet. Things found on planets can be kept, traded, or given to the people you care about.</p>';
    } else if (tab === 'help') {
      body.innerHTML = HELP_HTML;
    }
  },
  closeJournal() { $('journal').classList.add('hidden'); Game.setPaused(false); },
  journalOpen() { return !$('journal').classList.contains('hidden'); },
};

function portrait(id, scale = 3) {
  const d = crewDef(id);
  const c = document.createElement('canvas');
  c.width = 40 * scale; c.height = 44 * scale;
  const g = c.getContext('2d');
  g.scale(scale, scale);
  const dom = dominant(id), col = EMO[dom].color;
  const bg = g.createRadialGradient(20, 22, 2, 20, 22, 24);
  bg.addColorStop(0, U.hexA(col, 0.55)); bg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = bg; g.fillRect(0, 0, 40, 44);
  // shoulders
  g.fillStyle = d.suit; g.beginPath(); g.ellipse(20, 42, 15, 10, 0, Math.PI, 0); g.fill();
  // neck & head
  g.fillStyle = d.skin; g.fillRect(17, 26, 6, 6);
  g.beginPath(); g.ellipse(20, 20, 8.5, 10, 0, 0, 7); g.fill();
  // hair
  g.fillStyle = d.hair; g.beginPath(); g.ellipse(20, 14, 9.5, 6.5, 0, Math.PI, 0); g.fill(); g.fillRect(10.5, 13, 2.5, 8); g.fillRect(27, 13, 2.5, 8);
  // face shows the dominant feeling
  g.fillStyle = '#1a1a1a';
  const eyes = { joy: [1, 1], sorrow: [1, 1.6], anger: [1.4, 1], fear: [1.6, 2], love: [1, 1], greed: [1.3, 1], hope: [1, 1.4], wonder: [1.6, 1.8] }[dom];
  g.fillRect(15.5, 19, eyes[0] + 0.6, eyes[1]); g.fillRect(23, 19, eyes[0] + 0.6, eyes[1]);
  if (dom === 'anger') { g.fillRect(14.5, 17, 4, 0.8); g.fillRect(22.5, 17, 4, 0.8); }
  g.strokeStyle = '#3a1a1a'; g.lineWidth = 0.9; g.beginPath();
  if (dom === 'joy' || dom === 'love' || dom === 'hope') g.arc(20, 23.5, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (dom === 'sorrow' || dom === 'fear') g.arc(20, 27, 2.6, 1.2 * Math.PI, 1.8 * Math.PI);
  else if (dom === 'wonder') { g.ellipse(20, 25, 1.3, 1.8, 0, 0, 7); }
  else { g.moveTo(17, 25); g.lineTo(23, 25); }
  g.stroke();
  if (dom === 'love') { g.fillStyle = 'rgba(255,120,160,0.45)'; g.beginPath(); g.arc(14.5, 23, 2, 0, 7); g.arc(25.5, 23, 2, 0, 7); g.fill(); }
  if (dom === 'sorrow') { g.fillStyle = '#8fc8ff'; g.fillRect(16, 21.5, 0.8, 2.2); }
  return c;
}

const ARC_AFF = [18, 40, 62];

const HEART_TEXT = {
  joy: { title: 'A Light Heart', now: 'You lead with laughter. When things are dark, you reach for music, cake, a stupid joke. People breathe easier when you walk in.', end: 'You never stopped choosing joy, even when it was hard. Especially when it was hard. The colony has a festival every year on the anniversary of landing, and it was your idea.' },
  sorrow: { title: 'A Grieving Heart', now: 'You let yourself feel the weight of what was lost. You do not look away. It makes you gentle, and sometimes very tired.', end: 'You carried the grief of a whole planet so the others didn\'t have to carry it alone. The Memorial on the new world bears one line you wrote: We remember, so that we can go on.' },
  anger: { title: 'A Burning Heart', now: 'You are angry at the people who broke the Earth, and you do not pretend otherwise. Your anger is a compass. It is also a fire.', end: 'You never forgot who burned the old world. The new world\'s first law, written in your hand, says that no one may own the air, the water, or the soil.' },
  fear: { title: 'A Careful Heart', now: 'You choose caution. You count the fuel twice and hold people back from the edge. You are afraid, and that has kept people alive.', end: 'You were afraid the whole way. You kept going anyway. That is the only kind of courage there has ever been.' },
  love: { title: 'An Open Heart', now: 'You choose people over plans, every time. You sit with the crying. You remember birthdays. The crew is a family because you made it one.', end: 'You loved them, all of them, and they knew it. When the colony elected its first leader, they did not need to count the votes.' },
  greed: { title: 'A Hungry Heart', now: 'You take what the universe offers. Resources, relics, advantage. Survival first. Sentiment is a luxury for people with full stores.', end: 'You made sure the colony never went without. Its stores are full and its vaults are fuller. Sometimes, late at night, you wonder what else was lost in the taking.' },
  hope: { title: 'A Hopeful Heart', now: 'You keep pointing at the horizon. There is something better out there. You believe it so hard that other people start believing it too.', end: 'You never stopped believing there was somewhere better. Then you found it. Then you made it better still.' },
  wonder: { title: 'A Wondering Heart', now: 'You stop to look. At the nebula, the fossil, the alien sea. You want to know what is out there more than you want anything else.', end: 'You never stopped looking up. Your name is on the first survey of the new world\'s sky, and on a comet, and on a small grey cat\'s collar.' },
};

const HELP_HTML = `
<h3>The idea</h3>
<p><b>After Tranquility</b> is an open world where the landscape is made of feelings. Every crew member carries eight emotions: <span style="color:#ffd23f">Joy</span>, <span style="color:#5b8def">Sorrow</span>, <span style="color:#ef476f">Anger</span>, <span style="color:#a06cd5">Fear</span>, <span style="color:#ff8fcf">Love</span>, <span style="color:#3ddc97">Greed</span>, <span style="color:#8ce9ff">Hope</span> and <span style="color:#ffa552">Wonder</span>. Those feelings decide where people go, who they spend time with, who falls in love, who fights, what the ship\'s music sounds like, and whether the crew will follow you to a new home.</p>
<h3>Controls</h3>
<p><b>WASD / Arrows</b> move · <b>E / Space</b> interact · <b>1-4</b> pick a choice · <b>J</b> journal · <b>M</b> star map · <b>N</b> mute · <b>Esc</b> close</p>
<h3>Life on the Collins</h3>
<ul>
<li>Crew wander the ship by their own schedules. At work hours they go to their stations; in the evenings they drift to the room that matches their <b>strongest feeling</b> (the sad gather in the Archive, the angry in the Gym, the greedy in Cargo, the hopeful in Hydroponics...).</li>
<li>People who share a room <b>share a mood</b>. One furious person can sour a whole room. One joyful one can lift it. Watch the aura around each person.</li>
<li>Talk to people. Each one accepts a couple of heartfelt moments a day. Earn their trust (♥) and they will tell you their story, in three parts, with choices that change who they become.</li>
<li>Tend the garden, play music, organise sparring, repair the hull, sleep to advance the day.</li>
</ul>
<h3>The voyage</h3>
<ul>
<li>Use the <b>Helm</b> on the Bridge to jump between stars. Jumps cost fuel and days. During the journey, life happens.</li>
<li>Scan planets, then <b>land</b> with a crewmate. Gather ice (fuel), ore (parts) and food. Watch your oxygen. Some finds ask what kind of people you are.</li>
<li>When you find a world worth living on (habitability 50+ and surveyed on foot), call the <b>Assembly</b>. The crew votes with their hearts. Make your case.</li>
<li>If morale collapses, food runs out, or the hull fails, the voyage ends.</li>
</ul>`;
